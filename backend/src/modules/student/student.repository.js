import prisma from '../../config/database.js';
import { softDeleteWhere, buildPagination, parsePagination, parseSort } from '../../utils/response.util.js';

const buildSearchWhere = (search, fields) => {
  if (!search) return {};
  return {
    OR: fields.map((field) => ({ [field]: { contains: search } })),
  };
};

export const studentRepository = {
  findMany: async ({ search, status, assignedToId, page, limit, sort, scopeWhere = {} }) => {
    const { skip } = parsePagination({ page, limit });
    const where = {
      ...softDeleteWhere,
      ...scopeWhere,
      ...(status && { status }),
      ...(assignedToId && { assignedToId }),
      ...buildSearchWhere(search, ['firstName', 'lastName', 'email', 'studentCode', 'phone']),
    };

    const [data, total] = await Promise.all([
      prisma.student.findMany({
        where,
        skip,
        take: limit,
        orderBy: sort,
        include: {
          branch: { select: { id: true, name: true } },
          assignedTo: { select: { id: true, firstName: true, lastName: true } },
          partner: { select: { id: true, name: true } },
        },
      }),
      prisma.student.count({ where }),
    ]);

    return { data, pagination: buildPagination(page, limit, total) };
  },

  findById: (id) =>
    prisma.student.findFirst({
      where: { id, ...softDeleteWhere },
      include: {
        branch: true,
        assignedTo: { select: { id: true, firstName: true, lastName: true, email: true } },
        partner: true,
        applications: { where: softDeleteWhere },
        visas: { where: softDeleteWhere },
        documents: { where: softDeleteWhere },
        notes: { where: softDeleteWhere, include: { user: { select: { id: true, firstName: true, lastName: true } } }, orderBy: { createdAt: 'desc' } },
        activities: { orderBy: { createdAt: 'desc' }, take: 50 },
      },
    }),

  create: (data) => prisma.student.create({ data }),

  update: (id, data) => prisma.student.update({ where: { id }, data }),

  softDelete: (id, userId) =>
    prisma.student.update({
      where: { id },
      data: { deletedAt: new Date(), updatedBy: userId },
    }),

  bulkSoftDelete: (ids, userId, scopeWhere = {}) =>
    prisma.student.updateMany({
      where: { id: { in: ids }, ...softDeleteWhere, ...scopeWhere },
      data: { deletedAt: new Date(), updatedBy: userId },
    }),

  bulkAssign: (ids, assignedToId, userId, scopeWhere = {}) =>
    prisma.student.updateMany({
      where: { id: { in: ids }, ...softDeleteWhere, ...scopeWhere },
      data: { assignedToId, updatedBy: userId },
    }),

  generateCode: async (companyId) => {
    const company = companyId
      ? await prisma.company.findUnique({ where: { id: companyId }, select: { code: true } })
      : null;
    const coPrefix = (company?.code || 'CO').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6);
    const count = await prisma.student.count({
      where: companyId ? { branch: { companyId } } : undefined,
    });
    return `${coPrefix}-STU${String(count + 1).padStart(6, '0')}`;
  },
};

export const STUDENT_SORT_FIELDS = ['createdAt', 'firstName', 'lastName', 'status', 'studentCode'];
