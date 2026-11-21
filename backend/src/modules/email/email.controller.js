import { asyncHandler, sendSuccess, AppError } from '../../utils/response.util.js';
import emailService, {
  getSmtpStatus,
  getOverrideEmailConfig,
  setOverrideEmailConfig,
} from '../../services/email/email.service.js';
import * as templates from '../../services/email/emailTemplates.js';
import prisma from '../../config/database.js';
import { getCachedCompanyBrand } from '../../utils/companyBrand.util.js';

export const SYSTEM_TEMPLATES = [
  {
    code: 'ENQUIRY_WELCOME',
    name: 'Enquiry & Visitor Welcome',
    category: 'Student Journey',
    eventType: 'ENQUIRY_CREATED',
    channel: 'EMAIL',
    subject: 'Welcome to {{companyName}} — Thank you for your visit (Enquiry #{{enquiryCode}})',
    description: 'Sent automatically to students / visitors immediately after enquiry registration.',
    variables: ['studentName', 'enquiryCode', 'courseName', 'country', 'counsellorName', 'counsellorPhone', 'companyName'],
    sampleData: {
      studentName: 'Aarav Patel',
      enquiryCode: 'ENQ-2026-0842',
      courseName: 'IELTS Masterclass & Canada Admissions',
      country: 'Canada',
      counsellorName: 'Priya Sharma (Senior Advisor)',
      counsellorPhone: '+91 98765 43210',
      companyName: '3ni Infotech',
    },
    buildFn: (data) => templates.buildEnquiryWelcomeEmail(data),
  },
  {
    code: 'STUDENT_WELCOME',
    name: 'Student Portal Access & Onboarding',
    category: 'Student Journey',
    eventType: 'STUDENT_CREATED',
    channel: 'EMAIL',
    subject: '🎉 Welcome to {{companyName}} Student Portal — Your Student ID: {{studentCode}}',
    description: 'Sent when an enquiry is converted to an enrolled student, providing portal login credentials.',
    variables: ['studentName', 'studentCode', 'email', 'tempPassword', 'courseName', 'counsellorName', 'portalUrl', 'companyName'],
    sampleData: {
      studentName: 'Aarav Patel',
      studentCode: 'STU-2026-0149',
      email: 'aarav.patel@example.com',
      tempPassword: '123',
      courseName: 'Postgraduate Diploma in Cloud Computing',
      counsellorName: 'Ramesh Patel',
      companyName: '3ni Infotech',
    },
    buildFn: (data) => templates.buildStudentPortalWelcomeEmail(data),
  },
  {
    code: 'FEE_RECEIPT',
    name: 'Fee Payment Receipt & Invoice',
    category: 'Billing & Invoices',
    eventType: 'FEE_RECEIPT',
    channel: 'EMAIL',
    subject: '🧾 Payment Receipt & Invoice #{{invoiceNo}} — {{companyName}}',
    description: 'Sent automatically as soon as a student pays tuition, coaching, or visa fees.',
    variables: ['studentName', 'studentCode', 'invoiceNo', 'amountPaid', 'totalAmount', 'balanceDue', 'paymentMode', 'transactionDate', 'courseName', 'companyName'],
    sampleData: {
      studentName: 'Aarav Patel',
      studentCode: 'STU-2026-0149',
      invoiceNo: 'INV-2026-0038',
      amountPaid: 35000,
      totalAmount: 50000,
      balanceDue: 15000,
      paymentMode: 'UPI / Online Banking',
      courseName: 'IELTS Comprehensive + Canada Visa Advisory',
      companyName: '3ni Infotech',
    },
    buildFn: (data) => templates.buildFeeReceiptInvoiceEmail(data),
  },
  {
    code: 'APPLICATION_UPDATE',
    name: 'University Application Milestone',
    category: 'Admissions & Visa',
    eventType: 'APPLICATION_STATUS',
    channel: 'EMAIL',
    subject: '🎉 Offer Received: {{universityName}} — {{status}}',
    description: 'Sent when application status changes (e.g. Application Submitted, Offer Received).',
    variables: ['studentName', 'universityName', 'courseName', 'status', 'remarks', 'companyName'],
    sampleData: {
      studentName: 'Aarav Patel',
      universityName: 'Conestoga College, Ontario',
      courseName: 'Cloud Data Architecture (Fall 2027)',
      status: 'OFFER_RECEIVED',
      remarks: 'Letter of Acceptance (LOA) issued with scholarship grant.',
      companyName: '3ni Infotech',
    },
    buildFn: (data) => templates.buildApplicationMilestoneEmail(data),
  },
  {
    code: 'VISA_APPROVED',
    name: 'Visa Grant & Milestone Update',
    category: 'Admissions & Visa',
    eventType: 'VISA_STATUS',
    channel: 'EMAIL',
    subject: '🎉 VISA APPROVED: {{country}} (Granted) — {{companyName}}',
    description: 'Sent when study visa or permit status is updated or approved.',
    variables: ['studentName', 'country', 'status', 'visaType', 'remarks', 'companyName'],
    sampleData: {
      studentName: 'Aarav Patel',
      country: 'Canada',
      status: 'VISA_APPROVED',
      visaType: 'Student Direct Stream (SDS) Study Permit',
      remarks: 'Visa counterfoil stamped. Passport ready for collection.',
      companyName: '3ni Infotech',
    },
    buildFn: (data) => templates.buildVisaMilestoneEmail(data),
  },
  {
    code: 'DEMO_INVITE',
    name: 'Coaching Demo & Trial Class',
    category: 'Student Journey',
    eventType: 'DEMO_SCHEDULED',
    channel: 'EMAIL',
    subject: '🎓 Demo Class Scheduled: {{courseName}} with {{companyName}}',
    description: 'Sent to student when a faculty demo session or trial class is booked.',
    variables: ['studentName', 'courseName', 'demoDate', 'demoTime', 'facultyName', 'batch', 'venue', 'companyName'],
    sampleData: {
      studentName: 'Aarav Patel',
      courseName: 'IELTS Academic Masterclass',
      demoDate: 'Tomorrow, 21 Nov 2026',
      demoTime: '10:30 AM - 12:00 PM',
      facultyName: 'Prof. Ramesh Patel',
      batch: 'Batch Morning A',
      venue: 'Surat Head Office & Google Meet',
      companyName: '3ni Infotech',
    },
    buildFn: (data) => templates.buildDemoScheduledEmail(data),
  },
  {
    code: 'TASK_ASSIGNED',
    name: 'Staff Task & Follow-up Assignment',
    category: 'Operations',
    eventType: 'TASK_ASSIGNED',
    channel: 'EMAIL',
    subject: 'New Task Assigned: {{taskTitle}} ({{priority}} Priority)',
    description: 'Sent to counselors and staff members when a new CRM task or action item is assigned.',
    variables: ['taskTitle', 'description', 'priority', 'dueDate', 'assigneeName', 'companyName'],
    sampleData: {
      taskTitle: 'Verify Transcripts & GIC Certificate for Aarav Patel',
      description: 'Check Canadian High Commission financial proof before visa file submission.',
      priority: 'HIGH',
      dueDate: new Date(Date.now() + 86400000).toISOString(),
      assigneeName: 'Priya Sharma',
      companyName: '3ni Infotech',
    },
    buildFn: (data) => templates.buildTaskAssignedEmail(data),
  },
  {
    code: 'ANNOUNCEMENT',
    name: 'Company Broadcast Notice',
    category: 'Operations',
    eventType: 'ANNOUNCEMENT',
    channel: 'EMAIL',
    subject: 'Important Notice: {{title}}',
    description: 'Broadcast email sent to selected branches, staff, or students.',
    variables: ['title', 'body', 'audience', 'companyName'],
    sampleData: {
      title: 'Upcoming University Fair & Visa Masterclass',
      body: 'Representatives from 15 Canadian and UK institutions will be visiting our campus this weekend.',
      audience: 'All Students & Parents',
      companyName: '3ni Infotech',
    },
    buildFn: (data) => templates.buildAnnouncementEmail(data),
  },
];

