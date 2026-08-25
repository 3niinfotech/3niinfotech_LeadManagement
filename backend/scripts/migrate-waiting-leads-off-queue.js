/**
 * Phase 2 — migrate open WAITING leads off Live Queue semantics.
 * Preserves tokenNumber and all lead fields. Does not drop columns.
 *
 * Mapping:
 * - WAITING → WALK_IN (assigned or unassigned)
 * - IN_COUNSELLING / APPOINTMENT / COMPLETED / CANCELLED / WALK_IN unchanged
 *
 * Run: node scripts/migrate-waiting-leads-off-queue.js
 */
import prisma from '../src/config/database.js';

async function main() {
  const waiting = await prisma.lead.findMany({
    where: { status: 'WAITING', deletedAt: null },
    select: { id: true, leadCode: true, assignedToId: true, tokenNumber: true },
  });

  console.log(`Found ${waiting.length} WAITING lead(s) to migrate → WALK_IN`);

  let updated = 0;
  for (const lead of waiting) {
    await prisma.lead.update({
      where: { id: lead.id },
      data: {
        status: 'WALK_IN',
        metadata: {
          // Prisma Json merge is replace — load then merge
        },
      },
    });

    const full = await prisma.lead.findUnique({ where: { id: lead.id } });
    const meta = (full?.metadata && typeof full.metadata === 'object') ? full.metadata : {};
    await prisma.lead.update({
      where: { id: lead.id },
      data: {
        status: 'WALK_IN',
        metadata: {
          ...meta,
          migratedFromWaiting: true,
          migratedAt: new Date().toISOString(),
          preservedTokenNumber: lead.tokenNumber,
        },
      },
    });

    await prisma.activity.create({
      data: {
        leadId: lead.id,
        entityType: 'LEAD',
        entityId: lead.id,
        action: 'QUEUE_MIGRATION',
        description: 'Migrated from WAITING (Live Queue removed) to WALK_IN',
        metadata: {
          from: 'WAITING',
          to: 'WALK_IN',
          assignedToId: lead.assignedToId,
          preservedTokenNumber: lead.tokenNumber,
        },
      },
    });

    updated += 1;
    console.log(`  ${lead.leadCode} → WALK_IN (token preserved: ${lead.tokenNumber})`);
  }

  console.log(`Done. Migrated ${updated} lead(s). tokenNumber column retained.`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
