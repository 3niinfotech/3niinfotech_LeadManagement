/**
 * Idempotent relational master seed (W0).
 * Upserts by companyId + code. Resolves parents by stable codes (never UUIDs).
 *
 * Usage: node scripts/seed-relational-masters.js
 */
import { PrismaClient } from '@prisma/client';
import {
  RELATIONAL_COUNTRIES,
  RELATIONAL_DEPARTMENTS,
  RELATIONAL_QUALIFICATIONS,
  RELATIONAL_INTAKES,
  RELATIONAL_CURRENCIES,
  RELATIONAL_PAYMENT_MODES,
  RELATIONAL_TAXES,
  RELATIONAL_VISIT_PURPOSES,
  RELATIONAL_COUNSELLOR_SKILLS,
  RELATIONAL_FACULTY,
  RELATIONAL_LEAD_SOURCES,
  RELATIONAL_LEAD_STATUSES,
  RELATIONAL_LOST_REASONS,
  RELATIONAL_FOLLOWUP_TYPES,
  RELATIONAL_DOCUMENT_TYPES,
  RELATIONAL_UNIVERSITIES,
  RELATIONAL_COURSES,
  RELATIONAL_VISA_TYPES,
  RELATIONAL_EMBASSIES,
  RELATIONAL_DOCUMENT_REQUIREMENTS,
  RELATIONAL_COMMUNICATION_TEMPLATES,
  RELATIONAL_APPLICATION_CHECKLISTS,
  RELATIONAL_APPLICATION_STATUSES,
  RELATIONAL_VISA_CHECKLISTS,
  RELATIONAL_VISA_STATUSES,
  RELATIONAL_STUDENT_STATUSES,
} from '../src/config/master-relational-seed.config.js';

const prisma = new PrismaClient();

async function upsertByCode(delegate, companyId, code, data, createdBy) {
  const existing = await delegate.findUnique({
    where: { companyId_code: { companyId, code } },
  });
  if (existing) {
    return { record: existing, created: false };
  }
  const record = await delegate.create({
    data: {
      companyId,
      code,
      ...data,
      ...(createdBy ? { createdBy, updatedBy: createdBy } : {}),
    },
  });
  return { record, created: true };
}

function countKey(stats, key, created) {
  if (!stats[key]) stats[key] = { created: 0, skipped: 0 };
  if (created) stats[key].created += 1;
  else stats[key].skipped += 1;
}

