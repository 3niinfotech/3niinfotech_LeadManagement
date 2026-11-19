import prisma from '../../config/database.js';
import { notificationService } from './notification.service.js';
import { pushNotification, pushAssignmentEvent } from './notification.push.js';
import { taskService } from '../task/task.service.js';

/** Roles that should see reception / walk-in operational alerts for a branch. */
export const RECEPTION_ALERT_ROLE_SLUGS = [
  'branch_manager',
  'operational_head',
  'team_leader',
  'company_admin',
  'super_admin',
  'reception',
  'receptionist',
];

/**
 * Persist + realtime push to one user. Never throws — assignment must still succeed.
 */
export async function notifyUser(userId, payload) {
  if (!userId) return null;
  try {
    const notification = await notificationService.create({
      userId,
      type: payload.type || 'INFO',
      category: payload.category || 'GENERAL',
      title: payload.title,
      message: payload.message,
      link: payload.link || null,
      metadata: payload.metadata || {},
    });
    pushNotification(userId, notification);
    return notification;
  } catch (err) {
    console.error('[notifyUser] failed', userId, payload?.title, err?.message);
    return null;
  }
}

/**
 * Notify only the student portal user linked to a student record.
 */
export async function notifyStudentLinkedUser({
  studentId,
  userId,
  title,
  message,
  link = '/student/notifications',
  type = 'INFO',
  metadata = {},
} = {}) {
  let targetUserId = userId || null;
  if (!targetUserId && studentId) {
    const student = await prisma.student.findFirst({
      where: { id: studentId, deletedAt: null },
      select: { userId: true },
    });
    targetUserId = student?.userId || null;
  }
  if (!targetUserId) return null;

  const safeLink = link?.startsWith('/student') ? link : '/student/notifications';
  return notifyUser(targetUserId, {
    type,
    title,
    message,
    link: safeLink,
    metadata: { audience: 'STUDENT_PORTAL', ...metadata },
  });
}

/**
 * Assigned counsellor MUST get inbox + live push + assignment ping.
 */
export async function notifyCounsellorAssigned({ counsellorId, lead, enquiry = null, actorId = null } = {}) {
  if (!counsellorId || !lead?.id) return null;

  const visitorName = `${lead.firstName || ''} ${lead.lastName || ''}`.trim() || 'Visitor';
  const code = enquiry?.enquiryCode || lead.leadCode || '';
  const enquiryId = enquiry?.id || lead.enquiry?.id;
  const meta = lead.metadata && typeof lead.metadata === 'object' ? lead.metadata : {};
  const isWalkIn = lead.status === 'WALK_IN' || meta.entryType === 'WALK_IN';
  const courseLabel = lead.interestedCourse || meta.interestedCourse || null;
  const assignmentSource = meta.assignmentSource || null;

  const title = isWalkIn
    ? 'Walk-in visitor assigned to you'
    : 'New student assigned to you';

  let message = isWalkIn
    ? `${visitorName}${code ? ` (${code})` : ''} is at reception`
    : `${visitorName}${code ? ` (${code})` : ''} has been assigned to you`;

  if (courseLabel) {
    message += isWalkIn ? ` for ${courseLabel}` : ` — ${courseLabel}`;
  }
  if (assignmentSource === 'COURSE_MAPPING') {
    message += ' (course default)';
  }
  message += isWalkIn
    ? '. Open My Enquiries to start counselling.'
    : '. Open My Enquiries to start counselling.';

  const notification = await notifyUser(counsellorId, {
    type: 'INFO',
    title,
    message,
    link: enquiryId ? `/admin/enquiries/${enquiryId}` : '/admin/enquiries',
    metadata: {
      event: isWalkIn ? 'WALKIN_COUNSELLOR_ASSIGNED' : 'COUNSELLOR_ASSIGNED',
      audience: 'ASSIGNEE',
      leadId: lead.id,
      leadCode: lead.leadCode || null,
      enquiryId: enquiryId || null,
      branchId: lead.branchId || null,
      actorId: actorId || null,
      courseLabel,
      assignmentSource,
      priority: 'HIGH',
    },
  });

  try {
    pushAssignmentEvent(counsellorId, isWalkIn ? 'WALKIN_ASSIGNED' : 'ASSIGNED', {
      leadId: lead.id,
      leadCode: lead.leadCode || null,
      visitorName,
      courseLabel,
      enquiryId: enquiryId || null,
    });
  } catch {
    /* socket optional */
  }

  return notification;
}

