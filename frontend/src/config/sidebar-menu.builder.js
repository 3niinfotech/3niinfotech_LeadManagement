import {
  FiLayout, FiInbox, FiBookOpen, FiMonitor, FiDollarSign,
  FiBarChart2, FiSliders, FiDatabase, FiGrid, FiHome, FiGlobe, FiTarget,
  FiFileText, FiMail, FiUsers, FiBriefcase, FiShield, FiCalendar, FiUserPlus,
} from 'react-icons/fi';
import * as FiIcons from 'react-icons/fi';
import { ROUTES } from './routes';
import { PERMISSIONS } from './permissions';
import { MASTER_SECTIONS } from './master-registry.config';

const MASTER_SECTION_ICONS = {
  organization: FiHome,
  academic: FiBookOpen,
  crm: FiTarget,
  application: FiFileText,
  visa: FiGlobe,
  finance: FiDollarSign,
  partners: FiBriefcase,
  communication: FiMail,
  people: FiUsers,
  system: FiSliders,
  access: FiShield,
};

function mapMasterItem(entry) {
  return {
    id: entry.id,
    label: entry.label,
    description: entry.description,
    icon: FiIcons[entry.icon] || FiDatabase,
    path: entry.route,
    permission: entry.permissionKey,
    permissions: entry.permissionKey
      ? [entry.permissionKey, PERMISSIONS.MASTERS_VIEW, PERMISSIONS.MASTERS_MANAGE]
      : [PERMISSIONS.MASTERS_VIEW],
    keywords: [
      ...(entry.keywords || []),
      ...(entry.usedIn || []),
      entry.aliasOf,
      entry.entity,
      entry.id,
    ].filter(Boolean),
  };
}

export function buildMasterSidebarChildren() {
  const hub = {
    id: 'master-hub',
    label: 'Master Hub',
    description: 'Browse all reference data',
    icon: FiGrid,
    path: ROUTES.MASTER,
    permission: PERMISSIONS.MASTERS_VIEW,
    permissions: [PERMISSIONS.MASTERS_VIEW, PERMISSIONS.MASTERS_MANAGE],
  };

  const sectionGroups = MASTER_SECTIONS.map((section) => ({
    id: `master-${section.id}`,
    label: section.label,
    description: section.description,
    icon: MASTER_SECTION_ICONS[section.id] || FiDatabase,
    keywords: [section.id, section.label],
    children: section.items.filter((entry) => !entry.hidden).map(mapMasterItem),
  }));

  return [hub, ...sectionGroups];
}

/** Phase 1 sidebar — Dashboard, Masters, Reception, Enquiry, Calendar, Demo, Students, Fees, Reports, Settings */
export const sidebarMenuStructure = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    description: 'Overview, stats & activity',
    icon: FiLayout,
    path: ROUTES.DASHBOARD,
    permission: PERMISSIONS.DASHBOARD_VIEW,
  },
  {
    id: 'master',
    label: 'Masters',
    description: 'Reference data & setup',
    icon: FiDatabase,
    keywords: ['master hub', 'master data', 'setup', 'reference'],
    permissions: [PERMISSIONS.MASTERS_VIEW, PERMISSIONS.MASTERS_MANAGE],
    children: buildMasterSidebarChildren(),
  },
  {
    id: 'reception',
    label: 'Reception',
    description: 'Walk-in register & counsellor assignment',
    icon: FiUserPlus,
    path: ROUTES.WALK_INS,
    permission: PERMISSIONS.WALKIN_VIEW,
  },
  {
    id: 'enquiries',
    label: 'Enquiry',
    description: 'Follow-up, counselling & convert',
    icon: FiInbox,
    path: ROUTES.ENQUIRIES,
    permission: PERMISSIONS.ENQUIRIES_VIEW,
  },
  {
    id: 'calendar',
    label: 'Calendar',
    description: 'Follow-ups, appointments & due dates',
    icon: FiCalendar,
    path: ROUTES.CALENDAR,
    permission: PERMISSIONS.CALENDAR_VIEW,
  },
  {
    id: 'demo',
    label: 'Demo',
    description: 'Demo scheduling, attendance & feedback',
    icon: FiMonitor,
    path: ROUTES.DEMO,
    permission: PERMISSIONS.ENQUIRIES_VIEW,
  },
  {
    id: 'students',
    label: 'Students',
    description: 'Student profiles & journey',
    icon: FiBookOpen,
    path: ROUTES.STUDENTS,
    permission: PERMISSIONS.STUDENTS_VIEW,
  },
  {
    id: 'batches',
    label: 'Batches',
    description: 'Class batches, timetable & attendance',
    icon: FiUsers,
    path: ROUTES.BATCHES,
    permission: PERMISSIONS.ATTENDANCE_VIEW,
  },
  {
    id: 'applications',
    label: 'Applications',
    description: 'University applications & documents',
    icon: FiFileText,
    path: ROUTES.APPLICATIONS,
    permission: PERMISSIONS.APPLICATIONS_VIEW,
  },
  {
    id: 'visas',
    label: 'Visa',
    description: 'Visa cases & status',
    icon: FiGlobe,
    path: ROUTES.VISAS,
    permission: PERMISSIONS.VISAS_VIEW,
  },
  {
    id: 'partners',
    label: 'Partners',
    description: 'Partner / agent directory',
    icon: FiBriefcase,
    path: ROUTES.PARTNERS,
    permission: PERMISSIONS.PARTNERS_VIEW,
  },
  {
    id: 'fees',
    label: 'Fees',
    description: 'Fee plans, payments & ledger',
    icon: FiDollarSign,
    path: ROUTES.FEES,
    permission: PERMISSIONS.INVOICES_VIEW,
  },
  {
    id: 'reports',
    label: 'Reports',
    description: 'Analytics & exports',
    icon: FiBarChart2,
    path: ROUTES.REPORTS,
    permission: PERMISSIONS.REPORTS_VIEW,
  },
  {
    id: 'settings',
    label: 'Settings',
    description: 'Configuration & administration',
    icon: FiSliders,
    path: ROUTES.SETTINGS,
    permission: PERMISSIONS.SETTINGS_VIEW,
  },
];
