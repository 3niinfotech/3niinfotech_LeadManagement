import prisma from '../../config/database.js';
import { softDeleteWhere } from '../../utils/response.util.js';
import { RECEPTION_ASSIGN_ROLE_SLUGS } from '../assignment/assignment.config.js';

const counsellorSelect = {
  id: true,
  firstName: true,
  lastName: true,
  email: true,
  branch: { select: { id: true, name: true, code: true } },
};

const userInclude = {
  role: { select: { id: true, name: true, slug: true, permissions: true } },
  company: { select: { id: true, name: true, code: true } },
  branch: { select: { id: true, name: true, code: true } },
};

const workloadSelect = {
  _count: {
    select: {
      assignedEnquiries: { where: { deletedAt: null } },
      assignedLeads: { where: { deletedAt: null } },
      assignedStudents: { where: { deletedAt: null } },
    },
  },
};

export const userRepository = {
  findMany: async ({ skip, limit, search, roleSlug, branchId, status, companyId }) => {
    const where = {
      ...softDeleteWhere,
      ...(companyId ? { companyId } : {}),
      ...(branchId ? { branchId } : {}),
      ...(status ? { status } : {}),
      ...(roleSlug ? { role: { slug: roleSlug } } : {}),
      ...(search
        ? {
            OR: [
              { firstName: { contains: search } },
              { lastName: { contains: search } },
              { email: { contains: search } },
            ],
          }
        : {}),
    };

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ role: { name: 'asc' } }, { firstName: 'asc' }],
        include: { ...userInclude, ...workloadSelect },
      }),
      prisma.user.count({ where }),
    ]);

    return { users, total };
  },

  findById: async (id) =>
    prisma.user.findFirst({
      where: { id, ...softDeleteWhere },
      include: { ...userInclude, ...workloadSelect },
    }),

  findRoles: async () =>
    prisma.role.findMany({
      orderBy: { name: 'asc' },
      select: { id: true, name: true, slug: true, description: true, isSystem: true },
    }),

  getTeamSummary: async (companyId) => {
    const roles = await prisma.role.findMany({
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true,
        slug: true,
        _count: {
          select: {
            users: { where: { ...softDeleteWhere, status: 'ACTIVE', ...(companyId ? { companyId } : {}) } },
          },
        },
      },
    });

    const [enquiries, leads, students, unassignedEnquiries] = await Promise.all([
      prisma.enquiry.count({ where: { deletedAt: null, ...(companyId ? { branch: { companyId } } : {}) } }),
      prisma.lead.count({ where: { deletedAt: null, ...(companyId ? { branch: { companyId } } : {}) } }),
      prisma.student.count({ where: { deletedAt: null, ...(companyId ? { branch: { companyId } } : {}) } }),
      prisma.enquiry.count({ where: { deletedAt: null, assignedToId: null, ...(companyId ? { branch: { companyId } } : {}) } }),
    ]);

    return { roles, totals: { enquiries, leads, students, unassignedEnquiries } };
  },

  /** Active users with counsellor-eligible roles — tenant + optional branch scope */
  listCounsellors: ({ branchId, companyId } = {}) =>
    prisma.user.findMany({
      where: {
        status: 'ACTIVE',
        deletedAt: null,
        ...(companyId ? { companyId } : {}),
        ...(branchId ? { branchId } : {}),
        role: { slug: { in: RECEPTION_ASSIGN_ROLE_SLUGS } },
      },
      select: counsellorSelect,
      orderBy: { firstName: 'asc' },
    }),

  findByEmail: (email, excludeId = null) =>
    prisma.user.findFirst({
      where: {
        email,
        ...softDeleteWhere,
        ...(excludeId ? { NOT: { id: excludeId } } : {}),
      },
    }),

  create: (data) =>
    prisma.user.create({
      data,
      include: { ...userInclude, ...workloadSelect },
    }),

  update: (id, data) =>
    prisma.user.update({
      where: { id },
      data,
      include: { ...userInclude, ...workloadSelect },
    }),
};
