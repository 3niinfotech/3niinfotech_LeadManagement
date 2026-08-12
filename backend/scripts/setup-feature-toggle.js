/**
 * Migrates legacy feature_flags table to Feature Toggle schema.
 * Run: node scripts/setup-feature-toggle.js
 */
import { PrismaClient } from '@prisma/client';
import { featureRepository } from '../src/modules/feature/feature.repository.js';

const prisma = new PrismaClient();

async function main() {
  console.log('Feature Toggle: clearing legacy feature_flags rows...');
  await prisma.$executeRawUnsafe('DELETE FROM feature_flags');

  const columns = await prisma.$queryRawUnsafe(`
    SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'feature_flags'
  `);
  const names = new Set(columns.map((c) => c.COLUMN_NAME));

  if (names.has('isEnabled')) {
    await prisma.$executeRawUnsafe('ALTER TABLE feature_flags DROP COLUMN isEnabled');
  }
  if (names.has('metadata')) {
    await prisma.$executeRawUnsafe('ALTER TABLE feature_flags DROP COLUMN metadata');
  }

  console.log('Feature Toggle: run prisma db push next, then seed catalog.');
  await featureRepository.upsertCatalog().catch(() => {
    console.log('Catalog sync skipped — run after prisma db push.');
  });

  const companies = await prisma.company.findMany({ select: { id: true } });
  for (const c of companies) {
    await featureRepository.seedCompanyDefaults(c.id).catch(() => {});
  }

  console.log('Done.');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
