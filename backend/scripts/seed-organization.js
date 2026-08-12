/**
 * Idempotent organization seed — company profile + branches per tenant.
 * Usage: node scripts/seed-organization.js
 */
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';

dotenv.config();
const prisma = new PrismaClient();

const COMPANY_PROFILE = {
  code: 'MAIN',
  name: '3ni Infotech Visa Consultancy',
  legalName: '3ni Infotech Education & Visa Services Pvt. Ltd.',
  email: 'info@3niinfotech.com',
  phone: '+91 79 1234 5678',
  website: 'https://www.3niinfotech.com',
  addressLine1: '101, Shivalik Plaza, SG Highway',
  addressLine2: 'Near Iscon Cross Road',
  city: 'Ahmedabad',
  state: 'Gujarat',
  postalCode: '380015',
  taxNumber: 'GSTIN24AABCU9603R1ZM',
  registrationNumber: 'U80900GJ2018PTC105432',
};

const BRANCHES = [
  {
    code: 'HQ',
    name: 'Head Office — Ahmedabad',
    email: 'hq@3niinfotech.com',
    phone: '+91 79 1234 5678',
    addressLine1: '101, Shivalik Plaza, SG Highway',
    city: 'Ahmedabad',
    state: 'Gujarat',
    postalCode: '380015',
  },
  {
    code: 'SUR',
    name: 'Surat Branch',
    email: 'surat@3niinfotech.com',
    phone: '+91 261 234 5678',
    addressLine1: '402, International Business Center',
    addressLine2: 'Ring Road',
    city: 'Surat',
    state: 'Gujarat',
    postalCode: '395002',
  },
  {
    code: 'MUM',
    name: 'Mumbai Branch',
    email: 'mumbai@3niinfotech.com',
    phone: '+91 22 4567 8901',
    addressLine1: '18, Andheri Kurla Road',
    addressLine2: 'Andheri East',
    city: 'Mumbai',
    state: 'Maharashtra',
    postalCode: '400069',
  },
  {
    code: 'DEL',
    name: 'Delhi Branch',
    email: 'delhi@3niinfotech.com',
    phone: '+91 11 4987 6543',
    addressLine1: '55, Connaught Place',
    addressLine2: 'Block C',
    city: 'New Delhi',
    state: 'Delhi',
    postalCode: '110001',
  },
  {
    code: 'RJT',
    name: 'Rajkot Branch',
    email: 'rajkot@3niinfotech.com',
    phone: '+91 281 234 5678',
    addressLine1: '12, Kalawad Road',
    city: 'Rajkot',
    state: 'Gujarat',
    postalCode: '360005',
  },
];

async function resolveIndiaCountryId(companyId) {
  const country = await prisma.country.findFirst({
    where: { companyId, code: 'IN', deletedAt: null },
    select: { id: true },
  });
  return country?.id || null;
}

async function seedCompany(company, indiaCountryId) {
  const updated = await prisma.company.update({
    where: { id: company.id },
    data: {
      ...COMPANY_PROFILE,
      countryId: indiaCountryId,
      isActive: true,
    },
  });
  console.log(`  Company: ${updated.name} (${updated.code})`);
  return updated;
}

async function seedBranches(companyId, indiaCountryId, adminUserId) {
  let created = 0;
  let updated = 0;

  for (const branch of BRANCHES) {
    const existing = await prisma.branch.findFirst({
      where: { companyId, code: branch.code, deletedAt: null },
    });

    if (existing) {
      await prisma.branch.update({
        where: { id: existing.id },
        data: {
          ...branch,
          countryId: indiaCountryId,
          isActive: true,
          updatedBy: adminUserId,
        },
      });
      updated += 1;
    } else {
      await prisma.branch.create({
        data: {
          companyId,
          ...branch,
          countryId: indiaCountryId,
          isActive: true,
          createdBy: adminUserId,
          updatedBy: adminUserId,
        },
      });
      created += 1;
    }
  }

  return { created, updated };
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

  const admin = await prisma.user.findFirst({
    where: { email: 'admin@crm.com', deletedAt: null },
    select: { id: true },
  });

  console.log(`Seeding organization for ${companies.length} company(ies)...\n`);

  for (const company of companies) {
    const indiaCountryId = await resolveIndiaCountryId(company.id);
    if (!indiaCountryId) {
      console.warn(`[${company.code}] India country master not found — run npm run db:seed-relational-masters first`);
    }

    console.log(`[${company.code}] ${company.name}`);
    await seedCompany(company, indiaCountryId);
    const { created, updated } = await seedBranches(company.id, indiaCountryId, admin?.id);
    const total = await prisma.branch.count({ where: { companyId: company.id, deletedAt: null } });
    console.log(`  Branches: ${total} total (${created} new, ${updated} updated)\n`);
  }

  console.log('Done. Open Master → Company / Branch to view.');
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
