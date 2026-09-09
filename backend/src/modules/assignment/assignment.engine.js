import prisma from '../../config/database.js';
import { RECEPTION_ASSIGN_ROLE_SLUGS } from './assignment.config.js';
import { assignmentRepository } from './assignment.repository.js';
import { availabilityEngine, mapAvailabilityLabelFromState } from './availability.engine.js';
import { scoreCounsellorForLead, pickBestCandidate, mergeAssignmentConfig } from './assignment.scoring.js';

async function buildSkillsProfile(counsellor, companyId) {
  return availabilityEngine.getCounsellorSkillsProfile(counsellor.id, companyId);
}

async function buildRecommendationRow(counsellor, leadHint, companyId, branchId, weights) {
  const leadPriority = leadHint.priority || 'MEDIUM';
  const availability = await availabilityEngine.evaluateCounsellor(counsellor, {
    companyId,
    branchId,
    leadPriority,
  });
  const workload = availability.workload || await availabilityEngine.getWorkload(counsellor.id, counsellor.counsellorPresence);
  const skillsProfile = await buildSkillsProfile(counsellor, companyId);

  const scored = scoreCounsellorForLead({
    counsellor: { ...counsellor, skillsProfile },
    availability,
    workload,
    lead: leadHint,
    branchId,
    weights,
    priority: leadHint.priority || 'MEDIUM',
  });

  return {
    id: counsellor.id,
    firstName: counsellor.firstName,
    lastName: counsellor.lastName,
    email: counsellor.email,
    branchId: counsellor.branchId,
    role: counsellor.role?.name || counsellor.role?.slug,
    countries: skillsProfile.countries,
    courses: skillsProfile.courses,
    services: skillsProfile.services,
    specializationLabel: [...skillsProfile.countries, ...skillsProfile.courses].filter(Boolean).slice(0, 4).join(' / ') || 'General',
    availability: mapAvailabilityLabelFromState(availability),
    availabilityState: availability.state,
    activeLeads: workload.activeLeadTotal,
    activeEnquiries: workload.activeEnquiries,
    todayAssignments: workload.todayAssigned,
    activeSessions: workload.activeSessions,
    capacityPct: Math.round(workload.activeLeadCapacityPct),
    score: scored.percent,
    scoreRaw: scored.score,
    scoreBreakdown: scored.breakdown,
    reasons: scored.reasons,
    exclusions: [...(availability.exclusions || []), ...scored.exclusions],
    eligible: scored.eligible,
    routable: scored.routable,
    tier: scored.tier,
    recommended: false,
  };
}

