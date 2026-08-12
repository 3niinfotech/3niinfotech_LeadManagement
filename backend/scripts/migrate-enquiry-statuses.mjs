/**
 * Run once before `npm run db:push` when upgrading enquiry status enum.
 * Maps legacy status values to the new pipeline.
 */
import { PrismaClient } from '@prisma/client';

const LEGACY_MAP = {
  FOLLOW_UP_REQUIRED: 'FOLLOW_UP',
  COUNSELLING_SCHEDULED: 'COUNSELLING',
  READY_FOR_REGISTER: 'APPLICATION_STARTED',
  DROPPED: 'LOST',
};

const prisma = new PrismaClient();

async function main() {
  for (const [from, to] of Object.entries(LEGACY_MAP)) {
    const result = await prisma.$executeRawUnsafe(
      `UPDATE enquiries SET status = ? WHERE status = ?`,
      to,
      from,
    );
    if (result) console.log(`  ${from} → ${to}: ${result} row(s)`);
  }
  console.log('Enquiry status migration complete.');
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
