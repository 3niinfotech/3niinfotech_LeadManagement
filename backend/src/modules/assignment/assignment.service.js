import { AppError } from '../../utils/response.util.js';
import { auditLog } from '../../middleware/audit.middleware.js';
import prisma from '../../config/database.js';
import { buildDataScopeWhere } from '../../utils/scope.util.js';
import {
  assertLeadInTenant,
  assertBranchInTenant,
  assertUserInTenant,
  requireTenantCompany,
} from '../../utils/tenant.util.js';
import { notifyUser } from '../notification/notification.dispatcher.js';
import { leadDetailLink } from '../notification/notification.links.js';
import { pushAssignmentEvent } from '../notification/notification.push.js';
import { assignmentRepository } from './assignment.repository.js';
import { assignmentEngine } from './assignment.engine.js';
import { slaService } from './sla.service.js';
import { availabilityEngine } from './availability.engine.js';
import { mergeAssignmentConfig } from './assignment.scoring.js';

function parsePresenceMeta(existing) {
  const raw = existing?.metadata;
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return {};
  return { ...raw };
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

  /** @deprecated Manual status removed — availability is system-derived */
  updatePresence: async () => {
    throw new AppError('Manual counsellor status is disabled. Availability is calculated automatically.', 410);
  },

  /** Keeps last-seen timestamp only; does not gate assignment availability */
  heartbeat: async (userId, branchId) => {
    const existing = await assignmentRepository.getPresence(userId);
    return assignmentRepository.upsertPresence(userId, branchId, {
      lastHeartbeatAt: new Date(),
      status: existing?.status || 'AVAILABLE',
      metadata: parsePresenceMeta(existing),
    });
  },

  /** Legacy hook on logout/tab close — updates timestamp only, not availability gates */
  goOffline: async (userId, branchId) => {
    if (!userId) return null;
    const existing = await assignmentRepository.getPresence(userId);
    const effectiveBranch = branchId || existing?.branchId;
    if (!effectiveBranch) return null;
    return assignmentRepository.upsertPresence(userId, effectiveBranch, {
      lastHeartbeatAt: new Date(),
      status: existing?.status || 'OFFLINE',
      metadata: parsePresenceMeta(existing),
    });
  },

  getMyAvailability: async (user) => {
    const companyId = requireTenantCompany(user);
    if (!user.branchId) throw new AppError('Branch context required', 400);
    const snapshot = await availabilityEngine.getAvailabilitySnapshot(user.id, {
      companyId,
      branchId: user.branchId,
    });
    if (!snapshot) throw new AppError('Availability could not be calculated', 404);
    return snapshot;
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

  getAssignmentConfig: async (user) => {
    const companyId = requireTenantCompany(user);
    return assignmentEngine.getCompanyAssignmentConfig(companyId);
  },

  updateAssignmentConfig: async (user, payload) => {
    const companyId = requireTenantCompany(user);
    const company = await prisma.company.findUnique({ where: { id: companyId }, select: { settings: true } });
    const settings = company?.settings && typeof company.settings === 'object' && !Array.isArray(company.settings)
      ? { ...company.settings }
      : {};
    settings.assignment = { ...(settings.assignment || {}), ...payload };
    await prisma.company.update({ where: { id: companyId }, data: { settings } });
    return mergeAssignmentConfig(settings);
  },

  recommendForEnquiry: async (enquiryId, user) => {
    const enquiry = await prisma.enquiry.findFirst({
      where: { id: enquiryId, deletedAt: null, branch: { companyId: requireTenantCompany(user) } },
    });
    if (!enquiry) throw new AppError('Enquiry not found', 404);
    await assertBranchInTenant(enquiry.branchId, user);
    const branch = await prisma.branch.findUnique({ where: { id: enquiry.branchId }, select: { companyId: true } });
    return assignmentEngine.recommendCounsellors({
      branchId: enquiry.branchId,
      companyId: branch.companyId,
      country: enquiry.interestedCountry,
      interestedCountry: enquiry.interestedCountry,
      interestedCourse: enquiry.interestedCourse,
      priority: enquiry.priority,
    });
  },

  autoAssignEnquiry: async (enquiryId, userId, req) => {
    const enquiry = await prisma.enquiry.findFirst({
      where: { id: enquiryId, deletedAt: null },
    });
    if (!enquiry) throw new AppError('Enquiry not found', 404);
    await assertBranchInTenant(enquiry.branchId, req.user);
    if (enquiry.assignedToId) throw new AppError('Enquiry already assigned', 409);
    const result = await assignmentEngine.autoAssignEnquiry(enquiry, userId);
    if (!result.assigned) throw new AppError('No eligible counsellor available', 422);
    await auditLog({
      userId, action: 'UPDATE', entityType: 'enquiry', entityId: enquiry.id,
      newData: { assignedToId: result.match.id, auto: true }, req,
    });
    return result;
  },

  bulkAutoAssignEnquiries: async (ids, userId, req) => {
    const companyId = requireTenantCompany(req.user);
    const scopeWhere = buildDataScopeWhere(req.user, { entity: 'enquiry' });
    const results = [];
    for (const id of ids) {
      const enquiry = await prisma.enquiry.findFirst({
        where: { id, deletedAt: null, assignedToId: null, ...scopeWhere, branch: { companyId } },
      });
      if (!enquiry) {
        results.push({ id, assigned: false, error: 'Not found or already assigned' });
        continue;
      }
      const result = await assignmentEngine.autoAssignEnquiry(enquiry, userId);
      results.push({
        id,
        assigned: result.assigned,
        counsellorId: result.match?.id || null,
        score: result.match?.score || null,
        reasons: result.match?.reasons || [],
      });
    }
    return { results, assigned: results.filter((r) => r.assigned).length, total: ids.length };
  },

  manualAssignEnquiry: async (enquiryId, counsellorId, reason, userId, req) => {
    const enquiry = await prisma.enquiry.findFirst({ where: { id: enquiryId, deletedAt: null } });
    if (!enquiry) throw new AppError('Enquiry not found', 404);
    await assertBranchInTenant(enquiry.branchId, req.user);
    await assertUserInTenant(counsellorId, req.user);

    const branch = await prisma.branch.findUnique({ where: { id: enquiry.branchId }, select: { companyId: true } });
    const recommendations = await assignmentEngine.recommendCounsellors({
      branchId: enquiry.branchId,
      companyId: branch.companyId,
      country: enquiry.interestedCountry,
      interestedCourse: enquiry.interestedCourse,
      priority: enquiry.priority,
    });
    const match = recommendations.find((r) => r.id === counsellorId);

    const updated = await prisma.enquiry.update({
      where: { id: enquiryId },
      data: {
        assignedToId: counsellorId,
        assignedById: userId,
        updatedBy: userId,
        lastTouchedAt: new Date(),
      },
    });

    await assignmentRepository.logEnquiryAssignment({
      enquiryId,
      companyId: branch.companyId,
      branchId: enquiry.branchId,
      fromUserId: enquiry.assignedToId,
      toUserId: counsellorId,
      assignmentType: enquiry.assignedToId ? 'REASSIGN' : 'MANUAL',
      score: match?.score || null,
      scoreBreakdown: match?.scoreBreakdown || {},
      reasons: match?.reasons || [],
      exclusions: [],
      actorId: userId,
      reason,
    });

    await assignmentRepository.upsertPresence(counsellorId, enquiry.branchId, { lastAssignedAt: new Date() });
    return { enquiry: updated, match };
  },

  getUnassignedEnquiries: async (query, user) => {
    const scopeWhere = buildDataScopeWhere(user, { entity: 'enquiry' });
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 25;
    const result = await assignmentRepository.listUnassignedEnquiries({
      scopeWhere,
      page,
      limit,
      priority: query.priority,
      branchId: query.branchId,
    });

    const companyId = requireTenantCompany(user);
    const withSuggestions = await Promise.all(result.items.map(async (item) => {
      const recs = await assignmentEngine.recommendCounsellors({
        branchId: item.branchId,
        companyId,
        country: item.interestedCountry,
        interestedCourse: item.interestedCourse,
        priority: item.priority,
      });
      const top = recs.find((r) => r.recommended) || recs.find((r) => r.routable) || null;
      return { ...item, suggestedCounsellor: top };
    }));

    return { ...result, items: withSuggestions };
  },

  getEnquiryAssignmentHistory: async (enquiryId, user) => {
    const enquiry = await prisma.enquiry.findFirst({
      where: {
        id: enquiryId,
        deletedAt: null,
        branch: { companyId: requireTenantCompany(user) },
      },
    });
    if (!enquiry) throw new AppError('Enquiry not found', 404);
    return assignmentRepository.getEnquiryAssignmentHistory(enquiryId);
  },

  setTemporaryOverride: async (userId, branchId, { unavailable, reason, untilMinutes = 120 }) => {
    const existing = await assignmentRepository.getPresence(userId);
    const meta = parsePresenceMeta(existing);
    if (unavailable) {
      meta.temporaryOverride = 'UNAVAILABLE';
      meta.overrideReason = reason || 'Temporary unavailable';
      meta.overrideUntil = new Date(Date.now() + untilMinutes * 60 * 1000).toISOString();
    } else {
      delete meta.temporaryOverride;
      delete meta.overrideReason;
      delete meta.overrideUntil;
    }
    return assignmentRepository.upsertPresence(userId, branchId, {
      metadata: meta,
      lastHeartbeatAt: new Date(),
    });
  },

  getMySla: (user, query) => slaService.getMySlaLeads(user, query),

  getSlaOverview: (user, query) => slaService.getSlaOverview(user, query),
};
