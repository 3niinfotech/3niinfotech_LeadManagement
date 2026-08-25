import { z } from 'zod';
import { AppError } from '../../utils/response.util.js';
import { buildPagination, parsePagination } from '../../utils/response.util.js';
import { roleRepository } from './role.repository.js';
import { slugify } from './rbac.util.js';
import { sanitizePermissionKeysForRole } from '../../config/access-policy.js';

const formatRole = (role) => {
  if (!role) return null;
  const permissionKeys = role.rolePermissions
    ?.filter((rp) => rp.granted)
    .map((rp) => rp.permission?.key)
    .filter(Boolean) || [];

  return {
    id: role.id,
    name: role.name,
    slug: role.slug,
    description: role.description,
    dataScope: role.dataScope,
    hierarchyLevel: role.hierarchyLevel,
    isSystem: role.isSystem,
    isCustom: role.isCustom,
    isActive: role.isActive,
    companyId: role.companyId,
    parentRole: role.parentRole || null,
    parentRoleId: role.parentRoleId,
    permissions: permissionKeys,
    userCount: role._count?.users ?? role.users?.length ?? 0,
    childRoleCount: role._count?.childRoles ?? 0,
    users: role.users,
    activityLogs: role.activityLogs,
    createdAt: role.createdAt,
    updatedAt: role.updatedAt,
  };
};

const getAuditMeta = (req) => ({
  userId: req.user?.id,
  ipAddress: req.ip || req.headers['x-forwarded-for'] || null,
  userAgent: req.headers['user-agent'] || null,
});

const resolvePermissionIds = async (keys = []) => {
  if (!keys.length) return [];
  const perms = await roleRepository.getPermissionIdsByKeys(keys);
  const found = new Set(perms.map((p) => p.key));
  const missing = keys.filter((k) => !found.has(k));
  if (missing.length) throw new AppError(`Unknown permissions: ${missing.join(', ')}`, 400);
  return perms.map((p) => p.id);
};

