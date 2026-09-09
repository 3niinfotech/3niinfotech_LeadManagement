/**
 * Smoke-test availability engine against real DB records.
 * Run: node backend/scripts/test-availability-engine.js
 */
import prisma from '../src/config/database.js';
import { availabilityEngine } from '../src/modules/assignment/availability.engine.js';
import { AVAILABILITY_STATE } from '../src/modules/assignment/assignment.config.js';

async function findCounsellor(companyId) {
  return prisma.user.findFirst({
    where: {
      companyId,
      status: 'ACTIVE',
      deletedAt: null,
      role: { slug: { in: ['counsellor', 'team_leader'] } },
    },
    include: { counsellorPresence: true, role: { select: { slug: true } } },
  });
}

async function main() {
  const company = await prisma.company.findFirst({ select: { id: true, name: true } });
  if (!company) {
    console.error('No company in DB — seed data required');
    process.exit(1);
  }

  const counsellor = await findCounsellor(company.id);
  if (!counsellor) {
    console.error('No active counsellor in DB');
    process.exit(1);
  }

  console.log(`Company: ${company.name}`);
  console.log(`Counsellor: ${counsellor.firstName} ${counsellor.lastName} (${counsellor.id})`);

  const base = await availabilityEngine.evaluateCounsellor(counsellor, {
    companyId: company.id,
    branchId: counsellor.branchId,
  });
  console.log('\n[Baseline evaluation]');
  console.log(`  state=${base.state} label=${base.label} eligible=${base.eligible}`);

  const snapshot = await availabilityEngine.getAvailabilitySnapshot(counsellor.id, {
    companyId: company.id,
    branchId: counsellor.branchId,
  });
  console.log('\n[Snapshot]');
  console.log(`  status=${snapshot.status} label=${snapshot.label}`);
  console.log(`  workingHours=${snapshot.workingHoursToday}`);
  console.log(`  workload=${snapshot.workload.activeLeads}/${snapshot.workload.maxActiveLeads}`);
  console.log(`  activity=${snapshot.currentActivity}`);

  const inactive = await availabilityEngine.evaluateCounsellor(
    { ...counsellor, status: 'INACTIVE' },
    { companyId: company.id, branchId: counsellor.branchId },
  );
  console.log('\n[Inactive simulation]');
  console.log(`  state=${inactive.state} (expected ${AVAILABILITY_STATE.INELIGIBLE})`);

  const allCounsellors = await prisma.user.findMany({
    where: {
      companyId: company.id,
      status: 'ACTIVE',
      deletedAt: null,
      role: { slug: { in: ['counsellor', 'team_leader'] } },
    },
    include: { counsellorPresence: true, role: { select: { slug: true } } },
    take: 5,
  });

  console.log('\n[Batch evaluate — tenant scoped]');
  for (const c of allCounsellors) {
    const ev = await availabilityEngine.evaluateCounsellor(c, {
      companyId: company.id,
      branchId: c.branchId,
    });
    console.log(`  ${c.firstName} ${c.lastName}: ${ev.state} (${ev.label})`);
  }

  console.log('\nOK — availability engine executed against real DB');
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
