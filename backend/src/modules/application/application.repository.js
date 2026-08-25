import prisma from '../../config/database.js';
import { softDeleteWhere, buildPagination, parsePagination, parseSort } from '../../utils/response.util.js';

const buildSearchWhere = (search) => {
  if (!search) return {};
  return {
    OR: [
      { university: { contains: search } },
      { course: { contains: search } },
      { applicationNo: { contains: search } },
    ],
  };
};

export const applicationRepository = {
  findMany: async ({ search, studentId, status, page, limit, sort, scopeWhere }) => {
    const { skip } = parsePagination({ page, limit });
    const where = {
      ...softDeleteWhere,
      ...(scopeWhere || {}),
      ...(studentId && { studentId }),
      ...(status && { status }),
      ...buildSearchWhere(search),
    };

    const [data, total] = await Promise.all([
      prisma.application.findMany({
        where,
        skip,
        take: limit,
        orderBy: sort,
        include: { student: { select: { id: true, studentCode: true, firstName: true, lastName: true, branchId: true } } },
      }),
      prisma.application.count({ where }),
    ]);

    return { data, pagination: buildPagination(page, limit, total) };
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
