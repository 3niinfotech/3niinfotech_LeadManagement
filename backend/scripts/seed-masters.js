/**
 * Seed / refresh master lookup data for all companies (or MAIN).
 * Safe to re-run — skips existing labels.
 *
 * Usage: node scripts/seed-masters.js
 */
import { PrismaClient } from '@prisma/client';
import { masterService } from '../src/modules/master/master.service.js';
import { MASTER_DEFAULTS } from '../src/config/master-defaults.config.js';

const prisma = new PrismaClient();

async function main() {
  const companies = await prisma.company.findMany({
    where: { deletedAt: null },
    select: { id: true, code: true, name: true },
  });

  if (!companies.length) {
    console.error('No company found. Run: npm run db:seed');
    process.exit(1);
  }

  const admin = await prisma.user.findFirst({
    where: { email: 'admin@crm.com', deletedAt: null },
    select: { id: true },
  });

  const userId = admin?.id || null;
  const categoryCount = Object.keys(MASTER_DEFAULTS).length;
  let grandTotal = 0;

  console.log(`Seeding ${categoryCount} master categories for ${companies.length} company(ies)...\n`);

  for (const company of companies) {
    const created = await masterService.seedCompanyDefaults(company.id, userId);
    grandTotal += created;

    const byCategory = await prisma.masterItem.groupBy({
      by: ['category'],
      where: { companyId: company.id, deletedAt: null, isActive: true },
      _count: { _all: true },
    });

    console.log(`[${company.code}] ${company.name}`);
    console.log(`  Newly created this run: ${created}`);
    console.log(`  Categories in DB: ${byCategory.length}`);
    byCategory
      .sort((a, b) => a.category.localeCompare(b.category))
      .forEach((row) => {
        console.log(`    • ${row.category}: ${row._count._all}`);
      });
    console.log('');
  }

  console.log(`Done. Total new master items: ${grandTotal}`);
  console.log('Re-open Enquiry / Masters screens to use the data.');
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