export const roleService = {
  list: async (query, user) => {
    const { page, limit, skip } = parsePagination(query);
    const isActive = query.isActive === 'true' ? true : query.isActive === 'false' ? false : undefined;
    const isSystem = query.isSystem === 'true' ? true : query.isSystem === 'false' ? false : undefined;
    const isCustom = query.isCustom === 'true' ? true : query.isCustom === 'false' ? false : undefined;

    const companyId = user.dataScope === 'GLOBAL' ? undefined : user.companyId;

    const { roles, total } = await roleRepository.findMany({
      skip,
      limit,
      search: query.search,
      isActive,
      isSystem,
      isCustom,
      companyId,
    });

    return {
      data: roles.map(formatRole),
      pagination: buildPagination(page, limit, total),
    };
  },

  getById: async (id) => {
    const role = await roleRepository.findById(id);
    if (!role) throw new AppError('Role not found', 404);
    return formatRole(role);
  },

  create: async (body, req) => {
    const data = createRoleSchema.parse(body);
    const slug = data.slug || slugify(data.name);

    const existing = await roleRepository.findBySlug(slug);
    if (existing) throw new AppError('Role slug already exists', 409);

    const safeKeys = sanitizePermissionKeysForRole(slug, data.permissionKeys || []);
    const permissionIds = await resolvePermissionIds(safeKeys);

    const role = await roleRepository.create(
      {
        name: data.name,
        slug,
        description: data.description,
        dataScope: data.dataScope,
        parentRoleId: data.parentRoleId || null,
        hierarchyLevel: data.hierarchyLevel ?? 9,
        isSystem: false,
        isCustom: true,
        isActive: data.isActive ?? true,
        companyId: req.user.companyId || null,
        permissions: safeKeys,
        createdBy: req.user.id,
        updatedBy: req.user.id,
      },
      permissionIds,
    );

    await roleRepository.logActivity({
      roleId: role.id,
      ...getAuditMeta(req),
      action: 'CREATE',
      newValue: formatRole(role),
    });

    return formatRole(role);
  },

  update: async (id, body, req) => {
    const data = updateRoleSchema.parse(body);
    const existing = await roleRepository.findById(id);
    if (!existing) throw new AppError('Role not found', 404);

    let permissionIds = null;
    let safeKeys;
    if (data.permissionKeys !== undefined) {
      safeKeys = sanitizePermissionKeysForRole(existing.slug, data.permissionKeys);
      permissionIds = await resolvePermissionIds(safeKeys);
    }

    const role = await roleRepository.update(
      id,
      {
        ...(data.name !== undefined ? { name: data.name } : {}),
        ...(data.description !== undefined ? { description: data.description } : {}),
        ...(data.dataScope !== undefined ? { dataScope: data.dataScope } : {}),
        ...(data.parentRoleId !== undefined ? { parentRoleId: data.parentRoleId } : {}),
        ...(data.hierarchyLevel !== undefined ? { hierarchyLevel: data.hierarchyLevel } : {}),
        ...(data.isActive !== undefined ? { isActive: data.isActive } : {}),
        ...(safeKeys !== undefined ? { permissions: safeKeys } : {}),
        updatedBy: req.user.id,
      },
      permissionIds,
    );

    await roleRepository.logActivity({
      roleId: id,
      ...getAuditMeta(req),
      action: data.permissionKeys !== undefined ? 'PERMISSION_CHANGE' : 'UPDATE',
      oldValue: formatRole(existing),
      newValue: formatRole(role),
    });

    return formatRole(role);
  },

  remove: async (id, req) => {
    const existing = await roleRepository.findById(id);
    if (!existing) throw new AppError('Role not found', 404);
    if (existing.isSystem && !existing.isCustom) {
      throw new AppError('System roles cannot be deleted', 400);
    }
    if (existing._count?.users > 0) {
      throw new AppError('Cannot delete role with assigned users. Reassign users first.', 400);
    }

    await roleRepository.softDelete(id, req.user.id);
    await roleRepository.logActivity({
      roleId: id,
      ...getAuditMeta(req),
      action: 'DELETE',
      oldValue: formatRole(existing),
    });
    return { id };
  },

  setActive: async (id, isActive, req) => {
    const existing = await roleRepository.findById(id);
    if (!existing) throw new AppError('Role not found', 404);

    await roleRepository.setActive(id, isActive, req.user.id);
    await roleRepository.logActivity({
      roleId: id,
      ...getAuditMeta(req),
      action: 'STATUS_CHANGE',
      oldValue: { isActive: existing.isActive },
      newValue: { isActive },
    });

    return { id, isActive };
  },

  clone: async (id, body, req) => {
    const source = await roleRepository.findById(id);
    if (!source) throw new AppError('Role not found', 404);

    const name = body.name || `${source.name} (Copy)`;
    const slug = body.slug || slugify(`${source.slug}_copy_${Date.now()}`);

    const permissionKeys = source.rolePermissions
      .filter((rp) => rp.granted)
      .map((rp) => rp.permission.key);

    const permissionIds = await resolvePermissionIds(permissionKeys);

    const role = await roleRepository.create(
      {
        name,
        slug,
        description: source.description,
        dataScope: source.dataScope,
        parentRoleId: source.parentRoleId,
        hierarchyLevel: source.hierarchyLevel,
        isSystem: false,
        isCustom: true,
        isActive: true,
        companyId: req.user.companyId || null,
        permissions: permissionKeys,
        createdBy: req.user.id,
        updatedBy: req.user.id,
      },
      permissionIds,
    );

    await roleRepository.logActivity({
      roleId: role.id,
      ...getAuditMeta(req),
      action: 'CLONE',
      oldValue: { sourceRoleId: id, sourceName: source.name },
      newValue: formatRole(role),
    });

    return formatRole(role);
  },

  copyPermissions: async (targetId, sourceId, req) => {
    if (targetId === sourceId) throw new AppError('Cannot copy permissions from the same role', 400);

    const [target, source] = await Promise.all([
      roleRepository.findById(targetId),
      roleRepository.findById(sourceId),
    ]);
    if (!target || !source) throw new AppError('Role not found', 404);

    const permissionKeys = source.rolePermissions
      .filter((rp) => rp.granted)
      .map((rp) => rp.permission.key);

    const permissionIds = await resolvePermissionIds(permissionKeys);
    const role = await roleRepository.update(
      targetId,
      { permissions: permissionKeys, updatedBy: req.user.id },
      permissionIds,
    );

    await roleRepository.logActivity({
      roleId: targetId,
      ...getAuditMeta(req),
      action: 'PERMISSION_CHANGE',
      oldValue: { permissions: formatRole(target).permissions },
      newValue: { permissions: permissionKeys, copiedFrom: sourceId },
    });

    return formatRole(role);
  },

  assignUsers: async (roleId, userIds, req) => {
    const role = await roleRepository.findById(roleId);
    if (!role) throw new AppError('Role not found', 404);
    if (!userIds?.length) throw new AppError('No users specified', 400);

    await roleRepository.assignUsers(roleId, userIds);
    await roleRepository.logActivity({
      roleId,
      ...getAuditMeta(req),
      action: 'ASSIGN_USER',
      newValue: { userIds },
    });

    return { roleId, assignedCount: userIds.length };
  },

  getHistory: async (roleId) => {
    const role = await roleRepository.findById(roleId);
    if (!role) throw new AppError('Role not found', 404);
    return role.activityLogs || [];
  },

  exportRoles: async (query, user) => {
    const { roles } = await roleRepository.findMany({
      skip: 0,
      limit: 500,
      search: query.search,
      companyId: user.dataScope === 'GLOBAL' ? undefined : user.companyId,
    });
    return roles.map(formatRole);
  },

  getPermissions: async () => {
    const permissions = await roleRepository.getAllPermissions();
    const groups = {};
    permissions.forEach((p) => {
      const g = p.groupName || p.module;
      if (!groups[g]) groups[g] = [];
      groups[g].push(p);
    });
    return { permissions, groups };
  },
};

const dataScopeEnum = z.enum(['OWN', 'TEAM', 'BRANCH', 'COMPANY', 'GLOBAL']);

export const createRoleSchema = z.object({
  name: z.string().min(2).max(100),
  slug: z.string().min(2).max(100).optional(),
  description: z.string().max(500).optional().nullable(),
  dataScope: dataScopeEnum.default('OWN'),
  parentRoleId: z.string().uuid().optional().nullable(),
  hierarchyLevel: z.number().int().min(0).max(99).optional(),
  isActive: z.boolean().optional(),
  permissionKeys: z.array(z.string()).optional(),
});

export const updateRoleSchema = createRoleSchema.partial();

export const cloneRoleSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  slug: z.string().min(2).max(100).optional(),
});

export const assignUsersSchema = z.object({
  userIds: z.array(z.string().uuid()).min(1),
});

export const copyPermissionsSchema = z.object({
  sourceRoleId: z.string().uuid(),
});
