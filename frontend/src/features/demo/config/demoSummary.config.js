import {
  FiMonitor,
  FiCalendar,
  FiClock,
  FiCheckCircle,
  FiTrendingUp,
  FiUserX,
  FiAlertCircle,
} from 'react-icons/fi';

export const DEMO_SUMMARY_CARDS = [
  {
    key: 'total',
    label: 'Total Demos',
    icon: FiMonitor,
    tone: 'neutral',
    filterValue: null,
    value: (s) => s?.total ?? 0,
  },
  {
    key: 'today',
    label: "Today's",
    icon: FiCalendar,
    tone: 'info',
    filterValue: '__today',
    value: (s) => s?.today ?? 0,
  },
  {
    key: 'scheduled',
    label: 'Scheduled',
    icon: FiClock,
    tone: 'primary',
    filterValue: '__scheduled',
    value: (s) => s?.scheduled ?? 0,
  },
  {
    key: 'attended',
    label: 'Attended',
    icon: FiCheckCircle,
    tone: 'success',
    filterValue: '__attended',
    value: (s) => s?.attended ?? 0,
  },
  {
    key: 'converted',
    label: 'Converted',
    icon: FiTrendingUp,
    tone: 'primary',
    filterValue: '__converted',
    value: (s) => s?.converted ?? 0,
  },
  {
    key: 'missed',
    label: 'Missed / Absent',
    icon: FiUserX,
    tone: 'danger',
    filterValue: '__missed',
    value: (s) => s?.missed ?? 0,
  },
  {
    key: 'pendingOutcome',
    label: 'Pending Outcome',
    icon: FiAlertCircle,
    tone: 'warning',
    filterValue: '__pendingOutcome',
    value: (s) => s?.pendingOutcome ?? 0,
  },
];

export function buildDemoSummaryItems(summary = {}) {
  return DEMO_SUMMARY_CARDS.map((card) => ({
    key: card.key,
    label: card.label,
    icon: card.icon,
    tone: card.tone,
    filterValue: card.filterValue,
    value: card.value(summary),
  }));
}
