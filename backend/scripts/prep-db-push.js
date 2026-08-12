/**
 * Prepare local MySQL DB before `prisma db push`.
 * - Fixes invalid empty enquiry statuses
 * - Safe to re-run
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const STATUS_MAP = {
  '': 'NEW',
  FOLLOW_UP_REQUIRED: 'FOLLOW_UP',
  COUNSELLING_SCHEDULED: 'COUNSELLING',
  READY_FOR_REGISTER: 'CONVERTED',
  DROPPED: 'LOST',
};

try {
  let fixed = 0;
  for (const [from, to] of Object.entries(STATUS_MAP)) {
    const result = await prisma.$executeRawUnsafe(
      'UPDATE enquiries SET status = ? WHERE status = ?',
      to,
      from,
    );
    if (result > 0) {
      console.log(`Updated ${result} enquiries: ${from || '(empty)'} → ${to}`);
      fixed += result;
    }
  }
  console.log(fixed ? `Done. Fixed ${fixed} row(s).` : 'No status fixes needed.');
} catch (e) {
  console.error('Prep failed:', e.message);
  process.exitCode = 1;
} finally {
  await prisma.$disconnect();
}
