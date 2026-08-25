/**
 * RBAC workspace seed. Most roles are additive; closed roles revoke keys outside their allowlist.
 * Usage: node scripts/seed-role-workspace-rbac.js
 */
import { PrismaClient } from '@prisma/client';
import { DEFAULT_ROLES } from '../src/config/default-roles.js';

const prisma = new PrismaClient();

async function upsertPermission(key) {
  const [moduleName, action] = String(key).split('.');
  return prisma.permission.upsert({
    where: { key },
    update: { isActive: true },
    create: {
      key,
      module: moduleName || 'general',
      action: action || 'view',
      name: key,
      groupName: moduleName || 'General',
    },
  });
}

async function grantKeys(role, keys, permByKey) {
  for (const key of keys) {
    const perm = permByKey[key];
    if (!perm) continue;
    await prisma.rolePermission.upsert({
      where: { roleId_permissionId: { roleId: role.id, permissionId: perm.id } },
      update: { granted: true },
      create: { roleId: role.id, permissionId: perm.id, granted: true },
    });
  }
}

async function revokeKeys(role, keys, permByKey) {
  for (const key of keys) {
    const perm = permByKey[key];
    if (!perm) continue;
    await prisma.rolePermission.updateMany({
      where: { roleId: role.id, permissionId: perm.id },
      data: { granted: false },
    });
  }
}

async function main() {
  const allKeys = [...new Set(DEFAULT_ROLES.flatMap((r) => r.permissions || []))];
  const permByKey = {};
  for (const key of allKeys) {
    permByKey[key] = await upsertPermission(key);
  }

  const parentBySlug = {};
  for (const def of DEFAULT_ROLES) {
    const role = await prisma.role.upsert({
      where: { slug: def.slug },
      update: {
        name: def.name,
        description: def.description || null,
        dataScope: def.dataScope,
        hierarchyLevel: def.hierarchyLevel,
        isSystem: def.isSystem ?? false,
        isCustom: def.isCustom ?? false,
        isActive: true,
      },
      create: {
        name: def.name,
        slug: def.slug,
        description: def.description || null,
        dataScope: def.dataScope,
        hierarchyLevel: def.hierarchyLevel,
        isSystem: def.isSystem ?? true,
        isCustom: def.isCustom ?? false,
        permissions: def.permissions,
        isActive: true,
      },
    });
    parentBySlug[def.slug] = { id: role.id, parentSlug: def.parentSlug };
    await grantKeys(role, def.permissions || [], permByKey);
    if (def.slug === 'counsellor') {
      const receptionKeys = Object.keys(permByKey).filter((k) => k.startsWith('reception.'));
      await revokeKeys(role, receptionKeys, permByKey);
      await prisma.role.update({
        where: { id: role.id },
        data: { permissions: def.permissions },
      });
    }
    if (def.slug === 'receptionist') {
      const allowed = new Set(def.permissions || []);
      const extraKeys = Object.keys(permByKey).filter((key) => !allowed.has(key));
      await revokeKeys(role, extraKeys, permByKey);
      await prisma.role.update({
        where: { id: role.id },
        data: { permissions: def.permissions },
      });
    }
    console.log(`Workspace grants ready for ${def.slug} (${(def.permissions || []).length} keys)`);
  }

  for (const def of DEFAULT_ROLES) {
    if (!def.parentSlug) continue;
    const roleId = parentBySlug[def.slug]?.id;
    const parentId = parentBySlug[def.parentSlug]?.id;
    if (roleId && parentId) {
      await prisma.role.update({ where: { id: roleId }, data: { parentRoleId: parentId } });
    }
  }
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
