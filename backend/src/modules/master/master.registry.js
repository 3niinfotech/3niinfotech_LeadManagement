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
    filterFields: ['isActive'],
    createFields: [],
    updateFields: [],
    immutableFields: ['id', 'companyId', 'createdAt', 'createdBy', 'deletedAt'],
    listSelect: null,
    listInclude: null,
    detailInclude: null,
    relations: [],
    dependencies: [],
    usage: [],
    uniqueName: false,
    uniqueNameScope: [],
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
    createFields: ['code', 'name', 'isoCode', 'phoneCode', 'currencyCode', 'nationality', 'flagImageUrl', 'showOnMain', 'description', 'isActive', 'sortOrder'],
    updateFields: ['code', 'name', 'isoCode', 'phoneCode', 'currencyCode', 'nationality', 'flagImageUrl', 'showOnMain', 'description', 'isActive', 'sortOrder'],
    uniqueName: true,
    filterFields: ['isActive', 'showOnMain'],
    dependencies: [
      { prismaModel: 'university', foreignKey: 'countryId', label: 'universities' },
      { prismaModel: 'visaType', foreignKey: 'countryId', label: 'visa types' },
      { prismaModel: 'embassy', foreignKey: 'countryId', label: 'embassies' },
      { prismaModel: 'documentRequirement', foreignKey: 'countryId', label: 'document requirements' },
      { prismaModel: 'course', foreignKey: 'countryId', label: 'courses' },
      { prismaModel: 'branch', foreignKey: 'countryId', label: 'branches' },
      { prismaModel: 'company', foreignKey: 'countryId', label: 'companies' },
      { prismaModel: 'learningResource', foreignKey: 'countryId', label: 'learning resources' },
      { prismaModel: 'applicationChecklist', foreignKey: 'countryId', label: 'application checklist items' },
      { prismaModel: 'applicationStatusMaster', foreignKey: 'countryId', label: 'application statuses' },
      { prismaModel: 'visaChecklist', foreignKey: 'countryId', label: 'visa checklist items' },
      { prismaModel: 'visaStatusMaster', foreignKey: 'countryId', label: 'visa statuses' },
    ],
    usage: [
      { model: 'enquiry', field: 'interestedCountry', label: 'enquiries', via: 'branch' },
      { model: 'student', field: 'country', label: 'students', via: 'branch' },
      { model: 'application', field: 'country', label: 'applications', via: 'student.branch' },
      { model: 'visa', field: 'country', label: 'visa records', via: 'student.branch' },
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
    uniqueName: true,
    dependencies: [
      { prismaModel: 'course', foreignKey: 'universityId', label: 'courses' },
    ],
    usage: [
      { model: 'student', field: 'university', label: 'students', via: 'branch' },
      { model: 'application', field: 'university', label: 'applications', via: 'student.branch' },
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
    uniqueName: true,
    relations: [
      { field: 'universityId', prismaModel: 'university', required: true, label: 'University' },
      { field: 'countryId', prismaModel: 'country', required: false, label: 'Country' },
    ],
    usage: [
      { model: 'enquiry', field: 'interestedCourse', label: 'enquiries', via: 'branch' },
      { model: 'student', field: 'course', label: 'students', via: 'branch' },
      { model: 'application', field: 'course', label: 'applications', via: 'student.branch' },
    ],
  }),

  intake: baseEntity({
    prismaModel: 'intake',
    label: 'Intake',
    searchableFields: ['name', 'code'],
    createFields: ['code', 'name', 'startDate', 'endDate', 'applicationDeadline', 'description', 'isActive', 'sortOrder'],
    updateFields: ['code', 'name', 'startDate', 'endDate', 'applicationDeadline', 'description', 'isActive', 'sortOrder'],
    uniqueName: true,
    usage: [
      { model: 'enquiry', field: 'intake', label: 'enquiries', via: 'branch' },
      { model: 'student', field: 'intake', label: 'students', via: 'branch' },
      { model: 'application', field: 'intake', label: 'applications', via: 'student.branch' },
    ],
  }),

  qualification: baseEntity({
    prismaModel: 'qualification',
    label: 'Qualification',
    searchableFields: ['name', 'code', 'level'],
    createFields: ['code', 'name', 'level', 'description', 'isActive', 'sortOrder'],
    updateFields: ['code', 'name', 'level', 'description', 'isActive', 'sortOrder'],
    uniqueName: true,
    usage: [
      { model: 'enquiry', field: 'highestQual', label: 'enquiries', via: 'branch' },
    ],
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
    uniqueName: true,
    uniqueNameScope: ['countryId'],
    usage: [
      { model: 'visa', field: 'visaType', label: 'visa records', via: 'student.branch' },
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
      { prismaModel: 'visaChecklist', foreignKey: 'documentTypeId', label: 'visa checklist items' },
    ],
    uniqueName: true,
  }),

  'document-requirement': baseEntity({
    prismaModel: 'documentRequirement',
    label: 'Document Requirement',
    searchableFields: ['name', 'code', 'applicableFor'],
    filterFields: ['isActive', 'documentTypeId', 'countryId', 'visaTypeId', 'isMandatory', 'applicableFor'],
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
    uniqueName: true,
  }),

  currency: baseEntity({
    prismaModel: 'currency',
    label: 'Currency',
    searchableFields: ['name', 'code', 'symbol'],
    createFields: ['code', 'name', 'symbol', 'decimalPlaces', 'description', 'isActive', 'sortOrder'],
    updateFields: ['code', 'name', 'symbol', 'decimalPlaces', 'description', 'isActive', 'sortOrder'],
    uniqueName: true,
    usage: [
      { model: 'invoice', field: 'currency', label: 'invoices', via: 'student.branch' },
    ],
  }),

  'payment-mode': baseEntity({
    prismaModel: 'paymentMode',
    label: 'Payment Mode',
    searchableFields: ['name', 'code'],
    createFields: ['code', 'name', 'description', 'isActive', 'sortOrder'],
    updateFields: ['code', 'name', 'description', 'isActive', 'sortOrder'],
    uniqueName: true,
  }),

  tax: baseEntity({
    prismaModel: 'tax',
    label: 'Tax',
    searchableFields: ['name', 'code'],
    createFields: ['code', 'name', 'taxPercentage', 'description', 'isActive', 'sortOrder'],
    updateFields: ['code', 'name', 'taxPercentage', 'description', 'isActive', 'sortOrder'],
    uniqueName: true,
  }),

  'lead-source': baseEntity({
    prismaModel: 'leadSource',
    label: 'Lead Source',
    searchableFields: ['name', 'code'],
    createFields: ['code', 'name', 'description', 'isActive', 'sortOrder'],
    updateFields: ['code', 'name', 'description', 'isActive', 'sortOrder'],
    uniqueName: true,
    usage: [
      { model: 'enquiry', field: 'source', label: 'enquiries', via: 'branch' },
    ],
  }),

  'lead-status': baseEntity({
    prismaModel: 'crmLeadStatus',
    label: 'Lead Status',
    searchableFields: ['name', 'code'],
    defaultSort: 'sortOrder',
    sortableFields: ['name', 'code', 'sortOrder', 'isActive', 'createdAt'],
    createFields: ['code', 'name', 'description', 'defaultStatus', 'colorCode', 'isActive', 'sortOrder'],
    updateFields: ['code', 'name', 'description', 'defaultStatus', 'colorCode', 'isActive', 'sortOrder'],
    uniqueName: true,
  }),

  'lost-reason': baseEntity({
    prismaModel: 'lostReason',
    label: 'Lost Reason',
    searchableFields: ['name', 'code'],
    createFields: ['code', 'name', 'description', 'isActive', 'sortOrder'],
    updateFields: ['code', 'name', 'description', 'isActive', 'sortOrder'],
    uniqueName: true,
  }),

  'followup-type': baseEntity({
    prismaModel: 'followupType',
    label: 'Follow-up Type',
    searchableFields: ['name', 'code'],
    createFields: ['code', 'name', 'description', 'isActive', 'sortOrder'],
    updateFields: ['code', 'name', 'description', 'isActive', 'sortOrder'],
    uniqueName: true,
  }),

  'visit-purpose': baseEntity({
    prismaModel: 'visitPurpose',
    label: 'Visit Purpose',
    searchableFields: ['name', 'code'],
    createFields: ['code', 'name', 'description', 'isActive', 'sortOrder'],
    updateFields: ['code', 'name', 'description', 'isActive', 'sortOrder'],
    uniqueName: true,
  }),

  'counsellor-skill': baseEntity({
    prismaModel: 'counsellorSkill',
    label: 'Counsellor Skill',
    searchableFields: ['name', 'code'],
    createFields: ['code', 'name', 'description', 'isActive', 'sortOrder'],
    updateFields: ['code', 'name', 'description', 'isActive', 'sortOrder'],
    uniqueName: true,
  }),

  faculty: baseEntity({
    prismaModel: 'faculty',
    label: 'Faculty',
    searchableFields: ['name', 'code', 'email', 'phone', 'description'],
    filterFields: ['isActive', 'branchId'],
    createFields: ['code', 'name', 'email', 'phone', 'description', 'branchId', 'isActive', 'sortOrder'],
    updateFields: ['code', 'name', 'email', 'phone', 'description', 'branchId', 'isActive', 'sortOrder'],
    uniqueName: true,
    listInclude: {
      branch: { select: { id: true, code: true, name: true } },
    },
    detailInclude: {
      branch: { select: { id: true, code: true, name: true } },
    },
    relations: [
      { field: 'branchId', prismaModel: 'branch', required: false, label: 'Branch' },
    ],
    usage: [
      { model: 'enquiryDemo', field: 'facultyId', label: 'demo sessions' },
    ],
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
    uniqueName: true,
    uniqueNameScope: ['channel'],
  }),

  'application-checklist': baseEntity({
    prismaModel: 'applicationChecklist',
    label: 'Application Checklist',
    searchableFields: ['name', 'documentType'],
    filterFields: ['isActive', 'countryId'],
    createFields: ['name', 'countryId', 'documentType', 'enquiryForm', 'isMandatory', 'isActive', 'sortOrder'],
    updateFields: ['name', 'countryId', 'documentType', 'enquiryForm', 'isMandatory', 'isActive', 'sortOrder'],
    listInclude: {
      country: { select: { id: true, code: true, name: true } },
    },
    detailInclude: {
      country: { select: { id: true, code: true, name: true } },
    },
    relations: [
      { field: 'countryId', prismaModel: 'country', required: true, label: 'Country' },
    ],
    uniqueName: true,
    uniqueNameScope: ['countryId', 'documentType'],
  }),

  'application-status-master': baseEntity({
    prismaModel: 'applicationStatusMaster',
    label: 'Application Status',
    searchableFields: ['name'],
    filterFields: ['isActive', 'countryId'],
    createFields: ['name', 'countryId', 'mailSend', 'defaultStatus', 'setOfferLetter', 'position', 'isActive'],
    updateFields: ['name', 'countryId', 'mailSend', 'defaultStatus', 'setOfferLetter', 'position', 'isActive'],
    defaultSort: 'position',
    listInclude: {
      country: { select: { id: true, code: true, name: true } },
    },
    detailInclude: {
      country: { select: { id: true, code: true, name: true } },
    },
    relations: [
      { field: 'countryId', prismaModel: 'country', required: true, label: 'Country' },
    ],
    dependencies: [],
    optionLabelField: 'name',
    optionValueField: 'id',
    sortableFields: ['name', 'position', 'isActive', 'createdAt'],
    uniqueName: true,
    uniqueNameScope: ['countryId'],
  }),

  'visa-checklist': baseEntity({
    prismaModel: 'visaChecklist',
    label: 'Visa Checklist',
    searchableFields: ['name', 'documentType'],
    filterFields: ['isActive', 'countryId'],
    createFields: ['name', 'countryId', 'documentTypeId', 'documentType', 'isMandatory', 'isActive', 'sortOrder'],
    updateFields: ['name', 'countryId', 'documentTypeId', 'documentType', 'isMandatory', 'isActive', 'sortOrder'],
    listInclude: {
      country: { select: { id: true, code: true, name: true } },
      documentTypeRel: { select: { id: true, code: true, name: true } },
    },
    detailInclude: {
      country: { select: { id: true, code: true, name: true } },
      documentTypeRel: { select: { id: true, code: true, name: true } },
    },
    relations: [
      { field: 'countryId', prismaModel: 'country', required: true, label: 'Country' },
      { field: 'documentTypeId', prismaModel: 'documentType', required: false, label: 'Document Type' },
    ],
    uniqueName: true,
    uniqueNameScope: ['countryId', 'documentType'],
  }),

  'visa-status-master': baseEntity({
    prismaModel: 'visaStatusMaster',
    label: 'Visa Status',
    searchableFields: ['name'],
    filterFields: ['isActive', 'countryId'],
    createFields: [
      'name', 'countryId', 'visaApproved', 'visaWithdraw', 'visaRejected',
      'mailSend', 'defaultStatus', 'position', 'colorCode', 'isActive',
    ],
    updateFields: [
      'name', 'countryId', 'visaApproved', 'visaWithdraw', 'visaRejected',
      'mailSend', 'defaultStatus', 'position', 'colorCode', 'isActive',
    ],
    defaultSort: 'position',
    listInclude: {
      country: { select: { id: true, code: true, name: true } },
    },
    detailInclude: {
      country: { select: { id: true, code: true, name: true } },
    },
    relations: [
      { field: 'countryId', prismaModel: 'country', required: true, label: 'Country' },
    ],
    dependencies: [],
    optionLabelField: 'name',
    optionValueField: 'id',
    sortableFields: ['name', 'position', 'isActive', 'createdAt'],
    uniqueName: true,
    uniqueNameScope: ['countryId'],
  }),

  'student-status-master': baseEntity({
    prismaModel: 'studentStatusMaster',
    label: 'Student Status',
    searchableFields: ['name', 'code'],
    defaultSort: 'sortOrder',
    sortableFields: ['name', 'code', 'sortOrder', 'isActive', 'createdAt'],
    createFields: ['code', 'name', 'description', 'defaultStatus', 'colorCode', 'isActive', 'sortOrder'],
    updateFields: ['code', 'name', 'description', 'defaultStatus', 'colorCode', 'isActive', 'sortOrder'],
    uniqueName: true,
  }),

  'learning-resource': baseEntity({
    prismaModel: 'learningResource',
    label: 'Learning Resource',
    searchableFields: ['name', 'code', 'category', 'url'],
    filterFields: ['isActive', 'countryId'],
    createFields: ['code', 'name', 'countryId', 'category', 'url', 'fileUrl', 'description', 'isActive', 'sortOrder'],
    updateFields: ['code', 'name', 'countryId', 'category', 'url', 'fileUrl', 'description', 'isActive', 'sortOrder'],
    listInclude: {
      country: { select: { id: true, code: true, name: true } },
    },
    detailInclude: {
      country: { select: { id: true, code: true, name: true } },
    },
    relations: [
      { field: 'countryId', prismaModel: 'country', required: false, label: 'Country' },
    ],
    uniqueName: true,
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
