import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { seedRbac } from './seed-rbac.js';
import { featureRepository } from '../src/modules/feature/feature.repository.js';
import { masterService } from '../src/modules/master/master.service.js';

const prisma = new PrismaClient();

/**
 * Fresh baseline seed — no sample enquiries or students.
 * Real data starts when you register visitors in Manage Enquiry,
 * then convert interested leads to Students.
 */
async function main() {
  console.log('Seeding RBAC, menus, features...');
  await seedRbac(prisma);

  const company = await prisma.company.upsert({
    where: { code: 'MAIN' },
    update: { name: 'Lead Management CRM', email: 'admin@crm.com' },
    create: { name: 'Lead Management CRM', code: 'MAIN', email: 'admin@crm.com' },
  });

  const branch = await prisma.branch.upsert({
    where: { companyId_code: { companyId: company.id, code: 'HQ' } },
    update: { name: 'Head Office', email: 'hq@crm.com' },
    create: {
      companyId: company.id,
      name: 'Head Office',
      code: 'HQ',
      email: 'hq@crm.com',
    },
  });

  const adminRole = await prisma.role.findUnique({ where: { slug: 'super_admin' } });
  if (!adminRole) throw new Error('super_admin role missing — run seed-rbac first');

  const hashedPassword = await bcrypt.hash('Admin@123', 12);

  await prisma.user.upsert({
    where: { email: 'admin@crm.com' },
    update: {
      password: hashedPassword,
      status: 'ACTIVE',
      roleId: adminRole.id,
      branchId: branch.id,
    },
    create: {
      companyId: company.id,
      branchId: branch.id,
      roleId: adminRole.id,
      firstName: 'Super',
      lastName: 'Admin',
      email: 'admin@crm.com',
      password: hashedPassword,
      status: 'ACTIVE',
    },
  });

  const adminUser = await prisma.user.findUnique({ where: { email: 'admin@crm.com' } });

  const legacyFlags = [
    { key: 'module_leads', module: 'legacy', name: 'Leads Module', defaultEnabled: true, sortOrder: 0 },
    { key: 'module_students', module: 'legacy', name: 'Students Module', defaultEnabled: true, sortOrder: 0 },
    { key: 'module_visas', module: 'legacy', name: 'Visas Module', defaultEnabled: true, sortOrder: 0 },
    { key: 'module_invoices', module: 'legacy', name: 'Invoices Module', defaultEnabled: true, sortOrder: 0 },
    { key: 'module_partners', module: 'legacy', name: 'Partners Module', defaultEnabled: true, sortOrder: 0 },
    { key: 'module_reports', module: 'legacy', name: 'Reports Module', defaultEnabled: true, sortOrder: 0 },
    { key: 'module_enquiries', module: 'legacy', name: 'Enquiries Module', defaultEnabled: true, sortOrder: 0 },
  ];

  for (const flag of legacyFlags) {
    await prisma.featureFlag.upsert({
      where: { key: flag.key },
      update: { name: flag.name, module: flag.module, defaultEnabled: flag.defaultEnabled },
      create: flag,
    });
  }

  await featureRepository.seedCompanyDefaults(company.id, adminUser.id);
  const masterSeeded = await masterService.seedCompanyDefaults(company.id, adminUser.id);
  console.log(`Master data: ${masterSeeded} default lookup values seeded.`);

  const counts = {
    enquiries: await prisma.enquiry.count(),
    students: await prisma.student.count(),
    users: await prisma.user.count(),
  };

  console.log('Seed completed — clean slate.');
  console.log(`  Users: ${counts.users} (admin only)`);
  console.log(`  Enquiries: ${counts.enquiries} (add via Manage Enquiry)`);
  console.log(`  Students: ${counts.students} (created via Convert tab)`);
  console.log('\nLogin: admin@crm.com / Admin@123');
  console.log('\nRecommended flow:');
  console.log('  1. Login as admin');
  console.log('  2. Manage Enquiry → Register Visitor / Add Enquiry');
  console.log('  3. Follow up on interested lead');
  console.log('  4. Convert tab → Convert to Student');
  console.log('  5. Students menu → full admission profile');
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
