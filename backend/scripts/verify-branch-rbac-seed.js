/**
 * Pre/post RBAC seed verification for branch.switch & branch.view_multiple.
 * Usage:
 *   node scripts/verify-branch-rbac-seed.js           # plan only
 *   node scripts/verify-branch-rbac-seed.js --snapshot # save DB snapshot
 *   node scripts/verify-branch-rbac-seed.js --compare  # compare after seed
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import prisma from '../src/config/database.js';
import { DEFAULT_ROLES } from '../src/config/default-roles.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SNAPSHOT_PATH = path.join(__dirname, '.branch-rbac-snapshot.json');
const BRANCH_KEYS = ['branch.switch', 'branch.view_multiple'];

function expandRolePermissions(roleDef) {
  return [...new Set(roleDef.permissions || [])];
}

function analyzePlan() {
  const roles = DEFAULT_ROLES.map((r) => {
    const perms = expandRolePermissions(r);
    return {
      slug: r.slug,
      name: r.name,
      hasSwitch: perms.includes('branch.switch'),
      hasViewMultiple: perms.includes('branch.view_multiple'),
      permissionCount: perms.length,
    };
  });

  const withSwitch = roles.filter((r) => r.hasSwitch).map((r) => r.slug);
  const withViewMultiple = roles.filter((r) => r.hasViewMultiple).map((r) => r.slug);
  const withoutEither = roles.filter((r) => !r.hasSwitch && !r.hasViewMultiple).map((r) => r.slug);

  return { roles, withSwitch, withViewMultiple, withoutEither };
}

async function snapshotDb() {
  const systemSlugs = DEFAULT_ROLES.map((r) => r.slug);
  const roles = await prisma.role.findMany({
    where: { slug: { in: systemSlugs } },
    include: {
      rolePermissions: {
        where: { granted: true },
        include: { permission: { select: { key: true } } },
      },
    },
  });

  const bySlug = {};
  for (const role of roles) {
    const keys = role.rolePermissions.map((rp) => rp.permission.key).sort();
    bySlug[role.slug] = {
      name: role.name,
      permissionCount: keys.length,
      permissions: keys,
      branchSwitch: keys.includes('branch.switch'),
      branchViewMultiple: keys.includes('branch.view_multiple'),
    };
  }

  return bySlug;
}

function printPlan(plan) {
  console.log('\n=== Planned branch permissions (from default-roles.js) ===\n');
  console.log('branch.switch:');
  plan.withSwitch.forEach((s) => console.log(`  + ${s}`));
  console.log('\nbranch.view_multiple:');
  plan.withViewMultiple.forEach((s) => console.log(`  + ${s}`));
  console.log('\nNeither permission:');
  plan.withoutEither.forEach((s) => console.log(`  - ${s}`));

  const blocked = ['counsellor', 'receptionist', 'teacher'];
  console.log('\n=== Restricted roles check ===');
  for (const slug of blocked) {
    const row = plan.roles.find((r) => r.slug === slug);
    if (!row) {
      console.log(`  ${slug}: (role not in DEFAULT_ROLES)`);
      continue;
    }
    const ok = !row.hasSwitch && !row.hasViewMultiple;
    console.log(`  ${slug}: ${ok ? 'OK — no cross-branch perms' : 'FAIL — has cross-branch perms'}`);
  }
}

function compareSnapshots(before, after, plan) {
  console.log('\n=== Permission preservation check (system roles) ===\n');
  let issues = 0;

  for (const roleDef of DEFAULT_ROLES) {
    const slug = roleDef.slug;
    const b = before[slug];
    const a = after[slug];
    const planned = new Set(expandRolePermissions(roleDef));

    if (!b) {
      console.log(`  ${slug}: NEW (not in DB before seed)`);
      continue;
    }
    if (!a) {
      console.log(`  ${slug}: MISSING after seed!`);
      issues++;
      continue;
    }

    const removedFromDb = b.permissions.filter((k) => !a.permissions.includes(k));
    const unexpectedRemoved = removedFromDb.filter((k) => planned.has(k));
    const added = a.permissions.filter((k) => !b.permissions.includes(k));
    const branchAdded = added.filter((k) => BRANCH_KEYS.includes(k));

    if (unexpectedRemoved.length) {
      console.log(`  ${slug}: REMOVED planned permissions: ${unexpectedRemoved.join(', ')}`);
      issues++;
    } else if (removedFromDb.length) {
      console.log(`  ${slug}: removed ${removedFromDb.length} extra DB-only perm(s) (not in default-roles)`);
    }

    if (branchAdded.length) {
      console.log(`  ${slug}: added branch perms: ${branchAdded.join(', ')}`);
    }

    if (a.permissionCount !== planned.size) {
      const diff = a.permissionCount - planned.size;
      if (diff !== 0) {
        console.log(`  ${slug}: DB count ${a.permissionCount}, planned ${planned.size} (${diff > 0 ? '+' : ''}${diff})`);
      }
    }
  }

  console.log(issues ? `\n${issues} issue(s) found.` : '\nAll planned permissions preserved.');
  return issues;
}

async function main() {
  const mode = process.argv[2];
  const plan = analyzePlan();
  printPlan(plan);

  if (mode === '--snapshot') {
    const snap = await snapshotDb();
    fs.writeFileSync(SNAPSHOT_PATH, JSON.stringify(snap, null, 2));
    console.log(`\nSnapshot saved: ${SNAPSHOT_PATH}`);
    console.log(`Roles in DB: ${Object.keys(snap).length}`);
    return;
  }

  if (mode === '--compare') {
    if (!fs.existsSync(SNAPSHOT_PATH)) {
      throw new Error('No snapshot — run with --snapshot first');
    }
    const before = JSON.parse(fs.readFileSync(SNAPSHOT_PATH, 'utf8'));
    const after = await snapshotDb();
    const issues = compareSnapshots(before, after, plan);

    console.log('\n=== Branch permissions in DB after seed ===');
    for (const key of BRANCH_KEYS) {
      const holders = Object.entries(after)
        .filter(([, v]) => v.permissions.includes(key))
        .map(([slug]) => slug);
      console.log(`${key}: ${holders.length ? holders.join(', ') : '(none)'}`);
    }

    process.exitCode = issues ? 1 : 0;
    return;
  }

  console.log('\n(Run seed after --snapshot, then --compare to verify.)');
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
