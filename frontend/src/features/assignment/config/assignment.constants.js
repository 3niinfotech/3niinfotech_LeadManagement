export const VISIT_PURPOSES = [
  'Study Abroad Enquiry',
  'Visa Consultation',
  'IELTS / Coaching Demo',
  'Documentation Support',
  'Follow-up Visit',
  'Fee / Payment Query',
  'Existing Student Support',
  'Other',
];

/** System-derived availability labels (read-only, from backend engine) */
export const AVAILABILITY_STATUS_DISPLAY = {
  AVAILABLE: { label: 'Available', tone: 'success' },
  TEMPORARILY_BUSY: { label: 'Temporarily Busy', tone: 'warning' },
  ON_LEAVE: { label: 'On Leave', tone: 'danger' },
  OUTSIDE_WORKING_HOURS: { label: 'Outside Working Hours', tone: 'caution' },
  AT_CAPACITY: { label: 'At Capacity', tone: 'caution' },
  INELIGIBLE: { label: 'Ineligible', tone: 'neutral' },
  UNAVAILABLE: { label: 'Unavailable', tone: 'danger' },
  OFFLINE: { label: 'Offline', tone: 'neutral' },
};

/** @deprecated Manual presence removed — use AVAILABILITY_STATUS_DISPLAY */
export const PRESENCE_STATUS_OPTIONS = Object.entries(AVAILABILITY_STATUS_DISPLAY).map(([value, cfg]) => ({
  value,
  label: cfg.label,
  tone: cfg.tone,
}));

export const OFFER_REJECT_REASONS = [
  'In another session',
  'On break',
  'Not my expertise',
  'At capacity',
  'Other',
];
