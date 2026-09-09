import prisma from '../../config/database.js';
import { softDeleteWhere, buildPagination, parsePagination, parseSort } from '../../utils/response.util.js';
import { attachStudentPhotoUrl } from '../../utils/studentPhoto.util.js';

const buildSearchWhere = (search, fields) => {
  if (!search) return {};
  return {
    OR: fields.map((field) => ({ [field]: { contains: search } })),
  };
};

export const studentRepository = {
  findMany: async ({
    search,
    status,
    statusIn,
    country,
    course,
    branchId,
    assignedToId,
    ids,
    createdFrom,
    createdTo,
    page = 1,
    limit = 25,
    sort = { createdAt: 'desc' },
    scopeWhere = {},
  }) => {
    const { skip } = parsePagination({ page, limit });
    const where = {
      ...softDeleteWhere,
      ...scopeWhere,
    };

    if (Array.isArray(ids) && ids.length) {
      where.id = { in: ids };
    }

    if (statusIn) {
      const values = String(statusIn).split(',').map((s) => s.trim()).filter(Boolean);
      if (values.length) where.status = { in: values };
    } else if (status) {
      where.status = status;
    }

    if (country) where.country = { contains: country };
    if (course) where.course = { contains: course };
    if (branchId) where.branchId = branchId;
    if (assignedToId) where.assignedToId = assignedToId;

    if (createdFrom || createdTo) {
      where.createdAt = {};
      if (createdFrom) where.createdAt.gte = new Date(createdFrom);
      if (createdTo) {
        const toD = new Date(createdTo);
        toD.setHours(23, 59, 59, 999);
        where.createdAt.lte = toD;
      }
    }

    if (search) {
      const s = String(search).trim();
      where.OR = [
        { firstName: { contains: s } },
        { lastName: { contains: s } },
        { email: { contains: s } },
        { studentCode: { contains: s } },
        { phone: { contains: s } },
        { country: { contains: s } },
        { course: { contains: s } },
      ];
    }

    const [data, total] = await Promise.all([
      prisma.student.findMany({
        where,
        skip,
        take: limit,
        orderBy: sort,
        include: {
          branch: { select: { id: true, name: true, code: true } },
          assignedTo: { select: { id: true, firstName: true, lastName: true, email: true } },
          partner: { select: { id: true, name: true } },
          documents: {
            where: { ...softDeleteWhere, category: 'PHOTO' },
            orderBy: { createdAt: 'desc' },
            take: 1,
            select: {
              id: true,
              filePath: true,
              mimeType: true,
              fileName: true,
            },
          },
          enquiry: {
            select: {
              id: true,
              metadata: true,
              documents: {
                where: { category: 'PHOTO' },
                orderBy: { createdAt: 'desc' },
                take: 1,
                select: {
                  id: true,
                  filePath: true,
                  mimeType: true,
                  fileName: true,
                },
              },
            },
          },
          _count: {
            select: {
              applications: { where: softDeleteWhere },
              visas: { where: softDeleteWhere },
              documents: { where: softDeleteWhere },
              invoices: { where: softDeleteWhere },
            },
          },
        },
      }),
      prisma.student.count({ where }),
    ]);

    const rows = data.map((row) => {
      const withPhoto = attachStudentPhotoUrl(row);
      const { documents, enquiry, ...rest } = withPhoto;
      return {
        ...rest,
        photoUrl: withPhoto.photoUrl || null,
        enquiryId: enquiry?.id || null,
      };
    });

    return { data: rows, pagination: buildPagination(page, limit, total) };
  },

  getSummaryCounts: async (scopeWhere = {}) => {
    const where = { ...softDeleteWhere, ...scopeWhere };
    const [total, grouped] = await Promise.all([
      prisma.student.count({ where }),
      prisma.student.groupBy({
        by: ['status'],
        where,
        _count: { _all: true },
      }),
    ]);

    const counts = { total };
    grouped.forEach((g) => {
      counts[g.status] = g._count._all;
    });

    return counts;
  },

  bulkUpdateStatus: (ids, status, userId, scopeWhere = {}) =>
    prisma.student.updateMany({
      where: { id: { in: ids }, ...softDeleteWhere, ...scopeWhere },
      data: { status, updatedBy: userId },
    }),

  findById: (id) =>
    prisma.student.findFirst({
      where: { id, ...softDeleteWhere },
      include: {
        branch: true,
        assignedTo: { select: { id: true, firstName: true, lastName: true, email: true } },
        partner: true,
        applications: { where: softDeleteWhere },
        visas: { where: softDeleteWhere },
        documents: { where: softDeleteWhere, orderBy: { createdAt: 'desc' } },
        notes: { where: softDeleteWhere, include: { user: { select: { id: true, firstName: true, lastName: true } } }, orderBy: { createdAt: 'desc' } },
        activities: { orderBy: { createdAt: 'desc' }, take: 50 },
        enquiry: {
          include: {
            assignedTo: { select: { id: true, firstName: true, lastName: true, email: true } },
            branch: { select: { id: true, name: true } },
            lead: { select: { id: true, leadCode: true, source: true, walkInAt: true, status: true } },
            followups: {
              orderBy: { followupAt: 'desc' },
              include: { user: { select: { id: true, firstName: true, lastName: true } } },
            },
            demos: {
              orderBy: { demoDate: 'desc' },
              include: {
                user: { select: { id: true, firstName: true, lastName: true } },
                faculty: { select: { id: true, name: true } },
              },
            },
            documents: { orderBy: { createdAt: 'desc' } },
            notes: {
              orderBy: [{ isPinned: 'desc' }, { createdAt: 'desc' }],
              include: { user: { select: { id: true, firstName: true, lastName: true } } },
            },
            communications: {
              orderBy: { sentAt: 'desc' },
              take: 30,
              include: { user: { select: { id: true, firstName: true, lastName: true } } },
            },
            auditLogs: {
              orderBy: { createdAt: 'desc' },
              take: 30,
              include: { user: { select: { id: true, firstName: true, lastName: true } } },
            },
          },
        },
        lead: { select: { id: true, leadCode: true, source: true, walkInAt: true, status: true } },
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
