/**
 * Relational master entity engine configs (W2).
 * Consumed by master-registry.config.js — not a second hub registry.
 */
import { z } from 'zod';
import { PERMISSIONS } from './permissions';

const reqStr = (label, max = 200) => z.string().min(1, `${label} is required`).max(max);
const optStr = (max = 500) => z.string().max(max).optional().nullable().or(z.literal(''));
const optUuid = () => z.string().uuid().optional().nullable().or(z.literal(''));

function baseFields() {
  return [
    { name: 'code', label: 'Code', type: 'text', required: true, maxLength: 80 },
    { name: 'name', label: 'Name', type: 'text', required: true, maxLength: 200 },
  ];
}

function tailFields(extra = []) {
  return [
    ...extra,
    { name: 'description', label: 'Description', type: 'textarea', required: false },
    { name: 'sortOrder', label: 'Sort Order', type: 'number', required: false },
    { name: 'isActive', label: 'Active', type: 'switch', required: false },
  ];
}

const statusFilter = {
  name: 'status',
  label: 'Status',
  type: 'select',
  options: [
    { value: 'all', label: 'All' },
    { value: 'active', label: 'Active' },
    { value: 'inactive', label: 'Inactive' },
  ],
  defaultValue: 'all',
};

function commonColumns(extra = []) {
  return [
    { field: 'code', headerName: 'Code', minWidth: 110, sortable: true },
    { field: 'name', headerName: 'Name', flex: 1, minWidth: 160, sortable: true },
    ...extra,
    { field: 'isActive', headerName: 'Status', width: 110, sortable: true, cellType: 'status' },
    { field: 'updatedAt', headerName: 'Updated', width: 140, sortable: true, cellType: 'datetime' },
  ];
}

function entity(config) {
  return {
    permissions: {
      view: PERMISSIONS.MASTERS_VIEW,
      manage: PERMISSIONS.MASTERS_MANAGE,
    },
    defaultSort: 'sortOrder',
    defaultSortDirection: 'asc',
    pageSize: 25,
    filters: [statusFilter],
    ...config,
  };
}

