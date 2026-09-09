/**
 * ERP wiring smoke tests — duplicate guard, conversion lead sync, SLA processor.
 * Run: node scripts/test-erp-wiring.js
 */
import prisma from '../src/config/database.js';
import { enquiryService } from '../src/modules/enquiry/enquiry.service.js';
import { enquiryConversionService } from '../src/modules/enquiry/enquiryConversion.service.js';
import { processSlaBatch } from '../src/modules/assignment/sla.service.js';
import { processSmartReminderBatch } from '../src/modules/enquiry/enquirySmartReminder.service.js';
import { assignmentEngine } from '../src/modules/assignment/assignment.engine.js';

const results = [];

function pass(name) {
  results.push({ name, ok: true });
  console.log(`  ✓ ${name}`);
}

function fail(name, err) {
  results.push({ name, ok: false, error: err?.message || String(err) });
  console.error(`  ✗ ${name}:`, err?.message || err);
}

async function getAdminUser() {
  return prisma.user.findFirst({
    where: { email: 'admin@crm.com', deletedAt: null, status: 'ACTIVE' },
    include: { role: true },
  });
}

async function getBranch(companyId) {
  return prisma.branch.findFirst({
    where: { companyId, deletedAt: null, isActive: true },
  });
}

async function testDuplicateGuard(user, branch) {
  const req = { user: { ...user, dataScope: 'GLOBAL', role: user.role } };
  const base = {
    branchId: branch.id,
    firstName: 'ERPTest',
    lastName: 'Duplicate',
    email: `erp-dup-${Date.now()}@test.local`,
    mobile: `9${String(Date.now()).slice(-9)}`,
    source: 'Test',
  };

  const first = await enquiryService.create(base, user.id, req);
  if (!first?.id) throw new Error('First enquiry not created');

  try {
    await enquiryService.create(base, user.id, req);
    throw new Error('Expected 409 duplicate error');
  } catch (err) {
    if (err.statusCode !== 409 || !err.errors?.hasDuplicate) {
      throw new Error(`Expected 409 with hasDuplicate, got ${err.statusCode}`);
    }
  }

  const allowed = await enquiryService.create({ ...base, allowDuplicate: true }, user.id, req);
  if (!allowed?.id) throw new Error('allowDuplicate create failed');

  await prisma.enquiry.updateMany({
    where: { id: { in: [first.id, allowed.id] } },
    data: { deletedAt: new Date(), status: 'DUPLICATE' },
  });
}

async function testConversionLeadSync(user, branch) {
  const req = { user: { ...user, dataScope: 'GLOBAL', role: user.role } };
  const leadCode = `ERP-L-${Date.now()}`;
  const lead = await prisma.lead.create({
    data: {
      leadCode,
      tokenNumber: leadCode,
      branchId: branch.id,
      firstName: 'Convert',
      lastName: 'Test',
      phone: `8${String(Date.now()).slice(-9)}`,
      status: 'IN_COUNSELLING',
      createdBy: user.id,
      updatedBy: user.id,
    },
  });

  const { enquiryRepository } = await import('../src/modules/enquiry/enquiry.repository.js');
  const enquiryCodeStr = await enquiryRepository.generateCode(branch.companyId);
  const enquiry = await enquiryRepository.create({
    enquiryCode: enquiryCodeStr,
    branchId: branch.id,
    leadId: lead.id,
    assignedToId: user.id,
    firstName: lead.firstName,
    lastName: lead.lastName,
    email: `convert-${Date.now()}@test.local`,
    mobile: lead.phone,
    status: 'INTERESTED',
    priority: 'MEDIUM',
    tags: [],
    testsGiven: [],
    createdBy: user.id,
    updatedBy: user.id,
  });

  await enquiryConversionService.convertToStudent(enquiry.id, user.id, req);

  const linkedLead = await prisma.lead.findUnique({ where: { id: lead.id } });
  if (linkedLead.status !== 'COMPLETED') {
    throw new Error(`Expected lead COMPLETED, got ${linkedLead.status}`);
  }

  await prisma.enquiry.update({ where: { id: enquiry.id }, data: { deletedAt: new Date() } });
  await prisma.lead.update({ where: { id: lead.id }, data: { deletedAt: new Date() } });
}

async function testSlaProcessor() {
  const out = await processSlaBatch({ take: 10 });
  if (typeof out.processed !== 'number') throw new Error('SLA batch missing processed count');
}

async function testSmartReminderBatch() {
  const out = await processSmartReminderBatch({ take: 5 });
  if (typeof out.processed !== 'number') throw new Error('Smart reminder batch missing processed count');
}

async function testAssignmentConfigMerge() {
  const company = await prisma.company.findFirst({ where: { deletedAt: null, isActive: true } });
  if (!company) throw new Error('No company');
  const config = await assignmentEngine.getCompanyAssignmentConfig(company.id);
  if (config.slaEnabled === undefined || config.slaAutoReassign === undefined) {
    throw new Error('Assignment config missing slaEnabled/slaAutoReassign');
  }
}

async function main() {
  console.log('\nERP Wiring Tests\n');

  const user = await getAdminUser();
  if (!user?.companyId) {
    console.error('admin@crm.com with companyId required');
    process.exit(1);
  }
  const branch = await getBranch(user.companyId);
  if (!branch) {
    console.error('No branch for company');
    process.exit(1);
  }

  for (const [name, fn] of [
    ['Assignment config SLA fields', () => testAssignmentConfigMerge()],
    ['Enquiry create duplicate guard', () => testDuplicateGuard(user, branch)],
    ['Conversion syncs linked lead to COMPLETED', () => testConversionLeadSync(user, branch)],
    ['SLA batch processor runs', () => testSlaProcessor()],
    ['Smart reminder batch processor runs', () => testSmartReminderBatch()],
  ]) {
    try {
      await fn();
      pass(name);
    } catch (err) {
      fail(name, err);
    }
  }

  const failed = results.filter((r) => !r.ok);
  console.log(`\n${results.length - failed.length}/${results.length} passed`);
  await prisma.$disconnect();
  process.exit(failed.length ? 1 : 0);
}

main().catch((err) => {
  console.error(err);
  prisma.$disconnect().finally(() => process.exit(1));
});
