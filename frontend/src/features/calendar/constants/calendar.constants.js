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
  { id: 'ENQUIRY', label: 'Enquiry' },
  { id: 'LEAD', label: 'Lead' },
  { id: 'STUDENT', label: 'Student' },
  { id: 'APPLICATION', label: 'Application' },
  { id: 'VISA', label: 'Visa' },
  { id: 'INVOICE', label: 'Invoice' },
  { id: 'DEMO', label: 'Demo' },
  { id: 'CLASS', label: 'Class' },
];

export const CALENDAR_EVENT_TYPES = [
  { id: 'FOLLOWUP', label: 'Follow-up' },
  { id: 'APPOINTMENT', label: 'Appointment' },
  { id: 'DUE_DATE', label: 'Due Date' },
  { id: 'OFFER', label: 'Offer' },
  { id: 'EXPIRY', label: 'Expiry' },
  { id: 'DEMO', label: 'Demo' },
  { id: 'CLASS', label: 'Class' },
];

export const DEFAULT_CALENDAR_FILTERS = {
  categories: ['ENQUIRY', 'LEAD', 'STUDENT', 'APPLICATION', 'VISA', 'INVOICE', 'DEMO', 'CLASS'],
  eventTypes: ['FOLLOWUP', 'APPOINTMENT', 'DUE_DATE', 'OFFER', 'EXPIRY', 'DEMO', 'CLASS'],
  assignedTo: '',
  branchId: '',
  status: '',
  priority: '',
  search: '',
};