export const getStatus = asyncHandler(async (_req, res) => {
  const status = getSmtpStatus();
  sendSuccess(res, status, 'Email service status retrieved');
});

export const updateSettings = asyncHandler(async (req, res) => {
  const { overrideEmail, enabled } = req.body;
  setOverrideEmailConfig({ email: overrideEmail, enabled });
  const status = getSmtpStatus();
  sendSuccess(res, status, 'Email routing settings updated');
});

export const getTemplates = asyncHandler(async (req, res) => {
  const companyId = req.user?.companyId;

  // Fetch custom templates stored in database
  const dbTemplates = await prisma.communicationTemplate.findMany({
    where: {
      deletedAt: null,
      channel: 'EMAIL',
      ...(companyId ? { companyId } : {}),
    },
  }).catch(() => []);

  const dbMap = new Map(dbTemplates.map((t) => [t.code, t]));

  // Merge with system registry
  const merged = SYSTEM_TEMPLATES.map((st) => {
    const dbRow = dbMap.get(st.code);
    return {
      code: st.code,
      name: dbRow?.name || st.name,
      category: st.category,
      eventType: dbRow?.eventType || st.eventType,
      channel: 'EMAIL',
      subject: dbRow?.subject || st.subject,
      description: dbRow?.description || st.description,
      variables: st.variables,
      isActive: dbRow?.isActive != null ? dbRow.isActive : true,
      isCustomized: Boolean(dbRow),
      sampleData: st.sampleData,
      updatedAt: dbRow?.updatedAt || null,
    };
  });

  sendSuccess(res, merged, 'Email templates retrieved');
});

