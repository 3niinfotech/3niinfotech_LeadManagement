/** Master data catalog — sidebar + hub page source of truth */
import {
  MASTER_ENTITY_CONFIGS,
  getMasterEntityConfig,
  isRelationalMasterEntity,
  RELATIONAL_MASTER_ENTITIES,
} from './master-entities.config';

export {
  MASTER_ENTITY_CONFIGS,
  getMasterEntityConfig,
  isRelationalMasterEntity,
  RELATIONAL_MASTER_ENTITIES,
};

export const MASTER_SECTIONS = [
  {
    id: 'organization',
    label: 'Organization',
    description: 'Company structure and branches',
    items: [
      { id: 'company', label: 'Company', description: 'Tenant company profile', route: '/admin/master/company', icon: 'FiHome', permissionKey: 'settings.manage', engine: false },
      { id: 'branch', label: 'Branch', description: 'Offices and locations', route: '/admin/master/branch', icon: 'FiMapPin', permissionKey: 'settings.manage', engine: false },
      { id: 'staff', label: 'Staff & Users', description: 'Team members, counsellors, and role assignment', route: '/admin/master/staff', icon: 'FiUsers', permissionKey: 'users.view', engine: false },
      { id: 'department', label: 'Department', description: 'Internal departments', route: '/admin/master/department', icon: 'FiGrid', permissionKey: 'masters.view', engine: true, entity: 'department' },
    ],
  },
  {
    id: 'academic',
    label: 'Academic',
    description: 'Courses, countries, intakes',
    items: [
      { id: 'country', label: 'Country', description: 'Study destinations', route: '/admin/master/country', icon: 'FiGlobe', permissionKey: 'masters.view', engine: true, entity: 'country' },
      { id: 'university', label: 'University', description: 'Partner universities', route: '/admin/master/university', icon: 'FiBook', permissionKey: 'masters.view', engine: true, entity: 'university' },
      { id: 'course', label: 'Course', description: 'Programs and courses', route: '/admin/master/course', icon: 'FiBookOpen', permissionKey: 'masters.view', engine: true, entity: 'course' },
      { id: 'intake', label: 'Intake', description: 'Intake seasons', route: '/admin/master/intake', icon: 'FiCalendar', permissionKey: 'masters.view', engine: true, entity: 'intake' },
      { id: 'qualification', label: 'Qualification', description: 'Education levels', route: '/admin/master/qualification', icon: 'FiAward', permissionKey: 'masters.view', engine: true, entity: 'qualification' },
    ],
  },
  {
    id: 'visa',
    label: 'Visa',
    description: 'Visa types and checklists',
    items: [
      { id: 'visa-type', label: 'Visa Type', description: 'Visa categories', route: '/admin/master/visa-type', icon: 'FiGlobe', permissionKey: 'masters.view', engine: true, entity: 'visa-type' },
      { id: 'document-type', label: 'Document Type', description: 'Reusable document catalog', route: '/admin/master/document-type', icon: 'FiFileText', permissionKey: 'masters.view', engine: true, entity: 'document-type' },
      { id: 'document-requirement', label: 'Document Requirement', description: 'Country / visa document rules', route: '/admin/master/document-requirement', icon: 'FiCheckSquare', permissionKey: 'masters.view', engine: true, entity: 'document-requirement' },
      { id: 'document-checklist', label: 'Document Checklist', description: 'Legacy route → Document Types', route: '/admin/master/document-checklist', icon: 'FiFileText', permissionKey: 'masters.view', engine: true, entity: 'document-type', aliasOf: 'document-type' },
      { id: 'embassy', label: 'Embassy', description: 'Embassy locations', route: '/admin/master/embassy', icon: 'FiMapPin', permissionKey: 'masters.view', engine: true, entity: 'embassy' },
    ],
  },
  {
    id: 'finance',
    label: 'Finance',
    description: 'Fees, payments, tax',
    items: [
      { id: 'fee-type', label: 'Fee Type', description: 'Service fee types (MasterItem)', route: '/admin/master/fee-type', icon: 'FiDollarSign', permissionKey: 'settings.view', engine: false },
      { id: 'payment-mode', label: 'Payment Mode', description: 'Payment methods', route: '/admin/master/payment-mode', icon: 'FiCreditCard', permissionKey: 'masters.view', engine: true, entity: 'payment-mode' },
      { id: 'currency', label: 'Currency', description: 'Supported currencies', route: '/admin/master/currency', icon: 'FiDollarSign', permissionKey: 'masters.view', engine: true, entity: 'currency' },
      { id: 'tax', label: 'Tax', description: 'Tax rates and rules', route: '/admin/master/tax', icon: 'FiPercent', permissionKey: 'masters.view', engine: true, entity: 'tax' },
    ],
  },
  {
    id: 'crm',
    label: 'CRM',
    description: 'Sources, status, tags',
    items: [
      { id: 'lead-source', label: 'Lead Source', description: 'Enquiry sources', route: '/admin/master/lead-source', icon: 'FiTarget', permissionKey: 'masters.view', engine: true, entity: 'lead-source' },
      { id: 'lead-status', label: 'Lead Status', description: 'CRM pipeline statuses', route: '/admin/master/lead-status', icon: 'FiActivity', permissionKey: 'masters.view', engine: true, entity: 'lead-status' },
      { id: 'lost-reason', label: 'Lost Reason', description: 'Lost enquiry reasons', route: '/admin/master/lost-reason', icon: 'FiSlash', permissionKey: 'masters.view', engine: true, entity: 'lost-reason' },
      { id: 'followup-type', label: 'Follow-up Type', description: 'Follow-up channels', route: '/admin/master/followup-type', icon: 'FiPhone', permissionKey: 'masters.view', engine: true, entity: 'followup-type' },
      { id: 'enquiry-status', label: 'Enquiry Status', description: 'Legacy route → Lead Status', route: '/admin/master/enquiry-status', icon: 'FiActivity', permissionKey: 'masters.view', engine: true, entity: 'lead-status', aliasOf: 'lead-status' },
      { id: 'tags', label: 'Tags', description: 'Labels and tags (MasterItem)', route: '/admin/master/tags', icon: 'FiTag', permissionKey: 'settings.view', engine: false },
    ],
  },
  {
    id: 'reception',
    label: 'Reception',
    description: 'Walk-in and queue masters',
    items: [
      { id: 'visit-purpose', label: 'Visit Purpose', description: 'Walk-in purposes', route: '/admin/master/visit-purpose', icon: 'FiInbox', permissionKey: 'masters.view', engine: true, entity: 'visit-purpose' },
      { id: 'counsellor-skill', label: 'Counsellor Skill', description: 'Assignment skills', route: '/admin/master/counsellor-skill', icon: 'FiUserCheck', permissionKey: 'masters.view', engine: true, entity: 'counsellor-skill' },
    ],
  },
  {
    id: 'system',
    label: 'System',
    description: 'Feature toggles and config',
    items: [
      { id: 'feature-toggle', label: 'Feature Toggle', description: 'Simple vs Enterprise mode', route: '/admin/settings/feature-toggle', icon: 'FiToggleLeft', permissionKey: 'settings.manage', engine: false },
      { id: 'communication-template', label: 'Communication Template', description: 'Email / SMS templates', route: '/admin/master/communication-template', icon: 'FiMail', permissionKey: 'masters.view', engine: true, entity: 'communication-template' },
    ],
  },
];