/**
 * Resolve active users by role within tenant (company) and optional branch.
 */
export async function resolveUsersByRoles({
  companyId,
  branchId = null,
  roleSlugs = [],
  excludeUserIds = [],
} = {}) {
  if (!companyId || !roleSlugs.length) return [];

  const exclude = new Set((excludeUserIds || []).filter(Boolean));

  const users = await prisma.user.findMany({
    where: {
      companyId,
      deletedAt: null,
      status: 'ACTIVE',
      role: { slug: { in: roleSlugs } },
      ...(branchId
        ? {
            OR: [
              { branchId },
              // Company-wide ops roles may have null branch
              {
                branchId: null,
                role: { slug: { in: ['company_admin', 'operational_head', 'super_admin'] } },
              },
            ],
          }
        : {}),
    },
    select: { id: true, firstName: true, lastName: true, branchId: true, role: { select: { slug: true } } },
  });

  return users.filter((u) => !exclude.has(u.id));
}

/**
 * Fan-out the same notification to many users (deduped).
 */
export async function notifyMany(userIds, payload) {
  const unique = [...new Set((userIds || []).filter(Boolean))];
  const results = [];
  for (const userId of unique) {
    results.push(await notifyUser(userId, payload));
  }
  return results;
}

export async function notifyRoles({
  companyId,
  branchId,
  roleSlugs,
  excludeUserIds = [],
  payload,
}) {
  const users = await resolveUsersByRoles({
    companyId,
    branchId,
    roleSlugs,
    excludeUserIds,
  });
  return notifyMany(users.map((u) => u.id), payload);
}

/**
 * Visitor / walk-in registered — role-based realtime alerts.
 *
 * Who gets notified:
 * - Registrar (actor) — so the inbox shows the registration (toast alone is not enough)
 * - Assigned counsellor (if any; skips duplicate actor notify)
 * - Branch managers / ops / team leaders / company & super admins
 * - If unassigned: managers still get "waiting for assignment" alert
 */
export async function notifyVisitorRegistered({
  lead,
  enquiry = null,
  actorId = null,
  companyId,
  assigneeName = null,
}) {
  if (!lead?.id || !companyId) return { notified: [] };

  const visitorName = `${lead.firstName || ''} ${lead.lastName || ''}`.trim() || 'Visitor';
  const code = enquiry?.enquiryCode || lead.leadCode || '';
  const link = `/admin/reception/walk-ins?open=${lead.id}`;

  const baseMeta = {
    event: 'VISITOR_REGISTERED',
    leadId: lead.id,
    leadCode: lead.leadCode,
    enquiryId: enquiry?.id || null,
    enquiryCode: enquiry?.enquiryCode || null,
    branchId: lead.branchId,
  };

  const exclude = [actorId, lead.assignedToId].filter(Boolean);
  const notified = [];

  if (actorId && actorId !== lead.assignedToId) {
    const n = await notifyUser(actorId, {
      type: 'SUCCESS',
      title: 'Visitor registered',
      message: `${visitorName}${code ? ` (${code})` : ''} registered at reception.`,
      link,
      metadata: { ...baseMeta, audience: 'ACTOR' },
    });
    if (n) notified.push(n);
  }

  const managerMessage = lead.assignedToId
    ? `${visitorName}${code ? ` (${code})` : ''} registered`
      + (assigneeName ? ` and assigned to ${assigneeName}.` : '.')
    : `${visitorName}${code ? ` (${code})` : ''} registered — please assign a counsellor.`;

  const managers = await notifyRoles({
    companyId,
    branchId: lead.branchId,
    roleSlugs: RECEPTION_ALERT_ROLE_SLUGS,
    excludeUserIds: exclude,
    payload: {
      type: lead.assignedToId ? 'SUCCESS' : 'WARNING',
      title: lead.assignedToId ? 'Walk-in registered' : 'Unassigned walk-in waiting',
      message: managerMessage,
      link,
      metadata: { ...baseMeta, audience: 'MANAGEMENT' },
    },
  });

  return { notified: [...notified, ...managers] };
}

