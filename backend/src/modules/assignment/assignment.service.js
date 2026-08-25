import { AppError } from '../../utils/response.util.js';
import { auditLog } from '../../middleware/audit.middleware.js';
import prisma from '../../config/database.js';
import { buildDataScopeWhere } from '../../utils/scope.util.js';
import {
  assertLeadInTenant,
  assertBranchInTenant,
  assertUserInTenant,
} from '../../utils/tenant.util.js';
import { notifyUser } from '../notification/notification.dispatcher.js';
import { leadDetailLink } from '../notification/notification.links.js';
import { pushAssignmentEvent } from '../notification/notification.push.js';
import { assignmentRepository } from './assignment.repository.js';
import { assignmentEngine } from './assignment.engine.js';
import {
  PRESENCE_HOLD_MS,
  PRESENCE_PERMANENT_HOLD,
} from './assignment.config.js';

function parsePresenceMeta(existing) {
  const raw = existing?.metadata;
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return {};
  return { ...raw };
}

function resolveAutoPresence(existing, activeSessions, openAssignedLeads = 0) {
  if (activeSessions > 0) return { status: 'IN_COUNSELLING', metadata: parsePresenceMeta(existing) };

  const meta = parsePresenceMeta(existing);
  const current = existing?.status || 'OFFLINE';
  const now = Date.now();

  if (PRESENCE_PERMANENT_HOLD.includes(current)) {
    return { status: current, metadata: meta };
  }

  const holdMs = PRESENCE_HOLD_MS[current];
  if (holdMs && meta.manualUntil) {
    const until = new Date(meta.manualUntil).getTime();
    if (!Number.isNaN(until) && until > now) {
      return { status: current, metadata: meta };
    }
  }

  if (openAssignedLeads > 0) {
    return { status: 'BUSY', metadata: { ...meta, autoMode: true } };
  }

  return {
    status: 'AVAILABLE',
    metadata: { ...meta, manualUntil: null, autoMode: true },
  };
}

