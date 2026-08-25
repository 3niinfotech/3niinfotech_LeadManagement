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
      { field: 'showOnMain', headerName: 'Show on main', width: 120, cellType: 'bool' },
    ]),
    fields: [
      ...baseFields(),
      { name: 'isoCode', label: 'ISO Code', type: 'text', required: false, maxLength: 3 },
      { name: 'phoneCode', label: 'Phone Code', type: 'text', required: false },
      { name: 'currencyCode', label: 'Currency Code', type: 'text', required: false },
      { name: 'nationality', label: 'Nationality', type: 'text', required: false },
      { name: 'flagImageUrl', label: 'Flag image URL', type: 'text', required: false },
      { name: 'showOnMain', label: 'Show on main', type: 'switch', required: false },
      ...tailFields(),
    ],
    schema: z.object({
      code: reqStr('Code', 80),
      name: reqStr('Name'),
      isoCode: optStr(10),
      phoneCode: optStr(20),
      currencyCode: optStr(10),
      nationality: optStr(100),
      flagImageUrl: optStr(500),
      showOnMain: z.boolean().optional(),
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
      { field: 'applicableFor', headerName: 'Applies to', width: 120, cellType: 'badge' },
      { field: 'isMandatory', headerName: 'Mandatory', width: 110, cellType: 'bool' },
    ]),
    filters: [
      statusFilter,
      { name: 'documentTypeId', label: 'Document Type', type: 'options', optionsEntity: 'document-type' },
      { name: 'countryId', label: 'Country', type: 'options', optionsEntity: 'country' },
      { name: 'visaTypeId', label: 'Visa Type', type: 'options', optionsEntity: 'visa-type', dependsOn: 'countryId', dependsParam: 'countryId' },
      {
        name: 'applicableFor',
        label: 'Applies to',
        type: 'select',
        options: [
          { value: '', label: 'All' },
          { value: 'VISA', label: 'Visa' },
          { value: 'APPLICATION', label: 'Application' },
          { value: 'PARTNER', label: 'Partner' },
        ],
      },
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
      { name: 'applicableFor', label: 'Applicable For', type: 'select', required: false, options: [
        { value: '', label: 'General' },
        { value: 'VISA', label: 'Visa' },
        { value: 'APPLICATION', label: 'Application' },
        { value: 'PARTNER', label: 'Partner' },
      ] },
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
    singular: 'Enquiry Status',
    plural: 'Enquiry Statuses',
    description: 'CRM pipeline statuses for enquiries',
    defaultSort: 'sortOrder',
    columns: [
      { field: 'name', headerName: 'Status Name', flex: 1, minWidth: 160, sortable: true },
      { field: 'code', headerName: 'Code', width: 140, sortable: true },
      { field: 'defaultStatus', headerName: 'Default', width: 100, cellType: 'bool' },
      { field: 'colorCode', headerName: 'Color', width: 100 },
      { field: 'sortOrder', headerName: 'Position', width: 100, sortable: true },
      { field: 'isActive', headerName: 'Status', width: 110, cellType: 'status' },
      { field: 'updatedAt', headerName: 'Updated', width: 140, cellType: 'datetime' },
    ],
    fields: [
      { name: 'code', label: 'Code', type: 'text', required: true, maxLength: 80, placeholder: 'e.g. NEW' },
      { name: 'name', label: 'Status Name', type: 'text', required: true, maxLength: 200 },
      { name: 'defaultStatus', label: 'Default Status', type: 'switch', required: false },
      { name: 'colorCode', label: 'Color Code', type: 'text', required: false, maxLength: 50, placeholder: 'e.g. #3B82F6 or primary' },
      { name: 'description', label: 'Description', type: 'textarea', required: false },
      { name: 'sortOrder', label: 'Position', type: 'number', required: false, min: 0 },
      { name: 'isActive', label: 'Active', type: 'switch', required: false },
    ],
    schema: z.object({
      code: reqStr('Code', 80),
      name: reqStr('Status Name'),
      defaultStatus: z.boolean().optional(),
      colorCode: optStr(50),
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

  faculty: entity({
    entity: 'faculty',
    singular: 'Faculty',
    plural: 'Faculty',
    description: 'Demo and class faculty — separate from counsellors',
    columns: commonColumns([
      { field: 'description', headerName: 'Subject', minWidth: 160 },
      { field: 'branch.name', headerName: 'Branch', minWidth: 140, sortable: false, valueGetter: (p) => p.data?.branch?.name || '—' },
      { field: 'phone', headerName: 'Phone', minWidth: 120 },
      { field: 'email', headerName: 'Email', minWidth: 160 },
    ]),
    filters: [
      statusFilter,
      { name: 'branchId', label: 'Branch', type: 'branch' },
    ],
    fields: [
      ...baseFields(),
      { name: 'description', label: 'Subject / Specialization', type: 'textarea', required: false },
      { name: 'branchId', label: 'Branch', type: 'branch', required: false },
      { name: 'phone', label: 'Phone', type: 'text', required: false, maxLength: 30 },
      { name: 'email', label: 'Email', type: 'text', required: false, maxLength: 200 },
      { name: 'sortOrder', label: 'Sort Order', type: 'number', required: false },
      { name: 'isActive', label: 'Active', type: 'switch', required: false },
    ],
    schema: z.object({
      code: reqStr('Code', 80),
      name: reqStr('Name'),
      description: optStr(5000),
      branchId: optUuid(),
      phone: optStr(30),
      email: z.string().email('Enter a valid email').optional().nullable().or(z.literal('')),
      sortOrder: z.coerce.number().int().min(0).optional(),
      isActive: z.boolean().optional(),
    }),
  }),

  'application-checklist': entity({
    entity: 'application-checklist',
    singular: 'Application Checklist',
    plural: 'Application Checklists',
    description: 'Country-specific document checklist for applications',
    defaultSort: 'sortOrder',
    columns: [
      { field: 'country.name', headerName: 'Country', minWidth: 140, sortable: false, valueGetter: (p) => p.data?.country?.name || 'All Countries' },
      { field: 'documentType', headerName: 'Document Type', minWidth: 140, sortable: true },
      { field: 'name', headerName: 'Document Name', flex: 1, minWidth: 160, sortable: true },
      { field: 'enquiryForm', headerName: 'Enquiry Form', width: 120, cellType: 'bool' },
      { field: 'isMandatory', headerName: 'Mandatory', width: 110, cellType: 'bool' },
      { field: 'isActive', headerName: 'Status', width: 110, cellType: 'status' },
      { field: 'updatedAt', headerName: 'Updated', width: 140, cellType: 'datetime' },
    ],
    filters: [
      statusFilter,
      {
        name: 'countryId',
        label: 'Country',
        type: 'options',
        optionsEntity: 'country',
      },
    ],
    fields: [
      { name: 'countryId', label: 'Country', type: 'options', optionsEntity: 'country', required: true },
      { name: 'documentType', label: 'Document Type', type: 'options', optionsEntity: 'document-type', optionValueField: 'label', required: true },
      { name: 'name', label: 'Document Name', type: 'text', required: true, maxLength: 200 },
      { name: 'enquiryForm', label: 'Show in Enquiry Form', type: 'switch', required: false, defaultValue: false },
      { name: 'isMandatory', label: 'Mandatory', type: 'switch', required: false, defaultValue: true },
      { name: 'sortOrder', label: 'Sort Order', type: 'number', required: false },
      { name: 'isActive', label: 'Active', type: 'switch', required: false },
    ],
    schema: z.object({
      countryId: z.string().uuid('Country is required'),
      documentType: reqStr('Document Type', 200),
      name: reqStr('Document Name'),
      enquiryForm: z.boolean().optional(),
      isMandatory: z.boolean().optional(),
      sortOrder: z.coerce.number().int().min(0).optional(),
      isActive: z.boolean().optional(),
    }),
  }),

  'application-status-master': entity({
    entity: 'application-status-master',
    singular: 'Application Status',
    plural: 'Application Statuses',
    description: 'Country-specific application workflow statuses',
    defaultSort: 'position',
    sortableFields: ['name', 'position', 'isActive', 'createdAt'],
    columns: [
      { field: 'country.name', headerName: 'Country', minWidth: 140, sortable: false, valueGetter: (p) => p.data?.country?.name || 'All Countries' },
      { field: 'name', headerName: 'Status Name', flex: 1, minWidth: 160, sortable: true },
      { field: 'mailSend', headerName: 'Mail Send', width: 110, cellType: 'bool' },
      { field: 'defaultStatus', headerName: 'Default', width: 100, cellType: 'bool' },
      { field: 'setOfferLetter', headerName: 'Offer Letter', width: 120, cellType: 'bool' },
      { field: 'position', headerName: 'Position', width: 100, sortable: true },
      { field: 'isActive', headerName: 'Status', width: 110, cellType: 'status' },
    ],
    filters: [
      statusFilter,
      {
        name: 'countryId',
        label: 'Country',
        type: 'options',
        optionsEntity: 'country',
      },
    ],
    fields: [
      { name: 'countryId', label: 'Country', type: 'options', optionsEntity: 'country', required: true },
      { name: 'name', label: 'Status Name', type: 'text', required: true, maxLength: 200 },
      { name: 'mailSend', label: 'Mail Send', type: 'switch', required: false },
      { name: 'defaultStatus', label: 'Default Status', type: 'switch', required: false },
      { name: 'setOfferLetter', label: 'Set Offer Letter', type: 'switch', required: false },
      { name: 'position', label: 'Position', type: 'number', required: false, min: 0 },
      { name: 'isActive', label: 'Active', type: 'switch', required: false },
    ],
    schema: z.object({
      countryId: z.string().uuid('Country is required'),
      name: reqStr('Status Name'),
      mailSend: z.boolean().optional(),
      defaultStatus: z.boolean().optional(),
      setOfferLetter: z.boolean().optional(),
      position: z.coerce.number().int().min(0).optional(),
      isActive: z.boolean().optional(),
    }),
  }),

  'visa-checklist': entity({
    entity: 'visa-checklist',
    singular: 'Visa Checklist Item',
    plural: 'Visa Checklist',
    description: 'Country-specific document checklist for visa processing',
    defaultSort: 'sortOrder',
    columns: [
      { field: 'country.name', headerName: 'Country', minWidth: 140, sortable: false, valueGetter: (p) => p.data?.country?.name || '—' },
      { field: 'documentType', headerName: 'Document Type', minWidth: 140, sortable: true },
      { field: 'name', headerName: 'Document Name', flex: 1, minWidth: 160, sortable: true },
      { field: 'isMandatory', headerName: 'Mandatory', width: 110, cellType: 'bool' },
      { field: 'isActive', headerName: 'Status', width: 110, cellType: 'status' },
      { field: 'updatedAt', headerName: 'Updated', width: 140, cellType: 'datetime' },
    ],
    filters: [
      statusFilter,
      { name: 'countryId', label: 'Country', type: 'options', optionsEntity: 'country' },
    ],
    fields: [
      { name: 'countryId', label: 'Country', type: 'options', optionsEntity: 'country', required: true },
      { name: 'documentType', label: 'Document Type', type: 'options', optionsEntity: 'document-type', optionValueField: 'label', required: true },
      { name: 'name', label: 'Document Name', type: 'text', required: true, maxLength: 200 },
      { name: 'isMandatory', label: 'Mandatory', type: 'switch', required: false, defaultValue: true },
      { name: 'sortOrder', label: 'Sort Order', type: 'number', required: false },
      { name: 'isActive', label: 'Active', type: 'switch', required: false },
    ],
    schema: z.object({
      countryId: z.string().uuid('Country is required'),
      documentType: reqStr('Document Type', 200),
      name: reqStr('Document Name'),
      isMandatory: z.boolean().optional(),
      sortOrder: z.coerce.number().int().min(0).optional(),
      isActive: z.boolean().optional(),
    }),
  }),

  'visa-status-master': entity({
    entity: 'visa-status-master',
    singular: 'Visa Status',
    plural: 'Visa Statuses',
    description: 'Country-specific visa workflow statuses',
    defaultSort: 'position',
    sortableFields: ['name', 'position', 'isActive', 'createdAt'],
    columns: [
      { field: 'country.name', headerName: 'Country', minWidth: 140, sortable: false, valueGetter: (p) => p.data?.country?.name || '—' },
      { field: 'name', headerName: 'Status Name', flex: 1, minWidth: 160, sortable: true },
      { field: 'visaApproved', headerName: 'Approved', width: 100, cellType: 'bool' },
      { field: 'visaWithdraw', headerName: 'Withdraw', width: 100, cellType: 'bool' },
      { field: 'visaRejected', headerName: 'Rejected', width: 100, cellType: 'bool' },
      { field: 'mailSend', headerName: 'Mail Send', width: 100, cellType: 'bool' },
      { field: 'defaultStatus', headerName: 'Default', width: 90, cellType: 'bool' },
      { field: 'colorCode', headerName: 'Color', width: 100 },
      { field: 'position', headerName: 'Position', width: 90, sortable: true },
      { field: 'isActive', headerName: 'Status', width: 110, cellType: 'status' },
    ],
    filters: [
      statusFilter,
      { name: 'countryId', label: 'Country', type: 'options', optionsEntity: 'country' },
    ],
    fields: [
      { name: 'countryId', label: 'Country', type: 'options', optionsEntity: 'country', required: true },
      { name: 'name', label: 'Status Name', type: 'text', required: true, maxLength: 200 },
      { name: 'visaApproved', label: 'Visa Approved', type: 'switch', required: false },
      { name: 'visaWithdraw', label: 'Visa Withdraw', type: 'switch', required: false },
      { name: 'visaRejected', label: 'Visa Rejected', type: 'switch', required: false },
      { name: 'mailSend', label: 'Mail Send', type: 'switch', required: false },
      { name: 'defaultStatus', label: 'Default Status', type: 'switch', required: false },
      { name: 'colorCode', label: 'Color Code', type: 'text', required: false, maxLength: 50, placeholder: 'e.g. #3B82F6' },
      { name: 'position', label: 'Position', type: 'number', required: false, min: 0 },
      { name: 'isActive', label: 'Active', type: 'switch', required: false },
    ],
    schema: z.object({
      countryId: z.string().uuid('Country is required'),
      name: reqStr('Status Name'),
      visaApproved: z.boolean().optional(),
      visaWithdraw: z.boolean().optional(),
      visaRejected: z.boolean().optional(),
      mailSend: z.boolean().optional(),
      defaultStatus: z.boolean().optional(),
      colorCode: optStr(50),
      position: z.coerce.number().int().min(0).optional(),
      isActive: z.boolean().optional(),
    }),
  }),

  'student-status-master': entity({
    entity: 'student-status-master',
    singular: 'Student Status',
    plural: 'Student Statuses',
    description: 'Student lifecycle statuses with color and ordering',
    defaultSort: 'sortOrder',
    columns: [
      { field: 'name', headerName: 'Status Name', flex: 1, minWidth: 160, sortable: true },
      { field: 'code', headerName: 'Code', width: 140, sortable: true },
      { field: 'defaultStatus', headerName: 'Default', width: 100, cellType: 'bool' },
      { field: 'colorCode', headerName: 'Color', width: 100 },
      { field: 'sortOrder', headerName: 'Position', width: 100, sortable: true },
      { field: 'isActive', headerName: 'Status', width: 110, cellType: 'status' },
      { field: 'updatedAt', headerName: 'Updated', width: 140, cellType: 'datetime' },
    ],
    fields: [
      { name: 'code', label: 'Code', type: 'text', required: true, maxLength: 80, placeholder: 'e.g. REGISTERED' },
      { name: 'name', label: 'Status Name', type: 'text', required: true, maxLength: 200 },
      { name: 'defaultStatus', label: 'Default Status', type: 'switch', required: false },
      { name: 'colorCode', label: 'Color Code', type: 'text', required: false, maxLength: 50, placeholder: 'e.g. #3B82F6 or success' },
      { name: 'description', label: 'Description', type: 'textarea', required: false },
      { name: 'sortOrder', label: 'Position', type: 'number', required: false, min: 0 },
      { name: 'isActive', label: 'Active', type: 'switch', required: false },
    ],
    schema: z.object({
      code: reqStr('Code', 80),
      name: reqStr('Status Name'),
      defaultStatus: z.boolean().optional(),
      colorCode: optStr(50),
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
      { field: 'channel', headerName: 'Channel', width: 130, cellType: 'badge' },
      { field: 'eventType', headerName: 'Event', minWidth: 120 },
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
          { value: 'ANNOUNCEMENT', label: 'Announcement' },
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
          { value: 'ANNOUNCEMENT', label: 'Announcement' },
        ],
      },
      { name: 'subject', label: 'Subject', type: 'text', required: false },
      { name: 'body', label: 'Body', type: 'textarea', required: true },
      {
        name: 'eventType',
        label: 'Trigger / Event',
        type: 'select',
        required: false,
        options: [
          { value: '', label: 'None (manual)' },
          { value: 'ENQUIRY_CREATED', label: 'Enquiry created' },
          { value: 'ENQUIRY_STATUS_CHANGED', label: 'Enquiry status changed' },
          { value: 'APPLICATION_STATUS_CHANGED', label: 'Application status changed' },
          { value: 'VISA_STATUS_CHANGED', label: 'Visa status changed' },
          { value: 'STUDENT_CREATED', label: 'Student created' },
        ],
      },
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

  'learning-resource': entity({
    entity: 'learning-resource',
    singular: 'Learning Resource',
    plural: 'Learning Resources',
    description: 'Country-linked study resources',
    columns: commonColumns([
      { field: 'country.name', headerName: 'Country', minWidth: 120, valueGetter: (p) => p.data?.country?.name || '—' },
      { field: 'category', headerName: 'Category', width: 130 },
      { field: 'url', headerName: 'URL', minWidth: 160 },
    ]),
    filters: [
      statusFilter,
      { name: 'countryId', label: 'Country', type: 'options', optionsEntity: 'country' },
    ],
    fields: [
      ...baseFields(),
      { name: 'countryId', label: 'Country', type: 'options', optionsEntity: 'country', required: false },
      { name: 'category', label: 'Category', type: 'text', required: false },
      { name: 'url', label: 'URL', type: 'text', required: false },
      { name: 'fileUrl', label: 'File URL', type: 'text', required: false },
      ...tailFields(),
    ],
    schema: z.object({
      code: reqStr('Code', 80),
      name: reqStr('Name'),
      countryId: optUuid(),
      category: optStr(100),
      url: optStr(500),
      fileUrl: optStr(500),
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
  if (key === 'learning-resources') return MASTER_ENTITY_CONFIGS['learning-resource'];
  return null;
}

export function isRelationalMasterEntity(slug) {
  return Boolean(getMasterEntityConfig(slug));
}
