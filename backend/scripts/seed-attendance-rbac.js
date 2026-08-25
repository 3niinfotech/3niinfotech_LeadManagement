/**
 * Additive RBAC grant for attendance permissions.
 * Does NOT delete existing role permissions.
 * Usage: node scripts/seed-attendance-rbac.js
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const PERMS = [
  { key: 'attendance.view', action: 'view', name: 'View Attendance' },
  { key: 'attendance.mark', action: 'mark', name: 'Mark Attendance' },
  { key: 'attendance.edit', action: 'edit', name: 'Edit Attendance' },
  { key: 'attendance.correct', action: 'correct', name: 'Correct Locked Attendance' },
  { key: 'attendance.report', action: 'report', name: 'Attendance Reports' },
];

const GRANTS = {
  super_admin: PERMS.map((p) => p.key),
  company_admin: PERMS.map((p) => p.key),
  operational_head: PERMS.map((p) => p.key),
  branch_manager: PERMS.map((p) => p.key),
  team_leader: ['attendance.view', 'attendance.mark', 'attendance.edit', 'attendance.report'],
  counsellor: ['attendance.view', 'attendance.mark'],
};

async function main() {
  const created = [];
  for (const perm of PERMS) {
    const row = await prisma.permission.upsert({
      where: { key: perm.key },
      update: { module: 'attendance', action: perm.action, name: perm.name, groupName: 'Attendance', isActive: true },
      create: { key: perm.key, module: 'attendance', action: perm.action, name: perm.name, groupName: 'Attendance' },
    });
    created.push(row);
  }
  const byKey = Object.fromEntries(created.map((p) => [p.key, p]));

  for (const [slug, keys] of Object.entries(GRANTS)) {
    const role = await prisma.role.findUnique({ where: { slug } });
    if (!role) continue;
    for (const key of keys) {
      const perm = byKey[key];
      if (!perm) continue;
      await prisma.rolePermission.upsert({
        where: { roleId_permissionId: { roleId: role.id, permissionId: perm.id } },
        update: { granted: true },
        create: { roleId: role.id, permissionId: perm.id, granted: true },
      });
    }
    console.log(`Granted attendance perms to ${slug}`);
  }
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
