/**
 * One-shot backfill: Partner.companyId from metadata / linked user / creator.
 * Run: node backend/scripts/backfill-partner-company-id.js
 */
import prisma from '../src/config/database.js';

async function resolveCompanyId(row) {
  if (row.companyId) return row.companyId;
  const meta = row.metadata && typeof row.metadata === 'object' ? row.metadata : {};
  if (meta.companyId) return meta.companyId;
  if (row.user?.companyId) return row.user.companyId;
  if (row.createdBy) {
    const creator = await prisma.user.findUnique({
      where: { id: row.createdBy },
      select: { companyId: true },
    });
    if (creator?.companyId) return creator.companyId;
  }
  return null;
}

async function main() {
  let updated = 0;
  let skipped = 0;
  let pass = 0;

  while (pass < 50) {
    pass += 1;
    const batch = await prisma.partner.findMany({
      where: { companyId: null, deletedAt: null },
      include: { user: { select: { companyId: true } } },
      take: 200,
    });
    if (!batch.length) break;

    for (const row of batch) {
      const companyId = await resolveCompanyId(row);
      if (!companyId) {
        skipped += 1;
        continue;
      }
      await prisma.partner.update({ where: { id: row.id }, data: { companyId } });
      updated += 1;
    }
  }

  const remaining = await prisma.partner.count({ where: { companyId: null, deletedAt: null } });
  console.log(`Partner companyId backfill: updated=${updated}, unresolved=${skipped}, remaining=${remaining}`);
  if (remaining > 0) {
    console.warn('Some partners still lack companyId — review manually before making column required.');
  }
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
