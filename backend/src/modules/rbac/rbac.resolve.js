import prisma from '../../config/database.js';
import { sanitizePermissionKeysForRole } from '../../config/access-policy.js';
import { mergeUserPermissions } from './rbac.util.js';

const roleAccessInclude = {
  role: {
    include: {
      rolePermissions: { where: { granted: true }, include: { permission: true } },
    },
  },
  permissionOverrides: { include: { permission: true } },
};

async function resolveLegacyAccess(userId) {
  const user = await prisma.user.findFirst({
    where: { id: userId, deletedAt: null },
    include: { role: true },
  });
  if (!user?.role) return null;

  const legacyJson = Array.isArray(user.role.permissions) ? user.role.permissions : [];
  return {
    permissions: sanitizePermissionKeysForRole(user.role.slug, mergeUserPermissions([], legacyJson, [])),
    dataScope: user.role.dataScope || 'OWN',
    role: user.role,
  };
}

/** Resolve effective permissions + data scope for a user from DB */
export async function resolveUserAccess(userId) {
  try {
    const user = await prisma.user.findFirst({
      where: { id: userId, deletedAt: null },
      include: roleAccessInclude,
    });

    if (!user?.role) return null;

    const legacyJson = Array.isArray(user.role.permissions) ? user.role.permissions : [];
    const permissions = sanitizePermissionKeysForRole(
      user.role.slug,
      mergeUserPermissions(
        user.role.rolePermissions || [],
        legacyJson,
        user.permissionOverrides || [],
      ),
    );

    return {
      permissions,
      dataScope: user.role.dataScope || 'OWN',
      role: user.role,
    };
  } catch (err) {
    const isSchemaMismatch =
      err?.name === 'PrismaClientValidationError'
      || err?.code === 'P2021'
      || err?.code === 'P2022';

    if (isSchemaMismatch) {
      console.warn('[RBAC] Falling back to legacy role permissions — run: npx prisma db push && npx prisma generate');
      return resolveLegacyAccess(userId);
    }
    throw err;
  }
}

export async function attachAccessToUser(user) {
  const access = await resolveUserAccess(user.id);
  if (!access) return user;

  return {
    ...user,
    role: {
      ...user.role,
      permissions: access.permissions,
      dataScope: access.dataScope,
    },
    dataScope: access.dataScope,
    permissions: access.permissions,
  };
}