/**
 * Workflow A: Agent submits a student referral
 */
export async function notifyAgentReferredStudent({
  agentUser,
  partnerUserId,
  student,
  companyId,
  branchId,
  counsellorId,
  assignedCounsellorId,
}) {
  const effectiveCounsellorId = counsellorId || assignedCounsellorId;
  let effectiveAgentUser = agentUser;
  if (!effectiveAgentUser && partnerUserId) {
    effectiveAgentUser = await prisma.user.findUnique({
      where: { id: partnerUserId },
      include: { company: true },
    }).catch(() => null);
  }
  const effectiveCompanyId = companyId || student?.branch?.companyId || effectiveAgentUser?.companyId;
  if (!student?.id || !effectiveCompanyId) return;

  const sName = `${student.firstName || ''} ${student.lastName || ''}`.trim() || 'Candidate';
  const agencyName = effectiveAgentUser?.company?.name || effectiveAgentUser?.firstName || 'Partner Agency';

  // 1. Notify Branch Manager
  await notifyRoles({
    companyId: effectiveCompanyId,
    branchId: branchId || student.branchId,
    roleSlugs: ['branch_manager', 'operational_head'],
    payload: {
      type: 'INFO',
      category: 'STUDENT',
      title: 'New Partner Referral Lodged',
      message: `${agencyName} has referred a new candidate: ${sName} (${student.studentCode || 'STU'}).`,
      link: `/admin/students/${student.id}`,
      metadata: { event: 'AGENT_REFERRAL', studentId: student.id, agentUserId: effectiveAgentUser?.id },
    },
  });

  // 2. Notify Assigned Counsellor + Auto-create follow-up task
  if (effectiveCounsellorId) {
    await notifyUser(effectiveCounsellorId, {
      type: 'INFO',
      category: 'STUDENT',
      title: 'Partner Referral Assigned to You',
      message: `New student ${sName} from ${agencyName} has been assigned to you. Initiate contact and profile evaluation.`,
      link: `/admin/students/${student.id}`,
      metadata: { event: 'REFERRAL_COUNSELLOR_ASSIGNED', studentId: student.id, priority: 'HIGH' },
    });

    // Auto-create task for counsellor
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    await taskService.createTask({
      title: `Call & Profile Review: ${sName}`,
      description: `New referral from partner ${agencyName}. Reach out to candidate, assess program requirements, and schedule counseling.`,
      category: 'COUNSELLING',
      priority: 'HIGH',
      dueDate: tomorrow,
      companyId: effectiveCompanyId,
      branchId: branchId || student.branchId,
      assignedToId: effectiveCounsellorId,
      createdById: effectiveAgentUser?.id || null,
      studentId: student.id,
      dedupKey: `AGENT_REFERRAL_${student.id}`,
    });
  }

  // 3. Confirm in Agent Portal
  if (effectiveAgentUser?.id) {
    await notifyUser(effectiveAgentUser.id, {
      type: 'SUCCESS',
      category: 'STUDENT',
      title: 'Referral Lodged Successfully',
      message: `Your referral for ${sName} is now in active triage. Counsellor will be assigned and admission progress tracked.`,
      link: '/agent/students',
      metadata: { event: 'AGENT_REFERRAL_CONFIRMED', studentId: student.id },
    });
  }
}

