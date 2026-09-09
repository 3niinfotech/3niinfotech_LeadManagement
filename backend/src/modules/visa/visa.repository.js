import prisma from '../../config/database.js';
import { softDeleteWhere, buildPagination, parsePagination } from '../../utils/response.util.js';

const buildSearchWhere = (search) => {
  if (!search) return {};
  const term = String(search).trim();
  return {
    OR: [
      { country: { contains: term } },
      { visaType: { contains: term } },
      { applicationNo: { contains: term } },
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

  if (statusGroup === 'pending') {
    parts.push({
      AND: [
        { status: { notIn: ['APPROVED', 'REJECTED'] } },
        {
          NOT: {
            OR: [
              { metadata: { path: '$.visaApproved', equals: true } },
              { metadata: { path: '$.visaRejected', equals: true } },
            ],
          },
        },
      ],
    });
  } else if (statusGroup === 'approved') {
    parts.push({
      OR: [
        { status: 'APPROVED' },
        { metadata: { path: '$.visaApproved', equals: true } },
      ],
    });
  } else if (statusGroup === 'rejected') {
    parts.push({
      OR: [
        { status: 'REJECTED' },
        { metadata: { path: '$.visaRejected', equals: true } },
      ],
    });
  }

  if (parts.length === 1) return parts[0];
  return { AND: parts };
}

const studentInclude = {
  student: {
    select: {
      id: true,
      studentCode: true,
      firstName: true,
      lastName: true,
      branchId: true,
      email: true,
      phone: true,
      branch: { select: { id: true, name: true, code: true } },
    },
  },
};

export const visaRepository = {
  findMany: async ({
    search, studentId, status, countryId, statusGroup, ids, page, limit, sort, scopeWhere,
  }) => {
    const { skip } = parsePagination({ page, limit });
    const where = buildListWhere({
      search, studentId, status, countryId, statusGroup, ids, scopeWhere,
    });

    const [data, total] = await Promise.all([
      prisma.visa.findMany({
        where,
        skip,
        take: limit,
        orderBy: sort,
        include: studentInclude,
      }),
      prisma.visa.count({ where }),
    ]);

    return { data, pagination: buildPagination(page, limit, total) };
  },

  getSummary: async ({ search, studentId, countryId, scopeWhere }) => {
    const baseWhere = buildListWhere({
      search, studentId, status: undefined, countryId, scopeWhere,
    });

    const [total, pending, approved, rejected, notStarted, submitted, interview] = await Promise.all([
      prisma.visa.count({ where: baseWhere }),
      prisma.visa.count({
        where: buildListWhere({
          search, studentId, countryId, statusGroup: 'pending', scopeWhere,
        }),
      }),
      prisma.visa.count({
        where: buildListWhere({
          search, studentId, countryId, statusGroup: 'approved', scopeWhere,
        }),
      }),
      prisma.visa.count({
        where: buildListWhere({
          search, studentId, countryId, statusGroup: 'rejected', scopeWhere,
        }),
      }),
      prisma.visa.count({ where: { ...baseWhere, status: 'NOT_STARTED' } }),
      prisma.visa.count({ where: { ...baseWhere, status: 'APPLICATION_SUBMITTED' } }),
      prisma.visa.count({ where: { ...baseWhere, status: 'INTERVIEW_SCHEDULED' } }),
    ]);

    return {
      total, pending, approved, rejected, notStarted, submitted, interview,
    };
  },

  findById: (id) => prisma.visa.findFirst({
    where: { id, ...softDeleteWhere },
    include: studentInclude,
  }),

  create: (data) => prisma.visa.create({ data }),
  update: (id, data) => prisma.visa.update({ where: { id }, data }),
  softDelete: (id, userId) => prisma.visa.update({
    where: { id },
    data: { deletedAt: new Date(), updatedBy: userId },
  }),
  generateCode: async () => {
    const count = await prisma.visa.count();
    return `VISA-${String(count + 1).padStart(4, '0')}`;
  },
};

export const VISA_SORT_FIELDS = ['createdAt', 'status', 'country', 'visaType'];
