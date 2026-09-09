/**
 * Role-specific profile workspace + sidebar dock (above Logout).
 * Keep labels short — shown in tight UI.
 */
import {
  FiActivity,
  FiBookOpen,
  FiBriefcase,
  FiCalendar,
  FiClipboard,
  FiDollarSign,
  FiGlobe,
  FiGrid,
  FiSettings,
  FiShield,
  FiUserCheck,
  FiUsers,
} from 'react-icons/fi';
import { ROUTES } from './routes';

/** @typedef {{ id: string, label: string, path: string, icon: import('react-icons').IconType, hint?: string }} RoleQuickLink */

/** Paths already in the main sidebar — skip in the bottom quick dock */
const DOCK_SKIP_PATHS = new Set([
  ROUTES.TEAM_ACCESS,
  ROUTES.USERS,
  ROUTES.SETTINGS,
  ROUTES.DASHBOARD,
]);

function normalizeDockPath(path = '') {
  return String(path).split('?')[0];
}

/** @type {Record<string, { title: string, hint: string, links: RoleQuickLink[] }>} */
export const ROLE_PROFILE_WORKSPACE = {
  super_admin: {
    title: 'Admin console',
    hint: 'Users, access, and company setup',
    links: [
      { id: 'team-access', label: 'Team & Access', path: ROUTES.TEAM_ACCESS, icon: FiShield },
      { id: 'settings', label: 'Company settings', path: ROUTES.SETTINGS, icon: FiSettings },
      { id: 'reports', label: 'Reports', path: ROUTES.REPORTS, icon: FiActivity },
      { id: 'applications', label: 'Applications', path: ROUTES.APPLICATIONS, icon: FiClipboard },
      { id: 'visas', label: 'Visa cases', path: ROUTES.VISAS, icon: FiGlobe },
    ],
  },
  company_admin: {
    title: 'Admin console',
    hint: 'Branch operations and access',
    links: [
      { id: 'team-access', label: 'Team & Access', path: ROUTES.TEAM_ACCESS, icon: FiShield },
      { id: 'settings', label: 'Company settings', path: ROUTES.SETTINGS, icon: FiSettings },
      { id: 'enquiries', label: 'Enquiries', path: ROUTES.ENQUIRIES, icon: FiBriefcase },
      { id: 'students', label: 'Students', path: ROUTES.STUDENTS, icon: FiBookOpen },
      { id: 'reports', label: 'Reports', path: ROUTES.REPORTS, icon: FiActivity },
    ],
  },
  admin: {
    title: 'Admin workspace',
    hint: 'Operations and team access',
    links: [
      { id: 'team-access', label: 'Team & Access', path: ROUTES.TEAM_ACCESS, icon: FiShield },
      { id: 'settings', label: 'Settings', path: ROUTES.SETTINGS, icon: FiSettings },
      { id: 'enquiries', label: 'Enquiries', path: ROUTES.ENQUIRIES, icon: FiBriefcase },
      { id: 'students', label: 'Students', path: ROUTES.STUDENTS, icon: FiBookOpen },
    ],
  },
  counsellor: {
    title: 'Counselling desk',
    hint: 'Assigned pipeline and follow-ups',
    links: [
      { id: 'enquiries', label: 'My enquiries', path: ROUTES.ENQUIRIES, icon: FiBriefcase },
      { id: 'students', label: 'My students', path: ROUTES.STUDENTS, icon: FiUsers },
      { id: 'calendar', label: 'Follow-ups', path: ROUTES.CALENDAR, icon: FiCalendar },
      { id: 'demo', label: 'Demos', path: ROUTES.DEMO, icon: FiActivity },
      { id: 'batches', label: 'Attendance', path: ROUTES.BATCHES, icon: FiUserCheck },
    ],
  },
  teacher: {
    title: 'Teaching workspace',
    hint: 'Classes, students, and classroom work',
    links: [
      { id: 'dash', label: 'Teacher home', path: ROUTES.TEACHER_DASHBOARD, icon: FiGrid },
      { id: 'classes', label: 'My classes', path: ROUTES.TEACHER_CLASSES, icon: FiUsers },
      { id: 'students', label: 'My students', path: ROUTES.TEACHER_STUDENTS, icon: FiBookOpen },
      { id: 'attendance', label: 'Attendance', path: ROUTES.TEACHER_ATTENDANCE, icon: FiUserCheck },
      { id: 'assignments', label: 'Assignments', path: ROUTES.TEACHER_ASSIGNMENTS, icon: FiClipboard },
      { id: 'materials', label: 'Materials', path: ROUTES.TEACHER_MATERIALS, icon: FiBriefcase },
    ],
  },
  receptionist: {
    title: 'Front desk',
    hint: 'Walk-ins and today’s schedule',
    links: [
      { id: 'reception', label: 'Reception', path: ROUTES.RECEPTION, icon: FiActivity },
      { id: 'walkins', label: 'Walk-ins', path: ROUTES.WALK_INS, icon: FiUserCheck },
      { id: 'calendar', label: 'Calendar', path: ROUTES.CALENDAR, icon: FiCalendar },
    ],
  },
  application_officer: {
    title: 'Admissions desk',
    hint: 'University applications',
    links: [
      { id: 'apps', label: 'Applications', path: ROUTES.APPLICATIONS, icon: FiClipboard },
      { id: 'students', label: 'Students', path: ROUTES.STUDENTS, icon: FiUsers },
      { id: 'calendar', label: 'Calendar', path: ROUTES.CALENDAR, icon: FiCalendar },
    ],
  },
  visa_officer: {
    title: 'Visa desk',
    hint: 'Filings and case follow-ups',
    links: [
      { id: 'visas', label: 'Visa cases', path: ROUTES.VISAS, icon: FiGlobe },
      { id: 'students', label: 'Students', path: ROUTES.STUDENTS, icon: FiUsers },
      { id: 'apps', label: 'Applications', path: ROUTES.APPLICATIONS, icon: FiClipboard },
    ],
  },
  finance_manager: {
    title: 'Finance desk',
    hint: 'Collections and reports',
    links: [
      { id: 'fees', label: 'Fees', path: ROUTES.INVOICES, icon: FiDollarSign },
      { id: 'reports', label: 'Reports', path: ROUTES.REPORTS, icon: FiActivity },
      { id: 'students', label: 'Students', path: ROUTES.STUDENTS, icon: FiUsers },
    ],
  },
  finance_executive: {
    title: 'Collections',
    hint: 'Branch invoices and payments',
    links: [
      { id: 'fees', label: 'Fees', path: ROUTES.INVOICES, icon: FiDollarSign },
      { id: 'students', label: 'Students', path: ROUTES.STUDENTS, icon: FiUsers },
    ],
  },
  telecaller: {
    title: 'Calling desk',
    hint: 'Leads and follow-ups',
    links: [
      { id: 'enquiries', label: 'Enquiries', path: ROUTES.ENQUIRIES, icon: FiBriefcase },
      { id: 'calendar', label: 'Follow-ups', path: ROUTES.CALENDAR, icon: FiCalendar },
    ],
  },
  marketing_executive: {
    title: 'Marketing desk',
    hint: 'Lead intake and campaigns',
    links: [
      { id: 'enquiries', label: 'Enquiries', path: ROUTES.ENQUIRIES, icon: FiBriefcase },
      { id: 'calendar', label: 'Calendar', path: ROUTES.CALENDAR, icon: FiCalendar },
    ],
  },
  partner: {
    title: 'Partner portal',
    hint: 'Your referred students',
    links: [
      { id: 'home', label: 'Agent home', path: ROUTES.AGENT_DASHBOARD, icon: FiGrid },
      { id: 'students', label: 'My students', path: ROUTES.AGENT_STUDENTS, icon: FiUsers },
    ],
  },
  student_portal: {
    title: 'Student portal',
    hint: 'Your academic journey',
    links: [
      { id: 'home', label: 'Student home', path: ROUTES.STUDENT_DASHBOARD, icon: FiGrid },
      { id: 'apps', label: 'Applications', path: ROUTES.STUDENT_APPLICATIONS, icon: FiClipboard },
      { id: 'attendance', label: 'Attendance', path: ROUTES.STUDENT_ATTENDANCE, icon: FiUserCheck },
    ],
  },
};

const FALLBACK_WORKSPACE = {
  title: 'My workspace',
  hint: 'Shortcuts for your role',
  links: [
    { id: 'dash', label: 'Dashboard', path: ROUTES.DASHBOARD, icon: FiGrid },
    { id: 'profile', label: 'My profile', path: ROUTES.PROFILE, icon: FiSettings },
  ],
};

/** Sidebar dock shows fewer links than profile page */
const DOCK_LIMIT = 3;

export function getRoleProfileWorkspace(roleSlug) {
  if (!roleSlug) return FALLBACK_WORKSPACE;
  return ROLE_PROFILE_WORKSPACE[roleSlug] || FALLBACK_WORKSPACE;
}

export function getRoleSidebarDock(roleSlug) {
  const workspace = getRoleProfileWorkspace(roleSlug);
  const links = workspace.links.filter(
    (link) => !DOCK_SKIP_PATHS.has(normalizeDockPath(link.path)),
  );
  if (!links.length) return null;
  return {
    title: 'Quick links',
    links: links.slice(0, DOCK_LIMIT),
  };
}
