import prisma from '../../config/database.js';
import { softDeleteWhere, buildPagination, parsePagination, parseSort } from '../../utils/response.util.js';

const buildSearchWhere = (search) => {
  if (!search) return {};
  return {
    OR: [
      { country: { contains: search } },
      { visaType: { contains: search } },
      { applicationNo: { contains: search } },
    ],
  };
};

export const visaRepository = {
  findMany: async ({ search, studentId, status, page, limit, sort }) => {
    const { skip } = parsePagination({ page, limit });
    const where = {
      ...softDeleteWhere,
      ...(studentId && { studentId }),
      ...(status && { status }),
      ...buildSearchWhere(search),
    };

    const [data, total] = await Promise.all([
      prisma.visa.findMany({
        where,
        skip,
        take: limit,
        orderBy: sort,
        include: { student: { select: { id: true, studentCode: true, firstName: true, lastName: true } } },
      }),
      prisma.visa.count({ where }),
    ]);

    return { data, pagination: buildPagination(page, limit, total) };
  },

  findById: (id) => prisma.visa.findFirst({
    where: { id, ...softDeleteWhere },
    include: { student: { select: { id: true, studentCode: true, firstName: true, lastName: true } } },
  }),

  create: (data) => prisma.visa.create({ data }),
  update: (id, data) => prisma.visa.update({ where: { id }, data }),
  softDelete: (id, userId) => prisma.visa.update({ where: { id }, data: { deletedAt: new Date(), updatedBy: userId } }),
  generateCode: async () => {
    const count = await prisma.visa.count();
    return `VISA-${String(count + 1).padStart(4, '0')}`;
  },
};

export const VISA_SORT_FIELDS = ['createdAt', 'status', 'country', 'visaType'];
