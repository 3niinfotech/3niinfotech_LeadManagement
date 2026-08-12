import prisma from '../../config/database.js';
import { softDeleteWhere, buildPagination, parsePagination, parseSort } from '../../utils/response.util.js';

const buildSearchWhere = (search) => {
  if (!search) return {};
  return {
    OR: [
      { name: { contains: search } },
      { category: { contains: search } },
      { fileName: { contains: search } },
    ],
  };
};

export const documentRepository = {
  findMany: async ({ search, studentId, entityType, entityId, page, limit, sort }) => {
    const { skip } = parsePagination({ page, limit });
    const where = {
      ...softDeleteWhere,
      ...(studentId && { studentId }),
      ...(entityType && { entityType }),
      ...(entityId && { entityId }),
      ...buildSearchWhere(search),
    };

    const [data, total] = await Promise.all([
      prisma.document.findMany({
        where,
        skip,
        take: limit,
        orderBy: sort,
        include: { student: { select: { id: true, studentCode: true, firstName: true, lastName: true } } },
      }),
      prisma.document.count({ where }),
    ]);

    return { data, pagination: buildPagination(page, limit, total) };
  },

  findById: (id) => prisma.document.findFirst({ where: { id, ...softDeleteWhere } }),
  create: (data) => prisma.document.create({ data }),
  update: (id, data) => prisma.document.update({ where: { id }, data }),
  softDelete: (id, userId) => prisma.document.update({ where: { id }, data: { deletedAt: new Date(), updatedBy: userId } }),
};

export const DOCUMENT_SORT_FIELDS = ['createdAt', 'name', 'category'];
