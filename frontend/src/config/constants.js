export const PAGE_SIZES = [10, 25, 50, 100, 250, 500];

export const DEFAULT_PAGE_SIZE = 25;

export const TABLE_DENSITY = {
  COMPACT: 'compact',
  COMFORTABLE: 'comfortable',
};

export const THEMES = {
  LIGHT: 'light',
  DARK: 'dark',
};

export const STUDENT_STATUSES = [
  { value: 'ENQUIRY', label: 'Enquiry', color: 'info' },
  { value: 'REGISTERED', label: 'Registered', color: 'primary' },
  { value: 'DOCUMENT_PENDING', label: 'Document Pending', color: 'warning' },
  { value: 'APPLICATION_SUBMITTED', label: 'Application Submitted', color: 'info' },
  { value: 'OFFER_RECEIVED', label: 'Offer Received', color: 'success' },
  { value: 'VISA_APPLIED', label: 'Visa Applied', color: 'warning' },
  { value: 'VISA_GRANTED', label: 'Visa Granted', color: 'success' },
  { value: 'ENROLLED', label: 'Enrolled', color: 'success' },
  { value: 'DEFERRED', label: 'Deferred', color: 'secondary' },
  { value: 'WITHDRAWN', label: 'Withdrawn', color: 'danger' },
];

export const LEAD_STATUSES = [
  { value: 'NEW', label: 'New', color: 'info' },
  { value: 'CONTACTED', label: 'Contacted', color: 'primary' },
  { value: 'QUALIFIED', label: 'Qualified', color: 'success' },
  { value: 'PROPOSAL', label: 'Proposal', color: 'warning' },
  { value: 'NEGOTIATION', label: 'Negotiation', color: 'warning' },
  { value: 'WON', label: 'Won', color: 'success' },
  { value: 'LOST', label: 'Lost', color: 'danger' },
];

export const ENQUIRY_STATUSES = [
  {
    value: 'NEW',
    label: 'New',
    description: 'Fresh enquiry — not yet contacted',
    color: 'info',
    summaryKey: 'new',
  },
  {
    value: 'CONTACTED',
    label: 'Contacted',
    description: 'Initial contact made with the lead',
    color: 'primary',
    summaryKey: 'contacted',
  },
  {
    value: 'INTERESTED',
    label: 'Interested',
    description: 'Showed interest in courses or services',
    color: 'info',
    summaryKey: 'interested',
  },
  {
    value: 'HIGHLY_INTERESTED',
    label: 'Highly Interested',
    description: 'Strong intent — hot lead',
    color: 'primary',
    summaryKey: 'highlyInterested',
  },
  {
    value: 'FOLLOW_UP',
    label: 'Follow-up',
    description: 'Needs callback or reminder',
    color: 'warning',
    summaryKey: 'followUp',
  },
  {
    value: 'APPOINTMENT',
    label: 'Appointment',
    description: 'Meeting or call scheduled',
    color: 'warning',
    summaryKey: 'appointment',
  },
  {
    value: 'DEMO_SCHEDULED',
    label: 'Demo Scheduled',
    description: 'Product or counselling demo booked',
    color: 'primary',
    summaryKey: 'demoScheduled',
  },
  {
    value: 'DEMO_ATTENDED',
    label: 'Demo Attended',
    description: 'Demo or session completed',
    color: 'success',
    summaryKey: 'demoAttended',
  },
  {
    value: 'COUNSELLING',
    label: 'Counselling',
    description: 'Active counselling in progress',
    color: 'primary',
    summaryKey: 'counselling',
  },
  {
    value: 'DOCUMENTS_PENDING',
    label: 'Documents Pending',
    description: 'Waiting for documents from student',
    color: 'warning',
    summaryKey: 'documentsPending',
  },
  {
    value: 'APPLICATION_STARTED',
    label: 'Application Started',
    description: 'Application process initiated',
    color: 'success',
    summaryKey: 'applicationStarted',
  },
  {
    value: 'CONVERTED',
    label: 'Converted',
    description: 'Moved to student profile',
    color: 'success',
    summaryKey: 'converted',
  },
  {
    value: 'HOLD',
    label: 'Hold',
    description: 'Temporarily paused',
    color: 'secondary',
    summaryKey: 'hold',
  },
  {
    value: 'LOST',
    label: 'Lost',
    description: 'Closed without conversion',
    color: 'danger',
    summaryKey: 'lost',
  },
  {
    value: 'NOT_INTERESTED',
    label: 'Not Interested',
    description: 'Declined offer or services',
    color: 'danger',
    summaryKey: 'notInterested',
  },
  {
    value: 'SPAM',
    label: 'Spam',
    description: 'Invalid or junk enquiry',
    color: 'danger',
    summaryKey: 'spam',
  },
  {
    value: 'DUPLICATE',
    label: 'Duplicate',
    description: 'Duplicate of an existing enquiry',
    color: 'secondary',
    summaryKey: 'duplicate',
  },
];

