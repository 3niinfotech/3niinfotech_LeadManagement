import { PERMISSION_REGISTRY } from '../src/config/permission-registry.js';
import { DEFAULT_ROLES } from '../src/config/default-roles.js';
import { MENU_SEED } from '../src/config/menu-seed.js';
import { featureRepository } from '../src/modules/feature/feature.repository.js';

export async function seedRbac(prisma) {
  console.log('RBAC: seeding permissions...');
  for (const perm of PERMISSION_REGISTRY) {
    await prisma.permission.upsert({
      where: { key: perm.key },
      update: {
        module: perm.module,
        action: perm.action,
        name: perm.name,
        groupName: perm.groupName,
        isActive: true,
      },
      create: perm,
    });
  }

  const allPerms = await prisma.permission.findMany();
  const permByKey = Object.fromEntries(allPerms.map((p) => [p.key, p.id]));

  console.log('RBAC: seeding default roles...');
  const roleIdBySlug = {};

  for (const roleDef of DEFAULT_ROLES) {
    const { permissions, parentSlug, ...roleData } = roleDef;
    const role = await prisma.role.upsert({
      where: { slug: roleDef.slug },
      update: {
        name: roleData.name,
        description: roleData.description || null,
        dataScope: roleData.dataScope,
        hierarchyLevel: roleData.hierarchyLevel,
        isSystem: roleData.isSystem ?? false,
        isCustom: roleData.isCustom ?? false,
        isActive: true,
        permissions: permissions,
      },
      create: {
        ...roleData,
        description: roleData.description || null,
        permissions: permissions,
        isActive: true,
      },
    });
    roleIdBySlug[role.slug] = role.id;

    await prisma.rolePermission.deleteMany({ where: { roleId: role.id } });
    const permIds = permissions
      .map((k) => permByKey[k])
      .filter(Boolean)
      .map((permissionId) => ({ roleId: role.id, permissionId, granted: true }));

    if (permIds.length) {
      await prisma.rolePermission.createMany({ data: permIds, skipDuplicates: true });
    }
  }

  for (const roleDef of DEFAULT_ROLES) {
    if (!roleDef.parentSlug) continue;
    const roleId = roleIdBySlug[roleDef.slug];
    const parentId = roleIdBySlug[roleDef.parentSlug];
    if (roleId && parentId) {
      await prisma.role.update({
        where: { id: roleId },
        data: { parentRoleId: parentId },
      });
    }
  }

  console.log('RBAC: seeding menu items...');
  await prisma.menuItem.deleteMany({});

  async function seedMenuItems(items, parentId = null) {
    for (const item of items) {
      const created = await prisma.menuItem.create({
        data: {
          name: item.name,
          icon: item.icon || null,
          route: item.route || null,
          permissionKey: item.permissionKey || null,
          parentId,
          displayOrder: item.displayOrder ?? 0,
          isActive: true,
        },
      });
      if (item.children?.length) {
        await seedMenuItems(item.children, created.id);
      }
    }
  }

  await seedMenuItems(MENU_SEED);
  console.log('Features: syncing catalog...');
  await featureRepository.upsertCatalog();
  console.log(`RBAC: ${allPerms.length} permissions, ${DEFAULT_ROLES.length} roles, menus seeded.`);
}
