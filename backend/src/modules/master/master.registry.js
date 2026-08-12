/**
 * Relational Master registry — whitelist only.
 * Never resolve Prisma models from raw req.params.
 */
import { PERMISSIONS } from '../../config/permissions.js';

const COMMON_SORT = ['name', 'code', 'sortOrder', 'isActive', 'createdAt', 'updatedAt'];

function baseEntity(overrides) {
  return {
    companyScoped: true,
    softDelete: true,
    optionLabelField: 'name',
    optionValueField: 'id',
    searchableFields: ['name', 'code'],
    sortableFields: COMMON_SORT,
    filterFields: ['isActive', 'branchId', 'countryId', 'universityId', 'documentTypeId', 'visaTypeId', 'isMandatory', 'level', 'channel'],
    createFields: [],
    updateFields: [],
    immutableFields: ['id', 'companyId', 'createdAt', 'createdBy', 'deletedAt'],
    listSelect: null,
    listInclude: null,
    detailInclude: null,
    relations: [],
    dependencies: [],
    permissions: {
      view: PERMISSIONS.MASTERS_VIEW,
      manage: PERMISSIONS.MASTERS_MANAGE,
    },
    ...overrides,
  };
}

/**
 * @type {Record<string, object>}
 */
export const MASTER_ENTITY_REGISTRY = {
  department: baseEntity({
    prismaModel: 'department',
    label: 'Department',
    searchableFields: ['name', 'code', 'description'],
    filterFields: ['isActive', 'branchId'],
    createFields: ['code', 'name', 'description', 'branchId', 'isActive', 'sortOrder'],
    updateFields: ['code', 'name', 'description', 'branchId', 'isActive', 'sortOrder'],
    listInclude: {
      branch: { select: { id: true, code: true, name: true } },
    },
    detailInclude: {
      branch: { select: { id: true, code: true, name: true } },
    },
    relations: [
      { field: 'branchId', prismaModel: 'branch', required: false, label: 'Branch' },
    ],
    dependencies: [],
  }),

  country: baseEntity({
    prismaModel: 'country',
    label: 'Country',
    searchableFields: ['name', 'code', 'isoCode', 'nationality'],
    createFields: ['code', 'name', 'isoCode', 'phoneCode', 'currencyCode', 'nationality', 'description', 'isActive', 'sortOrder'],
    updateFields: ['code', 'name', 'isoCode', 'phoneCode', 'currencyCode', 'nationality', 'description', 'isActive', 'sortOrder'],
    dependencies: [
      { prismaModel: 'university', foreignKey: 'countryId', label: 'universities' },
      { prismaModel: 'visaType', foreignKey: 'countryId', label: 'visa types' },
      { prismaModel: 'embassy', foreignKey: 'countryId', label: 'embassies' },
      { prismaModel: 'documentRequirement', foreignKey: 'countryId', label: 'document requirements' },
      { prismaModel: 'course', foreignKey: 'countryId', label: 'courses' },
      { prismaModel: 'branch', foreignKey: 'countryId', label: 'branches' },
      { prismaModel: 'company', foreignKey: 'countryId', label: 'companies' },
    ],
  }),

  university: baseEntity({
    prismaModel: 'university',
    label: 'University',
    searchableFields: ['name', 'code', 'city', 'state'],
    filterFields: ['isActive', 'countryId'],
    createFields: ['code', 'name', 'countryId', 'city', 'state', 'website', 'ranking', 'universityType', 'description', 'isActive', 'sortOrder'],
    updateFields: ['code', 'name', 'countryId', 'city', 'state', 'website', 'ranking', 'universityType', 'description', 'isActive', 'sortOrder'],
    listInclude: {
      country: { select: { id: true, code: true, name: true } },
    },
    detailInclude: {
      country: { select: { id: true, code: true, name: true } },
    },
    relations: [
      { field: 'countryId', prismaModel: 'country', required: true, label: 'Country' },
    ],
    dependencies: [
      { prismaModel: 'course', foreignKey: 'universityId', label: 'courses' },
    ],
  }),

  course: baseEntity({
    prismaModel: 'course',
    label: 'Course',
    searchableFields: ['name', 'code', 'discipline', 'level'],
    filterFields: ['isActive', 'countryId', 'universityId', 'level'],
    createFields: [
      'code', 'name', 'universityId', 'countryId', 'level', 'discipline',
      'duration', 'durationUnit', 'tuitionFee', 'currencyCode', 'intakeAvailable',
      'description', 'isActive', 'sortOrder',
    ],
    updateFields: [
      'code', 'name', 'universityId', 'countryId', 'level', 'discipline',
      'duration', 'durationUnit', 'tuitionFee', 'currencyCode', 'intakeAvailable',
      'description', 'isActive', 'sortOrder',
    ],
    listInclude: {
      university: { select: { id: true, code: true, name: true } },
      country: { select: { id: true, code: true, name: true } },
    },
    detailInclude: {
      university: { select: { id: true, code: true, name: true } },
      country: { select: { id: true, code: true, name: true } },
    },
    relations: [
      { field: 'universityId', prismaModel: 'university', required: true, label: 'University' },
      { field: 'countryId', prismaModel: 'country', required: false, label: 'Country' },
    ],
    dependencies: [],
  }),

  intake: baseEntity({
    prismaModel: 'intake',
    label: 'Intake',
    searchableFields: ['name', 'code'],
    createFields: ['code', 'name', 'startDate', 'endDate', 'applicationDeadline', 'description', 'isActive', 'sortOrder'],
    updateFields: ['code', 'name', 'startDate', 'endDate', 'applicationDeadline', 'description', 'isActive', 'sortOrder'],
  }),

  qualification: baseEntity({
    prismaModel: 'qualification',
    label: 'Qualification',
    searchableFields: ['name', 'code', 'level'],
    createFields: ['code', 'name', 'level', 'description', 'isActive', 'sortOrder'],
    updateFields: ['code', 'name', 'level', 'description', 'isActive', 'sortOrder'],
  }),

  'visa-type': baseEntity({
    prismaModel: 'visaType',
    label: 'Visa Type',
    searchableFields: ['name', 'code', 'category'],
    filterFields: ['isActive', 'countryId'],
    createFields: [
      'code', 'name', 'countryId', 'category', 'description',
      'processingTime', 'fee', 'currencyCode', 'isActive', 'sortOrder',
    ],
    updateFields: [
      'code', 'name', 'countryId', 'category', 'description',
      'processingTime', 'fee', 'currencyCode', 'isActive', 'sortOrder',
    ],
    listInclude: {
      country: { select: { id: true, code: true, name: true } },
    },
    detailInclude: {
      country: { select: { id: true, code: true, name: true } },
    },
    relations: [
      { field: 'countryId', prismaModel: 'country', required: false, label: 'Country' },
    ],
    dependencies: [
      { prismaModel: 'documentRequirement', foreignKey: 'visaTypeId', label: 'document requirements' },
    ],
  }),

  'document-type': baseEntity({
    prismaModel: 'documentType',
    label: 'Document Type',
    searchableFields: ['name', 'code', 'category'],
    filterFields: ['isActive'],
    createFields: ['code', 'name', 'category', 'description', 'isActive', 'sortOrder'],
    updateFields: ['code', 'name', 'category', 'description', 'isActive', 'sortOrder'],
    dependencies: [
      { prismaModel: 'documentRequirement', foreignKey: 'documentTypeId', label: 'document requirements' },
    ],
  }),

  'document-requirement': baseEntity({
    prismaModel: 'documentRequirement',
    label: 'Document Requirement',
    searchableFields: ['name', 'code', 'applicableFor'],
    filterFields: ['isActive', 'documentTypeId', 'countryId', 'visaTypeId', 'isMandatory'],
    createFields: [
      'code', 'name', 'documentTypeId', 'countryId', 'visaTypeId',
      'applicableFor', 'isMandatory', 'description', 'isActive', 'sortOrder',
    ],
    updateFields: [
      'code', 'name', 'documentTypeId', 'countryId', 'visaTypeId',
      'applicableFor', 'isMandatory', 'description', 'isActive', 'sortOrder',
    ],
    listInclude: {
      documentType: { select: { id: true, code: true, name: true } },
      country: { select: { id: true, code: true, name: true } },
      visaType: { select: { id: true, code: true, name: true } },
    },
    detailInclude: {
      documentType: { select: { id: true, code: true, name: true } },
      country: { select: { id: true, code: true, name: true } },
      visaType: { select: { id: true, code: true, name: true } },
    },
    relations: [
      { field: 'documentTypeId', prismaModel: 'documentType', required: true, label: 'Document Type' },
      { field: 'countryId', prismaModel: 'country', required: false, label: 'Country' },
      { field: 'visaTypeId', prismaModel: 'visaType', required: false, label: 'Visa Type' },
    ],
  }),

  embassy: baseEntity({
    prismaModel: 'embassy',
    label: 'Embassy',
    searchableFields: ['name', 'code', 'city'],
    filterFields: ['isActive', 'countryId'],
    createFields: [
      'code', 'name', 'countryId', 'city', 'address', 'phone', 'email',
      'website', 'jurisdiction', 'description', 'isActive', 'sortOrder',
    ],
    updateFields: [
      'code', 'name', 'countryId', 'city', 'address', 'phone', 'email',
      'website', 'jurisdiction', 'description', 'isActive', 'sortOrder',
    ],
    listInclude: {
      country: { select: { id: true, code: true, name: true } },
    },
    detailInclude: {
      country: { select: { id: true, code: true, name: true } },
    },
    relations: [
      { field: 'countryId', prismaModel: 'country', required: false, label: 'Country' },
    ],
  }),

  currency: baseEntity({
    prismaModel: 'currency',
    label: 'Currency',
    searchableFields: ['name', 'code', 'symbol'],
    createFields: ['code', 'name', 'symbol', 'decimalPlaces', 'description', 'isActive', 'sortOrder'],
    updateFields: ['code', 'name', 'symbol', 'decimalPlaces', 'description', 'isActive', 'sortOrder'],
  }),

  'payment-mode': baseEntity({
    prismaModel: 'paymentMode',
    label: 'Payment Mode',
    searchableFields: ['name', 'code'],
    createFields: ['code', 'name', 'description', 'isActive', 'sortOrder'],
    updateFields: ['code', 'name', 'description', 'isActive', 'sortOrder'],
  }),

  tax: baseEntity({
    prismaModel: 'tax',
    label: 'Tax',
    searchableFields: ['name', 'code'],
    createFields: ['code', 'name', 'taxPercentage', 'description', 'isActive', 'sortOrder'],
    updateFields: ['code', 'name', 'taxPercentage', 'description', 'isActive', 'sortOrder'],
  }),

  'lead-source': baseEntity({
    prismaModel: 'leadSource',
    label: 'Lead Source',
    searchableFields: ['name', 'code'],
    createFields: ['code', 'name', 'description', 'isActive', 'sortOrder'],
    updateFields: ['code', 'name', 'description', 'isActive', 'sortOrder'],
  }),

  'lead-status': baseEntity({
    prismaModel: 'crmLeadStatus',
    label: 'Lead Status',
    searchableFields: ['name', 'code'],
    createFields: ['code', 'name', 'description', 'isActive', 'sortOrder'],
    updateFields: ['code', 'name', 'description', 'isActive', 'sortOrder'],
  }),

  'lost-reason': baseEntity({
    prismaModel: 'lostReason',
    label: 'Lost Reason',
    searchableFields: ['name', 'code'],
    createFields: ['code', 'name', 'description', 'isActive', 'sortOrder'],
    updateFields: ['code', 'name', 'description', 'isActive', 'sortOrder'],
  }),

  'followup-type': baseEntity({
    prismaModel: 'followupType',
    label: 'Follow-up Type',
    searchableFields: ['name', 'code'],
    createFields: ['code', 'name', 'description', 'isActive', 'sortOrder'],
    updateFields: ['code', 'name', 'description', 'isActive', 'sortOrder'],
  }),

  'visit-purpose': baseEntity({
    prismaModel: 'visitPurpose',
    label: 'Visit Purpose',
    searchableFields: ['name', 'code'],
    createFields: ['code', 'name', 'description', 'isActive', 'sortOrder'],
    updateFields: ['code', 'name', 'description', 'isActive', 'sortOrder'],
  }),

  'counsellor-skill': baseEntity({
    prismaModel: 'counsellorSkill',
    label: 'Counsellor Skill',
    searchableFields: ['name', 'code'],
    createFields: ['code', 'name', 'description', 'isActive', 'sortOrder'],
    updateFields: ['code', 'name', 'description', 'isActive', 'sortOrder'],
  }),

  'communication-template': baseEntity({
    prismaModel: 'communicationTemplate',
    label: 'Communication Template',
    searchableFields: ['name', 'code', 'subject', 'channel', 'eventType'],
    filterFields: ['isActive', 'channel'],
    createFields: [
      'code', 'name', 'channel', 'subject', 'body', 'variables',
      'eventType', 'description', 'isActive', 'sortOrder',
    ],
    updateFields: [
      'code', 'name', 'channel', 'subject', 'body', 'variables',
      'eventType', 'description', 'isActive', 'sortOrder',
    ],
  }),
};

export const RELATIONAL_MASTER_SLUGS = Object.keys(MASTER_ENTITY_REGISTRY);

export function getMasterEntityConfig(slug) {
  if (!slug) return null;
  return MASTER_ENTITY_REGISTRY[String(slug).toLowerCase()] || null;
}

export function isRelationalMasterEntity(slug) {
  return Boolean(getMasterEntityConfig(slug));
}
