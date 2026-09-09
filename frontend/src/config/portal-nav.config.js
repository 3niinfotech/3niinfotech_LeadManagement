import {
  FiAward,
  FiBarChart2,
  FiBell,
  FiBookOpen,
  FiCalendar,
  FiCheckSquare,
  FiClipboard,
  FiDollarSign,
  FiFileText,
  FiFolder,
  FiGlobe,
  FiHelpCircle,
  FiHome,
  FiMessageCircle,
  FiTrendingUp,
  FiUser,
  FiUsers,
} from 'react-icons/fi';
import { PERMISSIONS } from './permissions';
import { ROUTES } from './routes';

/** Bottom nav — max 4 primary + More */
export const PORTAL_BOTTOM_NAV = {
  student: [
    { id: 'home', to: ROUTES.STUDENT_DASHBOARD, label: 'Home', icon: FiHome },
    { id: 'courses', to: ROUTES.STUDENT_COURSES, label: 'Classes', icon: FiBookOpen, permissions: [PERMISSIONS.ATTENDANCE_VIEW, PERMISSIONS.STUDENTS_VIEW] },
    { id: 'tasks', to: ROUTES.STUDENT_ASSIGNMENTS, label: 'Tasks', icon: FiClipboard, permissions: [PERMISSIONS.ATTENDANCE_VIEW] },
    { id: 'notifications', to: ROUTES.STUDENT_NOTIFICATIONS, label: 'Alerts', icon: FiBell },
  ],
  teacher: [
    { id: 'home', to: ROUTES.TEACHER_DASHBOARD, label: 'Home', icon: FiHome },
    { id: 'classes', to: ROUTES.TEACHER_CLASSES, label: 'Classes', icon: FiBookOpen, permissions: [PERMISSIONS.ATTENDANCE_VIEW] },
    { id: 'attendance', to: ROUTES.TEACHER_ATTENDANCE, label: 'Attendance', icon: FiCheckSquare, permissions: [PERMISSIONS.ATTENDANCE_VIEW] },
    { id: 'tasks', to: ROUTES.TEACHER_ASSIGNMENTS, label: 'Tasks', icon: FiClipboard, permissions: [PERMISSIONS.ATTENDANCE_VIEW] },
    { id: 'more', to: ROUTES.TEACHER_DASHBOARD, label: 'More', icon: FiUser, isMore: true },
  ],
};

