import {
  FiLayout, FiInbox, FiBookOpen, FiMonitor, FiDollarSign,
  FiBarChart2, FiSliders, FiDatabase, FiGrid, FiHome, FiGlobe, FiTarget,
} from 'react-icons/fi';
import * as FiIcons from 'react-icons/fi';
import { ROUTES } from './routes';
import { PERMISSIONS } from './permissions';
import { MASTER_SECTIONS } from './master-registry.config';

const MASTER_SECTION_ICONS = {
  organization: FiHome,
  academic: FiBookOpen,
  visa: FiGlobe,
  finance: FiDollarSign,
  crm: FiTarget,
  reception: FiInbox,
  system: FiSliders,
};

function mapMasterItem(item) {
  return {
    id: item.id,
    label: item.label,
    description: item.description,
    icon: FiIcons[item.icon] || FiDatabase,
    path: item.route,
    permission: item.permissionKey,
    permissions: item.permissionKey
      ? [item.permissionKey, PERMISSIONS.SETTINGS_VIEW, PERMISSIONS.MASTERS_VIEW]
      : undefined,
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
    permissions: [PERMISSIONS.MASTERS_VIEW, PERMISSIONS.SETTINGS_VIEW],
  };

  const sectionGroups = MASTER_SECTIONS.map((section) => ({
    id: `master-${section.id}`,
    label: section.label,
    description: section.description,
    icon: MASTER_SECTION_ICONS[section.id] || FiDatabase,
    children: section.items.map(mapMasterItem),
  }));

  return [hub, ...sectionGroups];
}

/** Phase 1 sidebar — Dashboard, Masters, Enquiry, Demo, Students, Fees, Reports, Settings */
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
    children: buildMasterSidebarChildren(),
  },
  {
    id: 'enquiries',
    label: 'Enquiry',
    description: 'Register leads, follow-up & convert',
    icon: FiInbox,
    path: ROUTES.ENQUIRIES,
    permissions: [PERMISSIONS.ENQUIRIES_VIEW, PERMISSIONS.LEADS_VIEW],
  },
  {
    id: 'demo',
    label: 'Demo',
    description: 'Demo scheduling, attendance & feedback',
    icon: FiMonitor,
    path: ROUTES.DEMO,
    permissions: [PERMISSIONS.ENQUIRIES_VIEW, PERMISSIONS.STUDENTS_VIEW],
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
