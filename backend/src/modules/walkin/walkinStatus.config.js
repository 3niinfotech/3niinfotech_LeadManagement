export const WALKIN_STATUSES = [
  { value: 'WALK_IN', label: 'New Walk-in', summaryKey: 'walkIn', tone: 'primary' },
  { value: 'WAITING', label: 'Registered', summaryKey: 'waiting', tone: 'warning' },
  { value: 'IN_COUNSELLING', label: 'In Counselling', summaryKey: 'inCounselling', tone: 'info' },
  { value: 'COMPLETED', label: 'Completed', summaryKey: 'completed', tone: 'success' },
  { value: 'CANCELLED', label: 'Cancelled', summaryKey: 'cancelled', tone: 'danger' },
  { value: 'APPOINTMENT', label: 'Appointment', summaryKey: 'appointment', tone: 'brand' },
];

export const WALKIN_STATUS_VALUES = WALKIN_STATUSES.map((s) => s.value);

export const WALKIN_SUMMARY_VIEWS = [
  { id: 'today', label: "Today's Walk-ins", summaryKey: 'todayWalkIns', tone: 'primary' },
  { id: 'unassigned', label: 'Unassigned', status: null, summaryKey: 'waiting', tone: 'danger' },
  { id: 'in_counselling', label: 'In Counselling', status: 'IN_COUNSELLING', summaryKey: 'inCounselling', tone: 'info' },
  { id: 'completed', label: 'Completed', status: 'COMPLETED', summaryKey: 'completed', tone: 'success' },
  { id: 'cancelled', label: 'Cancelled', status: 'CANCELLED', summaryKey: 'cancelled', tone: 'danger' },
  { id: 'appointment', label: 'Appointments', status: 'APPOINTMENT', summaryKey: 'appointment', tone: 'brand' },
];
