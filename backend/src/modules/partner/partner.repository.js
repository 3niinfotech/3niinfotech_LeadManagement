import prisma from '../../config/database.js';
import { softDeleteWhere, buildPagination, parsePagination } from '../../utils/response.util.js';

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
      { user: { companyId } },
      ...(staffIds.length ? [{ createdBy: { in: staffIds } }] : []),
    ],
  };
}

const buildSearchWhere = (search) => {
  if (!search) return {};
  return {
    OR: [
      { name: { contains: search } },
      { code: { contains: search } },
      { email: { contains: search } },
      { phone: { contains: search } },
    ],
  };
};

export const partnerRepository = {
  findMany: async ({ companyId, search, type, page, limit, userId }) => {
    const { skip } = parsePagination({ page, limit });
    const searchWhere = buildSearchWhere(search);
    const scope = userId
      ? { ...softDeleteWhere, userId, ...(type ? { type } : {}) }
      : await companyScopeWhere(companyId, {
        ...(type ? { type } : {}),
      });
    const where = searchWhere.OR
      ? { AND: [scope, searchWhere] }
      : scope;

    const [data, total] = await Promise.all([
      prisma.partner.findMany({
        where,
        skip,
        take: limit,
        orderBy: { name: 'asc' },
        include: {
          user: { select: { id: true, email: true, firstName: true, lastName: true, companyId: true } },
        },
      }),
      prisma.partner.count({ where }),
    ]);

    return { data, pagination: buildPagination(page, limit, total) };
  },

  findById: async (id, companyId) => {
    const scope = await companyScopeWhere(companyId, { id });
    return prisma.partner.findFirst({
      where: scope,
      include: {
        user: { select: { id: true, email: true, firstName: true, lastName: true, companyId: true } },
      },
    });
  },

  create: (data) => prisma.partner.create({ data }),

  update: (id, data) => prisma.partner.update({ where: { id }, data }),

  generateCode: async (companyId) => {
    const company = await prisma.company.findUnique({
      where: { id: companyId },
      select: { code: true },
    });
    const prefix = (company?.code || 'CO').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6);
    const count = await prisma.partner.count();
    return `${prefix}-PTR${String(count + 1).padStart(6, '0')}`;
  },
};