export const MASTER_ENTITY_CONFIGS = {
  department: entity({
    entity: 'department',
    singular: 'Department',
    plural: 'Departments',
    description: 'Internal departments',
    columns: commonColumns([
      { field: 'branch.name', headerName: 'Branch', minWidth: 140, valueGetter: (p) => p.data?.branch?.name || '—' },
    ]),
    filters: [
      statusFilter,
      { name: 'branchId', label: 'Branch', type: 'branch' },
    ],
    fields: [
      ...baseFields(),
      { name: 'branchId', label: 'Branch', type: 'branch', required: false },
      ...tailFields(),
    ],
    schema: z.object({
      code: reqStr('Code', 80),
      name: reqStr('Name'),
      branchId: optUuid(),
      description: optStr(5000),
      sortOrder: z.coerce.number().int().min(0).optional(),
      isActive: z.boolean().optional(),
    }),
  }),

  country: entity({
    entity: 'country',
    singular: 'Country',
    plural: 'Countries',
    description: 'Study destinations',
    columns: commonColumns([
      { field: 'isoCode', headerName: 'ISO', width: 80, sortable: true },
      { field: 'phoneCode', headerName: 'Phone', width: 90 },
    ]),
    fields: [
      ...baseFields(),
      { name: 'isoCode', label: 'ISO Code', type: 'text', required: false, maxLength: 3 },
      { name: 'phoneCode', label: 'Phone Code', type: 'text', required: false },
      { name: 'currencyCode', label: 'Currency Code', type: 'text', required: false },
      { name: 'nationality', label: 'Nationality', type: 'text', required: false },
      ...tailFields(),
    ],
    schema: z.object({
      code: reqStr('Code', 80),
      name: reqStr('Name'),
      isoCode: optStr(10),
      phoneCode: optStr(20),
      currencyCode: optStr(10),
      nationality: optStr(100),
      description: optStr(5000),
      sortOrder: z.coerce.number().int().min(0).optional(),
      isActive: z.boolean().optional(),
    }),
  }),

  university: entity({
    entity: 'university',
    singular: 'University',
    plural: 'Universities',
    description: 'Partner universities',
    columns: commonColumns([
      { field: 'country.name', headerName: 'Country', minWidth: 120, valueGetter: (p) => p.data?.country?.name || '—' },
      { field: 'city', headerName: 'City', minWidth: 110 },
    ]),
    filters: [
      statusFilter,
      { name: 'countryId', label: 'Country', type: 'options', optionsEntity: 'country' },
    ],
    fields: [
      ...baseFields(),
      { name: 'countryId', label: 'Country', type: 'options', optionsEntity: 'country', required: true },
      { name: 'city', label: 'City', type: 'text', required: false },
      { name: 'state', label: 'State', type: 'text', required: false },
      { name: 'website', label: 'Website', type: 'text', required: false },
      ...tailFields(),
    ],
    schema: z.object({
      code: reqStr('Code', 80),
      name: reqStr('Name'),
      countryId: z.string().uuid('Country is required'),
      city: optStr(100),
      state: optStr(100),
      website: optStr(255),
      description: optStr(5000),
      sortOrder: z.coerce.number().int().min(0).optional(),
      isActive: z.boolean().optional(),
    }),
  }),

  course: entity({
    entity: 'course',
    singular: 'Course',
    plural: 'Courses',
    description: 'Programs and courses',
    columns: commonColumns([
      { field: 'university.name', headerName: 'University', minWidth: 150, valueGetter: (p) => p.data?.university?.name || '—' },
      { field: 'country.name', headerName: 'Country', minWidth: 110, valueGetter: (p) => p.data?.country?.name || '—' },
      { field: 'level', headerName: 'Level', width: 110 },
    ]),
    filters: [
      statusFilter,
      { name: 'countryId', label: 'Country', type: 'options', optionsEntity: 'country' },
      {
        name: 'universityId',
        label: 'University',
        type: 'options',
        optionsEntity: 'university',
        dependsOn: 'countryId',
        dependsParam: 'countryId',
      },
      { name: 'level', label: 'Level', type: 'text' },
    ],
    fields: [
      ...baseFields(),
      { name: 'countryId', label: 'Country', type: 'options', optionsEntity: 'country', required: false, clears: ['universityId'] },
      {
        name: 'universityId',
        label: 'University',
        type: 'options',
        optionsEntity: 'university',
        required: true,
        dependsOn: 'countryId',
        dependsParam: 'countryId',
      },
      { name: 'level', label: 'Level', type: 'text', required: false },
      { name: 'discipline', label: 'Discipline', type: 'text', required: false },
      ...tailFields(),
    ],
    schema: z.object({
      code: reqStr('Code', 80),
      name: reqStr('Name'),
      universityId: z.string().uuid('University is required'),
      countryId: optUuid(),
      level: optStr(100),
      discipline: optStr(100),
      description: optStr(5000),
      sortOrder: z.coerce.number().int().min(0).optional(),
      isActive: z.boolean().optional(),
    }),
  }),

  intake: entity({
    entity: 'intake',
    singular: 'Intake',
    plural: 'Intakes',
    description: 'Intake seasons',
    columns: commonColumns(),
    fields: [...baseFields(), ...tailFields()],
    schema: z.object({
      code: reqStr('Code', 80),
      name: reqStr('Name'),
      description: optStr(5000),
      sortOrder: z.coerce.number().int().min(0).optional(),
      isActive: z.boolean().optional(),
    }),
  }),

  qualification: entity({
    entity: 'qualification',
    singular: 'Qualification',
    plural: 'Qualifications',
    description: 'Education levels',
    columns: commonColumns([
      { field: 'level', headerName: 'Level', width: 130 },
    ]),
    fields: [
      ...baseFields(),
      { name: 'level', label: 'Level', type: 'text', required: false },
      ...tailFields(),
    ],
    schema: z.object({
      code: reqStr('Code', 80),
      name: reqStr('Name'),
      level: optStr(100),
      description: optStr(5000),
      sortOrder: z.coerce.number().int().min(0).optional(),
      isActive: z.boolean().optional(),
    }),
  }),

  'visa-type': entity({
    entity: 'visa-type',
    singular: 'Visa Type',
    plural: 'Visa Types',
    description: 'Visa categories',
    columns: commonColumns([
      { field: 'country.name', headerName: 'Country', minWidth: 120, valueGetter: (p) => p.data?.country?.name || '—' },
      { field: 'category', headerName: 'Category', width: 110 },
    ]),
    filters: [
      statusFilter,
      { name: 'countryId', label: 'Country', type: 'options', optionsEntity: 'country' },
    ],
    fields: [
      ...baseFields(),
      { name: 'countryId', label: 'Country', type: 'options', optionsEntity: 'country', required: false },
      { name: 'category', label: 'Category', type: 'text', required: false },
      ...tailFields(),
    ],
    schema: z.object({
      code: reqStr('Code', 80),
      name: reqStr('Name'),
      countryId: optUuid(),
      category: optStr(100),
      description: optStr(5000),
      sortOrder: z.coerce.number().int().min(0).optional(),
      isActive: z.boolean().optional(),
    }),
  }),

  'document-type': entity({
    entity: 'document-type',
    singular: 'Document Type',
    plural: 'Document Types',
    description: 'Reusable document catalog',
    columns: commonColumns([
      { field: 'category', headerName: 'Category', width: 120 },
    ]),
    fields: [
      ...baseFields(),
      { name: 'category', label: 'Category', type: 'text', required: false },
      ...tailFields(),
    ],
    schema: z.object({
      code: reqStr('Code', 80),
      name: reqStr('Name'),
      category: optStr(100),
      description: optStr(5000),
      sortOrder: z.coerce.number().int().min(0).optional(),
      isActive: z.boolean().optional(),
    }),
  }),

  'document-requirement': entity({
    entity: 'document-requirement',
    singular: 'Document Requirement',
    plural: 'Document Requirements',
    description: 'Document rules by country / visa',
    columns: commonColumns([
      { field: 'documentType.name', headerName: 'Document', minWidth: 140, valueGetter: (p) => p.data?.documentType?.name || '—' },
      { field: 'country.name', headerName: 'Country', minWidth: 110, valueGetter: (p) => p.data?.country?.name || '—' },
      { field: 'visaType.name', headerName: 'Visa Type', minWidth: 120, valueGetter: (p) => p.data?.visaType?.name || '—' },
      { field: 'isMandatory', headerName: 'Mandatory', width: 110, cellType: 'bool' },
    ]),
    filters: [
      statusFilter,
      { name: 'documentTypeId', label: 'Document Type', type: 'options', optionsEntity: 'document-type' },
      { name: 'countryId', label: 'Country', type: 'options', optionsEntity: 'country' },
      { name: 'visaTypeId', label: 'Visa Type', type: 'options', optionsEntity: 'visa-type', dependsOn: 'countryId', dependsParam: 'countryId' },
      {
        name: 'isMandatory',
        label: 'Mandatory',
        type: 'select',
        options: [
          { value: '', label: 'All' },
          { value: 'true', label: 'Yes' },
          { value: 'false', label: 'No' },
        ],
      },
    ],
    fields: [
      ...baseFields(),
      { name: 'documentTypeId', label: 'Document Type', type: 'options', optionsEntity: 'document-type', required: true },
      { name: 'countryId', label: 'Country', type: 'options', optionsEntity: 'country', required: false, clears: ['visaTypeId'] },
      {
        name: 'visaTypeId',
        label: 'Visa Type',
        type: 'options',
        optionsEntity: 'visa-type',
        required: false,
        dependsOn: 'countryId',
        dependsParam: 'countryId',
      },
      { name: 'applicableFor', label: 'Applicable For', type: 'text', required: false },
      { name: 'isMandatory', label: 'Mandatory', type: 'switch', required: false },
      ...tailFields(),
    ],
    schema: z.object({
      code: reqStr('Code', 80),
      name: reqStr('Name'),
      documentTypeId: z.string().uuid('Document Type is required'),
      countryId: optUuid(),
      visaTypeId: optUuid(),
      applicableFor: optStr(100),
      isMandatory: z.boolean().optional(),
      description: optStr(5000),
      sortOrder: z.coerce.number().int().min(0).optional(),
      isActive: z.boolean().optional(),
    }),
  }),

  embassy: entity({
    entity: 'embassy',
    singular: 'Embassy',
    plural: 'Embassies',
    description: 'Embassy locations',
    columns: commonColumns([
      { field: 'country.name', headerName: 'Country', minWidth: 120, valueGetter: (p) => p.data?.country?.name || '—' },
      { field: 'city', headerName: 'City', minWidth: 110 },
    ]),
    filters: [
      statusFilter,
      { name: 'countryId', label: 'Country', type: 'options', optionsEntity: 'country' },
    ],
    fields: [
      ...baseFields(),
      { name: 'countryId', label: 'Country', type: 'options', optionsEntity: 'country', required: false },
      { name: 'city', label: 'City', type: 'text', required: false },
      ...tailFields(),
    ],
    schema: z.object({
      code: reqStr('Code', 80),
      name: reqStr('Name'),
      countryId: optUuid(),
      city: optStr(100),
      description: optStr(5000),
      sortOrder: z.coerce.number().int().min(0).optional(),
      isActive: z.boolean().optional(),
    }),
  }),

  currency: entity({
    entity: 'currency',
    singular: 'Currency',
    plural: 'Currencies',
    description: 'Supported currencies',
    columns: commonColumns([
      { field: 'symbol', headerName: 'Symbol', width: 90 },
    ]),
    fields: [
      ...baseFields(),
      { name: 'symbol', label: 'Symbol', type: 'text', required: false },
      { name: 'decimalPlaces', label: 'Decimal Places', type: 'number', required: false },
      ...tailFields(),
    ],
    schema: z.object({
      code: reqStr('Code', 80),
      name: reqStr('Name'),
      symbol: optStr(20),
      decimalPlaces: z.coerce.number().int().min(0).max(6).optional(),
      description: optStr(5000),
      sortOrder: z.coerce.number().int().min(0).optional(),
      isActive: z.boolean().optional(),
    }),
  }),

  'payment-mode': entity({
    entity: 'payment-mode',
    singular: 'Payment Mode',
    plural: 'Payment Modes',
    description: 'Payment methods',
    columns: commonColumns(),
    fields: [...baseFields(), ...tailFields()],
    schema: z.object({
      code: reqStr('Code', 80),
      name: reqStr('Name'),
      description: optStr(5000),
      sortOrder: z.coerce.number().int().min(0).optional(),
      isActive: z.boolean().optional(),
    }),
  }),

  tax: entity({
    entity: 'tax',
    singular: 'Tax',
    plural: 'Taxes',
    description: 'Tax configuration labels',
    columns: commonColumns([
      { field: 'taxPercentage', headerName: 'Rate %', width: 100, cellType: 'percent' },
    ]),
    fields: [
      ...baseFields(),
      { name: 'taxPercentage', label: 'Tax %', type: 'number', required: false },
      ...tailFields(),
    ],
    schema: z.object({
      code: reqStr('Code', 80),
      name: reqStr('Name'),
      taxPercentage: z.coerce.number().optional().nullable(),
      description: optStr(5000),
      sortOrder: z.coerce.number().int().min(0).optional(),
      isActive: z.boolean().optional(),
    }),
  }),

  'lead-source': entity({
    entity: 'lead-source',
    singular: 'Lead Source',
    plural: 'Lead Sources',
    description: 'Enquiry sources',
    columns: commonColumns(),
    fields: [...baseFields(), ...tailFields()],
    schema: z.object({
      code: reqStr('Code', 80),
      name: reqStr('Name'),
      description: optStr(5000),
      sortOrder: z.coerce.number().int().min(0).optional(),
      isActive: z.boolean().optional(),
    }),
  }),

  'lead-status': entity({
    entity: 'lead-status',
    singular: 'Lead Status',
    plural: 'Lead Statuses',
    description: 'CRM pipeline statuses',
    columns: commonColumns(),
    fields: [...baseFields(), ...tailFields()],
    schema: z.object({
      code: reqStr('Code', 80),
      name: reqStr('Name'),
      description: optStr(5000),
      sortOrder: z.coerce.number().int().min(0).optional(),
      isActive: z.boolean().optional(),
    }),
  }),

  'lost-reason': entity({
    entity: 'lost-reason',
    singular: 'Lost Reason',
    plural: 'Lost Reasons',
    description: 'Reasons for lost enquiries',
    columns: commonColumns(),
    fields: [...baseFields(), ...tailFields()],
    schema: z.object({
      code: reqStr('Code', 80),
      name: reqStr('Name'),
      description: optStr(5000),
      sortOrder: z.coerce.number().int().min(0).optional(),
      isActive: z.boolean().optional(),
    }),
  }),

  'followup-type': entity({
    entity: 'followup-type',
    singular: 'Follow-up Type',
    plural: 'Follow-up Types',
    description: 'Follow-up channels/types',
    columns: commonColumns(),
    fields: [...baseFields(), ...tailFields()],
    schema: z.object({
      code: reqStr('Code', 80),
      name: reqStr('Name'),
      description: optStr(5000),
      sortOrder: z.coerce.number().int().min(0).optional(),
      isActive: z.boolean().optional(),
    }),
  }),

  'visit-purpose': entity({
    entity: 'visit-purpose',
    singular: 'Visit Purpose',
    plural: 'Visit Purposes',
    description: 'Walk-in purposes',
    columns: commonColumns(),
    fields: [...baseFields(), ...tailFields()],
    schema: z.object({
      code: reqStr('Code', 80),
      name: reqStr('Name'),
      description: optStr(5000),
      sortOrder: z.coerce.number().int().min(0).optional(),
      isActive: z.boolean().optional(),
    }),
  }),

  'counsellor-skill': entity({
    entity: 'counsellor-skill',
    singular: 'Counsellor Skill',
    plural: 'Counsellor Skills',
    description: 'Assignment skills',
    columns: commonColumns(),
    fields: [...baseFields(), ...tailFields()],
    schema: z.object({
      code: reqStr('Code', 80),
      name: reqStr('Name'),
      description: optStr(5000),
      sortOrder: z.coerce.number().int().min(0).optional(),
      isActive: z.boolean().optional(),
    }),
  }),

  'communication-template': entity({
    entity: 'communication-template',
    singular: 'Communication Template',
    plural: 'Communication Templates',
    description: 'Email / SMS / WhatsApp templates',
    columns: commonColumns([
      { field: 'channel', headerName: 'Channel', width: 110, cellType: 'badge' },
      { field: 'subject', headerName: 'Subject', minWidth: 140 },
    ]),
    filters: [
      statusFilter,
      {
        name: 'channel',
        label: 'Channel',
        type: 'select',
        options: [
          { value: '', label: 'All' },
          { value: 'EMAIL', label: 'Email' },
          { value: 'SMS', label: 'SMS' },
          { value: 'WHATSAPP', label: 'WhatsApp' },
        ],
      },
    ],
    fields: [
      ...baseFields(),
      {
        name: 'channel',
        label: 'Channel',
        type: 'select',
        required: true,
        options: [
          { value: 'EMAIL', label: 'Email' },
          { value: 'SMS', label: 'SMS' },
          { value: 'WHATSAPP', label: 'WhatsApp' },
        ],
      },
      { name: 'subject', label: 'Subject', type: 'text', required: false },
      { name: 'body', label: 'Body', type: 'textarea', required: true },
      { name: 'eventType', label: 'Event Type', type: 'text', required: false },
      { name: 'variables', label: 'Variables (comma-separated)', type: 'text', required: false },
      { name: 'description', label: 'Description', type: 'textarea', required: false },
      { name: 'sortOrder', label: 'Sort Order', type: 'number', required: false },
      { name: 'isActive', label: 'Active', type: 'switch', required: false },
    ],
    schema: z.object({
      code: reqStr('Code', 80),
      name: reqStr('Name'),
      channel: reqStr('Channel', 50),
      subject: optStr(255),
      body: reqStr('Body', 10000),
      eventType: optStr(100),
      variables: optStr(1000),
      description: optStr(5000),
      sortOrder: z.coerce.number().int().min(0).optional(),
      isActive: z.boolean().optional(),
    }),
  }),
};

export const RELATIONAL_MASTER_ENTITIES = Object.keys(MASTER_ENTITY_CONFIGS);

export function getMasterEntityConfig(entityOrSlug) {
  if (!entityOrSlug) return null;
  const key = String(entityOrSlug).toLowerCase();
  if (MASTER_ENTITY_CONFIGS[key]) return MASTER_ENTITY_CONFIGS[key];
  // aliases
  if (key === 'document-checklist') return MASTER_ENTITY_CONFIGS['document-type'];
  if (key === 'enquiry-status') return MASTER_ENTITY_CONFIGS['lead-status'];
  return null;
}

export function isRelationalMasterEntity(slug) {
  return Boolean(getMasterEntityConfig(slug));
}
