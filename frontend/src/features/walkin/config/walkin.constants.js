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

export const WALKIN_PROFILE_TABS = [
  { id: 'overview', label: 'Overview', icon: 'layout', group: 'core' },
  { id: 'timeline', label: 'Timeline', icon: 'clock', editOnly: true, group: 'activity' },
  { id: 'notes', label: 'Notes', icon: 'edit', editOnly: true, group: 'activity' },
  { id: 'communication', label: 'Calls', icon: 'message', editOnly: true, group: 'activity' },
  { id: 'documents', label: 'Documents', icon: 'file', editOnly: true, group: 'records' },
  { id: 'appointments', label: 'Appointments', icon: 'calendar', editOnly: true, group: 'records' },
  { id: 'tasks', label: 'Tasks', icon: 'checkSquare', editOnly: true, group: 'records' },
  { id: 'activity', label: 'Activity', icon: 'activity', editOnly: true, group: 'system' },
  { id: 'history', label: 'History', icon: 'history', editOnly: true, group: 'system' },
  { id: 'audit', label: 'Audit', icon: 'shield', editOnly: true, group: 'system' },
];

export const WALKIN_VIEW_TABS = [
  { id: 'all', label: 'All' },
  { id: 'today', label: 'Today' },
  { id: 'waiting', label: 'Waiting' },
  { id: 'in_counselling', label: 'In Counselling' },
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
