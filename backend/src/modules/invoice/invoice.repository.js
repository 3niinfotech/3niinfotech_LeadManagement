import prisma from '../../config/database.js';
import { softDeleteWhere, buildPagination, parsePagination, parseSort } from '../../utils/response.util.js';

const buildSearchWhere = (search) => {
  if (!search) return {};
  return {
    OR: [
      { invoiceNo: { contains: search } },
      { notes: { contains: search } },
    ],
  };
};

export const invoiceRepository = {
  findMany: async ({ search, studentId, status, page, limit, sort }) => {
    const { skip } = parsePagination({ page, limit });
    const where = {
      ...softDeleteWhere,
      ...(studentId && { studentId }),
      ...(status && { status }),
      ...buildSearchWhere(search),
    };

    const [data, total] = await Promise.all([
      prisma.invoice.findMany({
        where,
        skip,
        take: limit,
        orderBy: sort,
        include: { student: { select: { id: true, studentCode: true, firstName: true, lastName: true } } },
      }),
      prisma.invoice.count({ where }),
    ]);

    return { data, pagination: buildPagination(page, limit, total) };
  },

  findById: (id) => prisma.invoice.findFirst({
    where: { id, ...softDeleteWhere },
    include: { student: { select: { id: true, studentCode: true, firstName: true, lastName: true } } },
  }),

  create: (data) => prisma.invoice.create({ data }),
  update: (id, data) => prisma.invoice.update({ where: { id }, data }),
  softDelete: (id, userId) => prisma.invoice.update({ where: { id }, data: { deletedAt: new Date(), updatedBy: userId } }),
};

export const INVOICE_SORT_FIELDS = ['createdAt', 'status', 'invoiceNo', 'total'];
