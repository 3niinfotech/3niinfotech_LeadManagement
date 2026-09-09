import prisma from '../../config/database.js';
import { softDeleteWhere, buildPagination, parsePagination } from '../../utils/response.util.js';

/** Backfill companyId from metadata or creator for legacy rows (tenant-scoped batches). */
async function backfillPartnerCompanyId(companyId) {
  const legacy = await prisma.partner.findMany({
    where: { companyId: null, deletedAt: null },
    select: { id: true, metadata: true, createdBy: true, user: { select: { companyId: true } } },
    take: 200,
  });
  for (const row of legacy) {
    const metaCompany = row.metadata?.companyId;
    let resolved = metaCompany === companyId ? companyId : null;
    if (!resolved && row.user?.companyId === companyId) resolved = companyId;
    if (!resolved && row.createdBy) {
      const creator = await prisma.user.findUnique({
        where: { id: row.createdBy },
        select: { companyId: true },
      });
      if (creator?.companyId === companyId) resolved = companyId;
    }
    if (resolved) {
      await prisma.partner.update({ where: { id: row.id }, data: { companyId: resolved } });
    }
  }
}

function companyScopeWhere(companyId, extra = {}) {
  return {
    ...softDeleteWhere,
    companyId,
    ...extra,
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
    await backfillPartnerCompanyId(companyId);
    const { skip } = parsePagination({ page, limit });
    const searchWhere = buildSearchWhere(search);
    const scope = userId
      ? { ...companyScopeWhere(companyId), userId, ...(type ? { type } : {}) }
      : companyScopeWhere(companyId, { ...(type ? { type } : {}) });
    const where = searchWhere.OR ? { AND: [scope, searchWhere] } : scope;

    const [data, total] = await Promise.all([
      prisma.partner.findMany({
        where,
        skip,
        take: limit,
        orderBy: { name: 'asc' },
        include: {
          user: { select: { id: true, email: true, firstName: true, lastName: true, companyId: true } },
          _count: { select: { students: true } },
        },
      }),
      prisma.partner.count({ where }),
    ]);

    return { data, pagination: buildPagination(page, limit, total) };
  },

  findById: async (id, companyId) => {
    await backfillPartnerCompanyId(companyId);
    return prisma.partner.findFirst({
      where: companyScopeWhere(companyId, { id }),
      include: {
        user: { select: { id: true, email: true, firstName: true, lastName: true, companyId: true } },
        _count: { select: { students: true } },
      },
    });
  },

  countStudents: (partnerId, companyId) => prisma.student.count({
    where: {
      partnerId,
      deletedAt: null,
      branch: { companyId },
    },
  }),

  create: (data) => prisma.partner.create({ data }),

  update: (id, data) => prisma.partner.update({ where: { id }, data }),

  softDelete: (id, userId) => prisma.partner.update({
    where: { id },
    data: { deletedAt: new Date(), isActive: false, updatedBy: userId },
  }),

  generateCode: async (companyId) => {
    const company = await prisma.company.findUnique({
      where: { id: companyId },
      select: { code: true },
    });
    const prefix = (company?.code || 'CO').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6);
    const count = await prisma.partner.count({ where: { companyId } });
    return `${prefix}-PTR${String(count + 1).padStart(6, '0')}`;
  },
};
