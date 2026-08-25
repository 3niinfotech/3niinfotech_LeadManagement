import {
  FiUsers,
  FiUserCheck,
  FiSend,
  FiAward,
  FiGlobe,
  FiCheckCircle,
  FiPauseCircle,
} from 'react-icons/fi';

export const STUDENT_SUMMARY_CARDS = [
  {
    key: 'total',
    label: 'Total Students',
    icon: FiUsers,
    tone: 'neutral',
    filterValue: null,
    value: (s) => s?.total ?? 0,
  },
  {
    key: 'REGISTERED',
    label: 'Registered',
    icon: FiUserCheck,
    tone: 'info',
    filterValue: 'REGISTERED',
    value: (s) => s?.REGISTERED ?? 0,
  },
  {
    key: 'APPLICATION_SUBMITTED',
    label: 'Applied',
    icon: FiSend,
    tone: 'primary',
    filterValue: 'APPLICATION_SUBMITTED',
    value: (s) => s?.APPLICATION_SUBMITTED ?? 0,
  },
  {
    key: 'OFFER_RECEIVED',
    label: 'Offer Received',
    icon: FiAward,
    tone: 'success',
    filterValue: 'OFFER_RECEIVED',
    value: (s) => s?.OFFER_RECEIVED ?? 0,
  },
  {
    key: 'VISA_APPLIED',
    label: 'Visa Process',
    icon: FiGlobe,
    tone: 'warning',
    filterValue: 'VISA_APPLIED',
    value: (s) => (s?.VISA_APPLIED ?? 0) + (s?.VISA_GRANTED ?? 0),
  },
  {
    key: 'ENROLLED',
    label: 'Enrolled',
    icon: FiCheckCircle,
    tone: 'success',
    filterValue: 'ENROLLED',
    value: (s) => s?.ENROLLED ?? 0,
  },
  {
    key: 'DEFERRED',
    label: 'Deferred',
    icon: FiPauseCircle,
    tone: 'danger',
    filterValue: 'DEFERRED',
    value: (s) => (s?.DEFERRED ?? 0) + (s?.WITHDRAWN ?? 0),
  },
];

export function buildStudentSummaryItems(summary = {}) {
  const total = Number(summary?.total) || 0;

  return STUDENT_SUMMARY_CARDS.map((card) => {
    const val = typeof card.value === 'function' ? card.value(summary) : Number(summary?.[card.key]) || 0;
    const pct = total > 0 && card.key !== 'total' ? Math.round((val / total) * 100) : null;

    return {
      key: card.key,
      label: card.label,
      value: val,
      percent: pct,
      icon: card.icon,
      tone: card.tone,
      filterValue: card.filterValue,
    };
  });
}
