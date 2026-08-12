/**
 * Sync feature catalog + company defaults (non-destructive).
 * Run: node scripts/sync-features.js
 */
import { PrismaClient } from '@prisma/client';
import { featureRepository } from '../src/modules/feature/feature.repository.js';

const prisma = new PrismaClient();

async function main() {
  console.log('Syncing feature catalog...');
  await featureRepository.upsertCatalog();

  const companies = await prisma.company.findMany({ select: { id: true } });
  for (const c of companies) {
    await featureRepository.seedCompanyDefaults(c.id);
    console.log(`  Company ${c.id}: defaults seeded`);
  }

  console.log('Feature sync complete.');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
