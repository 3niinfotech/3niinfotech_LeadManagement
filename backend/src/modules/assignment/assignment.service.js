import { AppError } from '../../utils/response.util.js';
import { auditLog } from '../../middleware/audit.middleware.js';
import prisma from '../../config/database.js';
import { buildDataScopeWhere } from '../../utils/scope.util.js';
import {
  mergeScope,
  assertLeadInTenant,
  assertBranchInTenant,
  assertUserInTenant,
  requireTenantCompany,
} from '../../utils/tenant.util.js';
import { notificationService } from '../notification/notification.service.js';
import { pushNotification } from '../notification/notification.push.js';
import { assignmentRepository } from './assignment.repository.js';
import { assignmentEngine } from './assignment.engine.js';
import { DEFAULT_SLA } from './assignment.config.js';

async function notifyUser(userId, payload) {
  const notification = await notificationService.create({
    userId,
    type: payload.type || 'INFO',
    title: payload.title,
    message: payload.message,
    link: payload.link,
    metadata: payload.metadata || {},
  });
  pushNotification(userId, notification);
  return notification;
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
          include: { enquiry: { select: { id: true, enquiryCode: true } } },
        })
        : null,
    ]);

    if (student) return { matchType: 'STUDENT', record: student };
    if (enquiry) return { matchType: 'ENQUIRY', record: enquiry };
    if (lead) return { matchType: 'LEAD', record: lead };
    return { matchType: 'NEW', record: null };
  },

  enqueueAfterRegistration: async (leadId, actorId) => {
    await assignmentRepository.logAudit({
      leadId,
      branchId: (await assignmentRepository.findLeadById(leadId))?.branchId,
      actorId,
      action: 'QUEUED',
      description: 'Visitor added to routing queue',
    });
    return assignmentEngine.autoAssign(leadId, actorId);
  },

  getMyQueue: async (userId) => {
    const queue = await assignmentRepository.getCounsellorQueue(userId);
    const presence = await assignmentRepository.getPresence(userId);

    let avgDuration = null;
    const sessions = await prisma.counsellingSession.findMany({
      where: {
        counsellorId: userId,
        status: 'COMPLETED',
        endedAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) },
        durationMinutes: { not: null },
      },
      select: { durationMinutes: true },
    });
    if (sessions.length) {
      avgDuration = Math.round(
        sessions.reduce((s, x) => s + (x.durationMinutes || 0), 0) / sessions.length,
      );
    }

    return {
      ...queue,
      presence,
      stats: {
        completedToday: queue.completedToday,
        avgCounsellingMinutes: avgDuration,
        pendingOffers: queue.offers.length,
        waitingCount: queue.assigned.filter((l) => l.status === 'WAITING').length,
      },
    };
  },

  getBranchOps: async (user) => {
    const companyId = requireTenantCompany(user);
    const scopeWhere = mergeScope(user);
    const branchId = user.branchId;
    if (!branchId && !companyId) throw new AppError('Branch context required', 400);

    const queue = await assignmentRepository.getBranchQueue(
      branchId || (await prisma.branch.findFirst({ where: { companyId }, select: { id: true } }))?.id,
      scopeWhere,
    );
    const waiting = queue.filter((l) => l.status === 'WAITING');
    const sla = assignmentEngine.evaluateSla(waiting, DEFAULT_SLA);

    const counsellors = await assignmentRepository.listEligibleCounsellors(branchId);
    const presenceSummary = counsellors.map((c) => ({
      id: c.id,
      name: `${c.firstName} ${c.lastName || ''}`.trim(),
      status: c.counsellorPresence?.status || 'OFFLINE',
      todayAssigned: c.counsellorPresence?.todayAssigned || 0,
    }));

    return { queue, sla, presenceSummary };
  },

  updatePresence: async (userId, branchId, status) => {
    const presence = await assignmentRepository.upsertPresence(userId, branchId, {
      status,
      lastHeartbeatAt: new Date(),
    });
    return presence;
  },

  heartbeat: async (userId, branchId) => {
    const existing = await assignmentRepository.getPresence(userId);
    const status = existing?.status === 'OFFLINE' ? 'AVAILABLE' : (existing?.status || 'AVAILABLE');
    return assignmentRepository.upsertPresence(userId, branchId, {
      status,
      lastHeartbeatAt: new Date(),
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
        message: `${lead.firstName} accepted — Token ${lead.tokenNumber}`,
        link: `/enquiries`,
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
      message: `${lead.firstName} — Token ${lead.tokenNumber}. Please accept.`,
      link: `/counsellor/queue`,
      metadata: { leadId, offerId: offer.id },
    });

    return { lead, offer };
  },

  notifyOffer: async (offer, lead) => {
    await notifyUser(offer.counsellorId, {
      type: 'INFO',
      title: 'New visitor assignment',
      message: `${lead.firstName} ${lead.lastName || ''}`.trim()
        + ` — Token ${lead.tokenNumber}. Accept within 2 minutes.`,
      link: `/counsellor/queue`,
      metadata: { leadId: lead.id, offerId: offer.id },
    });
    const { pushAssignmentEvent } = await import('../notification/notification.push.js');
    pushAssignmentEvent(offer.counsellorId, 'OFFER_CREATED', { offerId: offer.id, leadId: lead.id });
  },
};
