/**
 * W0 verification — orphans, MasterItem, FK chains.
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const company = await prisma.company.findFirst({ where: { code: 'MAIN', deletedAt: null } });
  if (!company) throw new Error('MAIN company missing');
  const cid = company.id;

  const orphanTables = [
    'admissions',
    'admission_documents',
    'admission_payments',
    'admission_receipts',
    'fee_plans',
    'fee_installments',
  ];
  const orphanCounts = {};
  for (const t of orphanTables) {
    const rows = await prisma.$queryRawUnsafe(`SELECT COUNT(*) AS c FROM \`${t}\``);
    orphanCounts[t] = Number(rows[0].c);
  }

  const univ = await prisma.university.findFirst({
    where: { companyId: cid, code: 'UNIV_CONCORDIA' },
    include: {
      country: true,
      courses: { where: { code: 'COURSE_BSC_CS_CONCORDIA' } },
    },
  });
  const visa = await prisma.visaType.findFirst({
    where: { companyId: cid, code: 'STUDY_PERMIT_CA' },
    include: { country: true },
  });
  const req = await prisma.documentRequirement.findFirst({
    where: { companyId: cid, code: 'REQ_PASSPORT_CA_STUDY' },
    include: { documentType: true, visaType: true, country: true },
  });
  const dept = await prisma.department.findFirst({
    where: { companyId: cid, code: 'COUNSELLING' },
    include: { branch: true, company: true },
  });

  const masterItem = await prisma.masterItem.count({ where: { companyId: cid, deletedAt: null } });

  const companyCols = await prisma.$queryRawUnsafe(
    "SHOW COLUMNS FROM companies WHERE Field IN ('legalName','countryId','addressLine1','taxNumber','registrationNumber')",
  );
  const branchCols = await prisma.$queryRawUnsafe(
    "SHOW COLUMNS FROM branches WHERE Field IN ('managerId','countryId','addressLine1','postalCode')",
  );

  const masterTables = [
    'departments',
    'countries',
    'universities',
    'courses',
    'intakes',
    'qualifications',
    'visa_types',
    'document_types',
    'document_requirements',
    'embassies',
    'currencies',
    'payment_modes',
    'taxes',
    'lead_sources',
    'lead_statuses',
    'lost_reasons',
    'followup_types',
    'visit_purposes',
    'counsellor_skills',
    'communication_templates',
  ];
  const existingMasters = {};
  for (const t of masterTables) {
    const rows = await prisma.$queryRawUnsafe(`SELECT COUNT(*) AS c FROM \`${t}\``);
    existingMasters[t] = Number(rows[0].c);
  }

  const fkChecks = {
    'Country->University->Course':
      !!univ &&
      univ.country?.code === 'CA' &&
      univ.courses.length === 1 &&
      univ.courses[0].universityId === univ.id,
    'Country->VisaType': visa?.country?.code === 'CA',
    'DocumentType->DocumentRequirement(+VisaType/Country)':
      req?.documentType?.code === 'PASSPORT' &&
      req?.visaType?.code === 'STUDY_PERMIT_CA' &&
      req?.country?.code === 'CA',
    'Company->Branch->Department': dept?.company?.code === 'MAIN' && !!dept?.branchId,
  };

  console.log(
    JSON.stringify(
      {
        orphanCounts,
        masterItem,
        fkChecks,
        companyCols: companyCols.map((c) => c.Field),
        branchCols: branchCols.map((c) => c.Field),
        existingMasters,
        companyCountryIdNullable: company.countryId === null,
      },
      null,
      2,
    ),
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
