export const WALKIN_STATUSES = [
  { value: 'WALK_IN', label: 'New Walk-in', tone: 'primary' },
  { value: 'WAITING', label: 'Waiting', tone: 'warning' },
  { value: 'IN_COUNSELLING', label: 'In Counselling', tone: 'info' },
  { value: 'COMPLETED', label: 'Completed', tone: 'success' },
  { value: 'CANCELLED', label: 'Cancelled', tone: 'danger' },
  { value: 'APPOINTMENT', label: 'Appointment', tone: 'brand' },
];

export const WALKIN_SOURCES = [
  'Walk-in',
  'Website',
  'Phone',
  'Facebook',
  'Instagram',
  'WhatsApp',
  'Reference',
  'Google',
];

export const WALKIN_PRIORITIES = [
  { value: 'NORMAL', label: 'Normal', tone: 'neutral' },
  { value: 'HIGH', label: 'High', tone: 'warning' },
  { value: 'VIP', label: 'VIP', tone: 'brand' },
];

/** Reception profile is read-only — only tabs backed by real data are shown. */
export const WALKIN_PROFILE_TABS = [
  { id: 'overview', label: 'Overview', icon: 'layout' },
  { id: 'timeline', label: 'Timeline', icon: 'clock' },
  { id: 'notes', label: 'Notes', icon: 'edit' },
];

export const WALKIN_VIEW_TABS = [
  { id: 'today', label: 'Today' },
  { id: 'waiting', label: 'Waiting' },
  { id: 'in_counselling', label: 'With counsellor' },
  { id: 'completed', label: 'Done' },
  { id: 'all', label: 'All' },
];

export function getWalkInStatusLabel(value) {
  return WALKIN_STATUSES.find((s) => s.value === value)?.label ?? value;
}

export function getWalkInStatusMeta(value) {
  return WALKIN_STATUSES.find((s) => s.value === value);
}

export function getWalkInPriorityLabel(value) {
  return WALKIN_PRIORITIES.find((p) => p.value === value)?.label ?? value;
}

export function getWalkInPriorityMeta(value) {
  return WALKIN_PRIORITIES.find((p) => p.value === value);
}

/** Badge only knows primary/secondary/success/danger/warning/info */
const TONE_TO_BADGE_COLOR = {
  brand: 'primary',
  neutral: 'secondary',
};

export function toneToBadgeColor(tone) {
  return TONE_TO_BADGE_COLOR[tone] || tone || 'secondary';
}
