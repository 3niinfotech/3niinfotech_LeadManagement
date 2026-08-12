/**
 * Sidebar menu seed — Phase 1 (sync with frontend sidebar-menu.builder.js)
 * Run: node scripts/sync-menu.js
 */

const MASTER_SECTIONS_SEED = [
  {
    name: 'Organization',
    icon: 'FiHome',
    displayOrder: 2,
    children: [
      { name: 'Company', icon: 'FiHome', route: '/master/company', permissionKey: 'settings.manage', displayOrder: 1 },
      { name: 'Branch', icon: 'FiMapPin', route: '/master/branch', permissionKey: 'settings.manage', displayOrder: 2 },
      { name: 'Department', icon: 'FiGrid', route: '/master/department', permissionKey: 'settings.manage', displayOrder: 3 },
    ],
  },
  {
    name: 'Academic',
    icon: 'FiBookOpen',
    displayOrder: 3,
    children: [
      { name: 'Country', icon: 'FiGlobe', route: '/master/country', permissionKey: 'settings.view', displayOrder: 1 },
      { name: 'University', icon: 'FiBook', route: '/master/university', permissionKey: 'settings.view', displayOrder: 2 },
      { name: 'Course', icon: 'FiBookOpen', route: '/master/course', permissionKey: 'settings.view', displayOrder: 3 },
      { name: 'Intake', icon: 'FiCalendar', route: '/master/intake', permissionKey: 'settings.view', displayOrder: 4 },
      { name: 'Qualification', icon: 'FiAward', route: '/master/qualification', permissionKey: 'settings.view', displayOrder: 5 },
    ],
  },
  {
    name: 'Visa',
    icon: 'FiGlobe',
    displayOrder: 4,
    children: [
      { name: 'Visa Type', icon: 'FiGlobe', route: '/master/visa-type', permissionKey: 'settings.view', displayOrder: 1 },
      { name: 'Document Checklist', icon: 'FiFileText', route: '/master/document-checklist', permissionKey: 'settings.view', displayOrder: 2 },
      { name: 'Embassy', icon: 'FiMapPin', route: '/master/embassy', permissionKey: 'settings.view', displayOrder: 3 },
    ],
  },
  {
    name: 'Finance',
    icon: 'FiDollarSign',
    displayOrder: 5,
    children: [
      { name: 'Fee Type', icon: 'FiDollarSign', route: '/master/fee-type', permissionKey: 'settings.view', displayOrder: 1 },
      { name: 'Payment Mode', icon: 'FiCreditCard', route: '/master/payment-mode', permissionKey: 'settings.view', displayOrder: 2 },
      { name: 'Currency', icon: 'FiDollarSign', route: '/master/currency', permissionKey: 'settings.view', displayOrder: 3 },
      { name: 'Tax', icon: 'FiPercent', route: '/master/tax', permissionKey: 'settings.view', displayOrder: 4 },
    ],
  },
  {
    name: 'CRM',
    icon: 'FiTarget',
    displayOrder: 6,
    children: [
      { name: 'Lead Source', icon: 'FiTarget', route: '/master/lead-source', permissionKey: 'settings.view', displayOrder: 1 },
      { name: 'Enquiry Status', icon: 'FiActivity', route: '/master/enquiry-status', permissionKey: 'settings.view', displayOrder: 2 },
      { name: 'Tags', icon: 'FiTag', route: '/master/tags', permissionKey: 'settings.view', displayOrder: 3 },
    ],
  },
  {
    name: 'Reception',
    icon: 'FiInbox',
    displayOrder: 7,
    children: [
      { name: 'Visit Purpose', icon: 'FiInbox', route: '/master/visit-purpose', permissionKey: 'settings.view', displayOrder: 1 },
      { name: 'Counsellor Skill', icon: 'FiUserCheck', route: '/master/counsellor-skill', permissionKey: 'settings.manage', displayOrder: 2 },
    ],
  },
  {
    name: 'System',
    icon: 'FiSliders',
    displayOrder: 8,
    children: [
      { name: 'Communication Template', icon: 'FiMail', route: '/master/communication-template', permissionKey: 'settings.manage', displayOrder: 1 },
      { name: 'Feature Toggle', icon: 'FiToggleLeft', route: '/settings/feature-toggle', permissionKey: 'settings.manage', displayOrder: 2 },
    ],
  },
];

export const MENU_SEED = [
  { name: 'Dashboard', icon: 'FiLayout', route: '/dashboard', permissionKey: 'dashboard.view', displayOrder: 1 },
  {
    name: 'Masters',
    icon: 'FiDatabase',
    displayOrder: 2,
    children: [
      { name: 'Master Hub', icon: 'FiGrid', route: '/master', permissionKey: 'settings.view', displayOrder: 1 },
      ...MASTER_SECTIONS_SEED,
    ],
  },
  { name: 'Enquiry', icon: 'FiInbox', route: '/enquiries', permissionKey: 'enquiry.view', displayOrder: 3 },
  { name: 'Demo', icon: 'FiMonitor', route: '/demo', permissionKey: 'enquiry.view', displayOrder: 4 },
  { name: 'Students', icon: 'FiBookOpen', route: '/students', permissionKey: 'student.view', displayOrder: 5 },
  { name: 'Fees', icon: 'FiDollarSign', route: '/fees', permissionKey: 'accounts.invoice.view', displayOrder: 6 },
  { name: 'Reports', icon: 'FiBarChart2', route: '/reports', permissionKey: 'reports.view', displayOrder: 7 },
  { name: 'Settings', icon: 'FiSliders', route: '/settings', permissionKey: 'settings.view', displayOrder: 8 },
];
