import prisma from '../../config/database.js';
import { softDeleteWhere, buildPagination, parsePagination } from '../../utils/response.util.js';
import { WALKIN_STATUSES, WALKIN_SUMMARY_VIEWS } from './walkinStatus.config.js';
import { normalizePhone } from './walkin.utils.js';

const userSelect = { id: true, firstName: true, lastName: true, email: true };
const branchSelect = { id: true, name: true, code: true };

function startOfToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

function endOfToday() {
  const d = new Date();
  d.setHours(23, 59, 59, 999);
  return d;
}

const buildWhere = (filters = {}) => {
  const { scopeWhere, ...rest } = filters;
  const where = { ...softDeleteWhere, ...(scopeWhere || {}) };
  const {
    search, status, priority, branchId, assignedToId, view, userId,
    createdFrom, createdTo,
  } = rest;

  if (status) where.status = status;
  if (priority) where.priority = priority;
  if (branchId) where.branchId = branchId;
  if (assignedToId) where.assignedToId = assignedToId;

  if (view === 'today') {
    where.walkInAt = { gte: startOfToday(), lte: endOfToday() };
  } else if (view === 'unassigned' || view === 'waiting') {
    // Auto-assign miss: registered walk-in still without counsellor
    where.assignedToId = null;
    where.status = { in: ['WALK_IN', 'WAITING'] };
  } else if (view === 'in_counselling') where.status = 'IN_COUNSELLING';
  else if (view === 'completed') where.status = 'COMPLETED';
  else if (view === 'cancelled') where.status = 'CANCELLED';
  else if (view === 'appointment') where.status = 'APPOINTMENT';

  if (createdFrom || createdTo) {
    where.walkInAt = where.walkInAt || {};
    if (createdFrom) where.walkInAt.gte = new Date(createdFrom);
    if (createdTo) where.walkInAt.lte = new Date(createdTo);
  }

  if (search) {
    where.OR = [
      { firstName: { contains: search } },
      { lastName: { contains: search } },
      { phone: { contains: search } },
      { leadCode: { contains: search } },
      { tokenNumber: { contains: search } },
      { interestedCourse: { contains: search } },
      { country: { contains: search } },
    ];
  }

  return where;
};

export const walkinRepository = {
  findMany: async ({ page, limit, sort, ...filters }) => {
    const { skip } = parsePagination({ page, limit });
    const where = buildWhere(filters);

    const [data, total] = await Promise.all([
      prisma.lead.findMany({
        where,
        skip,
        take: limit,
        orderBy: sort,
        include: {
          branch: { select: branchSelect },
          assignedTo: { select: userSelect },
          receptionUser: { select: userSelect },
          enquiry: { select: { id: true, enquiryCode: true, status: true } },
        },
      }),
      prisma.lead.count({ where }),
    ]);

    return { data, pagination: buildPagination(page, limit, total) };
  },

  findById: (id) => prisma.lead.findFirst({
    where: { id, ...softDeleteWhere },
    include: {
      branch: { select: branchSelect },
      assignedTo: { select: userSelect },
      receptionUser: { select: userSelect },
      enquiry: { select: { id: true, enquiryCode: true, status: true } },
      activities: {
        orderBy: { createdAt: 'desc' },
        take: 100,
        include: { user: { select: userSelect } },
      },
    },
  }),

  findByPhone: (phone, branchId, excludeId) => {
    const normalized = normalizePhone(phone);
    return prisma.lead.findFirst({
      where: {
        ...softDeleteWhere,
        branchId,
        ...(excludeId && { id: { not: excludeId } }),
        phone: { contains: normalized.slice(-10) },
      },
      include: {
        assignedTo: { select: userSelect },
      },
    });
  },

  create: (data) => prisma.lead.create({
    data,
    include: {
      branch: { select: branchSelect },
      assignedTo: { select: userSelect },
      receptionUser: { select: userSelect },
    },
  }),

  update: (id, data) => prisma.lead.update({
    where: { id },
    data,
    include: {
      branch: { select: branchSelect },
      assignedTo: { select: userSelect },
      receptionUser: { select: userSelect },
      enquiry: { select: { id: true, enquiryCode: true, status: true } },
    },
  }),

  softDelete: (id, userId) => prisma.lead.update({
    where: { id },
    data: { deletedAt: new Date(), updatedBy: userId },
  }),

  generateLeadCode: async (companyId) => {
    const company = companyId
      ? await prisma.company.findUnique({ where: { id: companyId }, select: { code: true } })
      : null;
    const coPrefix = (company?.code || 'CO').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6);
    const year = new Date().getFullYear();
    const prefix = `${coPrefix}-LEAD-${year}-`;
    const latest = await prisma.lead.findFirst({
      where: {
        leadCode: { startsWith: prefix },
        ...(companyId ? { branch: { companyId } } : {}),
      },
      orderBy: { leadCode: 'desc' },
      select: { leadCode: true },
    });
    const lastNum = latest?.leadCode
      ? Number.parseInt(latest.leadCode.split('-').pop(), 10) || 0
      : 0;
    return `${prefix}${String(lastNum + 1).padStart(6, '0')}`;
  },

  generateTokenNumber: async (branchId) => {
    const branch = await prisma.branch.findUnique({
      where: { id: branchId },
      select: { code: true },
    });
    const series = (branch?.code || 'A').charAt(0).toUpperCase();
    const start = startOfToday();
    const end = endOfToday();

    const count = await prisma.lead.count({
      where: {
        branchId,
        walkInAt: { gte: start, lte: end },
      },
    });

    return `${series}-${101 + count}`;
  },

  getSummary: async (filters = {}) => {
    const baseWhere = buildWhere(filters);
    const todayWhere = {
      ...baseWhere,
      walkInAt: { gte: startOfToday(), lte: endOfToday() },
    };

    const [total, todayWalkIns, convertedToday, waitingUnassigned, ...statusCounts] = await Promise.all([
      prisma.lead.count({ where: baseWhere }),
      prisma.lead.count({ where: todayWhere }),
      prisma.lead.count({
        where: { ...todayWhere, enquiry: { isNot: null } },
      }),
      prisma.lead.count({
        where: {
          ...baseWhere,
          assignedToId: null,
          status: { in: ['WALK_IN', 'WAITING'] },
        },
      }),
      ...WALKIN_STATUSES.map((s) => prisma.lead.count({
        where: { ...baseWhere, status: s.value },
      })),
    ]);

    const summary = { total, todayWalkIns, convertedToday, waiting: waitingUnassigned };
    WALKIN_STATUSES.forEach((s, i) => {
      // Prefer unassigned count for "waiting" KPI (need counsellor)
      if (s.summaryKey === 'waiting') return;
      summary[s.summaryKey] = statusCounts[i];
    });
    WALKIN_SUMMARY_VIEWS.forEach((v) => {
      if (v.summaryKey && summary[v.summaryKey] === undefined) {
        summary[v.summaryKey] = 0;
      }
    });
    return summary;
  },

  listBranches: (companyId) => prisma.branch.findMany({
    where: {
      isActive: true,
      deletedAt: null,
      ...(companyId && { companyId }),
    },
    select: branchSelect,
    orderBy: { name: 'asc' },
  }),

  listNotes: (leadId) => prisma.note.findMany({
    where: {
      entityType: 'LEAD',
      entityId: leadId,
      deletedAt: null,
    },
    orderBy: { createdAt: 'desc' },
    include: { user: { select: userSelect } },
  }),

  addNote: (data) => prisma.note.create({
    data,
    include: { user: { select: userSelect } },
  }),
};
