/**
 * Ensure masters.view / masters.manage exist and are granted to super_admin + company_admin.
 */
import { PrismaClient } from '@prisma/client';
import { PERMISSION_REGISTRY } from '../src/config/permission-registry.js';

const prisma = new PrismaClient();

async function main() {
  const masterPerms = PERMISSION_REGISTRY.filter((p) => p.key.startsWith('masters.'));
  for (const perm of masterPerms) {
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

  const perms = await prisma.permission.findMany({
    where: { key: { in: ['masters.view', 'masters.manage'] } },
  });
  const roles = await prisma.role.findMany({
    where: { slug: { in: ['super_admin', 'company_admin', 'admin'] }, deletedAt: null },
  });

  for (const role of roles) {
    for (const perm of perms) {
      await prisma.rolePermission.upsert({
        where: { roleId_permissionId: { roleId: role.id, permissionId: perm.id } },
        update: { granted: true },
        create: { roleId: role.id, permissionId: perm.id, granted: true },
      });
    }
  }

  console.log(`Upserted ${masterPerms.length} master permissions; granted to ${roles.length} admin role(s).`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
