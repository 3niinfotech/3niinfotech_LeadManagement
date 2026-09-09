import prisma from '../../config/database.js';
import { softDeleteWhere } from '../../utils/response.util.js';
import { assignmentEngine } from './assignment.engine.js';
import { assignmentRepository } from './assignment.repository.js';
import { notifyUser, notifyRoles, RECEPTION_ALERT_ROLE_SLUGS } from '../notification/notification.dispatcher.js';

const CLOSED_ENQUIRY_STATUSES = new Set([
  'CONVERTED', 'LOST', 'NOT_INTERESTED', 'SPAM', 'DUPLICATE',
]);

const SLA_STATUS = {
  ON_TRACK: 'ON_TRACK',
  DUE_SOON: 'DUE_SOON',
  OVERDUE: 'OVERDUE',
  BREACHED: 'BREACHED',
  COMPLETED: 'COMPLETED',
};

const TIER_TO_SLA_STATUS = {
  ok: SLA_STATUS.ON_TRACK,
  warning: SLA_STATUS.DUE_SOON,
  escalate: SLA_STATUS.OVERDUE,
  manager: SLA_STATUS.BREACHED,
  mandatory_reassign: SLA_STATUS.BREACHED,
};

function mapSlaMinutes(config) {
  const raw = config?.slaMinutes || {};
  return {
    warningMinutes: raw.warning ?? 10,
    escalateMinutes: raw.escalate ?? 15,
    managerNotifyMinutes: raw.managerNotify ?? 20,
    mandatoryReassignMinutes: raw.mandatoryReassign ?? 30,
  };
}

function hasFirstResponse(enquiry) {
  if (!enquiry) return false;
  if (enquiry.status && enquiry.status !== 'NEW') return true;
  const followups = enquiry.followups || [];
  if (followups.some((f) => f.stage !== 'REMINDER')) return true;
  return Boolean(enquiry.metadata?.sla?.firstResponseAt);
}

function buildAnchorAt(enquiry) {
  if (enquiry.assignedToId && enquiry.metadata?.sla?.assignedAt) {
    return new Date(enquiry.metadata.sla.assignedAt);
  }
  if (enquiry.assignedToId) {
    const assignLog = (enquiry.assignmentLogs || [])
      .filter((l) => l.toUserId === enquiry.assignedToId)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0];
    if (assignLog?.createdAt) return new Date(assignLog.createdAt);
  }
  return new Date(enquiry.createdAt);
}

async function notifySlaTier({
  enquiry,
  companyId,
  tier,
  waitMinutes,
  slaMeta,
}) {
  const name = [enquiry.firstName, enquiry.lastName].filter(Boolean).join(' ').trim() || enquiry.enquiryCode;
  const link = `/admin/enquiries/${enquiry.id}`;
  const notified = slaMeta.notifications || {};

  if (tier === 'warning' && !notified.warning && enquiry.assignedToId) {
    await notifyUser(enquiry.assignedToId, {
      type: 'WARNING',
      title: `SLA due soon — ${enquiry.enquiryCode}`,
      message: `${name} requires first response within SLA (${waitMinutes} min waiting).`,
      link,
      metadata: { event: 'SLA_DUE_SOON', enquiryId: enquiry.id, tier, waitMinutes },
    });
    notified.warning = new Date().toISOString();
  }

  if ((tier === 'escalate' || tier === 'manager' || tier === 'mandatory_reassign') && !notified.manager) {
    await notifyRoles({
      companyId,
      branchId: enquiry.branchId,
      roleSlugs: RECEPTION_ALERT_ROLE_SLUGS,
      excludeUserIds: [enquiry.assignedToId].filter(Boolean),
      payload: {
        type: 'WARNING',
        title: tier === 'mandatory_reassign' ? `SLA breach — reassignment due` : `SLA breach — ${enquiry.enquiryCode}`,
        message: `${name} has waited ${waitMinutes} minutes without required action.`,
        link,
        metadata: { event: 'SLA_BREACH', enquiryId: enquiry.id, tier, waitMinutes },
      },
    });
    notified.manager = new Date().toISOString();
  }

  if (tier === 'mandatory_reassign' && enquiry.assignedToId && !notified.reassignAttempt) {
    await notifyUser(enquiry.assignedToId, {
      type: 'WARNING',
      title: 'SLA breach — case may be reassigned',
      message: `${name} (${enquiry.enquiryCode}) exceeded mandatory SLA. Manager review or auto-reassignment may apply.`,
      link,
      metadata: { event: 'SLA_REASSIGN_WARNING', enquiryId: enquiry.id, waitMinutes },
    });
    notified.reassignAttempt = new Date().toISOString();
  }

  return notified;
}