export const getTemplateByCode = asyncHandler(async (req, res) => {
  const { code } = req.params;
  const sys = SYSTEM_TEMPLATES.find((s) => s.code === code);
  if (!sys) throw new AppError(`Template "${code}" not found`, 404);

  const dbRow = await prisma.communicationTemplate.findFirst({
    where: {
      code,
      deletedAt: null,
      channel: 'EMAIL',
    },
  }).catch(() => null);

  // Render preview
  const brand = getCachedCompanyBrand();
  const sampleWithBrand = { ...sys.sampleData, company: brand, companyName: brand.name };

  let preview;
  if (dbRow?.body) {
    const renderedBody = templates.renderDynamicTemplate(dbRow.body, sampleWithBrand);
    const renderedSubject = templates.renderDynamicTemplate(dbRow.subject || sys.subject, sampleWithBrand);
    preview = {
      subject: renderedSubject,
      html: templates.wrapEmailTemplate({
        title: sys.name,
        bodyHtml: renderedBody,
        company: brand,
        forPreview: true,
      }),
    };
  } else {
    preview = sys.buildFn({ ...sampleWithBrand, forPreview: true });
  }

  const finalPreviewHtml = templates.renderForPreview(preview?.html || '');
  if (preview) {
    preview.html = finalPreviewHtml;
  }

  const merged = {
    code: sys.code,
    name: dbRow?.name || sys.name,
    category: sys.category,
    eventType: dbRow?.eventType || sys.eventType,
    channel: 'EMAIL',
    subject: dbRow?.subject || sys.subject,
    body: dbRow?.body || finalPreviewHtml || '',
    description: dbRow?.description || sys.description,
    variables: sys.variables,
    isActive: dbRow?.isActive != null ? dbRow.isActive : true,
    isCustomized: Boolean(dbRow),
    sampleData: sys.sampleData,
  };

  sendSuccess(res, {
    template: merged,
    preview,
    previewHtml: finalPreviewHtml,
  }, 'Template details retrieved');
});

export const updateTemplate = asyncHandler(async (req, res) => {
  const { code } = req.params;
  const { subject, body, isActive } = req.body;
  const companyId = req.user?.companyId;

  const sys = SYSTEM_TEMPLATES.find((s) => s.code === code);
  if (!sys) throw new AppError(`Template "${code}" not found`, 404);

  const defaultCompany = companyId || (await prisma.company.findFirst({ select: { id: true } }))?.id;
  if (!defaultCompany) throw new AppError('Company context required', 400);

  const existing = await prisma.communicationTemplate.findFirst({
    where: {
      code,
      companyId: defaultCompany,
      deletedAt: null,
    },
  });

  let saved;
  if (existing) {
    saved = await prisma.communicationTemplate.update({
      where: { id: existing.id },
      data: {
        ...(subject !== undefined ? { subject } : {}),
        ...(body !== undefined ? { body } : {}),
        ...(isActive !== undefined ? { isActive: Boolean(isActive) } : {}),
        updatedBy: req.user?.id,
      },
    });
  } else {
    saved = await prisma.communicationTemplate.create({
      data: {
        companyId: defaultCompany,
        code,
        name: sys.name,
        channel: 'EMAIL',
        subject: subject || sys.subject,
        body: body || null,
        eventType: sys.eventType,
        description: sys.description,
        isActive: isActive != null ? Boolean(isActive) : true,
        createdBy: req.user?.id,
      },
    });
  }

  sendSuccess(res, saved, 'Email template updated successfully');
});

