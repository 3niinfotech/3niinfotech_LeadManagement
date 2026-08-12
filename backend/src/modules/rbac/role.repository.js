import prisma from '../../config/database.js';
import { softDeleteWhere } from '../../utils/response.util.js';

const roleInclude = {
  rolePermissions: { include: { permission: true } },
  parentRole: { select: { id: true, name: true, slug: true } },
  _count: { select: { users: true, childRoles: true } },
};

export const roleRepository = {
  findMany: async ({ skip, limit, search, isActive, isSystem, isCustom, companyId }) => {
    const where = {
      ...softDeleteWhere,
      ...(companyId !== undefined ? { companyId } : {}),
      ...(isActive !== undefined ? { isActive } : {}),
      ...(isSystem !== undefined ? { isSystem } : {}),
      ...(isCustom !== undefined ? { isCustom } : {}),
      ...(search
        ? {
            OR: [
              { name: { contains: search } },
              { slug: { contains: search } },
              { description: { contains: search } },
            ],
          }
        : {}),
    };

    const [roles, total] = await Promise.all([
      prisma.role.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ hierarchyLevel: 'asc' }, { name: 'asc' }],
        include: roleInclude,
      }),
      prisma.role.count({ where }),
    ]);

    return { roles, total };
  },

  findById: async (id) =>
    prisma.role.findFirst({
      where: { id, ...softDeleteWhere },
      include: {
        ...roleInclude,
        users: {
          where: softDeleteWhere,
          select: {
            id: true, firstName: true, lastName: true, email: true, status: true,
            branch: { select: { name: true } },
          },
        },
        activityLogs: {
          orderBy: { createdAt: 'desc' },
          take: 50,
          include: { user: { select: { firstName: true, lastName: true, email: true } } },
        },
      },
    }),

  findBySlug: async (slug) =>
    prisma.role.findFirst({ where: { slug, ...softDeleteWhere } }),

  create: async (data, permissionIds = []) =>
    prisma.$transaction(async (tx) => {
      const role = await tx.role.create({ data });
      if (permissionIds.length) {
        await tx.rolePermission.createMany({
          data: permissionIds.map((permissionId) => ({ roleId: role.id, permissionId, granted: true })),
        });
      }
      return tx.role.findUnique({ where: { id: role.id }, include: roleInclude });
    }),

  update: async (id, data, permissionIds = null) =>
    prisma.$transaction(async (tx) => {
      const role = await tx.role.update({ where: { id }, data });
      if (permissionIds !== null) {
        await tx.rolePermission.deleteMany({ where: { roleId: id } });
        if (permissionIds.length) {
          await tx.rolePermission.createMany({
            data: permissionIds.map((permissionId) => ({ roleId: id, permissionId, granted: true })),
          });
        }
      }
      return tx.role.findUnique({ where: { id }, include: roleInclude });
    }),

  softDelete: async (id, updatedBy) =>
    prisma.role.update({
      where: { id },
      data: { deletedAt: new Date(), isActive: false, updatedBy },
    }),

  setActive: async (id, isActive, updatedBy) =>
    prisma.role.update({ where: { id }, data: { isActive, updatedBy } }),

  logActivity: async (data) => prisma.roleActivityLog.create({ data }),

  assignUsers: async (roleId, userIds) =>
    prisma.user.updateMany({
      where: { id: { in: userIds }, deletedAt: null },
      data: { roleId },
    }),

  getPermissionIdsByKeys: async (keys) => {
    const perms = await prisma.permission.findMany({
      where: { key: { in: keys }, isActive: true },
      select: { id: true, key: true },
    });
    return perms;
  },

  getAllPermissions: async () =>
    prisma.permission.findMany({
      where: { isActive: true },
      orderBy: [{ groupName: 'asc' }, { module: 'asc' }, { action: 'asc' }],
    }),
};
