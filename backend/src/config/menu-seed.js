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
      { name: 'Company', icon: 'FiHome', route: '/admin/master/company', permissionKey: 'settings.manage', displayOrder: 1 },
      { name: 'Branch', icon: 'FiMapPin', route: '/admin/master/branch', permissionKey: 'settings.manage', displayOrder: 2 },
      { name: 'Department', icon: 'FiGrid', route: '/admin/master/department', permissionKey: 'settings.manage', displayOrder: 3 },
    ],
  },
  {
    name: 'Academic',
    icon: 'FiBookOpen',
    displayOrder: 3,
    children: [
      { name: 'Country', icon: 'FiGlobe', route: '/admin/master/country', permissionKey: 'settings.view', displayOrder: 1 },
      { name: 'University', icon: 'FiBook', route: '/admin/master/university', permissionKey: 'settings.view', displayOrder: 2 },
      { name: 'Course', icon: 'FiBookOpen', route: '/admin/master/course', permissionKey: 'settings.view', displayOrder: 3 },
      { name: 'Intake', icon: 'FiCalendar', route: '/admin/master/intake', permissionKey: 'settings.view', displayOrder: 4 },
      { name: 'Qualification', icon: 'FiAward', route: '/admin/master/qualification', permissionKey: 'settings.view', displayOrder: 5 },
      { name: 'Faculty', icon: 'FiUsers', route: '/admin/master/faculty', permissionKey: 'masters.view', displayOrder: 6 },
    ],
  },
  {
    name: 'Visa',
    icon: 'FiGlobe',
    displayOrder: 4,
    children: [
      { name: 'Visa Type', icon: 'FiGlobe', route: '/admin/master/visa-type', permissionKey: 'settings.view', displayOrder: 1 },
      { name: 'Document Checklist', icon: 'FiFileText', route: '/admin/master/document-checklist', permissionKey: 'settings.view', displayOrder: 2 },
      { name: 'Embassy', icon: 'FiMapPin', route: '/admin/master/embassy', permissionKey: 'settings.view', displayOrder: 3 },
    ],
  },
  {
    name: 'Finance',
    icon: 'FiDollarSign',
    displayOrder: 5,
    children: [
      { name: 'Fee Type', icon: 'FiDollarSign', route: '/admin/master/fee-type', permissionKey: 'settings.view', displayOrder: 1 },
      { name: 'Payment Mode', icon: 'FiCreditCard', route: '/admin/master/payment-mode', permissionKey: 'settings.view', displayOrder: 2 },
      { name: 'Currency', icon: 'FiDollarSign', route: '/admin/master/currency', permissionKey: 'settings.view', displayOrder: 3 },
      { name: 'Tax', icon: 'FiPercent', route: '/admin/master/tax', permissionKey: 'settings.view', displayOrder: 4 },
    ],
  },
  {
    name: 'CRM',
    icon: 'FiTarget',
    displayOrder: 6,
    children: [
      { name: 'Lead Source', icon: 'FiTarget', route: '/admin/master/lead-source', permissionKey: 'settings.view', displayOrder: 1 },
      { name: 'Enquiry Status', icon: 'FiActivity', route: '/admin/master/enquiry-status', permissionKey: 'settings.view', displayOrder: 2 },
      { name: 'Tags', icon: 'FiTag', route: '/admin/master/tags', permissionKey: 'settings.view', displayOrder: 3 },
    ],
  },
  {
    name: 'Reception',
    icon: 'FiInbox',
    displayOrder: 7,
    children: [
      { name: 'Visit Purpose', icon: 'FiInbox', route: '/admin/master/visit-purpose', permissionKey: 'settings.view', displayOrder: 1 },
      { name: 'Counsellor Skill', icon: 'FiUserCheck', route: '/admin/master/counsellor-skill', permissionKey: 'settings.manage', displayOrder: 2 },
    ],
  },
  {
    name: 'System',
    icon: 'FiSliders',
    displayOrder: 8,
    children: [
      { name: 'Communication Template', icon: 'FiMail', route: '/admin/master/communication-template', permissionKey: 'settings.manage', displayOrder: 1 },
      { name: 'Feature Toggle', icon: 'FiToggleLeft', route: '/admin/settings/feature-toggle', permissionKey: 'settings.manage', displayOrder: 2 },
    ],
  },
];

export const MENU_SEED = [
  { name: 'Dashboard', icon: 'FiLayout', route: '/admin/dashboard', permissionKey: 'dashboard.view', displayOrder: 1 },
  {
    name: 'Masters',
    icon: 'FiDatabase',
    displayOrder: 2,
    children: [
      { name: 'Master Hub', icon: 'FiGrid', route: '/admin/master', permissionKey: 'settings.view', displayOrder: 1 },
      ...MASTER_SECTIONS_SEED,
    ],
  },
  { name: 'Enquiry', icon: 'FiInbox', route: '/admin/enquiries', permissionKey: 'enquiry.view', displayOrder: 3 },
  { name: 'Demo', icon: 'FiMonitor', route: '/admin/demo', permissionKey: 'enquiry.view', displayOrder: 4 },
  { name: 'Students', icon: 'FiBookOpen', route: '/admin/students', permissionKey: 'student.view', displayOrder: 5 },
  { name: 'Fees', icon: 'FiDollarSign', route: '/admin/fees', permissionKey: 'accounts.invoice.view', displayOrder: 6 },
  { name: 'Reports', icon: 'FiBarChart2', route: '/admin/reports', permissionKey: 'reports.view', displayOrder: 7 },
  { name: 'Settings', icon: 'FiSliders', route: '/admin/settings', permissionKey: 'settings.view', displayOrder: 8 },
];