export const sendTestTemplate = asyncHandler(async (req, res) => {
  const { code } = req.params;
  const { to, recipient, subject, body, customData = {} } = req.body;

  const sys = SYSTEM_TEMPLATES.find((s) => s.code === code);
  if (!sys) throw new AppError(`Template "${code}" not found`, 404);

  const dbRow = await prisma.communicationTemplate.findFirst({
    where: { code, deletedAt: null, channel: 'EMAIL' },
  }).catch(() => null);

  const brand = getCachedCompanyBrand();
  const mergedData = {
    ...sys.sampleData,
    ...customData,
    company: brand,
    companyName: brand.name,
  };

  const activeBody = body || dbRow?.body || null;
  const activeSubject = subject || dbRow?.subject || sys.subject;

  let rendered;
  if (activeBody) {
    const renderedBody = templates.renderDynamicTemplate(activeBody, mergedData);
    const renderedSubject = templates.renderDynamicTemplate(activeSubject, mergedData);
    rendered = {
      subject: renderedSubject,
      html: templates.wrapEmailTemplate({
        title: sys.name,
        bodyHtml: renderedBody,
        company: brand,
      }),
    };
  } else {
    rendered = sys.buildFn(mergedData);
  }

  const override = getOverrideEmailConfig();
  const targetEmail = to || recipient || override.overrideEmail || req.user?.email || 'kachhadiyadarshil2@gmail.com';

  const sendResult = await emailService.safeSendEmail({
    to: targetEmail,
    subject: rendered.subject,
    html: rendered.html,
  });

  sendSuccess(res, { ...sendResult, targetEmail, templateCode: code }, 'Test email successfully dispatched to mailbox');
});

export const sendTest = asyncHandler(async (req, res) => {
  const { to, template = 'ENQUIRY_WELCOME' } = req.body;
  req.params.code = template;
  return sendTestTemplate(req, res);
});

export const getTemplatePreview = asyncHandler(async (req, res) => {
  const { templateKey } = req.params;
  req.params.code = templateKey;
  return getTemplateByCode(req, res);
});

/**
 * Get recipient directory for Targeted & Broadcast email sending
 */
export const getRecipients = asyncHandler(async (_req, res) => {
  const [students, roles, staff] = await Promise.all([
    prisma.student.findMany({
      where: { deletedAt: null },
      select: {
        id: true,
        studentCode: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        status: true,
      },
      orderBy: { firstName: 'asc' },
    }),
    prisma.role.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
        users: {
          where: { deletedAt: null, status: 'ACTIVE' },
          select: { id: true },
        },
      },
      orderBy: { name: 'asc' },
    }),
    prisma.user.findMany({
      where: { deletedAt: null, status: 'ACTIVE' },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        roleId: true,
        role: { select: { id: true, name: true, slug: true } },
      },
      orderBy: { firstName: 'asc' },
    }),
  ]);

  const validStudents = students
    .filter((s) => s.email && s.email.includes('@'))
    .map((s) => ({
      id: s.id,
      studentCode: s.studentCode,
      name: `${s.firstName || ''} ${s.lastName || ''}`.trim() || s.studentCode,
      email: s.email,
      phone: s.phone || '',
      status: s.status,
    }));

  const roleSummary = roles
    .map((r) => ({
      id: r.id,
      name: r.name,
      slug: r.slug,
      userCount: r.users ? r.users.length : 0,
    }))
    .filter((r) => r.userCount > 0);

  const validStaff = staff
    .filter((u) => u.email && u.email.includes('@'))
    .map((u) => ({
      id: u.id,
      name: `${u.firstName || ''} ${u.lastName || ''}`.trim() || u.email,
      email: u.email,
      roleId: u.roleId,
      roleName: u.role?.name || 'Staff',
      roleSlug: u.role?.slug || '',
    }));

  sendSuccess(res, {
    students: validStudents,
    roles: roleSummary,
    staff: validStaff,
    counts: {
      students: validStudents.length,
      staff: validStaff.length,
    },
  }, 'Recipients list retrieved successfully');
});

/**
 * Preview a custom composed email before dispatch
 */