async function tryAutoReassign(enquiry, companyId, config, actorId = null) {
  if (!config.slaAutoReassign || !enquiry.assignedToId) return null;

  if (enquiry.leadId) {
    const activeSession = await assignmentRepository.findActiveSession(enquiry.leadId);
    if (activeSession) return null;
  }

  const excludeIds = [enquiry.assignedToId];
  const leadHint = {
    branchId: enquiry.branchId,
    country: enquiry.interestedCountry,
    interestedCountry: enquiry.interestedCountry,
    interestedCourse: enquiry.interestedCourse,
    priority: enquiry.priority,
    metadata: enquiry.metadata || {},
  };

  const branch = await prisma.branch.findUnique({
    where: { id: enquiry.branchId },
    select: { companyId: true },
  });
  if (!branch?.companyId) return null;

  const { rows } = await assignmentEngine.scoreAllForLead(leadHint, {
    branchId: enquiry.branchId,
    companyId: branch.companyId,
    excludeIds,
  });

  const candidate = rows.find((r) => r.routable && r.id !== enquiry.assignedToId);
  if (!candidate) return null;

  const fromUserId = enquiry.assignedToId;
  const updated = await prisma.enquiry.update({
    where: { id: enquiry.id },
    data: {
      assignedToId: candidate.id,
      assignedById: actorId,
      updatedBy: actorId,
      lastTouchedAt: new Date(),
      metadata: {
        ...(enquiry.metadata || {}),
        sla: {
          ...(enquiry.metadata?.sla || {}),
          reassignedAt: new Date().toISOString(),
          reassignReason: 'SLA mandatory breach — auto-reassigned by engine',
          previousAssigneeId: fromUserId,
        },
      },
    },
  });

  await assignmentRepository.logEnquiryAssignment({
    enquiryId: enquiry.id,
    companyId: branch.companyId,
    branchId: enquiry.branchId,
    fromUserId,
    toUserId: candidate.id,
    assignmentType: 'REASSIGN',
    score: candidate.score,
    scoreBreakdown: candidate.scoreBreakdown,
    reasons: [...(candidate.reasons || []), 'SLA mandatory breach auto-reassignment'],
    exclusions: rows.filter((r) => r.id !== candidate.id).map((r) => ({
      userId: r.id,
      name: `${r.firstName} ${r.lastName}`,
      exclusions: r.exclusions,
      score: r.score,
    })),
    actorId,
    reason: 'SLA mandatory breach — auto-reassigned by engine',
  });

  await notifyUser(candidate.id, {
    type: 'INFO',
    title: 'Enquiry reassigned to you (SLA)',
    message: `${enquiry.enquiryCode} was auto-reassigned due to SLA breach.`,
    link: `/admin/enquiries/${enquiry.id}`,
    metadata: { event: 'SLA_AUTO_REASSIGN', enquiryId: enquiry.id },
  });

  return updated;
}

async function processEnquirySla(enquiry, companyId, config) {
  if (CLOSED_ENQUIRY_STATUSES.has(enquiry.status)) return null;

  const slaMinutes = mapSlaMinutes(config);
  const responded = hasFirstResponse(enquiry);
  if (responded) {
    const existing = enquiry.metadata?.sla || {};
    if (existing.status === SLA_STATUS.COMPLETED) return null;
    await prisma.enquiry.update({
      where: { id: enquiry.id },
      data: {
        metadata: {
          ...(enquiry.metadata || {}),
          sla: {
            ...existing,
            status: SLA_STATUS.COMPLETED,
            completedAt: existing.completedAt || new Date().toISOString(),
            lastEvaluatedAt: new Date().toISOString(),
          },
        },
      },
    });
    return null;
  }

  const anchorAt = buildAnchorAt(enquiry);
  const waitMinutes = Math.floor((Date.now() - anchorAt.getTime()) / 60000);
  const [{ tier }] = assignmentEngine.evaluateSla(
    [{ id: enquiry.id, walkInAt: anchorAt, createdAt: anchorAt }],
    slaMinutes,
  );

  const slaStatus = TIER_TO_SLA_STATUS[tier] || SLA_STATUS.ON_TRACK;
  const existing = enquiry.metadata?.sla || {};
  const notifications = await notifySlaTier({
    enquiry,
    companyId,
    tier,
    waitMinutes,
    slaMeta: existing,
  });

  const slaPatch = {
    ...existing,
    status: slaStatus,
    tier,
    waitMinutes,
    anchorAt: anchorAt.toISOString(),
    assignedAt: enquiry.assignedToId
      ? (existing.assignedAt || anchorAt.toISOString())
      : null,
    lastEvaluatedAt: new Date().toISOString(),
    notifications,
  };

  let updated = enquiry;
  if (tier === 'mandatory_reassign' && config.slaAutoReassign && !existing.reassignedAt) {
    const reassigned = await tryAutoReassign(enquiry, companyId, config);
    if (reassigned) updated = reassigned;
  } else {
    await prisma.enquiry.update({
      where: { id: enquiry.id },
      data: { metadata: { ...(enquiry.metadata || {}), sla: slaPatch } },
    });
  }

  return { enquiryId: updated.id, tier, waitMinutes, status: slaStatus };
}

