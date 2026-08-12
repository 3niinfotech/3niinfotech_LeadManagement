import {
  FiInbox, FiUserPlus, FiClock, FiMonitor, FiFileText, FiTrendingUp, FiArchive,
} from 'react-icons/fi';

/**
 * Curated enquiry summary — counsellor daily view only (not every status).
 */
export const ENQUIRY_SUMMARY_CARDS = [
  {
    key: 'total',
    label: 'Total',
    icon: FiInbox,
    tone: 'neutral',
    filterValue: null,
    value: (s) => s.total ?? 0,
  },
  {
    key: 'new',
    label: 'New',
    icon: FiUserPlus,
    tone: 'info',
    filterValue: 'NEW',
    value: (s) => s.new ?? 0,
  },
  {
    key: 'followUp',
    label: 'Follow-up',
    icon: FiClock,
    tone: 'warning',
    filterValue: 'FOLLOW_UP',
    value: (s) => s.followUp ?? 0,
  },
  {
    key: 'demo',
    label: 'Demo',
    icon: FiMonitor,
    tone: 'primary',
    filterValue: '__demo',
    value: (s) => (s.demoScheduled ?? 0) + (s.demoAttended ?? 0),
  },
  {
    key: 'documentsPending',
    label: 'Documents',
    icon: FiFileText,
    tone: 'warning',
    filterValue: 'DOCUMENTS_PENDING',
    value: (s) => s.documentsPending ?? 0,
  },
  {
    key: 'converted',
    label: 'Converted',
    icon: FiTrendingUp,
    tone: 'success',
    filterValue: 'CONVERTED',
    value: (s) => s.converted ?? 0,
  },
  {
    key: 'closed',
    label: 'Closed',
    icon: FiArchive,
    tone: 'danger',
    filterValue: '__closed',
    value: (s) => (s.lost ?? 0) + (s.notInterested ?? 0) + (s.hold ?? 0)
      + (s.spam ?? 0) + (s.duplicate ?? 0),
  },
];

export function buildEnquirySummaryItems(summary = {}) {
  return ENQUIRY_SUMMARY_CARDS.map((card) => ({
    key: card.key,
    label: card.label,
    icon: card.icon,
    tone: card.tone,
    filterValue: card.filterValue,
    value: card.value(summary),
  }));
}