export const previewCustomEmail = asyncHandler(async (req, res) => {
  const { subject = 'Notice from 3ni InfoTech', message = '', ctaText = null, ctaUrl = null, recipientName = 'Recipient' } = req.body;

  const brand = getCachedCompanyBrand();
  const paragraphs = String(message || '')
    .split(/\n\n+/)
    .map((para) => `<p class="email-text" style="margin-bottom: 12px; line-height: 1.6;">${templates.escapeHtml(para).replace(/\n/g, '<br/>')}</p>`)
    .join('');

  const bodyHtml = `
    <p class="email-text" style="font-weight: 600; color: #0f172a; margin-bottom: 14px;">
      Hello <strong>${templates.escapeHtml(recipientName)}</strong>,
    </p>
    ${paragraphs || '<p class="email-text">This is a preview of your message content.</p>'}
  `;

  const rawHtml = templates.wrapEmailTemplate({
    title: subject || 'Announcement',
    preheader: message ? message.slice(0, 100) : 'Notice from 3ni InfoTech',
    bodyHtml,
    ctaText: ctaText ? ctaText.trim() : null,
    ctaUrl: ctaUrl ? ctaUrl.trim() : null,
    company: brand,
    forPreview: true,
  });

  const previewHtml = templates.renderForPreview(rawHtml);
  sendSuccess(res, { previewHtml }, 'Custom email preview rendered');
});

/**
 * Targeted & Broadcast Email Dispatcher
 * Sends to: Single Student, All Students, Staff by Role, Single Staff, or Custom Direct Email
 */
