import {
  FiBell,
  FiBookOpen,
  FiCheckSquare,
  FiClock,
  FiVolume2,
} from 'react-icons/fi';

/** Navbar quick actions — all open as soft anchored popovers (no drawers). */
export const HEADER_ACTIONS = [
  {
    id: 'reminder',
    label: 'Reminders',
    icon: FiClock,
    tooltip: 'View upcoming reminders',
    badgeKey: 'reminder',
    tone: 'warning',
    presentation: 'dropdown',
    width: 380,
  },
  {
    id: 'notification',
    label: 'Notifications',
    icon: FiBell,
    tooltip: 'Notifications & alerts',
    badgeKey: 'notification',
    tone: 'brand',
    presentation: 'dropdown',
    width: 400,
  },
  {
    id: 'announcement',
    label: 'Announcements',
    icon: FiVolume2,
    tooltip: 'Company announcements',
    badgeKey: 'announcement',
    tone: 'info',
    presentation: 'dropdown',
    width: 400,
  },
  {
    id: 'courseFinder',
    label: 'Courses',
    icon: FiBookOpen,
    tooltip: 'Course finder',
    badgeKey: null,
    tone: 'success',
    presentation: 'dropdown',
    width: 380,
    permissions: ['masters.view', 'settings.view'],
  },
  {
    id: 'task',
    label: 'Tasks',
    icon: FiCheckSquare,
    tooltip: 'Your tasks',
    badgeKey: 'task',
    tone: 'brand',
    presentation: 'dropdown',
    width: 400,
  },
];

export const HEADER_ACTION_TONES = {
  brand: {
    hover: 'hover:bg-brand-soft hover:text-brand',
    active: 'bg-brand-soft text-brand ring-1 ring-brand/20',
    badge: 'bg-brand',
    badgeText: 'text-white',
  },
  warning: {
    hover: 'hover:bg-warning-soft hover:text-warning',
    active: 'bg-warning-soft text-warning ring-1 ring-warning/20',
    badge: 'bg-warning',
    badgeText: 'text-white',
  },
  info: {
    hover: 'hover:bg-info-soft hover:text-info',
    active: 'bg-info-soft text-info ring-1 ring-info/20',
    badge: 'bg-info',
    badgeText: 'text-white',
  },
  success: {
    hover: 'hover:bg-success-soft hover:text-success',
    active: 'bg-success-soft text-success ring-1 ring-success/20',
    badge: 'bg-success',
    badgeText: 'text-white',
  },
};

/** @deprecated Drawers removed — kept for any legacy imports */
export const HEADER_ACTION_DRAWER_WIDTH = {
  reminder: '400px',
  notification: '420px',
  announcement: '720px',
  courseFinder: '480px',
  task: '640px',
};