export const assignmentService = {
  resolveIdentity: async (phone, branchId, companyId) => {
    const [student, enquiry, lead] = await Promise.all([
      assignmentRepository.findStudentByPhone(phone, companyId, branchId),
      assignmentRepository.findEnquiryByPhone(phone, companyId, branchId),
      branchId
        ? prisma.lead.findFirst({
          where: {
            phone: { contains: phone.slice(-10) },
            branchId,
            deletedAt: null,
            status: { in: ['WAITING', 'IN_COUNSELLING', 'APPOINTMENT', 'WALK_IN'] },
          },
          select: {
            id: true,
            leadCode: true,
            firstName: true,
            lastName: true,
            phone: true,
            status: true,
            createdAt: true,
            enquiry: { select: { id: true, enquiryCode: true, createdAt: true } },
          },
        })
        : null,
    ]);

    if (student) return { matchType: 'STUDENT', record: student };
    if (enquiry) return { matchType: 'ENQUIRY', record: enquiry };
    if (lead) return { matchType: 'LEAD', record: lead };
    return { matchType: 'NEW', record: null };
  },

  updatePresence: async (userId, branchId, status) => {
    const existing = await assignmentRepository.getPresence(userId);
    const meta = parsePresenceMeta(existing);
    const holdMs = PRESENCE_HOLD_MS[status];
    const isPermanent = PRESENCE_PERMANENT_HOLD.includes(status);
    const nextMeta = {
      ...meta,
      autoMode: status === 'AVAILABLE' || status === 'OFFLINE',
      manualStatus: ['AVAILABLE', 'OFFLINE', 'IN_COUNSELLING'].includes(status) ? null : status,
      manualUntil: holdMs
        ? new Date(Date.now() + holdMs).toISOString()
        : (isPermanent ? null : null),
      setAt: new Date().toISOString(),
    };
    if (status === 'AVAILABLE' || status === 'OFFLINE') {
      nextMeta.manualUntil = null;
      nextMeta.manualStatus = null;
    }
    return assignmentRepository.upsertPresence(userId, branchId, {
      status,
      lastHeartbeatAt: new Date(),
      metadata: nextMeta,
    });
  },

  /** Auto: Free while app open, Busy with student, Offline on logout / stale heartbeat. */
  heartbeat: async (userId, branchId) => {
    const [existing, activeSessions, openAssignedLeads] = await Promise.all([
      assignmentRepository.getPresence(userId),
      assignmentRepository.countActiveSessions(userId),
      prisma.lead.count({
        where: {
          assignedToId: userId,
          deletedAt: null,
          status: { in: ['WALK_IN', 'WAITING', 'IN_COUNSELLING', 'APPOINTMENT'] },
        },
      }),
    ]);
    const { status, metadata } = resolveAutoPresence(existing, activeSessions, openAssignedLeads);
    return assignmentRepository.upsertPresence(userId, branchId, {
      status,
      lastHeartbeatAt: new Date(),
      metadata,
    });
  },

  goOffline: async (userId, branchId) => {
    if (!userId) return null;
    const existing = await assignmentRepository.getPresence(userId);
    const meta = parsePresenceMeta(existing);
    if (PRESENCE_PERMANENT_HOLD.includes(existing?.status)) {
      return existing;
    }
    const effectiveBranch = branchId || existing?.branchId;
    if (!effectiveBranch) return null;
    return assignmentRepository.upsertPresence(userId, effectiveBranch, {
      status: 'OFFLINE',
      lastHeartbeatAt: new Date(),
      metadata: { ...meta, autoMode: true, manualUntil: null, manualStatus: null },
    });
  },

  acceptOffer: async (offerId, user, req) => {
    const userId = user.id;
    const offer = await prisma.assignmentOffer.findUnique({
      where: { id: offerId },
      include: { lead: true },
    });
    if (!offer) throw new AppError('Offer not found', 404);
    if (offer.counsellorId !== userId) throw new AppError('Not your assignment offer', 403);
    await assertLeadInTenant(offer.leadId, user);
    if (offer.status !== 'PENDING') throw new AppError('Offer is no longer pending', 400);
    if (offer.expiresAt < new Date()) throw new AppError('Offer has expired', 400);

    await assignmentRepository.updateOffer(offerId, {
      status: 'ACCEPTED',
      respondedAt: new Date(),
    });

    const lead = await assignmentRepository.updateLead(offer.leadId, {
      assignedToId: userId,
      updatedBy: userId,
    });

    await assignmentRepository.upsertPresence(userId, offer.branchId, {
      status: 'BUSY',
    });
    const pres = await assignmentRepository.getPresence(userId);
    if (pres) {
      await prisma.counsellorPresence.update({
        where: { userId },
        data: { todayAssigned: (pres.todayAssigned || 0) + 1 },
      });
    }

    await assignmentRepository.logAudit({
      leadId: offer.leadId,
      branchId: offer.branchId,
      actorId: userId,
      action: 'ACCEPTED',
      toUserId: userId,
      description: 'Counsellor accepted assignment',
      metadata: { offerId },
    });

    await prisma.activity.create({
      data: {
        userId,
        leadId: offer.leadId,
        entityType: 'LEAD',
        entityId: offer.leadId,
        action: 'ASSIGNMENT_ACCEPTED',
        description: 'Counsellor accepted visitor assignment',
      },
    });

    await auditLog({
      userId,
      action: 'ASSIGN',
      entityType: 'Lead',
      entityId: offer.leadId,
      newData: { assignedToId: userId },
      req,
    });

    if (lead.receptionUserId) {
      await notifyUser(lead.receptionUserId, {
        type: 'SUCCESS',
        title: 'Counsellor assigned',
        message: `${lead.firstName} accepted assignment (${lead.leadCode || 'lead'}).`,
        link: leadDetailLink(lead),
        metadata: { leadId: lead.id },
      });
    }

    return { lead, offerId };
  },

  rejectOffer: async (offerId, user, reason, req) => {
    const userId = user.id;
    const offer = await prisma.assignmentOffer.findUnique({
      where: { id: offerId },
      include: { lead: true },
    });
    if (!offer) throw new AppError('Offer not found', 404);
    if (offer.counsellorId !== userId) throw new AppError('Not your assignment offer', 403);
    await assertLeadInTenant(offer.leadId, user);
    if (offer.status !== 'PENDING') throw new AppError('Offer is no longer pending', 400);

    await assignmentRepository.updateOffer(offerId, {
      status: 'REJECTED',
      respondedAt: new Date(),
      rejectReason: reason || null,
    });

    await assignmentRepository.logAudit({
      leadId: offer.leadId,
      branchId: offer.branchId,
      actorId: userId,
      action: 'REJECTED',
      fromUserId: userId,
      description: reason || 'Counsellor rejected assignment',
      metadata: { offerId },
    });

    await assignmentRepository.upsertPresence(userId, offer.branchId, { status: 'AVAILABLE' });

    const result = await assignmentEngine.autoAssign(offer.leadId, userId, [userId]);
    return result;
  },

  startSession: async (leadId, user, req) => {
    const userId = user.id;
    const lead = await assertLeadInTenant(leadId, user);
    if (lead.assignedToId && lead.assignedToId !== userId) {
      throw new AppError('Not assigned to you', 403);
    }

    const existing = await assignmentRepository.findActiveSession(leadId);
    if (existing) return { lead, session: existing };

    const session = await assignmentRepository.createSession({
      leadId,
      counsellorId: userId,
      branchId: lead.branchId,
    });

    const updated = await assignmentRepository.updateLead(leadId, {
      status: 'IN_COUNSELLING',
      updatedBy: userId,
    });

    await assignmentRepository.upsertPresence(userId, lead.branchId, {
      status: 'IN_COUNSELLING',
    });

    await assignmentRepository.logAudit({
      leadId,
      branchId: lead.branchId,
      actorId: userId,
      action: 'SESSION_STARTED',
      toUserId: userId,
      description: 'Counselling session started',
      metadata: { sessionId: session.id },
    });

    await prisma.activity.create({
      data: {
        userId,
        leadId,
        entityType: 'LEAD',
        entityId: leadId,
        action: 'COUNSELLING_STARTED',
        description: 'Counselling session started',
      },
    });

    return { lead: updated, session };
  },

  completeSession: async (leadId, userId, outcome) => {
    const session = await assignmentRepository.findActiveSession(leadId);
    if (!session) throw new AppError('No active session', 400);
    if (session.counsellorId !== userId) throw new AppError('Not your session', 403);

    const endedAt = new Date();
    const durationMinutes = Math.round((endedAt - session.startedAt) / 60000);

    await assignmentRepository.endSession(session.id, {
      status: 'COMPLETED',
      endedAt,
      durationMinutes,
      outcome: outcome || null,
    });

    await assignmentRepository.upsertPresence(userId, session.branchId, {
      status: 'AVAILABLE',
    });

    await assignmentRepository.logAudit({
      leadId,
      branchId: session.branchId,
      actorId: userId,
      action: 'SESSION_COMPLETED',
      toUserId: userId,
      description: 'Counselling session completed',
      metadata: { sessionId: session.id, durationMinutes },
    });

    return { sessionId: session.id, durationMinutes };
  },

  managerReassign: async (leadId, counsellorId, reason, actorId, req) => {
    const lead = await assertLeadInTenant(leadId, req.user);
    await assertUserInTenant(counsellorId, req.user);

    const pending = await assignmentRepository.findPendingOfferForLead(leadId);
    if (pending) {
      await assignmentRepository.updateOffer(pending.id, {
        status: 'CANCELLED',
        respondedAt: new Date(),
      });
    }

    const offer = await assignmentEngine.offerToCounsellor(lead, counsellorId, actorId);

    await assignmentRepository.logAudit({
      leadId,
      branchId: lead.branchId,
      actorId,
      action: 'REASSIGNED',
      fromUserId: lead.assignedToId,
      toUserId: counsellorId,
      description: reason,
      metadata: { offerId: offer.id, managerOverride: true },
    });

    await notifyUser(counsellorId, {
      type: 'INFO',
      title: 'Visitor assigned to you',
      message: `${lead.firstName} ${lead.lastName || ''}`.trim()
        + ` (${lead.leadCode || 'lead'}) assigned to you.`,
      link: leadDetailLink(lead),
      metadata: { leadId, offerId: offer.id },
    });

    return { lead, offer };
  },

  notifyOffer: async (offer, lead) => {
    await notifyUser(offer.counsellorId, {
      type: 'INFO',
      title: 'New visitor assignment',
      message: `${lead.firstName} ${lead.lastName || ''}`.trim()
        + ` (${lead.leadCode || 'lead'}) — please review assignment.`,
      link: leadDetailLink(lead),
      metadata: { leadId: lead.id, offerId: offer.id },
    });
    const { pushAssignmentEvent } = await import('../notification/notification.push.js');
    pushAssignmentEvent(offer.counsellorId, 'OFFER_CREATED', { offerId: offer.id, leadId: lead.id });
  },
};
