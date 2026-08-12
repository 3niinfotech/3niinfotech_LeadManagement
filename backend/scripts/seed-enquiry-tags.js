/**
 * Idempotent seed for enquiry-oriented Tags (MasterItem category: tags).
 * Preserves existing tags; adds missing labels per company; migrates legacy enquiry tag codes.
 *
 * Usage: node scripts/seed-enquiry-tags.js
 */
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import { ENQUIRY_TAG_SEED_LABELS, mapLegacyEnquiryTag } from '../src/config/enquiry-tags.seed.config.js';
import { masterRepository } from '../src/modules/master/master.repository.js';

dotenv.config();
const prisma = new PrismaClient();
const CATEGORY = 'tags';

async function migrateEnquiryTagValues(allowed) {
  const enquiries = await prisma.enquiry.findMany({
    where: { deletedAt: null },
    select: { id: true, tags: true },
  });

  let updated = 0;
  for (const row of enquiries) {
    const current = Array.isArray(row.tags) ? row.tags : [];
    if (!current.length) continue;

    const next = [...new Set(
      current
        .map(mapLegacyEnquiryTag)
        .filter((t) => t && allowed.has(t)),
    )];

    const changed = next.length !== current.length
      || next.some((t, i) => t !== current[i]);

    if (changed) {
      await prisma.enquiry.update({
        where: { id: row.id },
        data: { tags: next },
      });
      updated += 1;
    }
  }
  return updated;
}

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
  const allowed = new Set(ENQUIRY_TAG_SEED_LABELS);

  console.log(`Seeding ${ENQUIRY_TAG_SEED_LABELS.length} enquiry tags for ${companies.length} company(ies)...\n`);

  let totalCreated = 0;

  for (const company of companies) {
    const created = await masterRepository.seedDefaults(
      company.id,
      CATEGORY,
      ENQUIRY_TAG_SEED_LABELS,
      userId,
    );
    totalCreated += created;

    const items = await prisma.masterItem.findMany({
      where: { companyId: company.id, category: CATEGORY, deletedAt: null },
      select: { label: true, isActive: true },
      orderBy: [{ sortOrder: 'asc' }, { label: 'asc' }],
    });

    console.log(`[${company.code}] ${company.name}`);
    console.log(`  New tags this run: ${created}`);
    console.log(`  Total tags in DB: ${items.length}`);
    console.log(`  Active: ${items.filter((i) => i.isActive).length}`);
  }

  const migrated = await migrateEnquiryTagValues(allowed);

  console.log(`\nEnquiry tag migration: ${migrated} record(s) normalized to master labels`);
  console.log(`Total new MasterItem tags: ${totalCreated}`);
  console.log('Done. Refresh Enquiry screen to see tags in the multi-select.');
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