export const ALL_MASTER_ITEMS = MASTER_SECTIONS.flatMap((s) =>
  s.items.map((item) => ({ ...item, sectionId: s.id, sectionLabel: s.label })),
);

export function getMasterBySlug(slug) {
  return ALL_MASTER_ITEMS.find((m) => m.route === `/master/${slug}` || m.id === slug);
}

/** Resolve hub item + engine config for a route slug */
export function resolveMasterPage(slug) {
  const hubItem = getMasterBySlug(slug);
  if (!hubItem) return null;
  if (!hubItem.engine) {
    return { hubItem, entityConfig: null, engineEntity: null };
  }
  const engineEntity = hubItem.entity || hubItem.id;
  const entityConfig = getMasterEntityConfig(engineEntity);
  return { hubItem, entityConfig, engineEntity };
}

export function getMasterMenuSeed() {
  return {
    name: 'Master Data',
    icon: 'FiDatabase',
    displayOrder: 9,
    children: [
      { name: 'Master Hub', icon: 'FiGrid', route: '/admin/master', permissionKey: 'masters.view', displayOrder: 1 },
      ...MASTER_SECTIONS.map((section, sectionIndex) => ({
        name: section.label,
        icon: {
          organization: 'FiHome',
          academic: 'FiBookOpen',
          visa: 'FiGlobe',
          finance: 'FiDollarSign',
          crm: 'FiTarget',
          reception: 'FiInbox',
          system: 'FiSliders',
        }[section.id] || 'FiDatabase',
        displayOrder: sectionIndex + 2,
        children: section.items.map((m, i) => ({
          name: m.label,
          icon: m.icon,
          route: m.route,
          permissionKey: m.permissionKey,
          displayOrder: i + 1,
        })),
      })),
    ],
  };
}
