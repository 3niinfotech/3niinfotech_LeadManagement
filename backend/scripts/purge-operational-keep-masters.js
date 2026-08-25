/**
 * Delete ALL operational CRM data. Keep masters + org + RBAC + features.
 *
 * KEPT: companies, branches, roles, permissions, menus, feature flags,
 *       all master_* / relational masters (country, faculty, lead source, …)
 *
 * REMOVED: users, leads, enquiries, demos, students, attendance batches,
 *          applications, visas, invoices, notifications, audit logs, …
 *
 * Usage: node scripts/purge-operational-keep-masters.js
 */
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';

dotenv.config();
const prisma = new PrismaClient();

/** MySQL table names (@@map) — operational only */
const OPERATIONAL_TABLES = [
  'class_attendances',
  'class_sessions',
  'class_timetable_slots',
  
  'batch_enrollments',
  'academic_batches',
  'admission_receipts',
  'admission_payments',
  'fee_installments',
  'fee_plans',
  'admission_documents',
  'admissions',
  'enquiry_note_attachments',
  'enquiry_notes',
  'enquiry_documents',
  'enquiry_communications',
  'enquiry_audit_logs',
  'enquiry_import_duplicates',
  'enquiry_import_batches',
  'enquiry_demos',
  'enquiry_appointments',
  'enquiry_followups',
  'assignment_audit_logs',
  'counselling_sessions',
  'assignment_offers',
  'counsellor_presence',
  'enquiries',
  'applications',
  'visas',
  'invoices',
  'documents',
  'notes',
  'activities',
  'appointments',
  'notifications',
  'audit_logs',
  'saved_filters',
  'leads',
  'students',
  'partners',
  'refresh_tokens',
  'user_permission_overrides',
  'role_activity_logs',
  'users',
];

const KEEP_HINT = [
  'companies', 'branches', 'roles', 'permissions', 'role_permissions', 'menu_items',
  'feature_flags', 'tenant_feature_overrides', 'master_items', 'faculties',
  'countries', 'courses', 'universities', 'departments', 'lead_sources',
];

async function countRows(table) {
  try {
    const rows = await prisma.$queryRawUnsafe(`SELECT COUNT(*) AS c FROM \`${table}\``);
    return Number(rows?.[0]?.c ?? 0);
  } catch {
    return -1;
  }
}

async function main() {
  console.log('\n⚠️  PURGE operational data — masters / company / branches / RBAC stay intact.\n');

  await prisma.$executeRawUnsafe('SET FOREIGN_KEY_CHECKS = 0');

  const summary = [];
  for (const table of OPERATIONAL_TABLES) {
    const before = await countRows(table);
    if (before < 0) {
      summary.push({ table, before: 'missing', deleted: 0 });
      continue;
    }
    await prisma.$executeRawUnsafe(`DELETE FROM \`${table}\``);
    summary.push({ table, before, deleted: before });
  }

  await prisma.$executeRawUnsafe('SET FOREIGN_KEY_CHECKS = 1');

  console.log('Deleted rows:');
  for (const row of summary.filter((r) => r.deleted > 0)) {
    console.log(`  ${row.table.padEnd(32)} ${row.deleted}`);
  }

  console.log('\nKept (spot-check):');
  for (const table of KEEP_HINT) {
    const n = await countRows(table);
    if (n >= 0) console.log(`  ${table.padEnd(32)} ${n}`);
  }

  console.log('\n✅ Operational purge complete. Masters unchanged.');
  console.log('Next: node scripts/seed-qa-testing.js\n');
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    try {
      await prisma.$executeRawUnsafe('SET FOREIGN_KEY_CHECKS = 1');
    } catch { /* ignore */ }
    await prisma.$disconnect();
  });