export const dispatchCustomEmail = asyncHandler(async (req, res) => {
  const {
    audienceType, // 'SINGLE_STUDENT' | 'ALL_STUDENTS' | 'ROLE_STAFF' | 'SINGLE_STAFF' | 'CUSTOM_EMAIL'
    studentId,
    roleId,
    staffId,
    customEmail,
    subject,
    message,
    ctaText,
    ctaUrl,
  } = req.body;

  if (!subject || !subject.trim()) {
    throw new AppError('Subject is required', 400);
  }
  if (!message || !message.trim()) {
    throw new AppError('Email message content is required', 400);
  }

  let recipients = [];

  switch (audienceType) {
    case 'SINGLE_STUDENT': {
      if (!studentId) throw new AppError('Please select a student', 400);
      const student = await prisma.student.findUnique({
        where: { id: studentId },
        select: { id: true, firstName: true, lastName: true, email: true, studentCode: true },
      });
      if (!student || !student.email) throw new AppError('Selected student does not have a valid email', 400);
      recipients.push({
        email: student.email.trim(),
        name: `${student.firstName || ''} ${student.lastName || ''}`.trim() || student.studentCode,
        type: 'Student',
      });
      break;
    }

    case 'ALL_STUDENTS': {
      const allStudents = await prisma.student.findMany({
        where: { deletedAt: null },
        select: { id: true, firstName: true, lastName: true, email: true, studentCode: true },
      });
      for (const s of allStudents) {
        if (s.email && s.email.includes('@')) {
          recipients.push({
            email: s.email.trim(),
            name: `${s.firstName || ''} ${s.lastName || ''}`.trim() || s.studentCode,
            type: 'Student',
          });
        }
      }
      break;
    }

    case 'ROLE_STAFF': {
      if (!roleId) throw new AppError('Please select a staff role', 400);
      const roleUsers = await prisma.user.findMany({
        where: { roleId, deletedAt: null, status: 'ACTIVE' },
        select: { id: true, firstName: true, lastName: true, email: true },
      });
      for (const u of roleUsers) {
        if (u.email && u.email.includes('@')) {
          recipients.push({
            email: u.email.trim(),
            name: `${u.firstName || ''} ${u.lastName || ''}`.trim() || u.email,
            type: 'Staff',
          });
        }
      }
      break;
    }

    case 'SINGLE_STAFF': {
      if (!staffId) throw new AppError('Please select a staff member', 400);
      const staffUser = await prisma.user.findUnique({
        where: { id: staffId },
        select: { id: true, firstName: true, lastName: true, email: true },
      });
      if (!staffUser || !staffUser.email) throw new AppError('Selected staff member has no email', 400);
      recipients.push({
        email: staffUser.email.trim(),
        name: `${staffUser.firstName || ''} ${staffUser.lastName || ''}`.trim() || staffUser.email,
        type: 'Staff',
      });
      break;
    }

    case 'CUSTOM_EMAIL': {
      if (!customEmail || !customEmail.includes('@')) {
        throw new AppError('Valid custom email address is required', 400);
      }
      recipients.push({
        email: customEmail.trim(),
        name: 'Recipient',
        type: 'Custom',
      });
      break;
    }

    default:
      throw new AppError(`Invalid audience type "${audienceType}"`, 400);
  }

  // Deduplicate by email
  const uniqueRecipients = [];
  const seenEmails = new Set();
  for (const r of recipients) {
    const lower = r.email.toLowerCase();
    if (!seenEmails.has(lower)) {
      seenEmails.add(lower);
      uniqueRecipients.push(r);
    }
  }

  if (uniqueRecipients.length === 0) {
    throw new AppError('No eligible recipients found for this selection', 400);
  }

  const brand = getCachedCompanyBrand();
  const paragraphs = String(message)
    .split(/\n\n+/)
    .map((para) => `<p class="email-text" style="margin-bottom: 12px; line-height: 1.6;">${templates.escapeHtml(para).replace(/\n/g, '<br/>')}</p>`)
    .join('');

  const sendResults = [];
  for (let i = 0; i < uniqueRecipients.length; i++) {
    const r = uniqueRecipients[i];
    const bodyHtml = `
      <p class="email-text" style="font-weight: 600; color: #0f172a; margin-bottom: 14px;">
        Hello <strong>${templates.escapeHtml(r.name)}</strong>,
      </p>
      ${paragraphs}
    `;

    const fullHtml = templates.wrapEmailTemplate({
      title: subject.trim(),
      preheader: message ? message.slice(0, 100) : 'Notice from 3ni InfoTech',
      bodyHtml,
      ctaText: ctaText ? ctaText.trim() : null,
      ctaUrl: ctaUrl ? ctaUrl.trim() : null,
      company: brand,
    });

    const result = await emailService.safeSendEmail({
      to: r.email,
      subject: subject.trim(),
      html: fullHtml,
    });

    sendResults.push({
      email: r.email,
      name: r.name,
      success: Boolean(result?.success),
      messageId: result?.messageId || null,
    });

    // Throttling to respect SMTP burst rate limits
    if (uniqueRecipients.length > 1 && i < uniqueRecipients.length - 1) {
      await new Promise((resolve) => setTimeout(resolve, 150));
    }
  }

  const successCount = sendResults.filter((r) => r.success).length;
  const override = emailService.getOverrideEmailConfig();

  // ── 1. Create In-App Notifications for Recipients ──
  try {
    const senderName = `${req.user?.firstName || ''} ${req.user?.lastName || ''}`.trim() || req.user?.email || 'CRM Team';
    const notifTitle = `✉️ Email: ${subject.trim()}`;
    const notifMsg = message.trim().slice(0, 180);

    // Identify user IDs for staff / student recipients
    const recipientEmails = uniqueRecipients.map((r) => r.email.toLowerCase());
    const matchedUsers = await prisma.user.findMany({
      where: {
        email: { in: recipientEmails },
        deletedAt: null,
        status: 'ACTIVE',
        id: { not: req.user?.id }, // Don't notify the sender themselves
      },
      select: { id: true },
    });

    if (matchedUsers.length > 0) {
      await prisma.notification.createMany({
        data: matchedUsers.map((u) => ({
          userId: u.id,
          type: 'INFO',
          category: 'EMAIL_ANNOUNCEMENT',
          title: notifTitle,
          message: notifMsg,
          link: '/admin/settings?tab=email-templates',
          metadata: { senderName, subject: subject.trim() },
        })),
      });
    }
  } catch (notifErr) {
    console.warn('[emailController] Failed to dispatch in-app notifications:', notifErr.message);
  }

  // ── 2. Record Sent Email in Activity & History Log ──
  let logRecord = null;
  try {
    const senderName = `${req.user?.firstName || ''} ${req.user?.lastName || ''}`.trim() || req.user?.email || 'Admin';
    const senderRole = req.user?.role?.name || 'Staff';

    // Build human-readable audience label
    let audienceLabel = 'Direct Recipient';
    if (audienceType === 'ALL_STUDENTS') audienceLabel = `All Students (${uniqueRecipients.length})`;
    else if (audienceType === 'SINGLE_STUDENT') audienceLabel = `Student: ${uniqueRecipients[0]?.name || ''}`;
    else if (audienceType === 'ROLE_STAFF') audienceLabel = `Role Staff (${uniqueRecipients.length})`;
    else if (audienceType === 'SINGLE_STAFF') audienceLabel = `Staff: ${uniqueRecipients[0]?.name || ''}`;
    else if (audienceType === 'CUSTOM_EMAIL') audienceLabel = `Custom: ${customEmail}`;

    logRecord = await prisma.activity.create({
      data: {
        userId: req.user?.id || null,
        studentId: studentId && (audienceType === 'SINGLE_STUDENT') ? studentId : null,
        action: 'EMAIL_DISPATCH',
        description: subject.trim(),
        metadata: {
          audienceType,
          audienceLabel,
          senderName,
          senderRole,
          senderEmail: req.user?.email || '',
          recipientCount: uniqueRecipients.length,
          successCount,
          recipients: uniqueRecipients.map((r) => ({ email: r.email, name: r.name, type: r.type })),
          subject: subject.trim(),
          message: message.trim(),
          ctaText: ctaText ? ctaText.trim() : null,
          ctaUrl: ctaUrl ? ctaUrl.trim() : null,
          overrideActive: override.enabled,
          overrideEmail: override.overrideEmail,
        },
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            role: { select: { id: true, name: true, slug: true } },
          },
        },
      },
    });
  } catch (logErr) {
    console.error('[emailController] Failed to log email activity:', logErr.message);
  }

  sendSuccess(res, {
    totalRecipients: uniqueRecipients.length,
    successCount,
    failedCount: uniqueRecipients.length - successCount,
    overrideActive: override.enabled,
    overrideEmail: override.overrideEmail,
    logId: logRecord?.id || null,
    details: sendResults.slice(0, 10),
  }, `Successfully dispatched email to ${successCount} recipient(s)`);
});

