import prisma from '../../config/database.js';
import { softDeleteWhere, buildPagination, parsePagination } from '../../utils/response.util.js';
import {
  mergeScope,
  getViewingBranchId,
  canSwitchViewingBranch,
} from '../../utils/tenant.util.js';

const buildSearchWhere = (search) => {
  if (!search) return {};
  const q = String(search).trim();
  if (!q) return {};
  return {
    OR: [
      { invoiceNo: { contains: q } },
      { notes: { contains: q } },
      { currency: { contains: q } },
      { student: { firstName: { contains: q } } },
      { student: { lastName: { contains: q } } },
      { student: { studentCode: { contains: q } } },
    ],
  };
};

async function companyScopeWhere(companyId, user, extra = {}) {
  const staff = await prisma.user.findMany({
    where: {
      companyId,
      deletedAt: null,
      ...(getViewingBranchId(user) && canSwitchViewingBranch(user)
        ? { branchId: getViewingBranchId(user) }
        : {}),
    },
    select: { id: true },
  });
  const staffIds = staff.map((u) => u.id);

  // Force student wall through mergeScope (tenant + role + viewing branch clamp)
  const studentScope = mergeScope(user, { entity: 'student', ownerField: 'assignedToId' });

  return {
    ...softDeleteWhere,
    ...extra,
    OR: [
      { student: studentScope },
      ...(staffIds.length ? [{ createdBy: { in: staffIds } }] : []),
    ],
  };
}

function buildListWhere({
  search,
  studentId,
  status,
  statusGroup,
  currency,
  dueFrom,
  dueTo,
  ids,
  companyId,
  user,
}) {
  return (async () => {
    const extra = {
      ...(studentId && { studentId }),
      ...(currency && { currency }),
      ...(Array.isArray(ids) && ids.length ? { id: { in: ids } } : {}),
    };

    if (statusGroup === 'outstanding') {
      extra.status = { in: ['DRAFT', 'SENT', 'PARTIAL', 'OVERDUE'] };
    } else if (status) {
      extra.status = status;
    }

    if (dueFrom || dueTo) {
      extra.dueDate = {
        ...(dueFrom ? { gte: new Date(dueFrom) } : {}),
        ...(dueTo ? { lte: new Date(dueTo) } : {}),
      };
    }

    const scope = await companyScopeWhere(companyId, user, extra);
    const searchWhere = buildSearchWhere(search);
    return searchWhere.OR ? { AND: [scope, searchWhere] } : scope;
  })();
}

const studentInclude = {
  student: {
    select: {
      id: true,
      studentCode: true,
      firstName: true,
      lastName: true,
      branch: { select: { id: true, name: true } },
    },
  },
};

export const invoiceRepository = {
  findMany: async ({
    search,
    studentId,
    status,
    statusGroup,
    currency,
    dueFrom,
    dueTo,
    ids,
    page,
    limit,
    sort,
    companyId,
    user,
  }) => {
    const { skip } = parsePagination({ page, limit });
    const where = await buildListWhere({
      search, studentId, status, statusGroup, currency, dueFrom, dueTo, ids, companyId, user,
    });

    const [data, total] = await Promise.all([
      prisma.invoice.findMany({
        where,
        skip,
        take: limit,
        orderBy: sort || { createdAt: 'desc' },
        include: studentInclude,
      }),
      prisma.invoice.count({ where }),
    ]);

    return { data, pagination: buildPagination(page, limit, total) };
  },

  getSummary: async ({ search, studentId, currency, dueFrom, dueTo, companyId, user }) => {
    const baseWhere = await buildListWhere({
      search, studentId, status: undefined, currency, dueFrom, dueTo, companyId, user,
    });

    const [total, draft, sent, partial, overdue, paid, cancelled, money] = await Promise.all([
      prisma.invoice.count({ where: baseWhere }),
      prisma.invoice.count({ where: { ...baseWhere, status: 'DRAFT' } }),
      prisma.invoice.count({ where: { ...baseWhere, status: 'SENT' } }),
      prisma.invoice.count({ where: { ...baseWhere, status: 'PARTIAL' } }),
      prisma.invoice.count({ where: { ...baseWhere, status: 'OVERDUE' } }),
      prisma.invoice.count({ where: { ...baseWhere, status: 'PAID' } }),
      prisma.invoice.count({ where: { ...baseWhere, status: 'CANCELLED' } }),
      prisma.invoice.aggregate({
        where: {
          ...baseWhere,
          status: { in: ['SENT', 'PARTIAL', 'OVERDUE', 'DRAFT'] },
        },
        _sum: { total: true },
      }),
    ]);

    return {
      total,
      draft,
      sent,
      partial,
      overdue,
      paid,
      cancelled,
      outstanding: Number(money?._sum?.total || 0),
    };
  },

  findById: async (id, companyId, user) => {
    const scope = await companyScopeWhere(companyId, user, { id });
    return prisma.invoice.findFirst({
      where: scope,
      include: studentInclude,
    });
  },

  create: (data) => prisma.invoice.create({
    data,
    include: studentInclude,
  }),

  update: (id, data) => prisma.invoice.update({
    where: { id },
    data,
    include: studentInclude,
  }),

  softDelete: (id, userId) => prisma.invoice.update({
    where: { id },
    data: { deletedAt: new Date(), updatedBy: userId },
  }),

  generateInvoiceNo: async (companyId) => {
    const company = await prisma.company.findFirst({
      where: { id: companyId, deletedAt: null },
      select: { code: true },
    });
    const prefix = (company?.code || 'CRM').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 12) || 'CRM';
    const year = new Date().getFullYear();
    const staff = await prisma.user.findMany({
      where: { companyId, deletedAt: null },
      select: { id: true },
    });
    const staffIds = staff.map((u) => u.id);
    const count = await prisma.invoice.count({
      where: {
        deletedAt: null,
        OR: [
          { student: { branch: { companyId } } },
          ...(staffIds.length ? [{ createdBy: { in: staffIds } }] : []),
        ],
      },
    });
    return `${prefix}-INV-${year}-${String(count + 1).padStart(6, '0')}`;
  },
};

export const INVOICE_SORT_FIELDS = ['createdAt', 'status', 'invoiceNo', 'total', 'dueDate'];
