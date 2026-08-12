import {
  FiBell,
  FiBookOpen,
  FiCheckSquare,
  FiClock,
  FiVolume2,
} from 'react-icons/fi';

/** Navbar quick actions — tone drives hover accent colors */
export const HEADER_ACTIONS = [
  {
    id: 'reminder',
    label: 'Reminders',
    icon: FiClock,
    tooltip: 'View upcoming reminders',
    badgeKey: 'reminder',
    tone: 'warning',
  },
  {
    id: 'notification',
    label: 'Notifications',
    icon: FiBell,
    tooltip: 'Notifications & alerts',
    badgeKey: 'notification',
    tone: 'brand',
  },
  {
    id: 'announcement',
    label: 'Announcements',
    icon: FiVolume2,
    tooltip: 'Company announcements',
    badgeKey: 'announcement',
    tone: 'info',
  },
  {
    id: 'courseFinder',
    label: 'Courses',
    icon: FiBookOpen,
    tooltip: 'Course finder',
    badgeKey: null,
    tone: 'success',
  },
  {
    id: 'task',
    label: 'Tasks',
    icon: FiCheckSquare,
    tooltip: 'Your tasks',
    badgeKey: 'task',
    tone: 'brand',
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

export const HEADER_ACTION_DRAWER_WIDTH = {
  reminder: '400px',
  notification: '420px',
  announcement: '720px',
  courseFinder: '480px',
  task: '640px',
};
