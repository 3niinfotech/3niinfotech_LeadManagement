import { PrismaClient } from '@prisma/client';
import { resolveUserAccess } from '../src/modules/rbac/rbac.resolve.js';

const p = new PrismaClient();
const u = await p.user.findFirst({ where: { email: 'admin@crm.com' } });
const a = await resolveUserAccess(u.id);
console.log(
  JSON.stringify(
    {
      slug: a.role?.slug,
      masters: a.permissions.filter((x) => String(x).includes('master')),
      masterItem: await p.masterItem.count({ where: { deletedAt: null } }),
    },
    null,
    2,
  ),
);
await p.$disconnect();
