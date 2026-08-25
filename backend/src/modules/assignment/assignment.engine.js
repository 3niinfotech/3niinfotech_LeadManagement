import {
  ROUTABLE_PRESENCE,
  OFFER_TIMEOUT_SECONDS,
  MAX_CONCURRENT_SESSIONS,
  DEFAULT_SLA,
  RECEPTION_ASSIGN_ROLE_SLUGS,
} from './assignment.config.js';
import { assignmentRepository } from './assignment.repository.js';
import prisma from '../../config/database.js';

/** Map presence (+ active session) → reception availability label */
export function mapAvailabilityLabel(presenceStatus, activeSessions = 0) {
  if (activeSessions > 0 || presenceStatus === 'IN_COUNSELLING') {
    return { key: 'IN_COUNSELLING', label: 'With student', tone: 'warning', detail: 'Busy in counselling' };
  }
  switch (presenceStatus) {
    case 'AVAILABLE':
    case 'WFH':
      return { key: 'AVAILABLE', label: 'Free', tone: 'success', detail: 'Ready for walk-ins' };
    case 'LUNCH':
      return { key: 'LUNCH', label: 'Lunch', tone: 'caution', detail: 'On lunch break' };
    case 'BREAK':
      return { key: 'ON_BREAK', label: 'Break', tone: 'caution', detail: 'On short break' };
    case 'LEAVE':
      return { key: 'ON_LEAVE', label: 'Leave', tone: 'danger', detail: 'On leave today' };
    case 'MEETING':
      return { key: 'MEETING', label: 'Meeting', tone: 'danger', detail: 'In a meeting' };
    case 'TRAINING':
      return { key: 'TRAINING', label: 'Training', tone: 'danger', detail: 'In training' };
    case 'BUSY':
    case 'DND':
      return { key: 'UNAVAILABLE', label: 'Busy', tone: 'danger', detail: 'Not taking walk-ins' };
    case 'OFFLINE':
    default:
      return { key: 'OFFLINE', label: 'Offline', tone: 'neutral', detail: 'Not signed in' };
  }
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
  const skills = presence?.skills;
  const meta = skills && typeof skills === 'object' && !Array.isArray(skills) ? skills : {};

  const countries = Array.isArray(meta.countries) ? meta.countries : [];
  const courses = Array.isArray(meta.courses) ? meta.courses : [];
  const languages = Array.isArray(meta.languages) ? meta.languages : [];
  const services = Array.isArray(meta.services) ? meta.services : [];

  if (lead.country && countries.includes(lead.country)) score += 25;
  if (lead.interestedCourse && courses.some((c) => lead.interestedCourse.toLowerCase().includes(String(c).toLowerCase()))) score += 20;
  if (lead.metadata?.preferredLanguage && languages.includes(lead.metadata.preferredLanguage)) score += 15;
  if (lead.metadata?.visitPurpose && services.some((s) => String(lead.metadata.visitPurpose).toLowerCase().includes(String(s).toLowerCase()))) score += 10;
  if (lead.priority === 'VIP') score += 10;

  score -= todayCount * 2;
  score -= activeSessions * 10;

  const lastAssigned = presence?.lastAssignedAt?.getTime() || 0;
  const waitBonus = Math.min(20, (Date.now() - lastAssigned) / 60000);
  score += waitBonus;

  return score;
}

