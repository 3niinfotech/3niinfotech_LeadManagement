/**
 * Idempotent counsellor user seed — real Users with Counsellor/Team Leader roles per branch.
 * Counsellors are NOT a Master; they are application Users (RBAC).
 *
 * Usage: node scripts/seed-counsellors.js
 */
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';

dotenv.config();
const prisma = new PrismaClient();

const DEFAULT_PASSWORD = 'Counsellor@123';

/** branchCode → counsellor staff (roleSlug must be in COUNSELLOR_ROLE_SLUGS) */
const STAFF = [
  // HQ — Ahmedabad
  { branchCode: 'HQ', firstName: 'Priya', lastName: 'Shah', email: 'priya.shah@3niinfotech.com', roleSlug: 'counsellor', phone: '+91 98765 43210' },
  { branchCode: 'HQ', firstName: 'Rahul', lastName: 'Mehta', email: 'rahul.mehta@3niinfotech.com', roleSlug: 'counsellor', phone: '+91 98765 43211' },
  { branchCode: 'HQ', firstName: 'Amit', lastName: 'Patel', email: 'amit.patel@3niinfotech.com', roleSlug: 'team_leader', phone: '+91 98765 43212' },
  // Surat
  { branchCode: 'SUR', firstName: 'Neha', lastName: 'Desai', email: 'neha.desai@3niinfotech.com', roleSlug: 'counsellor', phone: '+91 98765 43220' },
  { branchCode: 'SUR', firstName: 'Karan', lastName: 'Joshi', email: 'karan.joshi@3niinfotech.com', roleSlug: 'counsellor', phone: '+91 98765 43221' },
  { branchCode: 'SUR', firstName: 'Divya', lastName: 'Rathod', email: 'divya.rathod@3niinfotech.com', roleSlug: 'team_leader', phone: '+91 98765 43222' },
  // Mumbai
  { branchCode: 'MUM', firstName: 'Ananya', lastName: 'Iyer', email: 'ananya.iyer@3niinfotech.com', roleSlug: 'counsellor', phone: '+91 98765 43230' },
  { branchCode: 'MUM', firstName: 'Vikram', lastName: 'Singh', email: 'vikram.singh@3niinfotech.com', roleSlug: 'counsellor', phone: '+91 98765 43231' },
  // Delhi
  { branchCode: 'DEL', firstName: 'Sneha', lastName: 'Gupta', email: 'sneha.gupta@3niinfotech.com', roleSlug: 'counsellor', phone: '+91 98765 43240' },
  { branchCode: 'DEL', firstName: 'Arjun', lastName: 'Malhotra', email: 'arjun.malhotra@3niinfotech.com', roleSlug: 'counsellor', phone: '+91 98765 43241' },
  // Rajkot
  { branchCode: 'RJT', firstName: 'Kirti', lastName: 'Parmar', email: 'kirti.parmar@3niinfotech.com', roleSlug: 'counsellor', phone: '+91 98765 43250' },
  { branchCode: 'RJT', firstName: 'Harsh', lastName: 'Thakkar', email: 'harsh.thakkar@3niinfotech.com', roleSlug: 'counsellor', phone: '+91 98765 43251' },
];

async function seedStaffForCompany(company, hashedPassword) {
  const branches = await prisma.branch.findMany({
    where: { companyId: company.id, deletedAt: null },
    select: { id: true, code: true, name: true },
  });
  const branchByCode = new Map(branches.map((b) => [b.code, b]));

  const roles = await prisma.role.findMany({
    where: { slug: { in: ['counsellor', 'team_leader', 'branch_manager'] } },
    select: { id: true, slug: true },
  });
  const roleBySlug = new Map(roles.map((r) => [r.slug, r.id]));

  let created = 0;
  let updated = 0;
  let skipped = 0;

  for (const row of STAFF) {
    const branch = branchByCode.get(row.branchCode);
    const roleId = roleBySlug.get(row.roleSlug);
    if (!branch) {
      console.warn(`  [skip] Branch ${row.branchCode} not found — run npm run db:seed-organization`);
      skipped += 1;
      continue;
    }
    if (!roleId) {
      console.warn(`  [skip] Role ${row.roleSlug} not found — run npm run db:seed`);
      skipped += 1;
      continue;
    }

    const existing = await prisma.user.findUnique({ where: { email: row.email } });
    if (existing) {
      await prisma.user.update({
        where: { id: existing.id },
        data: {
          companyId: company.id,
          branchId: branch.id,
          roleId,
          firstName: row.firstName,
          lastName: row.lastName,
          phone: row.phone,
          status: 'ACTIVE',
          deletedAt: null,
        },
      });
      updated += 1;
    } else {
      await prisma.user.create({
        data: {
          companyId: company.id,
          branchId: branch.id,
          roleId,
          firstName: row.firstName,
          lastName: row.lastName,
          email: row.email,
          phone: row.phone,
          password: hashedPassword,
          status: 'ACTIVE',
        },
      });
      created += 1;
    }
  }

  return { created, updated, skipped, branchCount: branches.length };
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

  const hashedPassword = await bcrypt.hash(DEFAULT_PASSWORD, 12);
  console.log(`Seeding counsellor users for ${companies.length} company(ies)...\n`);

  for (const company of companies) {
    console.log(`[${company.code}] ${company.name}`);
    const { created, updated, skipped, branchCount } = await seedStaffForCompany(company, hashedPassword);
    const eligible = await prisma.user.count({
      where: {
        companyId: company.id,
        deletedAt: null,
        status: 'ACTIVE',
        role: { slug: { in: ['counsellor', 'team_leader', 'branch_manager', 'company_admin', 'super_admin'] } },
      },
    });
    console.log(`  Branches: ${branchCount} | Staff: ${created} new, ${updated} updated, ${skipped} skipped`);
    console.log(`  Assignable counsellors (all roles): ${eligible}\n`);
  }

  console.log('Done. Assign Counsellor dropdown will load these users.');
  console.log(`Default password for seeded counsellors: ${DEFAULT_PASSWORD}`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
