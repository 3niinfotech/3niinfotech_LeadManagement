/**
 * Available workspace shortcut catalog (role filters applied in UI).
 */
import {
  FiBriefcase,
  FiClipboard,
  FiBookOpen,
  FiGlobe,
  FiFileText,
  FiDollarSign,
  FiBarChart2,
  FiMail,
  FiMessageSquare,
  FiUsers,
  FiCalendar,
  FiGrid,
  FiActivity,
  FiUserCheck,
} from 'react-icons/fi';
import { ROUTES } from './routes';
import { getRoleProfileWorkspace } from './role-profile.config';

export const SHORTCUT_CATALOG = [
  { id: 'enquiries', label: 'Enquiries', path: ROUTES.ENQUIRIES, icon: FiBriefcase, tone: 'blue' },
  { id: 'applications', label: 'Applications', path: ROUTES.APPLICATIONS, icon: FiClipboard, tone: 'green' },
  { id: 'students', label: 'Students', path: ROUTES.STUDENTS, icon: FiBookOpen, tone: 'purple' },
  { id: 'visas', label: 'Visa', path: ROUTES.VISAS, icon: FiGlobe, tone: 'orange' },
  { id: 'documents', label: 'Documents', path: ROUTES.DOCUMENTS, icon: FiFileText, tone: 'slate' },
  { id: 'finance', label: 'Finance', path: ROUTES.INVOICES, icon: FiDollarSign, tone: 'emerald' },
  { id: 'reports', label: 'Reports', path: ROUTES.REPORTS, icon: FiBarChart2, tone: 'violet' },
  { id: 'calendar', label: 'Calendar', path: ROUTES.CALENDAR, icon: FiCalendar, tone: 'cyan' },
  { id: 'demo', label: 'Demos', path: ROUTES.DEMO, icon: FiActivity, tone: 'amber' },
  { id: 'users', label: 'Users', path: ROUTES.USERS, icon: FiUsers, tone: 'blue' },
  { id: 'teacher', label: 'Classes', path: ROUTES.TEACHER_CLASSES, icon: FiUserCheck, tone: 'purple' },
  { id: 'dashboard', label: 'Dashboard', path: ROUTES.DASHBOARD, icon: FiGrid, tone: 'slate' },
  { id: 'email', label: 'Email', path: ROUTES.NOTIFICATIONS, icon: FiMail, tone: 'amber' },
  { id: 'sms', label: 'SMS', path: ROUTES.NOTIFICATIONS, icon: FiMessageSquare, tone: 'rose' },
];

const DEFAULT_SHORTCUT_IDS = {
  super_admin: ['enquiries', 'applications', 'students', 'visas', 'documents', 'finance', 'reports', 'email', 'sms'],
  company_admin: ['enquiries', 'applications', 'students', 'visas', 'finance', 'reports', 'users', 'calendar'],
  counsellor: ['enquiries', 'students', 'calendar', 'demo', 'applications'],
  teacher: ['teacher', 'students', 'calendar', 'dashboard'],
  receptionist: ['calendar', 'students', 'enquiries'],
  application_officer: ['applications', 'students', 'documents', 'calendar'],
  visa_officer: ['visas', 'students', 'applications', 'documents'],
  finance_manager: ['finance', 'reports', 'students'],
  finance_executive: ['finance', 'students'],
};

export function getDefaultShortcutIds(roleSlug) {
  return DEFAULT_SHORTCUT_IDS[roleSlug]
    || getRoleProfileWorkspace(roleSlug).links.map((l) => l.id).slice(0, 8)
    || ['dashboard', 'enquiries', 'students'];
}

export function resolveShortcuts(ids = []) {
  const map = Object.fromEntries(SHORTCUT_CATALOG.map((s) => [s.id, s]));
  return ids.map((id) => map[id]).filter(Boolean);
}

export const LANDING_PAGE_OPTIONS = [
  { value: '/admin/dashboard', label: 'Dashboard' },
  { value: '/admin/enquiries', label: 'Enquiries' },
  { value: '/admin/students', label: 'Students' },
  { value: '/admin/applications', label: 'Applications' },
  { value: '/admin/visas', label: 'Visa' },
  { value: '/admin/calendar', label: 'Calendar' },
  { value: '/admin/teacher/dashboard', label: 'Teacher home' },
  { value: '/admin/reception', label: 'Reception' },
  { value: '/admin/profile', label: 'My Profile' },
];

export const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];

export const WORKSPACE_TIPS = [
  {
    title: 'Use Shortcuts',
    body: 'Add your frequently used modules to shortcuts for one-click access from Account and Workspace.',
  },
  {
    title: 'Compact Mode',
    body: 'Turn on Compact tables under Workspace to see more records without scrolling.',
  },
  {
    title: 'Secure Sessions',
    body: 'Review Active Sessions regularly and revoke devices you do not recognize.',
  },
];