/**
 * Workflow B: Counsellor Assignment / Reassignment
 */
export async function notifyCounsellorAssignment({
  counsellorId,
  previousCounsellorId,
  student,
  actorId,
  companyId,
  branchId,
}) {
  if (!student?.id || !counsellorId) return;
  const sName = `${student.firstName || ''} ${student.lastName || ''}`.trim() || 'Student';

  // Notify new assignee
  await notifyUser(counsellorId, {
    type: 'INFO',
    category: 'STUDENT',
    title: previousCounsellorId ? 'Student Reassigned to You' : 'New Student Assigned to You',
    message: `${sName} (${student.studentCode || 'STU'}) has been assigned to your desk. Open student profile to review history.`,
    link: `/admin/students/${student.id}`,
    metadata: { event: 'COUNSELLOR_ASSIGNED', studentId: student.id, priority: 'HIGH' },
  });

  // Auto-create follow-up task
  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + 2);
  await taskService.createTask({
    title: `Initial Counseling Session: ${sName}`,
    description: `Conduct initial consultation for ${sName}, shortlist target universities, and review document requirements.`,
    category: 'COUNSELLING',
    priority: 'HIGH',
    dueDate,
    companyId: companyId || student.branch?.companyId,
    branchId: branchId || student.branchId,
    assignedToId: counsellorId,
    createdById: actorId || null,
    studentId: student.id,
    dedupKey: `COUNSELLOR_FOLLOWUP_${student.id}`,
  });

  // Notify previous counsellor if reassigned
  if (previousCounsellorId && previousCounsellorId !== counsellorId) {
    await notifyUser(previousCounsellorId, {
      type: 'INFO',
      category: 'STUDENT',
      title: 'Student Handover Reassigned',
      message: `${sName} has been reassigned to another team member. Your desk active load has been updated.`,
      link: '/admin/students',
      metadata: { event: 'COUNSELLOR_REASSIGNED', studentId: student.id, newCounsellorId: counsellorId },
    });
  }
}

/**
 * Workflow C: University / College Application Status
 */
export async function notifyApplicationEvent({
  application,
  student,
  eventType,
  newStatus,
  actorId,
  companyId,
}) {
  if (!application?.id || !student) return;
  const sName = `${student.firstName || ''} ${student.lastName || ''}`.trim() || 'Student';
  const uniName = application.university || 'Target Institution';

  if (eventType === 'CREATED') {
    // Notify assigned counsellor with task
    if (student.assignedToId) {
      const due = new Date();
      due.setDate(due.getDate() + 3);
      await taskService.createTask({
        title: `University Application Pending: ${uniName}`,
        description: `Compile SOP, transcripts, and application materials for ${sName} applying to ${uniName}. Submit prior to intake cutoff.`,
        category: 'APPLICATION',
        priority: 'MEDIUM',
        dueDate: due,
        companyId: companyId || student.branch?.companyId,
        branchId: student.branchId,
        assignedToId: student.assignedToId,
        createdById: actorId,
        studentId: student.id,
        applicationId: application.id,
        dedupKey: `APP_PENDING_${application.id}`,
      });
    }
  } else if (eventType === 'STATUS_CHANGED') {
    // Notify Student
    await notifyStudentLinkedUser({
      studentId: student.id,
      title: `Application Update: ${uniName}`,
      message: `Your application to ${uniName} status changed to ${newStatus}.`,
      link: '/student/applications',
      metadata: { applicationId: application.id, newStatus, category: 'APPLICATION' },
    });

    // Notify Counsellor
    if (student.assignedToId) {
      await notifyUser(student.assignedToId, {
        type: newStatus === 'ACCEPTED' || newStatus === 'OFFER_RECEIVED' ? 'SUCCESS' : 'INFO',
        category: 'APPLICATION',
        title: `Application Status: ${uniName}`,
        message: `${sName}'s application to ${uniName} is now ${newStatus}.`,
        link: `/admin/students/${student.id}`,
        metadata: { applicationId: application.id, studentId: student.id, newStatus },
      });
    }
  }
}

