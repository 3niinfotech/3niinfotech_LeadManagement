import {
  FiCalendar,
  FiClock,
  FiAlertCircle,
  FiPhone,
  FiUsers,
  FiDollarSign,
  FiLayers,
} from 'react-icons/fi';

/** Same SummaryStatBar shape as Manage Enquiry / Demo / Students */
export const CALENDAR_SUMMARY_CARDS = [
  {
    key: 'total',
    label: 'Total',
    icon: FiLayers,
    tone: 'neutral',
    filterValue: null,
    value: (s) => s?.total ?? 0,
  },
  {
    key: 'today',
    label: 'Today',
    icon: FiCalendar,
    tone: 'primary',
    filterValue: 'today',
    value: (s) => s?.today ?? 0,
  },
  {
    key: 'upcoming',
    label: 'Next 7 days',
    icon: FiClock,
    tone: 'info',
    filterValue: 'upcoming',
    value: (s) => s?.upcoming ?? 0,
  },
  {
    key: 'overdue',
    label: 'Overdue',
    icon: FiAlertCircle,
    tone: 'danger',
    filterValue: 'overdue',
    value: (s) => s?.overdue ?? 0,
  },
  {
    key: 'followups',
    label: 'Follow-ups',
    icon: FiPhone,
    tone: 'warning',
    filterValue: 'followups',
    value: (s) => s?.followups ?? 0,
  },
  {
    key: 'appointments',
    label: 'Appointments',
    icon: FiUsers,
    tone: 'primary',
    filterValue: 'appointments',
    value: (s) => s?.appointments ?? 0,
  },
  {
    key: 'due',
    label: 'Due dates',
    icon: FiDollarSign,
    tone: 'warning',
    filterValue: 'due',
    value: (s) => s?.invoiceDue ?? 0,
  },
];

export function buildCalendarSummaryItems(summary = {}) {
  return CALENDAR_SUMMARY_CARDS.map((card) => ({
    key: card.key,
    label: card.label,
    icon: card.icon,
    tone: card.tone,
    filterValue: card.filterValue,
    value: card.value(summary),
  }));
}
