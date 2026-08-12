/**
 * Entity-aware Zod validators for relational masters.
 */
import { z } from 'zod';
import { getMasterEntityConfig } from './master.registry.js';
import { AppError } from '../../utils/response.util.js';

const optionalUuid = z.string().uuid().optional().nullable().or(z.literal('')).transform((v) => (v === '' ? null : v));
const optionalString = z.string().max(500).optional().nullable().or(z.literal('')).transform((v) => (v === '' ? null : v));
const optionalText = z.string().max(10000).optional().nullable().or(z.literal('')).transform((v) => (v === '' ? null : v));
const optionalInt = z.coerce.number().int().optional().nullable();
const optionalDecimal = z.coerce.number().optional().nullable();
const optionalDate = z.union([z.string(), z.date()]).optional().nullable().transform((v) => {
  if (v == null || v === '') return null;
  const d = v instanceof Date ? v : new Date(v);
  return Number.isNaN(d.getTime()) ? null : d;
});

const codeSchema = z.string().min(1).max(80).trim().transform((v) => v.toUpperCase().replace(/\s+/g, '_'));
const nameSchema = z.string().min(1).max(200).trim();

const FIELD_SCHEMAS = {
  code: codeSchema,
  name: nameSchema,
  description: optionalText,
  isActive: z.boolean().optional().default(true),
  sortOrder: z.coerce.number().int().min(0).optional().default(0),
  branchId: optionalUuid,
  countryId: optionalUuid,
  universityId: optionalUuid,
  documentTypeId: optionalUuid,
  visaTypeId: optionalUuid,
  isoCode: z.string().max(10).optional().nullable().or(z.literal('')).transform((v) => (v === '' ? null : v?.toUpperCase())),
  phoneCode: optionalString,
  currencyCode: z.string().max(10).optional().nullable().or(z.literal('')).transform((v) => (v === '' ? null : v?.toUpperCase())),
  nationality: optionalString,
  city: optionalString,
  state: optionalString,
  website: optionalString,
  ranking: optionalInt,
  universityType: optionalString,
  level: optionalString,
  discipline: optionalString,
  duration: optionalDecimal,
  durationUnit: optionalString,
  tuitionFee: optionalDecimal,
  intakeAvailable: optionalText,
  startDate: optionalDate,
  endDate: optionalDate,
  applicationDeadline: optionalDate,
  category: optionalString,
  processingTime: optionalString,
  fee: optionalDecimal,
  applicableFor: optionalString,
  isMandatory: z.boolean().optional().default(true),
  address: optionalText,
  phone: optionalString,
  email: z.string().email().optional().nullable().or(z.literal('')).transform((v) => (v === '' ? null : v)),
  jurisdiction: optionalText,
  symbol: optionalString,
  decimalPlaces: z.coerce.number().int().min(0).max(6).optional().default(2),
  taxPercentage: optionalDecimal,
  channel: z.string().min(1).max(50).optional().nullable(),
  subject: optionalString,
  body: optionalText,
  variables: z.union([z.array(z.string()), z.record(z.any())]).optional().default([]),
  eventType: optionalString,
};

function buildSchema(fields, { partial = false } = {}) {
  const shape = {};
  for (const field of fields) {
    if (!FIELD_SCHEMAS[field]) continue;
    shape[field] = FIELD_SCHEMAS[field];
  }
  const schema = z.object(shape);
  return partial ? schema.partial() : schema;
}

/** Extra rules that Zod field map alone cannot express. */
function applyEntityRules(slug, data, { isCreate }) {
  if (slug === 'communication-template') {
    if (isCreate || data.channel !== undefined) {
      if (!data.channel || !String(data.channel).trim()) {
        throw new AppError('channel is required for communication templates', 422);
      }
    }
    if (isCreate || data.body !== undefined) {
      if (!data.body || !String(data.body).trim()) {
        throw new AppError('body is required for communication templates', 422);
      }
    }
  }

  if (slug === 'university' && (isCreate || data.countryId !== undefined)) {
    if (!data.countryId) throw new AppError('countryId is required for university', 422);
  }

  if (slug === 'course' && (isCreate || data.universityId !== undefined)) {
    if (!data.universityId) throw new AppError('universityId is required for course', 422);
  }

  if (slug === 'document-requirement' && (isCreate || data.documentTypeId !== undefined)) {
    if (!data.documentTypeId) throw new AppError('documentTypeId is required for document requirement', 422);
  }

  if (slug === 'country' && data.isoCode) {
    if (!/^[A-Z]{2,3}$/.test(data.isoCode)) {
      throw new AppError('isoCode must be a 2–3 letter ISO code', 422);
    }
  }

  return data;
}

export function parseMasterCreate(slug, body) {
  const config = getMasterEntityConfig(slug);
  if (!config) throw new AppError('Unknown master entity', 404);
  const parsed = buildSchema(config.createFields).parse(body || {});
  return applyEntityRules(slug, parsed, { isCreate: true });
}

export function parseMasterUpdate(slug, body) {
  const config = getMasterEntityConfig(slug);
  if (!config) throw new AppError('Unknown master entity', 404);
  const parsed = buildSchema(config.updateFields, { partial: true }).parse(body || {});
  return applyEntityRules(slug, parsed, { isCreate: false });
}

export const masterStatusSchema = z.object({
  isActive: z.boolean(),
});

export function parseMasterPagination(query = {}) {
  const page = Math.max(1, parseInt(query.page, 10) || 1);
  const rawSize = parseInt(query.pageSize ?? query.limit, 10) || 25;
  const limit = Math.min(100, Math.max(1, rawSize));
  return { page, limit, skip: (page - 1) * limit };
}

export function parseMasterSort(query = {}, sortableFields = [], defaultSort = 'sortOrder') {
  const requested = query.sort || query.sortBy || defaultSort;
  const sortBy = sortableFields.includes(requested) ? requested : defaultSort;
  const dirRaw = String(query.sortDirection || query.sortOrder || 'asc').toLowerCase();
  const sortOrder = dirRaw === 'desc' ? 'desc' : 'asc';
  // Secondary sort for stable lists
  if (sortBy === 'sortOrder') {
    return [{ sortOrder }, { name: 'asc' }];
  }
  return [{ [sortBy]: sortOrder }];
}