/**
 * Workflow D: Document Management (Upload, Approve, Reject)
 */
export async function notifyDocumentEvent({
  document,
  student,
  eventType,
  status,
  rejectionReason,
  reviewerUser,
  companyId,
}) {
  if (!document?.id || !student) return;
  const sName = `${student.firstName || ''} ${student.lastName || ''}`.trim() || 'Student';
  const docName = document.name || document.fileName || 'Uploaded Document';

  if (eventType === 'UPLOADED') {
    // Notify responsible counsellor or visa officer
    const reviewerId = student.assignedToId;
    if (reviewerId) {
      await notifyUser(reviewerId, {
        type: 'INFO',
        category: 'DOCUMENT',
        title: `New Document Uploaded: ${docName}`,
        message: `${sName} uploaded "${docName}". Review and verify for admission or visa checklist.`,
        link: `/admin/students/${student.id}`,
        metadata: { documentId: document.id, studentId: student.id },
      });

      // Auto-create document verification task
      const due = new Date();
      due.setDate(due.getDate() + 1);
      await taskService.createTask({
        title: `Verify Document: ${docName}`,
        description: `Review uploaded document "${docName}" for student ${sName}. Verify compliance, legibility, and completeness.`,
        category: 'DOCUMENT',
        priority: 'MEDIUM',
        dueDate: due,
        companyId: companyId || student.branch?.companyId,
        branchId: student.branchId,
        assignedToId: reviewerId,
        studentId: student.id,
        documentId: document.id,
        dedupKey: `DOC_VERIFY_${document.id}`,
      });
    }
  } else if (eventType === 'REJECTED') {
    // Notify student with exact reason
    await notifyStudentLinkedUser({
      studentId: student.id,
      type: 'WARNING',
      title: `Document Rejected: ${docName}`,
      message: `Your document "${docName}" was rejected. Reason: ${rejectionReason || 'Document illegible or incomplete'}. Please re-upload.`,
      link: '/student/documents',
      metadata: { documentId: document.id, rejectionReason, category: 'DOCUMENT' },
    });

    // Auto-create correction task for student/staff
    if (student.assignedToId) {
      await taskService.createTask({
        title: `Correction Required: ${docName} (${sName})`,
        description: `Document was rejected due to: ${rejectionReason || 'Discrepancy'}. Follow up with ${sName} to re-submit correct file.`,
        category: 'DOCUMENT',
        priority: 'HIGH',
        dueDate: new Date(Date.now() + 48 * 3600 * 1000),
        companyId: companyId || student.branch?.companyId,
        branchId: student.branchId,
        assignedToId: student.assignedToId,
        studentId: student.id,
        documentId: document.id,
        dedupKey: `DOC_CORRECTION_${document.id}`,
      });
    }
  } else if (eventType === 'APPROVED') {
    // Notify student of approval
    await notifyStudentLinkedUser({
      studentId: student.id,
      type: 'SUCCESS',
      title: `Document Verified: ${docName}`,
      message: `Your document "${docName}" has been successfully verified and approved.`,
      link: '/student/documents',
      metadata: { documentId: document.id, category: 'DOCUMENT' },
    });

    // Complete the verification task if one exists
    try {
      const activeTask = await prisma.task.findFirst({
        where: {
          dedupKey: `DOC_VERIFY_${document.id}`,
          status: { in: ['PENDING', 'IN_PROGRESS'] },
          deletedAt: null,
        },
      });
      if (activeTask && reviewerUser) {
        await taskService.updateTask(activeTask.id, { status: 'COMPLETED', remark: 'Document verified and approved' }, reviewerUser);
      }
    } catch {}
  }
}

