import {
  FiInbox,
  FiCalendar,
  FiClock,
  FiCheckCircle,
  FiXCircle,
  FiTrendingUp,
} from 'react-icons/fi';

export const DEMO_VIEW_TABS = [
  { id: 'all', label: 'All Demos', icon: FiInbox },
  { id: 'today', label: "Today's", icon: FiCalendar },
  { id: 'upcoming', label: 'Upcoming', icon: FiClock },
  { id: 'attended', label: 'Present', icon: FiCheckCircle },
  { id: 'missed', label: 'Absent', icon: FiXCircle },
  { id: 'converted', label: 'Converted', icon: FiTrendingUp },
];

/** Final statuses only: PRESENT | ABSENT. NOT_MARKED is temporary. */
export const DEMO_ATTENDANCE_OPTIONS = [
  { value: 'PRESENT', label: 'PRESENT', tone: 'success' },
  { value: 'ABSENT', label: 'ABSENT', tone: 'danger' },
  { value: 'NOT_MARKED', label: 'NOT MARKED', tone: 'warning' },
];

/** Filter dropdown — All + three states */
export const DEMO_ATTENDANCE_FILTER_OPTIONS = [
  { value: '', label: 'All' },
  ...DEMO_ATTENDANCE_OPTIONS,
];

export const DEMO_SESSION_STATUS_OPTIONS = [
  { value: 'SCHEDULED', label: 'Scheduled', tone: 'primary' },
  { value: 'RESCHEDULED', label: 'Rescheduled', tone: 'warning' },
  { value: 'CANCELLED', label: 'Cancelled', tone: 'danger' },
  { value: 'COMPLETED', label: 'Completed', tone: 'success' },
];

export const DEMO_RESULT_OPTIONS = [
  { value: 'PENDING', label: 'Pending Outcome', tone: 'secondary' },
  { value: 'POSITIVE', label: 'Positive', tone: 'success' },
  { value: 'NEUTRAL', label: 'Neutral', tone: 'info' },
  { value: 'NEGATIVE', label: 'Negative', tone: 'danger' },
  { value: 'CONVERTED', label: 'Converted', tone: 'primary' },
];

export const DEMO_CLASSES = [
  'IELTS Foundation',
  'IELTS Advanced',
  'PTE Intensive',
  'Spoken English',
  'GRE Prep',
  'SAT Prep',
  'DuoLingo',
  'TOEFL Prep',
  'German A1/A2',
  'French Beginner',
];

export const DEMO_BATCHES = [
  'Morning A (09:00 AM)',
  'Morning B (11:00 AM)',
  'Afternoon A (02:00 PM)',
  'Evening A (05:00 PM)',
  'Evening B (07:00 PM)',
  'Weekend FastTrack',
];

export function normalizeDemoAttendance(value) {
  const raw = String(value || 'NOT_MARKED').toUpperCase();
  if (raw === 'PRESENT' || raw === 'ATTENDED') return 'PRESENT';
  if (raw === 'ABSENT' || raw === 'NO_SHOW') return 'ABSENT';
  return 'NOT_MARKED';
}

export function getDemoAttendanceBadgeTone(attendance) {
  switch (normalizeDemoAttendance(attendance)) {
    case 'PRESENT':
      return 'success';
    case 'ABSENT':
      return 'danger';
    case 'NOT_MARKED':
    default:
      return 'warning';
  }
}

export function getDemoAttendanceLabel(attendance) {
  const v = normalizeDemoAttendance(attendance);
  return DEMO_ATTENDANCE_OPTIONS.find((a) => a.value === v)?.label || v;
}

export function getDemoSessionStatusTone(status) {
  switch (status) {
    case 'SCHEDULED':
      return 'primary';
    case 'COMPLETED':
      return 'success';
    case 'RESCHEDULED':
      return 'warning';
    case 'CANCELLED':
      return 'danger';
    default:
      return 'secondary';
  }
}

export function getDemoResultBadgeTone(result) {
  switch (result) {
    case 'CONVERTED':
      return 'primary';
    case 'POSITIVE':
      return 'success';
    case 'NEUTRAL':
      return 'info';
    case 'NEGATIVE':
      return 'danger';
    case 'PENDING':
    default:
      return 'secondary';
  }
}

export function formatDemoDay(day) {
  if (!day) return '—';
  return `Day ${day}`;
}