export function getEnquiryStatusLabel(value) {
  return ENQUIRY_STATUSES.find((s) => s.value === value)?.label ?? value;
}

export function getEnquiryStatusMeta(value) {
  return ENQUIRY_STATUSES.find((s) => s.value === value);
}

export const ENQUIRY_PRIORITIES = [
  { value: 'URGENT', label: 'Urgent', color: 'danger' },
  { value: 'HIGH', label: 'High', color: 'warning' },
  { value: 'MEDIUM', label: 'Medium', color: 'info' },
  { value: 'LOW', label: 'Low', color: 'secondary' },
];

export function getEnquiryPriorityLabel(value) {
  return ENQUIRY_PRIORITIES.find((p) => p.value === value)?.label ?? value;
}

export function getEnquiryPriorityMeta(value) {
  return ENQUIRY_PRIORITIES.find((p) => p.value === value);
}

export {
  ENQUIRY_TAGS,
  ENQUIRY_TAG_LABELS,
  getEnquiryTagLabel,
  getEnquiryTagMeta,
} from '../features/enquiry/config/enquiryTags.config';

export const ENQUIRY_VIEW_TABS = [
  { id: 'all', label: 'All' },
  { id: 'assigned_to_me', label: 'Assigned to Me' },
  { id: 'unassigned', label: 'Unassigned' },
  { id: 'untouched_5_days', label: 'Untouched 5 Days' },
  { id: 'closed', label: 'Closed' },
];

/** Add Enquiry modal — stepped form tabs (create mode only) */
export const ENQUIRY_CREATE_FORM_TABS = [
  { id: 'personal', label: 'Personal', icon: 'user' },
  { id: 'other', label: 'Other Details', icon: 'book' },
  { id: 'followup', label: 'Follow Up', icon: 'phone' },
  { id: 'appointment', label: 'Appointments', icon: 'calendar' },
];

/** Enquiry-only tabs — pre-admission lead workspace (no visa/fees/application) */
export const ENQUIRY_PROFILE_TABS = [
  { id: 'overview', label: 'Lead Details', icon: 'layout', group: 'workspace' },
  { id: 'followup', label: 'Follow-up', icon: 'calendar', editOnly: true, group: 'workspace' },
  { id: 'demo', label: 'Demo', icon: 'monitor', editOnly: true, group: 'workspace' },
  { id: 'communication', label: 'Calls & WhatsApp', icon: 'message', editOnly: true, group: 'workspace' },
  { id: 'notes', label: 'Notes', icon: 'edit', editOnly: true, group: 'workspace' },
  { id: 'timeline', label: 'Timeline', icon: 'clock', editOnly: true, group: 'workspace' },
  { id: 'documents', label: 'Documents', icon: 'file', editOnly: true, group: 'workspace' },
  { id: 'conversion', label: 'Convert', icon: 'trending', editOnly: true, group: 'workspace' },
];

/** Post-conversion student profile tabs — full admission journey */
export const STUDENT_PROFILE_TABS = [
  { id: 'overview', label: 'Overview', icon: 'layout', group: 'profile' },
  { id: 'personal', label: 'Personal', icon: 'edit', group: 'profile' },
  { id: 'academic', label: 'Academic', icon: 'book', group: 'profile' },
  { id: 'documents', label: 'Documents', icon: 'file', group: 'journey' },
  { id: 'applications', label: 'Applications', icon: 'briefcase', group: 'journey' },
  { id: 'visa', label: 'Visa', icon: 'globe', group: 'journey' },
  { id: 'finance', label: 'Finance', icon: 'dollar', group: 'journey' },
  { id: 'attendance', label: 'Attendance', icon: 'clock', group: 'journey' },
  { id: 'notes', label: 'Notes', icon: 'message', group: 'activity' },
  { id: 'timeline', label: 'Timeline', icon: 'clock', group: 'activity' },
];

/** @deprecated Use ENQUIRY_CREATE_FORM_TABS or ENQUIRY_PROFILE_TABS */
export const ENQUIRY_FORM_TABS = ENQUIRY_CREATE_FORM_TABS;

/** @deprecated Use ENQUIRY_PROFILE_TABS */
export const ENQUIRY_DRAWER_TABS = ENQUIRY_PROFILE_TABS;