/**
 * Workflow E: Visa Process (File Ready, Decision, Milestones)
 */
export async function notifyVisaEvent({
  visa,
  student,
  eventType,
  newStatus,
  milestoneType,
  milestoneDate,
  companyId,
  actorId,
}) {
  if (!visa?.id || !student) return;
  const sName = `${student.firstName || ''} ${student.lastName || ''}`.trim() || 'Student';
  const destCountry = visa.country || 'Destination';

  if (eventType === 'FILE_READY') {
    // Notify Visa Officers and create visa task
    const visaOfficers = await resolveUsersByRoles({
      companyId: companyId || student.branch?.companyId,
      branchId: student.branchId,
      roleSlugs: ['visa_officer', 'branch_manager'],
    });

    const targetOfficerId = visaOfficers[0]?.id || student.assignedToId;
    if (targetOfficerId) {
      await notifyUser(targetOfficerId, {
        type: 'INFO',
        category: 'VISA',
        title: `Visa File Ready: ${sName}`,
        message: `Admission secured for ${sName}. Visa lodging file is ready for ${destCountry}.`,
        link: `/admin/students/${student.id}`,
        metadata: { visaId: visa.id, studentId: student.id },
      });

      const due = new Date();
      due.setDate(due.getDate() + 5);
      await taskService.createTask({
        title: `Visa File Lodgement: ${sName} (${destCountry})`,
        description: `Audit visa documentation checklist, financial capacity proof, and lodge visa application for ${destCountry}.`,
        category: 'VISA',
        priority: 'HIGH',
        dueDate: due,
        companyId: companyId || student.branch?.companyId,
        branchId: student.branchId,
        assignedToId: targetOfficerId,
        createdById: actorId,
        studentId: student.id,
        visaId: visa.id,
        dedupKey: `VISA_PROCESS_${visa.id}`,
      });
    }
  } else if (eventType === 'MILESTONE_SCHEDULED') {
    // Biometrics, Medical, Interview schedule
    const dateStr = milestoneDate ? new Date(milestoneDate).toLocaleDateString('en-IN') : 'Scheduled Date';
    await notifyStudentLinkedUser({
      studentId: student.id,
      type: 'WARNING',
      title: `${milestoneType} Scheduled: ${destCountry} Visa`,
      message: `Your ${milestoneType} appointment is scheduled for ${dateStr}. Please bring all required originals and confirmations.`,
      link: '/student/visa',
      metadata: { visaId: visa.id, milestoneType, milestoneDate, category: 'VISA' },
    });

    if (student.assignedToId) {
      await notifyUser(student.assignedToId, {
        type: 'INFO',
        category: 'VISA',
        title: `${milestoneType} Scheduled: ${sName}`,
        message: `${sName}'s ${milestoneType} appointment set for ${dateStr}.`,
        link: `/admin/students/${student.id}`,
        metadata: { visaId: visa.id, studentId: student.id },
      });
    }
  } else if (eventType === 'DECISION') {
    const isGranted = (newStatus || '').toUpperCase().includes('GRANT') || (newStatus || '').toUpperCase().includes('APPROV');
    
    // Notify Student
    await notifyStudentLinkedUser({
      studentId: student.id,
      type: isGranted ? 'SUCCESS' : 'WARNING',
      title: isGranted ? `Congratulations! Visa Granted for ${destCountry}` : `Visa Decision: ${destCountry}`,
      message: isGranted
        ? `Your student visa application for ${destCountry} has been officially approved and granted!`
        : `Your visa application for ${destCountry} decision status is: ${newStatus}. Contact your counsellor for next steps.`,
      link: '/student/visa',
      metadata: { visaId: visa.id, newStatus, category: 'VISA' },
    });

    // Notify Counsellor
    if (student.assignedToId) {
      await notifyUser(student.assignedToId, {
        type: isGranted ? 'SUCCESS' : 'WARNING',
        category: 'VISA',
        title: isGranted ? `Visa Granted: ${sName}` : `Visa Update: ${sName}`,
        message: `${sName}'s visa for ${destCountry} has been ${newStatus}.`,
        link: `/admin/students/${student.id}`,
        metadata: { visaId: visa.id, studentId: student.id, newStatus },
      });
    }

    // Notify Referring Agent if student was referred by a partner
    let partnerUserId = student.partner?.userId;
    if (!partnerUserId && student.partnerId) {
      const p = await prisma.partner.findUnique({
        where: { id: student.partnerId },
        select: { userId: true },
      }).catch(() => null);
      partnerUserId = p?.userId;
    }

    if (partnerUserId) {
      await notifyUser(partnerUserId, {
        type: isGranted ? 'SUCCESS' : 'INFO',
        category: 'VISA',
        title: isGranted ? `Referral Visa Approved: ${sName}` : `Referral Visa Status: ${sName}`,
        message: `Your referred candidate ${sName} visa for ${destCountry} has been ${newStatus}.`,
        link: '/agent/students',
        metadata: { studentId: student.id, newStatus },
      });
    }
  }
}

