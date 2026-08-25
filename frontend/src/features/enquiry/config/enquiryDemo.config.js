export const DEMO_ATTENDANCE_OPTIONS = [
  { value: 'NOT_MARKED', label: 'Not marked' },
  { value: 'ATTENDED', label: 'Attended' },
  { value: 'ABSENT', label: 'Absent' },
  { value: 'LATE', label: 'Late' },
  { value: 'NO_SHOW', label: 'No-show' },
];

export const DEMO_ATTENDANCE_ALL_OPTIONS = [
  ...DEMO_ATTENDANCE_OPTIONS,
  { value: 'PRESENT', label: 'Attended' },
  { value: 'PARTIAL', label: 'Partial' },
];

/** Enquiry pipeline statuses that must come from a real demo session, not the grid pill. */
export const DEMO_DRIVEN_ENQUIRY_STATUSES = new Set(['DEMO_SCHEDULED', 'DEMO_ATTENDED']);

export const DEMO_SESSION_STATUS_OPTIONS = [
  { value: 'SCHEDULED', label: 'Scheduled' },
  { value: 'RESCHEDULED', label: 'Rescheduled' },
  { value: 'CANCELLED', label: 'Cancelled' },
  { value: 'COMPLETED', label: 'Completed' },
];

export const DEMO_RESULT_OPTIONS = [
  { value: 'PENDING', label: 'Pending' },
  { value: 'POSITIVE', label: 'Positive' },
  { value: 'NEUTRAL', label: 'Neutral' },
  { value: 'NEGATIVE', label: 'Negative' },
  { value: 'CONVERTED', label: 'Converted' },
];

export const DEMO_CLASSES = [
  'IELTS Foundation',
  'IELTS Advanced',
  'PTE Intensive',
  'Spoken English',
  'GRE Prep',
  'SAT Prep',
  'DuoLingo',
];

export const DEMO_BATCHES = [
  'Morning A',
  'Morning B',
  'Afternoon A',
  'Evening A',
  'Weekend Batch',
];

export function getDemoAttendanceLabel(value) {
  return DEMO_ATTENDANCE_ALL_OPTIONS.find((a) => a.value === value)?.label ?? value;
}

export function getDemoResultLabel(value) {
  return DEMO_RESULT_OPTIONS.find((r) => r.value === value)?.label ?? value;
}

export function getDemoAttendanceTone(value) {
  const tones = {
    PRESENT: 'success',
    ATTENDED: 'success',
    ABSENT: 'danger',
    LATE: 'warning',
    PARTIAL: 'info',
    NO_SHOW: 'danger',
    NOT_MARKED: 'secondary',
  };
  return tones[value] || 'secondary';
}

export function getDemoResultTone(value) {
  const tones = {
    PENDING: 'secondary',
    POSITIVE: 'success',
    NEUTRAL: 'info',
    NEGATIVE: 'danger',
    CONVERTED: 'primary',
  };
  return tones[value] || 'secondary';
}
