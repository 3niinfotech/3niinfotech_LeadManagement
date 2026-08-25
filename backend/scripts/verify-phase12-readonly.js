/**
 * READ-ONLY Phase 1+2 verification queries. No mutations.
 * Usage: node scripts/verify-phase12-readonly.js
 */
import prisma from '../src/config/database.js';

const BRANCH_KEYS = ['branch.switch', 'branch.view_multiple'];

async function verifyRbacDb() {
  const perms = await prisma.permission.findMany({
    where: { key: { in: BRANCH_KEYS } },
    select: { id: true, key: true },
  });

  const roles = await prisma.role.findMany({
    where: { isSystem: true, deletedAt: null },
    include: {
      rolePermissions: {
        where: { granted: true, permission: { key: { in: BRANCH_KEYS } } },
        include: { permission: { select: { key: true } } },
      },
    },
    orderBy: { hierarchyLevel: 'asc' },
  });

  console.log('\n=== RBAC DB: branch permissions by role ===\n');
  for (const key of BRANCH_KEYS) {
    const holders = roles.filter((r) => r.rolePermissions.some((rp) => rp.permission.key === key));
    console.log(`${key}:`);
    holders.forEach((r) => console.log(`  + ${r.slug} (${r.name})`));
    if (!holders.length) console.log('  (none)');
  }

  const blocked = ['counsellor', 'receptionist', 'teacher'];
  console.log('\n=== Restricted roles (DB) ===');
  for (const slug of blocked) {
    const role = roles.find((r) => r.slug === slug);
    if (!role) {
      console.log(`  ${slug}: role not in DB`);
      continue;
    }
    const keys = role.rolePermissions.map((rp) => rp.permission.key);
    const ok = !keys.some((k) => BRANCH_KEYS.includes(k));
    console.log(`  ${slug}: ${ok ? 'OK — no cross-branch perms' : `FAIL — has ${keys.join(', ')}`}`);
  }

  return { perms, roles };
}

async function verifyMigratedLeads() {
  const migrated = await prisma.lead.findMany({
    where: {
      deletedAt: null,
      OR: [
        { metadata: { path: '$.migratedFromWaiting', equals: true } },
        {
          activities: {
            some: { action: 'QUEUE_MIGRATION' },
          },
        },
      ],
    },
    include: {
      student: { select: { id: true, studentCode: true, firstName: true, lastName: true } },
      assignedTo: { select: { id: true, firstName: true, lastName: true, email: true } },
      branch: { select: { code: true, name: true } },
      counsellingSessions: {
        select: { id: true, status: true, startedAt: true, endedAt: true },
        orderBy: { startedAt: 'desc' },
        take: 3,
      },
      activities: {
        where: { action: 'QUEUE_MIGRATION' },
        select: { id: true, action: true, description: true, metadata: true, createdAt: true },
        orderBy: { createdAt: 'desc' },
        take: 1,
      },
    },
    orderBy: { leadCode: 'asc' },
  });

  console.log(`\n=== Migrated WAITING → WALK_IN leads (${migrated.length}) ===\n`);

  for (const lead of migrated) {
    const meta = lead.metadata && typeof lead.metadata === 'object' ? lead.metadata : {};
    const act = lead.activities[0];
    const actMeta = act?.metadata && typeof act.metadata === 'object' ? act.metadata : {};

    console.log(`Lead ID:     ${lead.id}`);
    console.log(`Lead Code:   ${lead.leadCode}`);
    console.log(`Branch:      ${lead.branch?.code} — ${lead.branch?.name}`);
    console.log(`Student:     ${lead.student ? `${lead.student.studentCode} (${lead.student.firstName} ${lead.student.lastName})` : '(none)'}`);
    console.log(`Old status:  ${actMeta.from || meta.migratedFromWaiting ? 'WAITING' : 'unknown'}`);
    console.log(`New status:  ${lead.status}`);
    console.log(`tokenNumber: ${lead.tokenNumber}`);
    console.log(`Preserved:   ${meta.preservedTokenNumber ?? actMeta.preservedTokenNumber ?? '—'}`);
    console.log(`Counsellor:  ${lead.assignedTo ? `${lead.assignedTo.firstName} ${lead.assignedTo.lastName} (${lead.assignedTo.email})` : '(unassigned)'}`);
    console.log(`Sessions:    ${lead.counsellingSessions.length ? lead.counsellingSessions.map((s) => `${s.status}${s.startedAt ? ` @ ${s.startedAt.toISOString()}` : ''}`).join('; ') : '(none)'}`);
    console.log(`Migrated at: ${meta.migratedAt || act?.createdAt?.toISOString() || '—'}`);
    console.log('---');
  }

  const stillWaiting = await prisma.lead.count({ where: { status: 'WAITING', deletedAt: null } });
  console.log(`\nRemaining WAITING leads (open): ${stillWaiting}`);

  return migrated;
}

async function verifyCounsellingIntegrity() {
  const inCounselling = await prisma.lead.findMany({
    where: { status: 'IN_COUNSELLING', deletedAt: null },
    select: {
      id: true,
      leadCode: true,
      status: true,
      tokenNumber: true,
      metadata: true,
      assignedTo: { select: { email: true } },
      counsellingSessions: {
        where: { endedAt: null, status: 'ACTIVE' },
        select: { id: true, status: true },
      },
    },
  });

  const wronglyMigrated = inCounselling.filter((l) => {
    const meta = l.metadata && typeof l.metadata === 'object' ? l.metadata : {};
    return meta.migratedFromWaiting === true;
  });

  const activeSessions = await prisma.counsellingSession.findMany({
    where: {
      status: 'ACTIVE',
      endedAt: null,
      lead: { deletedAt: null },
    },
    select: {
      id: true,
      status: true,
      lead: { select: { id: true, leadCode: true, status: true } },
    },
  });

  const sessionLeadMismatch = activeSessions.filter(
    (s) => s.lead?.status === 'WALK_IN' && s.lead?.status !== 'IN_COUNSELLING',
  );

  console.log('\n=== Counselling integrity ===\n');
  console.log(`IN_COUNSELLING leads: ${inCounselling.length}`);
  console.log(`IN_COUNSELLING wrongly marked migratedFromWaiting: ${wronglyMigrated.length}`);
  console.log(`Active counselling sessions: ${activeSessions.length}`);

  if (wronglyMigrated.length) {
    wronglyMigrated.forEach((l) => console.log(`  FAIL: ${l.leadCode} is IN_COUNSELLING but has migratedFromWaiting`));
  }

  const walkInWithActiveSession = activeSessions.filter((s) => s.lead?.status === 'WALK_IN');
  console.log(`Active sessions on WALK_IN leads: ${walkInWithActiveSession.length}`);
  walkInWithActiveSession.forEach((s) => {
    console.log(`  ${s.lead.leadCode} session ${s.id} status=${s.status} leadStatus=${s.lead.status}`);
  });

  return {
    inCounsellingCount: inCounselling.length,
    wronglyMigrated: wronglyMigrated.length,
    activeSessions: activeSessions.length,
    walkInWithActiveSession: walkInWithActiveSession.length,
  };
}

async function main() {
  await verifyRbacDb();
  await verifyMigratedLeads();
  await verifyCounsellingIntegrity();
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
