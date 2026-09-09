/**
 * Smoke tests for Master Module fixes (real DB).
 * Run: node backend/scripts/test-master-module.js
 */
import prisma from '../src/config/database.js';
import { masterRepository } from '../src/modules/master/master.repository.js';
import { getMasterEntityConfig } from '../src/modules/master/master.registry.js';
import { partnerRepository } from '../src/modules/partner/partner.repository.js';

async function assert(name, condition, detail = '') {
  if (!condition) {
    throw new Error(`${name} failed${detail ? `: ${detail}` : ''}`);
  }
  console.log(`  ✓ ${name}`);
}

async function main() {
  console.log('Master module smoke tests\n');

  const company = await prisma.company.findFirst({ where: { deletedAt: null }, select: { id: true, code: true } });
  await assert('tenant company exists', Boolean(company?.id), 'seed a company first');
  const companyId = company.id;
  console.log(`Using company ${company.code} (${companyId})\n`);

  // Partner companyId backfill state
  const nullPartners = await prisma.partner.count({ where: { companyId: null, deletedAt: null } });
  await assert('partner companyId null count reported', nullPartners >= 0);
  console.log(`  partners without companyId: ${nullPartners}`);

  const scoped = await partnerRepository.findMany({ companyId, page: 1, limit: 5 });
  await assert('partner list scoped by companyId', Array.isArray(scoped.data));
  if (scoped.data.length) {
    await assert('partner rows have companyId when listed', scoped.data.every((p) => p.companyId === companyId));
  }

  // Usage counts on relational masters
  const countryConfig = getMasterEntityConfig('country');
  const country = await prisma.country.findFirst({ where: { companyId, deletedAt: null }, select: { id: true, name: true, code: true } });
  if (country) {
    const deps = await masterRepository.countDependencies(countryConfig, country, companyId);
    await assert('country dependency count runs', Array.isArray(deps));
    const [enriched] = await masterRepository.attachUsageCounts(countryConfig, companyId, [country]);
    await assert('attachUsageCounts adds usageCount', enriched.usageCount != null);
  } else {
    console.log('  ~ skip country usage (no country row)');
  }

  const taxConfig = getMasterEntityConfig('tax');
  const tax = await prisma.tax.findFirst({ where: { companyId, deletedAt: null }, select: { id: true, code: true, name: true } });
  if (tax) {
    const deps = await masterRepository.countDependencies(taxConfig, tax, companyId);
    await assert('tax jsonUsage count runs', Array.isArray(deps));
  } else {
    console.log('  ~ skip tax jsonUsage (no tax row)');
  }

  const leadStatus = await prisma.crmLeadStatus.findFirst({ where: { companyId, deletedAt: null }, orderBy: { sortOrder: 'asc' } });
  if (leadStatus) {
    const workflow = await masterRepository.findLeadStatusWorkflow(companyId);
    await assert('lead status workflow loads', workflow.length > 0);
  } else {
    console.log('  ~ skip lead status workflow (no rows)');
  }

  console.log('\nAll master module smoke checks passed.');
}

main()
  .catch((err) => {
    console.error('\nMaster module smoke tests FAILED:', err.message);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