async function seedCompany(company, userId, stats) {
  const companyId = company.id;
  const branch = await prisma.branch.findFirst({
    where: { companyId, deletedAt: null, isActive: true },
    orderBy: { createdAt: 'asc' },
    select: { id: true, code: true },
  });

  const countryByCode = new Map();
  const universityByCode = new Map();
  const documentTypeByCode = new Map();
  const visaTypeByCode = new Map();

  // Countries
  for (let i = 0; i < RELATIONAL_COUNTRIES.length; i += 1) {
    const row = RELATIONAL_COUNTRIES[i];
    const { record, created } = await upsertByCode(
      prisma.country,
      companyId,
      row.code,
      {
        name: row.name,
        isoCode: row.isoCode,
        phoneCode: row.phoneCode,
        currencyCode: row.currencyCode,
        nationality: row.nationality,
        sortOrder: i + 1,
      },
      userId,
    );
    countryByCode.set(row.code, record);
    countKey(stats, 'Country', created);
  }

  // Departments (optional branch link)
  for (let i = 0; i < RELATIONAL_DEPARTMENTS.length; i += 1) {
    const row = RELATIONAL_DEPARTMENTS[i];
    const { created } = await upsertByCode(
      prisma.department,
      companyId,
      row.code,
      {
        name: row.name,
        branchId: branch?.id ?? null,
        sortOrder: i + 1,
      },
      userId,
    );
    countKey(stats, 'Department', created);
  }

  // Qualifications
  for (let i = 0; i < RELATIONAL_QUALIFICATIONS.length; i += 1) {
    const row = RELATIONAL_QUALIFICATIONS[i];
    const { created } = await upsertByCode(
      prisma.qualification,
      companyId,
      row.code,
      { name: row.name, level: row.level, sortOrder: i + 1 },
      userId,
    );
    countKey(stats, 'Qualification', created);
  }

  // Intakes
  for (let i = 0; i < RELATIONAL_INTAKES.length; i += 1) {
    const row = RELATIONAL_INTAKES[i];
    const { created } = await upsertByCode(
      prisma.intake,
      companyId,
      row.code,
      { name: row.name, sortOrder: i + 1 },
      userId,
    );
    countKey(stats, 'Intake', created);
  }

  // Currencies
  for (let i = 0; i < RELATIONAL_CURRENCIES.length; i += 1) {
    const row = RELATIONAL_CURRENCIES[i];
    const { created } = await upsertByCode(
      prisma.currency,
      companyId,
      row.code,
      { name: row.name, symbol: row.symbol, sortOrder: i + 1 },
      userId,
    );
    countKey(stats, 'Currency', created);
  }

  // Payment modes
  for (let i = 0; i < RELATIONAL_PAYMENT_MODES.length; i += 1) {
    const row = RELATIONAL_PAYMENT_MODES[i];
    const { created } = await upsertByCode(
      prisma.paymentMode,
      companyId,
      row.code,
      { name: row.name, sortOrder: i + 1 },
      userId,
    );
    countKey(stats, 'PaymentMode', created);
  }

  // Taxes
  for (let i = 0; i < RELATIONAL_TAXES.length; i += 1) {
    const row = RELATIONAL_TAXES[i];
    const { created } = await upsertByCode(
      prisma.tax,
      companyId,
      row.code,
      { name: row.name, taxPercentage: row.taxPercentage, sortOrder: i + 1 },
      userId,
    );
    countKey(stats, 'Tax', created);
  }

  // Visit purposes
  for (let i = 0; i < RELATIONAL_VISIT_PURPOSES.length; i += 1) {
    const row = RELATIONAL_VISIT_PURPOSES[i];
    const { created } = await upsertByCode(
      prisma.visitPurpose,
      companyId,
      row.code,
      { name: row.name, sortOrder: i + 1 },
      userId,
    );
    countKey(stats, 'VisitPurpose', created);
  }

  // Counsellor skills
  for (let i = 0; i < RELATIONAL_COUNSELLOR_SKILLS.length; i += 1) {
    const row = RELATIONAL_COUNSELLOR_SKILLS[i];
    const { created } = await upsertByCode(
      prisma.counsellorSkill,
      companyId,
      row.code,
      { name: row.name, sortOrder: i + 1 },
      userId,
    );
    countKey(stats, 'CounsellorSkill', created);
  }

  for (let i = 0; i < RELATIONAL_FACULTY.length; i += 1) {
    const row = RELATIONAL_FACULTY[i];
    const { created } = await upsertByCode(
      prisma.faculty,
      companyId,
      row.code,
      { name: row.name, description: row.description || null, sortOrder: i + 1 },
      userId,
    );
    countKey(stats, 'Faculty', created);
  }

  // Lead sources
  for (let i = 0; i < RELATIONAL_LEAD_SOURCES.length; i += 1) {
    const row = RELATIONAL_LEAD_SOURCES[i];
    const { created } = await upsertByCode(
      prisma.leadSource,
      companyId,
      row.code,
      { name: row.name, sortOrder: i + 1 },
      userId,
    );
    countKey(stats, 'LeadSource', created);
  }

  // Lead statuses (CrmLeadStatus)
  for (let i = 0; i < RELATIONAL_LEAD_STATUSES.length; i += 1) {
    const row = RELATIONAL_LEAD_STATUSES[i];
    const { created } = await upsertByCode(
      prisma.crmLeadStatus,
      companyId,
      row.code,
      { name: row.name, sortOrder: i + 1 },
      userId,
    );
    countKey(stats, 'CrmLeadStatus', created);
  }

  // Lost reasons
  for (let i = 0; i < RELATIONAL_LOST_REASONS.length; i += 1) {
    const row = RELATIONAL_LOST_REASONS[i];
    const { created } = await upsertByCode(
      prisma.lostReason,
      companyId,
      row.code,
      { name: row.name, sortOrder: i + 1 },
      userId,
    );
    countKey(stats, 'LostReason', created);
  }

  // Follow-up types
  for (let i = 0; i < RELATIONAL_FOLLOWUP_TYPES.length; i += 1) {
    const row = RELATIONAL_FOLLOWUP_TYPES[i];
    const { created } = await upsertByCode(
      prisma.followupType,
      companyId,
      row.code,
      { name: row.name, sortOrder: i + 1 },
      userId,
    );
    countKey(stats, 'FollowupType', created);
  }

  // Document types
  for (let i = 0; i < RELATIONAL_DOCUMENT_TYPES.length; i += 1) {
    const row = RELATIONAL_DOCUMENT_TYPES[i];
    const { record, created } = await upsertByCode(
      prisma.documentType,
      companyId,
      row.code,
      { name: row.name, category: row.category, sortOrder: i + 1 },
      userId,
    );
    documentTypeByCode.set(row.code, record);
    countKey(stats, 'DocumentType', created);
  }

  // Universities (Country by code)
  for (let i = 0; i < RELATIONAL_UNIVERSITIES.length; i += 1) {
    const row = RELATIONAL_UNIVERSITIES[i];
    const country = countryByCode.get(row.countryCode);
    if (!country) {
      throw new Error(`University ${row.code}: missing country ${row.countryCode}`);
    }
    const { record, created } = await upsertByCode(
      prisma.university,
      companyId,
      row.code,
      {
        name: row.name,
        countryId: country.id,
        city: row.city ?? null,
        sortOrder: i + 1,
      },
      userId,
    );
    universityByCode.set(row.code, record);
    countKey(stats, 'University', created);
  }

  // Courses (University + Country)
  for (let i = 0; i < RELATIONAL_COURSES.length; i += 1) {
    const row = RELATIONAL_COURSES[i];
    const university = universityByCode.get(row.universityCode);
    if (!university) {
      throw new Error(`Course ${row.code}: missing university ${row.universityCode}`);
    }
    const { created } = await upsertByCode(
      prisma.course,
      companyId,
      row.code,
      {
        name: row.name,
        universityId: university.id,
        countryId: university.countryId,
        level: row.level ?? null,
        discipline: row.discipline ?? null,
        sortOrder: i + 1,
      },
      userId,
    );
    countKey(stats, 'Course', created);
  }

  // Visa types
  for (let i = 0; i < RELATIONAL_VISA_TYPES.length; i += 1) {
    const row = RELATIONAL_VISA_TYPES[i];
    const country = row.countryCode ? countryByCode.get(row.countryCode) : null;
    if (row.countryCode && !country) {
      throw new Error(`VisaType ${row.code}: missing country ${row.countryCode}`);
    }
    const { record, created } = await upsertByCode(
      prisma.visaType,
      companyId,
      row.code,
      {
        name: row.name,
        countryId: country?.id ?? null,
        category: row.category ?? null,
        sortOrder: i + 1,
      },
      userId,
    );
    visaTypeByCode.set(row.code, record);
    countKey(stats, 'VisaType', created);
  }

  // Embassies
  for (let i = 0; i < RELATIONAL_EMBASSIES.length; i += 1) {
    const row = RELATIONAL_EMBASSIES[i];
    const country = countryByCode.get(row.countryCode);
    if (!country) {
      throw new Error(`Embassy ${row.code}: missing country ${row.countryCode}`);
    }
    const { created } = await upsertByCode(
      prisma.embassy,
      companyId,
      row.code,
      {
        name: row.name,
        countryId: country.id,
        city: row.city ?? null,
        sortOrder: i + 1,
      },
      userId,
    );
    countKey(stats, 'Embassy', created);
  }

  // Document requirements
  for (let i = 0; i < RELATIONAL_DOCUMENT_REQUIREMENTS.length; i += 1) {
    const row = RELATIONAL_DOCUMENT_REQUIREMENTS[i];
    const documentType = documentTypeByCode.get(row.documentTypeCode);
    if (!documentType) {
      throw new Error(`DocumentRequirement ${row.code}: missing document type ${row.documentTypeCode}`);
    }
    const country = row.countryCode ? countryByCode.get(row.countryCode) : null;
    if (row.countryCode && !country) {
      throw new Error(`DocumentRequirement ${row.code}: missing country ${row.countryCode}`);
    }
    const visaType = row.visaTypeCode ? visaTypeByCode.get(row.visaTypeCode) : null;
    if (row.visaTypeCode && !visaType) {
      throw new Error(`DocumentRequirement ${row.code}: missing visa type ${row.visaTypeCode}`);
    }
    const { created } = await upsertByCode(
      prisma.documentRequirement,
      companyId,
      row.code,
      {
        name: row.name,
        documentTypeId: documentType.id,
        countryId: country?.id ?? null,
        visaTypeId: visaType?.id ?? null,
        applicableFor: row.applicableFor ?? null,
        isMandatory: row.isMandatory !== false,
        sortOrder: i + 1,
      },
      userId,
    );
    countKey(stats, 'DocumentRequirement', created);
  }

  // Application + Visa checklists/statuses are country-specific.
  // Seed for every active country so Visa/Application create flows always have workflow options.
  const seededCountryIds = [...countryByCode.values()].map((c) => c.id);

  for (const countryId of seededCountryIds) {
    // Application Checklists (per-country)
    for (let i = 0; i < RELATIONAL_APPLICATION_CHECKLISTS.length; i += 1) {
      const row = RELATIONAL_APPLICATION_CHECKLISTS[i];
      const existing = await prisma.applicationChecklist.findFirst({
        where: { companyId, name: row.name, countryId },
      });
      if (!existing) {
        await prisma.applicationChecklist.create({
          data: {
            companyId,
            countryId,
            name: row.name,
            documentType: row.documentType ?? null,
            enquiryForm: row.enquiryForm ?? false,
            isMandatory: row.isMandatory ?? true,
            sortOrder: row.sortOrder ?? i + 1,
            createdBy: userId,
            updatedBy: userId,
          },
        });
        countKey(stats, 'ApplicationChecklist', true);
      } else {
        countKey(stats, 'ApplicationChecklist', false);
      }
    }

    // Application Statuses (per-country)
    for (let i = 0; i < RELATIONAL_APPLICATION_STATUSES.length; i += 1) {
      const row = RELATIONAL_APPLICATION_STATUSES[i];
      const existing = await prisma.applicationStatusMaster.findFirst({
        where: { companyId, name: row.name, countryId },
      });
      if (!existing) {
        await prisma.applicationStatusMaster.create({
          data: {
            companyId,
            countryId,
            name: row.name,
            mailSend: row.mailSend ?? false,
            defaultStatus: row.defaultStatus ?? false,
            setOfferLetter: row.setOfferLetter ?? false,
            position: row.position ?? i + 1,
            createdBy: userId,
            updatedBy: userId,
          },
        });
        countKey(stats, 'ApplicationStatus', true);
      } else {
        countKey(stats, 'ApplicationStatus', false);
      }
    }
  }

  // Student statuses (company-wide)
  for (let i = 0; i < RELATIONAL_STUDENT_STATUSES.length; i += 1) {
    const row = RELATIONAL_STUDENT_STATUSES[i];
    const { created } = await upsertByCode(
      prisma.studentStatusMaster,
      companyId,
      row.code,
      {
        name: row.name,
        defaultStatus: row.defaultStatus ?? false,
        colorCode: row.colorCode ?? null,
        sortOrder: row.sortOrder ?? i + 1,
      },
      userId,
    );
    countKey(stats, 'StudentStatus', created);
  }

  for (const countryId of seededCountryIds) {
    // Visa Checklists (per-country)
    for (let i = 0; i < RELATIONAL_VISA_CHECKLISTS.length; i += 1) {
      const row = RELATIONAL_VISA_CHECKLISTS[i];
      const existing = await prisma.visaChecklist.findFirst({
        where: { companyId, name: row.name, countryId },
      });
      if (!existing) {
        await prisma.visaChecklist.create({
          data: {
            companyId,
            countryId,
            name: row.name,
            documentType: row.documentType ?? null,
            isMandatory: row.isMandatory ?? true,
            sortOrder: row.sortOrder ?? i + 1,
            createdBy: userId,
            updatedBy: userId,
          },
        });
        countKey(stats, 'VisaChecklist', true);
      } else {
        countKey(stats, 'VisaChecklist', false);
      }
    }

    // Visa Statuses (per-country)
    for (let i = 0; i < RELATIONAL_VISA_STATUSES.length; i += 1) {
      const row = RELATIONAL_VISA_STATUSES[i];
      const existing = await prisma.visaStatusMaster.findFirst({
        where: { companyId, name: row.name, countryId },
      });
      if (!existing) {
        await prisma.visaStatusMaster.create({
          data: {
            companyId,
            countryId,
            name: row.name,
            visaApproved: row.visaApproved ?? false,
            visaWithdraw: row.visaWithdraw ?? false,
            visaRejected: row.visaRejected ?? false,
            mailSend: row.mailSend ?? false,
            defaultStatus: row.defaultStatus ?? false,
            position: row.position ?? i + 1,
            createdBy: userId,
            updatedBy: userId,
          },
        });
        countKey(stats, 'VisaStatus', true);
      } else {
        countKey(stats, 'VisaStatus', false);
      }
    }
  }

  // Communication templates
  for (let i = 0; i < RELATIONAL_COMMUNICATION_TEMPLATES.length; i += 1) {
    const row = RELATIONAL_COMMUNICATION_TEMPLATES[i];
    const { created } = await upsertByCode(
      prisma.communicationTemplate,
      companyId,
      row.code,
      {
        name: row.name,
        channel: row.channel ?? null,
        subject: row.subject ?? null,
        body: row.body ?? null,
        variables: row.variables ?? [],
        eventType: row.eventType ?? null,
        sortOrder: i + 1,
      },
      userId,
    );
    countKey(stats, 'CommunicationTemplate', created);
  }

  return { branchCode: branch?.code ?? null };
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
  const userId = admin?.id || null;

  console.log(`Seeding relational masters for ${companies.length} company(ies)...\n`);

  for (const company of companies) {
    const stats = {};
    const meta = await seedCompany(company, userId, stats);
    console.log(`[${company.code}] ${company.name} (branch: ${meta.branchCode || 'none'})`);
    Object.keys(stats)
      .sort()
      .forEach((key) => {
        const s = stats[key];
        console.log(`  ${key}: +${s.created} created, ${s.skipped} skipped`);
      });
    console.log('');
  }

  // Totals across DB (first company scope for report clarity)
  const companyId = companies[0].id;
  const totals = {
    Country: await prisma.country.count({ where: { companyId, deletedAt: null } }),
    Department: await prisma.department.count({ where: { companyId, deletedAt: null } }),
    University: await prisma.university.count({ where: { companyId, deletedAt: null } }),
    Course: await prisma.course.count({ where: { companyId, deletedAt: null } }),
    Intake: await prisma.intake.count({ where: { companyId, deletedAt: null } }),
    Qualification: await prisma.qualification.count({ where: { companyId, deletedAt: null } }),
    VisaType: await prisma.visaType.count({ where: { companyId, deletedAt: null } }),
    DocumentType: await prisma.documentType.count({ where: { companyId, deletedAt: null } }),
    DocumentRequirement: await prisma.documentRequirement.count({ where: { companyId, deletedAt: null } }),
    Embassy: await prisma.embassy.count({ where: { companyId, deletedAt: null } }),
    Currency: await prisma.currency.count({ where: { companyId, deletedAt: null } }),
    PaymentMode: await prisma.paymentMode.count({ where: { companyId, deletedAt: null } }),
    Tax: await prisma.tax.count({ where: { companyId, deletedAt: null } }),
    LeadSource: await prisma.leadSource.count({ where: { companyId, deletedAt: null } }),
    CrmLeadStatus: await prisma.crmLeadStatus.count({ where: { companyId, deletedAt: null } }),
    LostReason: await prisma.lostReason.count({ where: { companyId, deletedAt: null } }),
    FollowupType: await prisma.followupType.count({ where: { companyId, deletedAt: null } }),
    VisitPurpose: await prisma.visitPurpose.count({ where: { companyId, deletedAt: null } }),
    CounsellorSkill: await prisma.counsellorSkill.count({ where: { companyId, deletedAt: null } }),
    Faculty: await prisma.faculty.count({ where: { companyId, deletedAt: null } }),
    CommunicationTemplate: await prisma.communicationTemplate.count({ where: { companyId, deletedAt: null } }),
    MasterItem: await prisma.masterItem.count({ where: { companyId, deletedAt: null } }),
  };

  console.log(`DB totals for [${companies[0].code}]:`);
  Object.entries(totals).forEach(([k, v]) => console.log(`  ${k}: ${v}`));
  console.log('\nDone. Relational master seed complete.');
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
