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
    label: 'Present',
    icon: FiCheckCircle,
    tone: 'success',
    filterValue: '__attended',
    value: (s) => s?.present ?? s?.attended ?? 0,
  },
  {
    key: 'missed',
    label: 'Absent',
    icon: FiUserX,
    tone: 'danger',
    filterValue: '__missed',
    value: (s) => s?.absent ?? s?.missed ?? 0,
  },
  {
    key: 'notMarked',
    label: 'Not Marked',
    icon: FiAlertCircle,
    tone: 'warning',
    filterValue: '__notMarked',
    value: (s) => s?.notMarked ?? 0,
  },
  {
    key: 'converted',
    label: 'Converted',
    icon: FiTrendingUp,
    tone: 'primary',
    filterValue: '__converted',
    value: (s) => s?.converted ?? 0,
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

/** Compact strip for today's demo attendance on Demo page */
export function buildTodayAttendanceSummary(summary = {}) {
  const total = summary.todayTotal
    ?? ((summary.todayPresent || 0) + (summary.todayAbsent || 0) + (summary.todayNotMarked || 0));
  return {
    total,
    present: summary.todayPresent ?? 0,
    absent: summary.todayAbsent ?? 0,
    notMarked: summary.todayNotMarked ?? 0,
    rate: summary.todayAttendanceRate,
  };  
}
