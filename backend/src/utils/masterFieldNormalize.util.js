import prisma from '../config/database.js';

const ENTITY_MAP = {
  course: { model: 'course', label: 'name', include: { university: { select: { name: true } } } },
  university: { model: 'university', label: 'name' },
  country: { model: 'country', label: 'name' },
  intake: { model: 'intake', label: 'name' },
  qualification: { model: 'qualification', label: 'name' },
};

function formatCourseLabel(row) {
  if (!row?.name) return null;
  return row.university?.name ? `${row.name} · ${row.university.name}` : row.name;
}

/** Resolve stored code/id/name to the human master label (name). */
export async function resolveMasterFieldLabel(entity, companyId, raw) {
  if (raw == null || raw === '') return raw ?? null;
  if (!companyId) return String(raw).trim();

  const val = String(raw).trim();
  const cfg = ENTITY_MAP[entity];
  if (!cfg) return val;

  const row = await prisma[cfg.model].findFirst({
    where: {
      companyId,
      deletedAt: null,
      OR: [{ code: val }, { name: val }, { id: val }],
    },
    select: {
      [cfg.label]: true,
      ...(cfg.include ? { university: cfg.include.university } : {}),
    },
  });

  if (!row) return val;
  if (entity === 'course') return formatCourseLabel(row) || val;
  return row[cfg.label] || val;
}

export async function normalizeEnquiryMasterFields(data, companyId) {
  if (!data || !companyId) return data;
  const out = { ...data };

  if (out.interestedCourse != null) {
    out.interestedCourse = await resolveMasterFieldLabel('course', companyId, out.interestedCourse);
  }
  if (out.interestedCountry != null) {
    out.interestedCountry = await resolveMasterFieldLabel('country', companyId, out.interestedCountry);
  }
  if (out.intake != null) {
    out.intake = await resolveMasterFieldLabel('intake', companyId, out.intake);
  }
  if (out.highestQual != null) {
    out.highestQual = await resolveMasterFieldLabel('qualification', companyId, out.highestQual);
  }

  return out;
}

export async function normalizeStudentMasterFields(data, companyId) {
  if (!data || !companyId) return data;
  const out = { ...data };

  if (out.course != null) {
    out.course = await resolveMasterFieldLabel('course', companyId, out.course);
  }
  if (out.university != null) {
    out.university = await resolveMasterFieldLabel('university', companyId, out.university);
  }
  if (out.country != null) {
    out.country = await resolveMasterFieldLabel('country', companyId, out.country);
  }
  if (out.intake != null) {
    out.intake = await resolveMasterFieldLabel('intake', companyId, out.intake);
  }

  return out;
}

async function hydrateRecord(record, companyId, fieldMap) {
  if (!record || !companyId) return record;
  const next = { ...record };
  for (const [field, entity] of Object.entries(fieldMap)) {
    if (next[field]) {
      next[field] = await resolveMasterFieldLabel(entity, companyId, next[field]);
    }
  }
  return next;
}

async function forceResolveCountryFields(record, companyId, fields) {
  if (!record || !companyId) return record;
  const next = { ...record };
  for (const field of fields) {
    if (!next[field]) continue;
    const raw = String(next[field]).trim();
    if (!raw) continue;
    const resolved = await resolveMasterFieldLabel('country', companyId, raw);
    if (resolved && resolved !== raw) next[field] = resolved;
  }
  return next;
}

export async function hydrateEnquiryMasterLabels(enquiry, companyId) {
  const hydrated = await hydrateRecord(enquiry, companyId, {
    interestedCourse: 'course',
    interestedCountry: 'country',
    intake: 'intake',
    highestQual: 'qualification',
  });
  return forceResolveCountryFields(hydrated, companyId, ['interestedCountry']);
}

export async function hydrateStudentMasterLabels(student, companyId) {
  const hydrated = await hydrateRecord(student, companyId, {
    course: 'course',
    university: 'university',
    country: 'country',
    intake: 'intake',
  });
  return forceResolveCountryFields(hydrated, companyId, ['country']);
}

async function buildMasterLookup(entity, companyId, values = []) {
  const unique = [...new Set(values.map((v) => String(v).trim()).filter(Boolean))];
  if (!unique.length || !companyId) return new Map();

  const cfg = ENTITY_MAP[entity];
  if (!cfg) return new Map();

  const rows = await prisma[cfg.model].findMany({
    where: {
      companyId,
      deletedAt: null,
      OR: [
        { code: { in: unique } },
        { name: { in: unique } },
        { id: { in: unique } },
      ],
    },
    select: {
      id: true,
      code: true,
      name: true,
      ...(entity === 'course' ? { university: { select: { name: true } } } : {}),
    },
  });

  const map = new Map();
  rows.forEach((row) => {
    const label = entity === 'course' ? (formatCourseLabel(row) || row.name) : row.name;
    if (row.code) map.set(row.code, label);
    if (row.name) map.set(row.name, label);
    if (row.id) map.set(row.id, label);
  });
  return map;
}

export async function hydrateEnquiryListMasterLabels(rows, companyId) {
  if (!rows?.length || !companyId) return rows;
  const courseMap = await buildMasterLookup('course', companyId, rows.map((r) => r.interestedCourse));
  const countryMap = await buildMasterLookup('country', companyId, rows.map((r) => r.interestedCountry));
  return rows.map((row) => ({
    ...row,
    interestedCourse: courseMap.get(row.interestedCourse) || row.interestedCourse,
    interestedCountry: countryMap.get(row.interestedCountry) || row.interestedCountry,
  }));
}

export async function hydrateStudentListMasterLabels(rows, companyId) {
  if (!rows?.length || !companyId) return rows;
  const courseMap = await buildMasterLookup('course', companyId, rows.map((r) => r.course));
  const universityMap = await buildMasterLookup('university', companyId, rows.map((r) => r.university));
  const countryMap = await buildMasterLookup('country', companyId, rows.map((r) => r.country));
  return rows.map((row) => ({
    ...row,
    course: courseMap.get(row.course) || row.course,
    university: universityMap.get(row.university) || row.university,
    country: countryMap.get(row.country) || row.country,
  }));
}