/**
 * Get Email Dispatch History Logs
 * Super Admin & Company Admin see all dispatched emails with sender details.
 * Other roles see emails dispatched by them.
 */
export const getEmailHistory = asyncHandler(async (req, res) => {
  const user = req.user;
  const isSuperOrCompanyAdmin = ['super_admin', 'company_admin'].includes(user?.role?.slug);

  const where = {
    action: 'EMAIL_DISPATCH',
    ...(!isSuperOrCompanyAdmin ? { userId: user.id } : {}),
  };

  const logs = await prisma.activity.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: 100,
    include: {
      user: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          role: { select: { id: true, name: true, slug: true } },
        },
      },
      student: {
        select: {
          id: true,
          studentCode: true,
          firstName: true,
          lastName: true,
          email: true,
        },
      },
    },
  });

  const formatted = logs.map((l) => {
    const meta = l.metadata || {};
    const senderName = l.user
      ? `${l.user.firstName || ''} ${l.user.lastName || ''}`.trim() || l.user.email
      : meta.senderName || 'Admin / System';
    const senderRole = l.user?.role?.name || meta.senderRole || 'Staff';

    return {
      id: l.id,
      createdAt: l.createdAt,
      sender: {
        id: l.user?.id || null,
        name: senderName,
        email: l.user?.email || meta.senderEmail || '',
        role: senderRole,
      },
      audienceType: meta.audienceType || 'CUSTOM',
      audienceLabel: meta.audienceLabel || 'Direct Email',
      recipientCount: meta.recipientCount || 1,
      successCount: meta.successCount || 1,
      subject: l.description || meta.subject || 'No Subject',
      message: meta.message || '',
      ctaText: meta.ctaText || null,
      ctaUrl: meta.ctaUrl || null,
      recipients: meta.recipients || [],
      overrideActive: Boolean(meta.overrideActive),
      overrideEmail: meta.overrideEmail || null,
      student: l.student,
    };
  });

  sendSuccess(res, formatted, 'Email history retrieved successfully');
});

/**
 * Delete an Email Dispatch Log Record
 */
export const deleteEmailHistory = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const user = req.user;
  const isSuperOrCompanyAdmin = ['super_admin', 'company_admin'].includes(user?.role?.slug);

  const existing = await prisma.activity.findUnique({ where: { id } });
  if (!existing || existing.action !== 'EMAIL_DISPATCH') {
    throw new AppError('Email log record not found', 404);
  }

  if (!isSuperOrCompanyAdmin && existing.userId !== user.id) {
    throw new AppError('You do not have permission to delete this log', 403);
  }

  await prisma.activity.delete({ where: { id } });
  sendSuccess(res, { id }, 'Email log deleted successfully');
});