export const PORTAL_NAV = {
  student: [
    {
      items: [
        { to: ROUTES.STUDENT_DASHBOARD, label: 'Dashboard', icon: FiHome, show: true },
      ],
    },
    {
      label: 'My Learning',
      items: [
        { to: ROUTES.STUDENT_COURSES, label: 'My Courses', icon: FiBookOpen, permissions: [PERMISSIONS.ATTENDANCE_VIEW, PERMISSIONS.STUDENTS_VIEW] },
        { to: ROUTES.STUDENT_ATTENDANCE, label: 'Attendance', icon: FiCheckSquare, permissions: [PERMISSIONS.ATTENDANCE_VIEW, PERMISSIONS.STUDENTS_VIEW] },
        { to: ROUTES.STUDENT_ASSIGNMENTS, label: 'Assignments', icon: FiClipboard, permissions: [PERMISSIONS.ATTENDANCE_VIEW] },
        { to: ROUTES.STUDENT_TESTS, label: 'Tests & Results', icon: FiAward, permissions: [PERMISSIONS.ATTENDANCE_VIEW] },
        { to: ROUTES.STUDENT_MATERIALS, label: 'Study Materials', icon: FiFolder, permissions: [PERMISSIONS.ATTENDANCE_VIEW] },
        { to: ROUTES.STUDENT_PERFORMANCE, label: 'Performance', icon: FiTrendingUp, permissions: [PERMISSIONS.ATTENDANCE_VIEW] },
      ],
    },
    {
      label: 'My Journey',
      items: [
        { to: ROUTES.STUDENT_APPLICATIONS, label: 'Applications', icon: FiFileText, permissions: [PERMISSIONS.APPLICATIONS_VIEW] },
        { to: ROUTES.STUDENT_DOCUMENTS, label: 'Documents', icon: FiFileText, permissions: [PERMISSIONS.DOCUMENTS_VIEW] },
        { to: ROUTES.STUDENT_VISA, label: 'Visa Process', icon: FiGlobe, permissions: [PERMISSIONS.VISAS_VIEW] },
        { to: ROUTES.STUDENT_COUNSELING, label: 'Counselling', icon: FiUsers, permissions: [PERMISSIONS.CALENDAR_VIEW] },
      ],
    },
    {
      label: 'Finance',
      items: [
        { to: ROUTES.STUDENT_FEES, label: 'Fees & Payments', icon: FiDollarSign, permissions: [PERMISSIONS.STUDENTS_VIEW] },
        { to: ROUTES.STUDENT_RECEIPTS, label: 'Receipts', icon: FiFileText, permissions: [PERMISSIONS.STUDENTS_VIEW] },
      ],
    },
    {
      label: 'Communication',
      items: [
        { to: ROUTES.STUDENT_CALENDAR, label: 'Calendar', icon: FiCalendar, show: true },
        { to: ROUTES.STUDENT_NOTIFICATIONS, label: 'Notifications', icon: FiMessageCircle, show: true },
        { to: ROUTES.STUDENT_HELP, label: 'Help & Support', icon: FiHelpCircle, show: true },
      ],
    },
    {
      items: [
        { to: ROUTES.STUDENT_PROFILE, label: 'My Profile', icon: FiUser, show: true },
        { to: ROUTES.STUDENT_REPORTS, label: 'Reports', icon: FiBarChart2, permissions: [PERMISSIONS.ATTENDANCE_VIEW] },
      ],
    },
  ],
  teacher: [
    {
      items: [
        { to: ROUTES.TEACHER_DASHBOARD, label: 'Dashboard', icon: FiHome, permissions: [PERMISSIONS.ATTENDANCE_VIEW] },
      ],
    },
    {
      label: 'Teaching',
      items: [
        { to: ROUTES.TEACHER_CLASSES, label: 'Classes', icon: FiBookOpen, permissions: [PERMISSIONS.ATTENDANCE_VIEW] },
        { to: ROUTES.TEACHER_STUDENTS, label: 'Students', icon: FiUsers, permissions: [PERMISSIONS.ATTENDANCE_VIEW] },
        { to: ROUTES.TEACHER_ATTENDANCE, label: 'Attendance', icon: FiCheckSquare, permissions: [PERMISSIONS.ATTENDANCE_VIEW] },
        { to: ROUTES.TEACHER_ASSIGNMENTS, label: 'Assignments', icon: FiClipboard, permissions: [PERMISSIONS.ATTENDANCE_VIEW] },
        { to: ROUTES.TEACHER_TESTS, label: 'Tests', icon: FiAward, permissions: [PERMISSIONS.ATTENDANCE_VIEW] },
        { to: ROUTES.TEACHER_MATERIALS, label: 'Materials', icon: FiFolder, permissions: [PERMISSIONS.ATTENDANCE_VIEW] },
        { to: ROUTES.TEACHER_PERFORMANCE, label: 'Performance', icon: FiTrendingUp, permissions: [PERMISSIONS.ATTENDANCE_VIEW] },
      ],
    },
    {
      items: [
        { to: ROUTES.CALENDAR, label: 'Calendar', icon: FiCalendar, permissions: [PERMISSIONS.CALENDAR_VIEW] },
        { to: ROUTES.NOTIFICATIONS, label: 'Notifications', icon: FiBell, show: true },
        { to: ROUTES.PROFILE, label: 'Profile', icon: FiUser, show: true },
      ],
    },
  ],
};

export function filterPortalNav(groups, can) {
  return groups
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => {
        if (item.show === true) return true;
        if (item.show === false) return false;
        if (!item.permissions?.length) return true;
        return item.permissions.some((p) => can(p));
      }),
    }))
    .filter((group) => group.items.length > 0);
}

export function filterBottomNav(items, can) {
  return items.filter((item) => {
    if (item.isMore) return true;
    if (!item.permissions?.length) return true;
    return item.permissions.some((p) => can(p));
  });
}
