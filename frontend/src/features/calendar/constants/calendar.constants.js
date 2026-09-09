import {
  FiInbox, FiUserPlus, FiUsers, FiSend, FiGlobe, FiDollarSign,
  FiMonitor, FiBookOpen, FiPhone, FiCalendar, FiClock, FiAward, FiAlertTriangle,
} from 'react-icons/fi';

export const CALENDAR_VIEWS = {
  MONTH: 'dayGridMonth',
  WEEK: 'timeGridWeek',
  DAY: 'timeGridDay',
  LIST: 'listMonth',
};

export const CALENDAR_VIEW_OPTIONS = [
  { id: 'month', label: 'Month', fc: CALENDAR_VIEWS.MONTH },
  { id: 'week', label: 'Week', fc: CALENDAR_VIEWS.WEEK },
  { id: 'day', label: 'Day', fc: CALENDAR_VIEWS.DAY },
  { id: 'list', label: 'List', fc: CALENDAR_VIEWS.LIST },
];

export const CALENDAR_CATEGORIES = [
  { id: 'ENQUIRY', label: 'Enquiry', icon: FiInbox, tone: 'brand' },
  { id: 'LEAD', label: 'Lead', icon: FiUserPlus, tone: 'info' },
  { id: 'STUDENT', label: 'Student', icon: FiUsers, tone: 'success' },
  { id: 'APPLICATION', label: 'Application', icon: FiSend, tone: 'sky' },
  { id: 'VISA', label: 'Visa', icon: FiGlobe, tone: 'amber' },
  { id: 'INVOICE', label: 'Invoice', icon: FiDollarSign, tone: 'warning' },
  { id: 'DEMO', label: 'Demo', icon: FiMonitor, tone: 'info' },
  { id: 'CLASS', label: 'Class', icon: FiBookOpen, tone: 'brand' },
];

export const CALENDAR_EVENT_TYPES = [
  { id: 'FOLLOWUP', label: 'Follow-up', icon: FiPhone, tone: 'warning' },
  { id: 'APPOINTMENT', label: 'Appointment', icon: FiCalendar, tone: 'brand' },
  { id: 'DUE_DATE', label: 'Due Date', icon: FiClock, tone: 'warning' },
  { id: 'OFFER', label: 'Offer', icon: FiAward, tone: 'success' },
  { id: 'EXPIRY', label: 'Expiry', icon: FiAlertTriangle, tone: 'danger' },
  { id: 'DEMO', label: 'Demo', icon: FiMonitor, tone: 'info' },
  { id: 'CLASS', label: 'Class', icon: FiBookOpen, tone: 'brand' },
];

export const CALENDAR_FILTER_PRESETS = [
  { id: 'all', label: 'All', description: 'Everything in range' },
  { id: 'overdue', label: 'Overdue', description: 'Past due items' },
  { id: 'followups', label: 'Follow-ups', description: 'Outreach only' },
  { id: 'appointments', label: 'Meetings', description: 'Appointments' },
  { id: 'due', label: 'Due & expiry', description: 'Fees, offers, expiry' },
  { id: 'classes', label: 'Classes', description: 'Demo + class sessions' },
];

export const DEFAULT_CALENDAR_FILTERS = {
  categories: CALENDAR_CATEGORIES.map((c) => c.id),
  eventTypes: CALENDAR_EVENT_TYPES.map((t) => t.id),
  assignedTo: '',
  branchId: '',
  status: '',
  priority: '',
  search: '',
};