async function buildRecommendationRow(counsellor, lead) {
  const presence = counsellor.counsellorPresence;
  let status = presence?.status || 'OFFLINE';
  const heartbeatAt = presence?.lastHeartbeatAt ? new Date(presence.lastHeartbeatAt).getTime() : 0;
  // No recent heartbeat → Offline (except Leave). Heartbeat every ~15s while CRM open.
  const staleMs = 90 * 1000;
  if ((!heartbeatAt || Date.now() - heartbeatAt > staleMs) && status !== 'LEAVE') {
    status = 'OFFLINE';
  }
  const [activeSessions, todayCount, activeLeads] = await Promise.all([
    assignmentRepository.countActiveSessions(counsellor.id),
    assignmentRepository.countTodayAssignments(counsellor.id),
    prisma.lead.count({
      where: {
        assignedToId: counsellor.id,
        deletedAt: null,
        status: { in: ['WALK_IN', 'WAITING', 'IN_COUNSELLING', 'APPOINTMENT'] },
      },
    }),
  ]);

  const rawScore = await scoreCounsellor(counsellor, lead);
  const availability = mapAvailabilityLabel(status, activeSessions);
  if (availability.key === 'UNAVAILABLE' && activeLeads > 0 && activeSessions === 0) {
    availability.detail = 'Assigned visitor waiting';
  }
  if (availability.key === 'AVAILABLE') {
    availability.detail = 'Ready for walk-ins';
  }
  const skillsRaw = presence?.skills;
  const skills = skillsRaw && typeof skillsRaw === 'object' && !Array.isArray(skillsRaw) ? skillsRaw : {};
  const countries = Array.isArray(skills.countries) ? skills.countries : [];
  const services = Array.isArray(skills.services)
    ? skills.services
    : (Array.isArray(skills.courses) ? skills.courses : []);

  let displayScore = rawScore;
  if (displayScore < 0) {
    displayScore = 10;
    if (lead.country && countries.includes(lead.country)) displayScore += 25;
    displayScore -= todayCount;
  }

  return {
    id: counsellor.id,
    firstName: counsellor.firstName,
    lastName: counsellor.lastName,
    email: counsellor.email,
    branchId: counsellor.branchId,
    role: counsellor.role?.name || counsellor.role?.slug,
    countries,
    services,
    specializationLabel: [...countries, ...services].filter(Boolean).slice(0, 4).join('/') || 'General',
    availability,
    activeLeads,
    todayAssignments: todayCount,
    activeSessions,
    score: displayScore,
    routable: rawScore >= 0,
    recommended: false,
  };
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
      RECEPTION_ASSIGN_ROLE_SLUGS,
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

  /**
   * Reception recommendations — scored list. Reception chooses manually.
   * Does NOT create offers or auto-assign.
   */
  recommendCounsellors: async ({
    branchId, companyId, country, interestedCourse, preferredLanguage, visitPurpose, priority,
  }) => {
    const leadHint = {
      branchId,
      country: country || null,
      interestedCourse: interestedCourse || null,
      priority: priority || 'NORMAL',
      metadata: {
        preferredLanguage: preferredLanguage || null,
        visitPurpose: visitPurpose || null,
      },
    };

    const counsellors = (await assignmentRepository.listEligibleCounsellors(
      branchId,
      [],
      companyId,
      RECEPTION_ASSIGN_ROLE_SLUGS,
    )).filter((c) => RECEPTION_ASSIGN_ROLE_SLUGS.includes(c.role?.slug));

    const rows = await Promise.all(counsellors.map((c) => buildRecommendationRow(c, leadHint)));
    rows.sort((a, b) => {
      if (a.routable !== b.routable) return a.routable ? -1 : 1;
      if (a.availability.key === 'AVAILABLE' && b.availability.key !== 'AVAILABLE') return -1;
      if (b.availability.key === 'AVAILABLE' && a.availability.key !== 'AVAILABLE') return 1;
      return b.score - a.score;
    });

    const best = rows.find((r) => r.routable) || null;
    if (best) best.recommended = true;
    return rows;
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
      description: 'Assignment offered to counsellor',
      metadata: { offerId: offer.id, expiresAt },
    });

    await assignmentRepository.upsertPresence(counsellorId, lead.branchId, {
      lastAssignedAt: new Date(),
    });

    return offer;
  },

  async autoAssign(leadId, actorId = null, excludeIds = []) {
    // Legacy helper — Reception no longer auto-queues. Prefer recommendCounsellors + manual assign.
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
        action: 'NO_COUNSELLOR',
        description: 'No eligible counsellor for recommendation engine',
      });
      return { lead, offer: null, queued: false };
    }

    const offer = await this.offerToCounsellor(lead, counsellor.id, actorId);
    return { lead, offer, counsellor };
  },

  async processExpiredOffers() {
    await assignmentRepository.expireStaleOffers();
    const expired = await assignmentRepository.getExpiredOffersNeedingReroute();
    const results = [];

    for (const item of expired) {
      await assignmentRepository.logAudit({
        leadId: item.leadId,
        branchId: item.branchId,
        action: 'EXPIRED',
        fromUserId: item.counsellorId,
        description: 'Offer expired — awaiting manual Reception assign',
        metadata: { offerId: item.id },
      });
      results.push({ leadId: item.leadId, expired: true });
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