/**
 * Workflow F: Financial / Accountant Management (Payment Proofs, Receipts, Refunds)
 */
export async function notifyFinancialEvent({
  eventType,
  proof,
  refund,
  invoice,
  student,
  companyId,
  branchId,
  rejectionReason,
  reviewerUser,
}) {
  if (eventType === 'PAYMENT_PROOF_SUBMITTED') {
    // Notify Accountants
    const accountants = await resolveUsersByRoles({
      companyId,
      branchId,
      roleSlugs: ['accountant', 'company_admin', 'branch_manager'],
    });

    const sName = student ? `${student.firstName || ''} ${student.lastName || ''}`.trim() : 'Student';
    const amountStr = proof.amount ? `$${proof.amount}` : 'payment';

    for (const acc of accountants) {
      await notifyUser(acc.id, {
        type: 'INFO',
        category: 'FEE',
        title: 'Payment Proof Submitted for Verification',
        message: `${sName} uploaded offline payment receipt (${amountStr}) for Invoice #${invoice?.invoiceNo || 'INV'}. Review and approve.`,
        link: '/admin/fees',
        metadata: { proofId: proof.id, invoiceId: invoice?.id, studentId: student?.id },
      });
    }

    // Auto-create task for accountant
    const leadAccountantId = accountants[0]?.id;
    if (leadAccountantId) {
      await taskService.createTask({
        title: `Verify Payment Proof: ${sName} (${amountStr})`,
        description: `Verify bank transfer reference "${proof.referenceNo || 'N/A'}" and credit payment against Invoice #${invoice?.invoiceNo || ''}.`,
        category: 'PAYMENT',
        priority: 'HIGH',
        dueDate: new Date(Date.now() + 24 * 3600 * 1000),
        companyId,
        branchId,
        assignedToId: leadAccountantId,
        studentId: student?.id,
        dedupKey: `PROOF_VERIFY_${proof.id}`,
      });
    }
  } else if (eventType === 'PAYMENT_PROOF_APPROVED') {
    // Notify Student with confirmation & receipt link
    if (student) {
      await notifyStudentLinkedUser({
        studentId: student.id,
        type: 'SUCCESS',
        title: 'Payment Verified & Receipt Generated',
        message: `Your payment of $${proof.amount || '0'} has been verified. Official receipt has been added to your portal.`,
        link: '/student/receipts',
        metadata: { proofId: proof.id, category: 'FEE' },
      });
    }

    // Complete review task
    try {
      const activeTask = await prisma.task.findFirst({
        where: {
          dedupKey: `PROOF_VERIFY_${proof.id}`,
          status: { in: ['PENDING', 'IN_PROGRESS'] },
          deletedAt: null,
        },
      });
      if (activeTask && reviewerUser) {
        await taskService.updateTask(activeTask.id, { status: 'COMPLETED', remark: 'Payment verified and credited' }, reviewerUser);
      }
    } catch {}
  } else if (eventType === 'PAYMENT_PROOF_REJECTED') {
    if (student) {
      await notifyStudentLinkedUser({
        studentId: student.id,
        type: 'ERROR',
        title: 'Payment Verification Unsuccessful',
        message: `Your payment proof was rejected. Reason: ${rejectionReason || 'Reference could not be verified in bank records'}. Please contact accounts.`,
        link: '/student/fees',
        metadata: { proofId: proof.id, rejectionReason, category: 'FEE' },
      });
    }
  } else if (eventType === 'REFUND_REQUESTED') {
    // Notify Approvers
    const approvers = await resolveUsersByRoles({
      companyId,
      branchId,
      roleSlugs: ['company_admin', 'branch_manager', 'accountant'],
    });

    const sName = student ? `${student.firstName || ''} ${student.lastName || ''}`.trim() : 'Student';
    for (const app of approvers) {
      await notifyUser(app.id, {
        type: 'WARNING',
        category: 'FEE',
        title: 'Refund Approval Required',
        message: `Refund of $${refund.amount} requested for ${sName} (#${refund.refundNo}). Authorization required.`,
        link: '/admin/fees',
        metadata: { refundId: refund.id, studentId: student?.id },
      });
    }

    if (approvers[0]?.id) {
      await taskService.createTask({
        title: `Authorize Refund #${refund.refundNo}: ${sName} ($${refund.amount})`,
        description: `Review refund justification: "${refund.reason || 'Requested'}". Approve or reject payout.`,
        category: 'PAYMENT',
        priority: 'HIGH',
        dueDate: new Date(Date.now() + 48 * 3600 * 1000),
        companyId,
        branchId,
        assignedToId: approvers[0].id,
        studentId: student?.id,
        dedupKey: `REFUND_APPROVE_${refund.id}`,
      });
    }
  }
}

