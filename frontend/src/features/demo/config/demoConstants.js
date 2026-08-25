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
  { id: 'attended', label: 'Attended', icon: FiCheckCircle },
  { id: 'missed', label: 'Missed', icon: FiXCircle },
  { id: 'converted', label: 'Converted', icon: FiTrendingUp },
];

export const DEMO_ATTENDANCE_OPTIONS = [
  { value: 'NOT_MARKED', label: 'Not marked', tone: 'secondary' },
  { value: 'ATTENDED', label: 'Attended', tone: 'success' },
  { value: 'ABSENT', label: 'Absent', tone: 'danger' },
  { value: 'LATE', label: 'Late', tone: 'warning' },
  { value: 'PARTIAL', label: 'Partial', tone: 'info' },
  { value: 'NO_SHOW', label: 'No-show', tone: 'danger' },
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

export function getDemoAttendanceBadgeTone(attendance) {
  switch (attendance) {
    case 'PRESENT':
    case 'ATTENDED':
      return 'success';
    case 'ABSENT':
    case 'NO_SHOW':
      return 'danger';
    case 'LATE':
      return 'warning';
    case 'PARTIAL':
      return 'info';
    case 'NOT_MARKED':
    default:
      return 'secondary';
  }
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
