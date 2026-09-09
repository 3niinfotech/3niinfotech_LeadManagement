import prisma from '../../config/database.js';
import { softDeleteWhere, buildPagination, parsePagination } from '../../utils/response.util.js';

const buildSearchWhere = (search) => {
  if (!search) return {};
  const term = String(search).trim();
  return {
    OR: [
      { university: { contains: term } },
      { course: { contains: term } },
      { applicationNo: { contains: term } },
      { country: { contains: term } },
      {
        student: {
          OR: [
            { firstName: { contains: term } },
            { lastName: { contains: term } },
            { studentCode: { contains: term } },
          ],
        },
      },
    ],
  };
};

function buildListWhere({
  search, studentId, status, countryId, statusGroup, ids, scopeWhere,
}) {
  const base = {
    ...softDeleteWhere,
    ...(scopeWhere || {}),
    ...(studentId && { studentId }),
    ...(status && { status }),
    ...(ids?.length ? { id: { in: ids } } : {}),
    ...(countryId && {
      metadata: { path: '$.countryId', equals: countryId },
    }),
  };

  const parts = [base];
  const searchClause = buildSearchWhere(search);
  if (searchClause.OR) parts.push(searchClause);

  if (statusGroup === 'inReview') {
    parts.push({ status: { in: ['SUBMITTED', 'UNDER_REVIEW'] } });
  } else if (statusGroup === 'offer') {
    parts.push({
      OR: [
        { status: { in: ['CONDITIONAL_OFFER', 'UNCONDITIONAL_OFFER'] } },
        { metadata: { path: '$.setOfferLetter', equals: true } },
      ],
    });
  }

  if (parts.length === 1) return parts[0];
  return { AND: parts };
}

export const applicationRepository = {
  findMany: async ({
    search, studentId, status, countryId, statusGroup, ids, page, limit, sort, scopeWhere,
  }) => {
    const { skip } = parsePagination({ page, limit });
    const where = buildListWhere({
      search, studentId, status, countryId, statusGroup, ids, scopeWhere,
    });

    const [data, total] = await Promise.all([
      prisma.application.findMany({
        where,
        skip,
        take: limit,
        orderBy: sort,
        include: {
          student: {
            select: {
              id: true,
              studentCode: true,
              firstName: true,
              lastName: true,
              branchId: true,
              branch: { select: { id: true, name: true, code: true } },
            },
          },
        },
      }),
      prisma.application.count({ where }),
    ]);

    return { data, pagination: buildPagination(page, limit, total) };
  },

  getSummary: async ({ search, studentId, countryId, scopeWhere }) => {
    const baseWhere = buildListWhere({
      search, studentId, status: undefined, countryId, scopeWhere,
    });

    const [total, inReview, offer, submitted, draft, rejected, withdrawn] = await Promise.all([
      prisma.application.count({ where: baseWhere }),
      prisma.application.count({
        where: {
          ...baseWhere,
          status: { in: ['SUBMITTED', 'UNDER_REVIEW'] },
        },
      }),
      prisma.application.count({
        where: {
          ...baseWhere,
          OR: [
            { status: { in: ['CONDITIONAL_OFFER', 'UNCONDITIONAL_OFFER'] } },
            { metadata: { path: '$.setOfferLetter', equals: true } },
          ],
        },
      }),
      prisma.application.count({ where: { ...baseWhere, status: 'SUBMITTED' } }),
      prisma.application.count({ where: { ...baseWhere, status: 'DRAFT' } }),
      prisma.application.count({ where: { ...baseWhere, status: 'REJECTED' } }),
      prisma.application.count({ where: { ...baseWhere, status: 'WITHDRAWN' } }),
    ]);

    return { total, inReview, offer, submitted, draft, rejected, withdrawn };
  },

  findById: (id) => prisma.application.findFirst({
    where: { id, ...softDeleteWhere },
    include: { student: { select: { id: true, studentCode: true, firstName: true, lastName: true, branchId: true } } },
  }),

  create: (data) => prisma.application.create({ data }),
  update: (id, data) => prisma.application.update({ where: { id }, data }),
  softDelete: (id, userId) => prisma.application.update({ where: { id }, data: { deletedAt: new Date(), updatedBy: userId } }),
  generateCode: async () => {
    const count = await prisma.application.count();
    return `APP-${String(count + 1).padStart(4, '0')}`;
  },
};

export const APPLICATION_SORT_FIELDS = ['createdAt', 'status', 'university', 'course'];
