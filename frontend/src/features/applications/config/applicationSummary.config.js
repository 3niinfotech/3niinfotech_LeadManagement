import {
  FiFileText,
  FiClock,
  FiAward,
  FiSend,
  FiEdit3,
  FiXCircle,
  FiSlash,
} from 'react-icons/fi';

export const APPLICATION_SUMMARY_CARDS = [
  {
    key: 'total',
    label: 'Total Applications',
    icon: FiFileText,
    tone: 'neutral',
    filterValue: null,
    value: (s) => s?.total ?? 0,
  },
  {
    key: 'inReview',
    label: 'In Review',
    icon: FiClock,
    tone: 'info',
    filterValue: '__inReview',
    value: (s) => s?.inReview ?? 0,
  },
  {
    key: 'offer',
    label: 'Offer Stage',
    icon: FiAward,
    tone: 'success',
    filterValue: '__offer',
    value: (s) => s?.offer ?? 0,
  },
  {
    key: 'submitted',
    label: 'Submitted',
    icon: FiSend,
    tone: 'primary',
    filterValue: 'SUBMITTED',
    value: (s) => s?.submitted ?? 0,
  },
  {
    key: 'draft',
    label: 'Draft',
    icon: FiEdit3,
    tone: 'warning',
    filterValue: 'DRAFT',
    value: (s) => s?.draft ?? 0,
  },
  {
    key: 'rejected',
    label: 'Rejected',
    icon: FiXCircle,
    tone: 'danger',
    filterValue: 'REJECTED',
    value: (s) => s?.rejected ?? 0,
  },
  {
    key: 'withdrawn',
    label: 'Withdrawn',
    icon: FiSlash,
    tone: 'secondary',
    filterValue: 'WITHDRAWN',
    value: (s) => s?.withdrawn ?? 0,
  },
];

export function buildApplicationSummaryItems(summary = {}) {
  return APPLICATION_SUMMARY_CARDS.map((card) => ({
    key: card.key,
    label: card.label,
    icon: card.icon,
    tone: card.tone,
    filterValue: card.filterValue,
    value: card.value(summary),
  }));
}
