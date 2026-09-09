/**
 * One-time backfill: replace stored master codes (COURSE_*, UNIV_*) with human labels.
 * Usage: node backend/scripts/normalize-master-field-labels.js
 */
import prisma from '../src/config/database.js';
import { resolveMasterFieldLabel } from '../src/utils/masterFieldNormalize.util.js';

const ENTITY_BY_FIELD = {
  interestedCourse: 'course',
  course: 'course',
  interestedCountry: 'country',
  country: 'country',
  university: 'university',
  intake: 'intake',
  highestQual: 'qualification',
};

async function backfillModel(model, fields, companyId) {
  let updated = 0;
  for (const field of fields) {
    const entity = ENTITY_BY_FIELD[field];
    if (!entity) continue;

    const where = {
      deletedAt: null,
      [field]: { not: null },
      ...(model === 'enquiry' || model === 'student' || model === 'lead'
        ? { branch: { companyId } }
        : { companyId }),
    };

    const rows = await prisma[model].findMany({
      where,
      select: { id: true, [field]: true },
    });

    for (const row of rows) {
      const raw = row[field];
      if (!raw || !/^(COURSE|UNIV|INTAKE|COUNTRY|QUAL)_/i.test(String(raw))) continue;
      const label = await resolveMasterFieldLabel(entity, companyId, raw);
      if (label && label !== raw) {
        await prisma[model].update({ where: { id: row.id }, data: { [field]: label } });
        updated += 1;
      }
    }
  }
  return updated;
}

async function main() {
  const companies = await prisma.company.findMany({ select: { id: true, code: true } });
  let total = 0;
  for (const company of companies) {
    const n1 = await backfillModel('enquiry', ['interestedCourse', 'interestedCountry', 'intake', 'highestQual'], company.id);
    const n2 = await backfillModel('student', ['course', 'university', 'country', 'intake'], company.id);
    const n3 = await backfillModel('lead', ['interestedCourse', 'country'], company.id);
    const sum = n1 + n2 + n3;
    total += sum;
    if (sum) console.log(`${company.code}: updated ${sum} field(s)`);
  }
  console.log(`Done. Total updates: ${total}`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
