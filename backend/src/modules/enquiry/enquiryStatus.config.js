/** Single source of truth for enquiry pipeline statuses */
export const ENQUIRY_STATUSES = [
  { value: 'NEW', summaryKey: 'new' },
  { value: 'CONTACTED', summaryKey: 'contacted' },
  { value: 'INTERESTED', summaryKey: 'interested' },
  { value: 'HIGHLY_INTERESTED', summaryKey: 'highlyInterested' },
  { value: 'FOLLOW_UP', summaryKey: 'followUp' },
  { value: 'APPOINTMENT', summaryKey: 'appointment' },
  { value: 'DEMO_SCHEDULED', summaryKey: 'demoScheduled' },
  { value: 'DEMO_ATTENDED', summaryKey: 'demoAttended' },
  { value: 'COUNSELLING', summaryKey: 'counselling' },
  { value: 'DOCUMENTS_PENDING', summaryKey: 'documentsPending' },
  { value: 'APPLICATION_STARTED', summaryKey: 'applicationStarted' },
  { value: 'CONVERTED', summaryKey: 'converted' },
  { value: 'HOLD', summaryKey: 'hold' },
  { value: 'LOST', summaryKey: 'lost' },
  { value: 'NOT_INTERESTED', summaryKey: 'notInterested' },
  { value: 'SPAM', summaryKey: 'spam' },
  { value: 'DUPLICATE', summaryKey: 'duplicate' },
];

export const ENQUIRY_STATUS_VALUES = ENQUIRY_STATUSES.map((s) => s.value);

export const CLOSED_ENQUIRY_STATUSES = [
  'LOST', 'NOT_INTERESTED', 'SPAM', 'DUPLICATE', 'CONVERTED',
];

export const CLOSED_VIEW_STATUSES = ['LOST', 'NOT_INTERESTED', 'SPAM', 'DUPLICATE'];

/** Map legacy enum values before schema migration */
export const LEGACY_ENQUIRY_STATUS_MAP = {
  FOLLOW_UP_REQUIRED: 'FOLLOW_UP',
  COUNSELLING_SCHEDULED: 'COUNSELLING',
  READY_FOR_REGISTER: 'APPLICATION_STARTED',
  DROPPED: 'LOST',
};

export function getEnquirySummaryKey(status) {
  return ENQUIRY_STATUSES.find((s) => s.value === status)?.summaryKey
    || status.toLowerCase();
}
