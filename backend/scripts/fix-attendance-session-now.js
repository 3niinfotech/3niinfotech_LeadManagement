/**
 * Move QA batch session to NOW so teacher can mark attendance immediately.
 * Usage: node scripts/fix-attendance-session-now.js
 */
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';

dotenv.config();
const prisma = new PrismaClient();

async function main() {
  const batch = await prisma.academicBatch.findFirst({
    where: { code: { contains: 'BAT-0001' }, deletedAt: null },
    orderBy: { updatedAt: 'desc' },
  });
  if (!batch) {
    console.error('No QA batch found. Run: npm run db:seed-qa');
    process.exit(1);
  }

  const now = new Date();
  const sessionStart = new Date(now.getTime() - 20 * 60 * 1000);
  const sessionEnd = new Date(now.getTime() + 45 * 60 * 1000);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let session = await prisma.classSession.findFirst({
    where: { batchId: batch.id, deletedAt: null },
    orderBy: { startAt: 'desc' },
  });

  if (!session) {
    console.error('No session for batch. Run: npm run db:seed-qa');
    process.exit(1);
  }

  session = await prisma.classSession.update({
    where: { id: session.id },
    data: {
      sessionDate: today,
      startAt: sessionStart,
      endAt: sessionEnd,
      status: 'SCHEDULED',
      deletedAt: null,
    },
  });

  console.log('\n✓ Attendance session moved to current time');
  console.log(`  Batch: ${batch.name}`);
  console.log(`  Start: ${sessionStart.toLocaleString('en-IN')}`);
  console.log(`  End:   ${sessionEnd.toLocaleString('en-IN')}`);
  console.log(`  URL:   http://localhost:3000/admin/sessions/${session.id}/attendance`);
  console.log('  Window should show OPEN — refresh the page.\n');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