export const assignmentEngine = {
  async getCompanyAssignmentConfig(companyId) {
    const company = await prisma.company.findUnique({
      where: { id: companyId },
      select: { settings: true },
    });
    return mergeAssignmentConfig(company?.settings || {});
  },

  async scoreAllForLead(leadHint, { branchId, companyId, excludeIds = [] }) {
    const config = await this.getCompanyAssignmentConfig(companyId);
    const counsellors = (await assignmentRepository.listEligibleCounsellors(
      branchId,
      excludeIds,
      companyId,
      RECEPTION_ASSIGN_ROLE_SLUGS,
    )).filter((c) => RECEPTION_ASSIGN_ROLE_SLUGS.includes(c.role?.slug));

    const rows = await Promise.all(
      counsellors.map((c) => buildRecommendationRow(c, leadHint, companyId, branchId, config.scoring)),
    );

    rows.sort((a, b) => {
      if (a.routable !== b.routable) return a.routable ? -1 : 1;
      if (a.availabilityState === 'AVAILABLE' && b.availabilityState !== 'AVAILABLE') return -1;
      if (b.availabilityState === 'AVAILABLE' && a.availabilityState !== 'AVAILABLE') return 1;
      return b.score - a.score;
    });

    return { rows, config };
  },

  async pickCounsellor(lead, excludeIds = []) {
    const branch = await prisma.branch.findUnique({
      where: { id: lead.branchId },
      select: { companyId: true },
    });
    if (!branch?.companyId) return null;

    const leadHint = {
      branchId: lead.branchId,
      country: lead.country || lead.interestedCountry,
      interestedCountry: lead.interestedCountry || lead.country,
      interestedCourse: lead.interestedCourse,
      priority: lead.priority || 'MEDIUM',
      metadata: lead.metadata || {},
    };

    const { rows, config } = await assignmentEngine.scoreAllForLead(leadHint, {
      branchId: lead.branchId,
      companyId: branch.companyId,
      excludeIds,
    });

    const { selected } = pickBestCandidate(rows, config.fallback);
    if (!selected) return null;

    const counsellor = await prisma.user.findUnique({
      where: { id: selected.id },
      include: { counsellorPresence: true, role: { select: { slug: true, name: true } } },
    });
    return counsellor ? { counsellor, match: selected } : null;
  },

  async recommendCounsellors({
    branchId, companyId, country, interestedCourse, interestedCountry,
    preferredLanguage, visitPurpose, priority,
  }) {
    const leadHint = {
      branchId,
      country: country || interestedCountry || null,
      interestedCountry: interestedCountry || country || null,
      interestedCourse: interestedCourse || null,
      priority: priority || 'MEDIUM',
      metadata: {
        preferredLanguage: preferredLanguage || null,
        visitPurpose: visitPurpose || null,
      },
    };

    const { rows } = await assignmentEngine.scoreAllForLead(leadHint, { branchId, companyId, excludeIds: [] });
    const best = rows.find((r) => r.routable) || null;
    if (best) best.recommended = true;
    return rows;
  },

  async autoAssignLead(lead, actorId = null) {
    const picked = await this.pickCounsellor(lead);
    if (!picked) {
      await assignmentRepository.logAudit({
        leadId: lead.id,
        branchId: lead.branchId,
        actorId,
        action: 'NO_COUNSELLOR',
        description: 'No eligible counsellor found by assignment engine',
        metadata: { engine: 'availability_v2' },
      });
      return { lead, assigned: false, match: null };
    }

    const updated = await assignmentRepository.updateLead(lead.id, {
      assignedToId: picked.counsellor.id,
      updatedBy: actorId,
    });

    await assignmentRepository.logAudit({
      leadId: lead.id,
      branchId: lead.branchId,
      actorId,
      action: 'AUTO_ASSIGNED',
      toUserId: picked.counsellor.id,
      description: `Auto-assigned to ${picked.counsellor.firstName} ${picked.counsellor.lastName}`,
      metadata: {
        score: picked.match.score,
        reasons: picked.match.reasons,
        breakdown: picked.match.scoreBreakdown,
        engine: 'availability_v2',
      },
    });

    await assignmentRepository.upsertPresence(picked.counsellor.id, lead.branchId, {
      lastAssignedAt: new Date(),
    });

    return { lead: updated, assigned: true, counsellor: picked.counsellor, match: picked.match };
  },

  async autoAssignEnquiry(enquiry, actorId = null) {
    const branch = await prisma.branch.findUnique({
      where: { id: enquiry.branchId },
      select: { companyId: true },
    });
    if (!branch?.companyId) return { enquiry, assigned: false };

    const leadHint = {
      branchId: enquiry.branchId,
      country: enquiry.interestedCountry,
      interestedCountry: enquiry.interestedCountry,
      interestedCourse: enquiry.interestedCourse,
      priority: enquiry.priority,
      metadata: enquiry.metadata || {},
    };

    const { rows, config } = await this.scoreAllForLead(leadHint, {
      branchId: enquiry.branchId,
      companyId: branch.companyId,
    });
    const { selected } = pickBestCandidate(rows, config.fallback);
    if (!selected?.routable) {
      return { enquiry, assigned: false, match: null, candidates: rows };
    }

    const updated = await prisma.enquiry.update({
      where: { id: enquiry.id },
      data: {
        assignedToId: selected.id,
        assignedById: actorId,
        updatedBy: actorId,
        lastTouchedAt: new Date(),
      },
    });

    await assignmentRepository.logEnquiryAssignment({
      enquiryId: enquiry.id,
      companyId: branch.companyId,
      branchId: enquiry.branchId,
      fromUserId: enquiry.assignedToId,
      toUserId: selected.id,
      assignmentType: 'AUTO',
      score: selected.score,
      scoreBreakdown: selected.scoreBreakdown,
      reasons: selected.reasons,
      exclusions: rows.filter((r) => r.id !== selected.id).map((r) => ({
        userId: r.id,
        name: `${r.firstName} ${r.lastName}`,
        exclusions: r.exclusions,
        score: r.score,
      })),
      actorId,
    });

    await assignmentRepository.upsertPresence(selected.id, enquiry.branchId, {
      lastAssignedAt: new Date(),
    });

    return { enquiry: updated, assigned: true, match: selected, candidates: rows };
  },

  /** @deprecated Legacy offer flow — prefer direct assign */
  async offerToCounsellor(lead, counsellorId, actorId = null) {
    return assignmentRepository.createOffer({
      leadId: lead.id,
      counsellorId,
      branchId: lead.branchId,
      expiresAt: new Date(Date.now() + 120000),
      assignmentScore: 0,
      ruleSnapshot: { legacy: true },
      createdBy: actorId,
    });
  },

  async autoAssign(leadId, actorId = null, excludeIds = []) {
    const lead = await assignmentRepository.findLeadById(leadId);
    if (!lead || lead.assignedToId) return { lead, assigned: false };
    return this.autoAssignLead(lead, actorId);
  },

  async processExpiredOffers() {
    await assignmentRepository.expireStaleOffers();
    return [];
  },

  evaluateSla(waitingLeads, branchSla) {
    const now = Date.now();
    const sla = branchSla || { warningMinutes: 10, escalateMinutes: 15, managerNotifyMinutes: 20, mandatoryReassignMinutes: 30 };
    return waitingLeads.map((lead) => {
      const waitMin = Math.floor((now - new Date(lead.walkInAt || lead.createdAt).getTime()) / 60000);
      let tier = 'ok';
      if (waitMin >= sla.mandatoryReassignMinutes) tier = 'mandatory_reassign';
      else if (waitMin >= sla.managerNotifyMinutes) tier = 'manager';
      else if (waitMin >= sla.escalateMinutes) tier = 'escalate';
      else if (waitMin >= sla.warningMinutes) tier = 'warning';
      return { leadId: lead.id, waitMinutes: waitMin, tier };
    });
  },
};

/** @deprecated use mapAvailabilityLabelFromState */
export function mapAvailabilityLabel(presenceStatus, activeSessions = 0) {
  return mapAvailabilityLabelFromState({
    state: activeSessions > 0 ? 'TEMPORARILY_BUSY' : (presenceStatus === 'AVAILABLE' ? 'AVAILABLE' : 'OFFLINE'),
    label: presenceStatus,
    display: { tone: 'neutral', detail: presenceStatus },
  });
}
