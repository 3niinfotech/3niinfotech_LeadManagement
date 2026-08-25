import prisma from '../../config/database.js';
import { softDeleteWhere, buildPagination, parsePagination, parseSort } from '../../utils/response.util.js';

export const leadRepository = {
  findMany: async ({ search, status, branchId, assignedToId, page, limit, sort, scopeWhere }) => {
    const { skip } = parsePagination({ page, limit });
    const where = {
      ...softDeleteWhere,
      ...(scopeWhere || {}),
      ...(branchId && { branchId }),
      ...(status && { status }),
      ...(assignedToId && { assignedToId }),
      ...(search && {
        OR: [
          { firstName: { contains: search } },
          { lastName: { contains: search } },
          { email: { contains: search } },
          { phone: { contains: search } },
        ],
      }),
    };

    const [data, total] = await Promise.all([
      prisma.lead.findMany({
        where, skip, take: limit, orderBy: sort,
        include: {
          branch: { select: { id: true, name: true } },
          assignedTo: { select: { id: true, firstName: true, lastName: true } },
        },
      }),
      prisma.lead.count({ where }),
    ]);

    return { data, pagination: buildPagination(page, limit, total) };
  },

  findById: (id) =>
    prisma.lead.findFirst({
      where: { id, ...softDeleteWhere },
      include: {
        branch: true,
        assignedTo: { select: { id: true, firstName: true, lastName: true, email: true } },
        activities: { orderBy: { createdAt: 'desc' }, take: 50 },
      },
    }),

  create: (data) => prisma.lead.create({ data }),
  update: (id, data) => prisma.lead.update({ where: { id }, data }),
  softDelete: (id, userId) =>
    prisma.lead.update({ where: { id }, data: { deletedAt: new Date(), updatedBy: userId } }),
};

export const LEAD_SORT_FIELDS = ['createdAt', 'firstName', 'lastName', 'status', 'followUpAt'];
