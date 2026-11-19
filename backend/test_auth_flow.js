import prisma from './src/config/database.js';
import { extractToken, verifyAccessToken } from './src/utils/jwt.util.js';
import { resolveUserAccess } from './src/modules/rbac/rbac.resolve.js';
import { hasAnyPermission } from './src/modules/rbac/rbac.util.js';
import { PERMISSIONS } from './src/config/permissions.js';

async function main() {
  const user = await prisma.user.findFirst({
    where: { email: { contains: 'counsel' } },
    include: { role: true, company: true, branch: true }
  });

  const access = await resolveUserAccess(user.id);
  const legacyPerms = Array.isArray(user.role?.permissions) ? user.role.permissions : [];
  const permissions = access?.permissions?.length ? access.permissions : legacyPerms;
  
  console.log('User ID:', user.id);
  console.log('Resolved permissions:', permissions);
  console.log('Testing hasAnyPermission(permissions, [PERMISSIONS.ENQUIRIES_VIEW]):');
  console.log('Result:', hasAnyPermission(permissions, [PERMISSIONS.ENQUIRIES_VIEW]));
  console.log('PERMISSIONS.ENQUIRIES_VIEW:', PERMISSIONS.ENQUIRIES_VIEW);
}

main().finally(() => prisma.$disconnect());
