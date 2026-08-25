import prisma from '../../config/database.js';
import { softDeleteWhere, buildPagination, parsePagination } from '../../utils/response.util.js';

const buildSearchWhere = (search) => {
  if (!search) return {};
  return {
    OR: [
      { invoiceNo: { contains: search } },
      { notes: { contains: search } },
    ],
  };
};

async function companyScopeWhere(companyId, extra = {}) {
  const staff = await prisma.user.findMany({
    where: { companyId, deletedAt: null },
    select: { id: true },
  });
  const staffIds = staff.map((u) => u.id);
  return {
    ...softDeleteWhere,
    ...extra,
    OR: [
      { student: { branch: { companyId, deletedAt: null } } },
      ...(staffIds.length ? [{ createdBy: { in: staffIds } }] : []),
    ],
  };
}

export const invoiceRepository = {
  findMany: async ({ search, studentId, status, page, limit, sort, companyId }) => {
    const { skip } = parsePagination({ page, limit });
    const scope = await companyScopeWhere(companyId, {
      ...(studentId && { studentId }),
      ...(status && { status }),
    });
    const searchWhere = buildSearchWhere(search);
    const where = searchWhere.OR ? { AND: [scope, searchWhere] } : scope;

    const [data, total] = await Promise.all([
      prisma.invoice.findMany({
        where,
        skip,
        take: limit,
        orderBy: sort || { createdAt: 'desc' },
        include: { student: { select: { id: true, studentCode: true, firstName: true, lastName: true } } },
      }),
      prisma.invoice.count({ where }),
    ]);

    return { data, pagination: buildPagination(page, limit, total) };
  },

  findById: async (id, companyId) => {
    const scope = await companyScopeWhere(companyId, { id });
    return prisma.invoice.findFirst({
      where: scope,
      include: { student: { select: { id: true, studentCode: true, firstName: true, lastName: true } } },
    });
  },

  create: (data) => prisma.invoice.create({ data }),
  update: (id, data) => prisma.invoice.update({ where: { id }, data }),
  softDelete: (id, userId) => prisma.invoice.update({ where: { id }, data: { deletedAt: new Date(), updatedBy: userId } }),
};

export const INVOICE_SORT_FIELDS = ['createdAt', 'status', 'invoiceNo', 'total'];