export async function processSlaBatch({ take = 200 } = {}) {
  const companies = await prisma.company.findMany({
    where: { deletedAt: null, isActive: true },
    select: { id: true, settings: true },
  });

  const results = [];
  for (const company of companies) {
    const config = await assignmentEngine.getCompanyAssignmentConfig(company.id);
    if (config.slaEnabled === false) continue;

    const enquiries = await prisma.enquiry.findMany({
      where: {
        ...softDeleteWhere,
        branch: { companyId: company.id },
        status: { notIn: [...CLOSED_ENQUIRY_STATUSES] },
      },
      include: {
        followups: { orderBy: { createdAt: 'desc' }, take: 5 },
        assignmentLogs: { orderBy: { createdAt: 'desc' }, take: 3 },
      },
      orderBy: { createdAt: 'asc' },
      take,
    });

    for (const enquiry of enquiries) {
      try {
        const row = await processEnquirySla(enquiry, company.id, config);
        if (row) results.push(row);
      } catch (err) {
        console.error('[sla] enquiry', enquiry.id, err.message);
      }
    }
  }

  return { processed: results.length, results };
}

function buildSlaRow(enquiry, config) {
  const slaMeta = enquiry.metadata?.sla || {};
  const anchorAt = buildAnchorAt(enquiry);
  const waitMinutes = Math.floor((Date.now() - anchorAt.getTime()) / 60000);
  const slaMinutes = mapSlaMinutes(config);
  const responded = hasFirstResponse(enquiry);
  let tier = 'ok';
  let status = SLA_STATUS.COMPLETED;

  if (!responded) {
    [{ tier }] = assignmentEngine.evaluateSla(
      [{ id: enquiry.id, walkInAt: anchorAt, createdAt: anchorAt }],
      slaMinutes,
    );
    status = TIER_TO_SLA_STATUS[tier] || SLA_STATUS.ON_TRACK;
  }

  const mandatory = slaMinutes.mandatoryReassignMinutes;
  const remainingMinutes = responded ? 0 : Math.max(0, mandatory - waitMinutes);

  return {
    enquiryId: enquiry.id,
    enquiryCode: enquiry.enquiryCode,
    firstName: enquiry.firstName,
    lastName: enquiry.lastName,
    status,
    tier,
    waitMinutes,
    remainingMinutes,
    overdueMinutes: !responded && waitMinutes > mandatory ? waitMinutes - mandatory : 0,
    priority: enquiry.priority,
    enquiryStatus: enquiry.status,
    branchId: enquiry.branchId,
    branchName: enquiry.branch?.name || null,
    assignedToId: enquiry.assignedToId,
    assignedTo: enquiry.assignedTo
      ? `${enquiry.assignedTo.firstName || ''} ${enquiry.assignedTo.lastName || ''}`.trim()
      : null,
    interestedCountry: enquiry.interestedCountry,
    interestedCourse: enquiry.interestedCourse,
    createdAt: enquiry.createdAt,
    sla: slaMeta,
    requiredAction: responded ? 'Completed' : (tier === 'mandatory_reassign' ? 'Escalate / Reassign' : 'First response'),
  };
}

/** Counsellor SLA list — assigned open enquiries with live SLA evaluation */
export async function getMySlaLeads(user, { status, page = 1, limit = 25 } = {}) {
  const companyId = user.companyId;
  if (!companyId) return { items: [], total: 0, summary: {} };

  const config = await assignmentEngine.getCompanyAssignmentConfig(companyId);
  const where = {
    ...softDeleteWhere,
    assignedToId: user.id,
    branch: { companyId },
    status: { notIn: [...CLOSED_ENQUIRY_STATUSES] },
  };

  const [enquiries, total] = await Promise.all([
    prisma.enquiry.findMany({
      where,
      include: {
        branch: { select: { name: true } },
        assignedTo: { select: { id: true, firstName: true, lastName: true } },
        followups: { orderBy: { createdAt: 'desc' }, take: 3 },
        assignmentLogs: { orderBy: { createdAt: 'desc' }, take: 2 },
      },
      orderBy: { createdAt: 'asc' },
      skip: (Number(page) - 1) * Number(limit),
      take: Number(limit),
    }),
    prisma.enquiry.count({ where }),
  ]);

  let items = enquiries.map((e) => buildSlaRow(e, config));
  if (status) {
    items = items.filter((i) => i.status === status);
  }

  const summary = {
    onTrack: items.filter((i) => i.status === SLA_STATUS.ON_TRACK).length,
    dueSoon: items.filter((i) => i.status === SLA_STATUS.DUE_SOON).length,
    overdue: items.filter((i) => i.status === SLA_STATUS.OVERDUE).length,
    breached: items.filter((i) => i.status === SLA_STATUS.BREACHED).length,
    completed: items.filter((i) => i.status === SLA_STATUS.COMPLETED).length,
  };

  return { items, total, page: Number(page), limit: Number(limit), summary, config: mapSlaMinutes(config) };
}

