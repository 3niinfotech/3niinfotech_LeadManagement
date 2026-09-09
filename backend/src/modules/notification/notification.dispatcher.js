import prisma from '../../config/database.js';
import { notificationService } from './notification.service.js';
import { pushNotification, pushAssignmentEvent } from './notification.push.js';

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

export default {
  notifyUser,
  notifyCounsellorAssigned,
  notifyMany,
  notifyRoles,
  resolveUsersByRoles,
  notifyVisitorRegistered,
  RECEPTION_ALERT_ROLE_SLUGS,
};
