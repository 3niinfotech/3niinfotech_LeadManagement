import {
  FiLayout, FiInbox, FiBookOpen, FiMonitor, FiDollarSign,
  FiBarChart2, FiSliders, FiDatabase, FiGrid, FiHome, FiGlobe, FiTarget,
  FiFileText, FiMail, FiUsers, FiBriefcase, FiShield, FiCalendar, FiUserPlus,
  FiClipboard, FiCheckCircle,
} from 'react-icons/fi';
import * as FiIcons from 'react-icons/fi';
import { ROUTES } from './routes';
import { PERMISSIONS } from './permissions';
import { MASTER_SECTIONS } from './master-registry.config';
import { buildReportsSidebarChildren } from '../features/reports/config/reports.config';

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
  if (entry.hidden) return null;
  // Alias entries that share another master’s engine but have their own route (e.g. announcements)
  if (entry.aliasOf && entry.id === entry.aliasOf) return null;
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
    children: section.items
      .filter((entry) => !entry.hidden && !entry.aliasOf)
      .map(mapMasterItem)
      .filter(Boolean),
  })).filter((group) => group.children.length > 0);

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
    description: 'Walk-in register & course counsellor auto-assign',
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
    id: 'teacher-attendance',
    label: 'Attendance',
    description: 'Today\'s sessions and mark attendance',
    icon: FiCheckCircle,
    path: ROUTES.TEACHER_ATTENDANCE,
    permission: PERMISSIONS.ATTENDANCE_VIEW,
  },
  {
    id: 'teacher-assignments',
    label: 'Assignments',
    description: 'Create assignments and review submissions',
    icon: FiClipboard,
    path: ROUTES.TEACHER_ASSIGNMENTS,
    permission: PERMISSIONS.ATTENDANCE_VIEW,
  },
  {
    id: 'teacher-tests',
    label: 'Tests',
    description: 'Schedule tests and publish results',
    icon: FiFileText,
    path: ROUTES.TEACHER_TESTS,
    permission: PERMISSIONS.ATTENDANCE_VIEW,
  },
  {
    id: 'teacher-materials',
    label: 'Materials',
    description: 'Study materials for your classes',
    icon: FiBookOpen,
    path: ROUTES.TEACHER_MATERIALS,
    permission: PERMISSIONS.ATTENDANCE_VIEW,
  },
  {
    id: 'teacher-performance',
    label: 'Performance',
    description: 'Student performance summary',
    icon: FiBarChart2,
    path: ROUTES.TEACHER_PERFORMANCE,
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
    permission: PERMISSIONS.REPORTS_VIEW,
    children: buildReportsSidebarChildren(),
  },
  {
    id: 'team-access',
    label: 'Team & Access',
    description: 'Team members, roles & permissions',
    icon: FiShield,
    path: ROUTES.TEAM_ACCESS,
    permissions: [PERMISSIONS.USERS_VIEW, PERMISSIONS.ROLES_VIEW],
    keywords: ['users', 'staff', 'roles', 'permissions', 'rbac', 'team'],
  },
  {
    id: 'role-applications',
    label: 'Role Applications',
    description: 'Staff apply requests — counsellor, teacher & more',
    icon: FiUserPlus,
    path: ROUTES.ROLE_APPLICATIONS,
    permission: PERMISSIONS.ROLE_APPLICATION_VIEW,
    keywords: ['apply', 'hiring', 'recruitment', 'staff application'],
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
