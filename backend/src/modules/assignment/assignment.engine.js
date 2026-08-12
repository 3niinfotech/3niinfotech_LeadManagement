import {
  ROUTABLE_PRESENCE,
  OFFER_TIMEOUT_SECONDS,
  MAX_CONCURRENT_SESSIONS,
  DEFAULT_SLA,
} from './assignment.config.js';
import { assignmentRepository } from './assignment.repository.js';
import prisma from '../../config/database.js';

function startOfToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * Score counsellor for a lead — higher is better.
 * Hybrid: skill hints from metadata + load balancing + round-robin tie-break.
 */
async function scoreCounsellor(counsellor, lead) {
  const presence = counsellor.counsellorPresence;
  const status = presence?.status || 'OFFLINE';
  if (!ROUTABLE_PRESENCE.includes(status)) return -1;

  const [activeSessions, pendingOffers, todayCount] = await Promise.all([
    assignmentRepository.countActiveSessions(counsellor.id),
    assignmentRepository.countPendingOffers(counsellor.id),
    assignmentRepository.countTodayAssignments(counsellor.id),
  ]);

  if (activeSessions >= MAX_CONCURRENT_SESSIONS) return -1;
  if (pendingOffers > 0) return -1;

  const maxDaily = presence?.maxDailyCapacity || 20;
  if (todayCount >= maxDaily) return -1;

  let score = 50;
  const skills = presence?.skills || {};
  const meta = typeof skills === 'object' ? skills : {};

  const countries = meta.countries || [];
  const courses = meta.courses || [];
  const languages = meta.languages || [];

  if (lead.country && countries.includes(lead.country)) score += 25;
  if (lead.interestedCourse && courses.some((c) => lead.interestedCourse.toLowerCase().includes(String(c).toLowerCase()))) score += 20;
  if (lead.metadata?.preferredLanguage && languages.includes(lead.metadata.preferredLanguage)) score += 15;
  if (lead.priority === 'VIP') score += 10;

  // Least loaded bonus
  score -= todayCount * 2;
  score -= activeSessions * 10;

  // Round-robin: prefer counsellor waiting longest since last assignment
  const lastAssigned = presence?.lastAssignedAt?.getTime() || 0;
  const waitBonus = Math.min(20, (Date.now() - lastAssigned) / 60000);
  score += waitBonus;

  return score;
}

export const assignmentEngine = {
  pickCounsellor: async (lead, excludeIds = []) => {
    const branch = await prisma.branch.findUnique({
      where: { id: lead.branchId },
      select: { companyId: true },
    });
    const counsellors = await assignmentRepository.listEligibleCounsellors(
      lead.branchId,
      excludeIds,
      branch?.companyId,
    );
    if (!counsellors.length) return null;

    const scored = await Promise.all(
      counsellors.map(async (c) => ({
        counsellor: c,
        score: await scoreCounsellor(c, lead),
      })),
    );

    const eligible = scored.filter((s) => s.score >= 0).sort((a, b) => b.score - a.score);
    return eligible[0]?.counsellor || null;
  },

  async offerToCounsellor(lead, counsellorId, actorId = null) {
    const expiresAt = new Date(Date.now() + OFFER_TIMEOUT_SECONDS * 1000);
    const branch = await prisma.branch.findUnique({
      where: { id: lead.branchId },
      select: { companyId: true },
    });
    const counsellor = await assignmentRepository.listEligibleCounsellors(
      lead.branchId,
      [],
      branch?.companyId,
    ).then((list) => list.find((c) => c.id === counsellorId));

    const score = counsellor ? await scoreCounsellor(counsellor, lead) : null;

    const offer = await assignmentRepository.createOffer({
      leadId: lead.id,
      counsellorId,
      branchId: lead.branchId,
      expiresAt,
      assignmentScore: score,
      ruleSnapshot: { strategy: 'hybrid_skill_load_rr', score },
      createdBy: actorId,
    });

    await assignmentRepository.logAudit({
      leadId: lead.id,
      branchId: lead.branchId,
      actorId,
      action: 'OFFERED',
      toUserId: counsellorId,
      description: `Assignment offered to counsellor`,
      metadata: { offerId: offer.id, expiresAt },
    });

    await assignmentRepository.upsertPresence(counsellorId, lead.branchId, {
      lastAssignedAt: new Date(),
    });

    return offer;
  },

  async autoAssign(leadId, actorId = null, excludeIds = []) {
    const lead = await assignmentRepository.findLeadById(leadId);
    if (!lead || lead.assignedToId) return { lead, offer: null };

    const pending = await assignmentRepository.findPendingOfferForLead(leadId);
    if (pending) return { lead, offer: pending };

    const counsellor = await this.pickCounsellor(lead, excludeIds);
    if (!counsellor) {
      await assignmentRepository.logAudit({
        leadId: lead.id,
        branchId: lead.branchId,
        actorId,
        action: 'QUEUED',
        description: 'No eligible counsellor — visitor remains in branch queue',
      });
      return { lead, offer: null, queued: true };
    }

    const offer = await this.offerToCounsellor(lead, counsellor.id, actorId);
    return { lead, offer, counsellor };
  },

  async processExpiredOffers() {
    await assignmentRepository.expireStaleOffers();
    const expired = await assignmentRepository.getExpiredOffersNeedingReroute();
    const results = [];

    for (const item of expired) {
      const exclude = [item.counsellorId];
      const result = await this.autoAssign(item.leadId, null, exclude);
      results.push(result);
      await assignmentRepository.logAudit({
        leadId: item.leadId,
        branchId: item.branchId,
        action: 'EXPIRED',
        fromUserId: item.counsellorId,
        description: 'Offer expired — re-routing',
        metadata: { offerId: item.id },
      });
    }
    return results;
  },

  evaluateSla(waitingLeads, branchSla = DEFAULT_SLA) {
    const now = Date.now();
    return waitingLeads.map((lead) => {
      const waitMin = Math.floor((now - new Date(lead.walkInAt).getTime()) / 60000);
      let tier = 'ok';
      if (waitMin >= branchSla.mandatoryReassignMinutes) tier = 'mandatory_reassign';
      else if (waitMin >= branchSla.managerNotifyMinutes) tier = 'manager';
      else if (waitMin >= branchSla.escalateMinutes) tier = 'escalate';
      else if (waitMin >= branchSla.warningMinutes) tier = 'warning';
      return { leadId: lead.id, waitMinutes: waitMin, tier };
    });
  },
};
