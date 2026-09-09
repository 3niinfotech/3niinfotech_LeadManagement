import {
  FiGlobe,
  FiClock,
  FiCheckCircle,
  FiXCircle,
  FiFileText,
  FiSend,
  FiUsers,
} from 'react-icons/fi';

export const VISA_SUMMARY_CARDS = [
  {
    key: 'total',
    label: 'Total Cases',
    icon: FiGlobe,
    tone: 'neutral',
    filterValue: null,
    value: (s) => s?.total ?? 0,
  },
  {
    key: 'pending',
    label: 'Pending',
    icon: FiClock,
    tone: 'warning',
    filterValue: '__pending',
    value: (s) => s?.pending ?? 0,
  },
  {
    key: 'approved',
    label: 'Approved',
    icon: FiCheckCircle,
    tone: 'success',
    filterValue: '__approved',
    value: (s) => s?.approved ?? 0,
  },
  {
    key: 'rejected',
    label: 'Rejected',
    icon: FiXCircle,
    tone: 'danger',
    filterValue: '__rejected',
    value: (s) => s?.rejected ?? 0,
  },
  {
    key: 'notStarted',
    label: 'Not Started',
    icon: FiFileText,
    tone: 'secondary',
    filterValue: 'NOT_STARTED',
    value: (s) => s?.notStarted ?? 0,
  },
  {
    key: 'submitted',
    label: 'Submitted',
    icon: FiSend,
    tone: 'primary',
    filterValue: 'APPLICATION_SUBMITTED',
    value: (s) => s?.submitted ?? 0,
  },
  {
    key: 'interview',
    label: 'Interview',
    icon: FiUsers,
    tone: 'info',
    filterValue: 'INTERVIEW_SCHEDULED',
    value: (s) => s?.interview ?? 0,
  },
];

export function buildVisaSummaryItems(summary = {}) {
  return VISA_SUMMARY_CARDS.map((card) => ({
    key: card.key,
    label: card.label,
    icon: card.icon,
    tone: card.tone,
    filterValue: card.filterValue,
    value: card.value(summary),
  }));
}
