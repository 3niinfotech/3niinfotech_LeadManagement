/**
 * Sync sidebar menu_items from MENU_SEED without touching users/enquiries.
 * Usage: node scripts/sync-menu.js
 */
import { PrismaClient } from '@prisma/client';
import { seedRbac } from '../prisma/seed-rbac.js';

const prisma = new PrismaClient();

async function main() {
  await seedRbac(prisma);
  console.log('Menu + RBAC permissions synced. Refresh the app (Ctrl+Shift+R).');
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