/**
 * Workflow G: Appointment Scheduling
 */
export async function notifyAppointmentEvent({
  appointment,
  student,
  enquiry,
  counsellorId,
  actorId,
  companyId,
}) {
  if (!appointment?.id) return;
  const targetName = student
    ? `${student.firstName || ''} ${student.lastName || ''}`.trim()
    : `${enquiry?.firstName || ''} ${enquiry?.lastName || ''}`.trim();
  const timeStr = appointment.startAt ? new Date(appointment.startAt).toLocaleString('en-IN') : 'Scheduled time';

  // Notify Counsellor
  if (counsellorId) {
    await notifyUser(counsellorId, {
      type: 'INFO',
      category: 'APPOINTMENT',
      title: `Appointment Booked: ${targetName}`,
      message: `Consultation session scheduled for ${timeStr} (${appointment.title || 'Meeting'}).`,
      link: '/admin/calendar',
      metadata: { appointmentId: appointment.id, studentId: student?.id, enquiryId: enquiry?.id },
    });
  }

  // Notify Student if linked
  if (student?.id) {
    await notifyStudentLinkedUser({
      studentId: student.id,
      type: 'INFO',
      title: `Upcoming Consultation: ${appointment.title || 'Counselling'}`,
      message: `Your session is booked for ${timeStr}. Room/Mode: ${appointment.location || 'Online'}.`,
      link: '/student/calendar',
      metadata: { appointmentId: appointment.id, category: 'APPOINTMENT' },
    });
  }
}

export default {
  notifyUser,
  notifyCounsellorAssigned,
  notifyMany,
  notifyRoles,
  resolveUsersByRoles,
  notifyVisitorRegistered,
  notifyAgentReferredStudent,
  notifyCounsellorAssignment,
  notifyApplicationEvent,
  notifyDocumentEvent,
  notifyVisaEvent,
  notifyFinancialEvent,
  notifyAppointmentEvent,
  RECEPTION_ALERT_ROLE_SLUGS,
};