/** Manager SLA overview — aggregate + at-risk enquiries */
export async function getSlaOverview(user, { branchId, counsellorId, page = 1, limit = 50 } = {}) {
  const companyId = user.companyId;
  if (!companyId) return { items: [], total: 0, summary: {}, counsellorStats: [] };

  const config = await assignmentEngine.getCompanyAssignmentConfig(companyId);
  const where = {
    ...softDeleteWhere,
    branch: { companyId, ...(branchId ? { id: branchId } : {}) },
    status: { notIn: [...CLOSED_ENQUIRY_STATUSES] },
    ...(counsellorId ? { assignedToId: counsellorId } : {}),
  };

  const enquiries = await prisma.enquiry.findMany({
    where,
    include: {
      branch: { select: { name: true } },
      assignedTo: { select: { id: true, firstName: true, lastName: true } },
      followups: { orderBy: { createdAt: 'desc' }, take: 3 },
      assignmentLogs: { orderBy: { createdAt: 'desc' }, take: 2 },
    },
    orderBy: { createdAt: 'asc' },
  });

  const allRows = enquiries.map((e) => buildSlaRow(e, config));
  const atRisk = allRows.filter((r) => [
    SLA_STATUS.DUE_SOON,
    SLA_STATUS.OVERDUE,
    SLA_STATUS.BREACHED,
  ].includes(r.status));

  const counsellorMap = new Map();
  for (const row of allRows) {
    if (!row.assignedToId) continue;
    const key = row.assignedToId;
    if (!counsellorMap.has(key)) {
      counsellorMap.set(key, {
        counsellorId: key,
        name: row.assignedTo,
        total: 0,
        warning: 0,
        breach: 0,
        avgWaitMinutes: 0,
        reassignCount: 0,
      });
    }
    const stat = counsellorMap.get(key);
    stat.total += 1;
    if (row.status === SLA_STATUS.DUE_SOON) stat.warning += 1;
    if (row.status === SLA_STATUS.BREACHED || row.status === SLA_STATUS.OVERDUE) stat.breach += 1;
    stat.avgWaitMinutes += row.waitMinutes;
    if (row.sla?.reassignedAt) stat.reassignCount += 1;
  }

  const counsellorStats = [...counsellorMap.values()].map((s) => ({
    ...s,
    avgWaitMinutes: s.total ? Math.round(s.avgWaitMinutes / s.total) : 0,
    avgResponseMinutes: s.total ? Math.round(s.avgWaitMinutes / s.total) : 0,
  }));

  const skip = (Number(page) - 1) * Number(limit);
  const items = atRisk.slice(skip, skip + Number(limit));

  const summary = {
    totalOpen: allRows.length,
    onTrack: allRows.filter((i) => i.status === SLA_STATUS.ON_TRACK).length,
    dueSoon: allRows.filter((i) => i.status === SLA_STATUS.DUE_SOON).length,
    overdue: allRows.filter((i) => i.status === SLA_STATUS.OVERDUE).length,
    breached: allRows.filter((i) => i.status === SLA_STATUS.BREACHED).length,
    unassigned: enquiries.filter((e) => !e.assignedToId).length,
    reassignCount: allRows.filter((r) => r.sla?.reassignedAt).length,
    avgWaitMinutes: allRows.length
      ? Math.round(allRows.reduce((s, r) => s + r.waitMinutes, 0) / allRows.length)
      : 0,
  };

  return {
    items,
    total: atRisk.length,
    page: Number(page),
    limit: Number(limit),
    summary,
    counsellorStats,
    config: mapSlaMinutes(config),
    slaEnabled: config.slaEnabled !== false,
    slaAutoReassign: Boolean(config.slaAutoReassign),
  };
}

export const slaService = {
  processSlaBatch,
  processEnquirySla,
  getMySlaLeads,
  getSlaOverview,
  SLA_STATUS,
};

export default slaService;
