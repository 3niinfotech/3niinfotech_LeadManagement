import {
  FiFileText,
  FiEdit3,
  FiSend,
  FiPieChart,
  FiAlertTriangle,
  FiCheckCircle,
  FiDollarSign,
} from 'react-icons/fi';

export const FEES_SUMMARY_CARDS = [
  {
    key: 'total',
    label: 'Total Invoices',
    icon: FiFileText,
    tone: 'neutral',
    filterValue: null,
    value: (s) => s?.total ?? 0,
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
    key: 'sent',
    label: 'Sent',
    icon: FiSend,
    tone: 'info',
    filterValue: 'SENT',
    value: (s) => s?.sent ?? 0,
  },
  {
    key: 'partial',
    label: 'Partial',
    icon: FiPieChart,
    tone: 'primary',
    filterValue: 'PARTIAL',
    value: (s) => s?.partial ?? 0,
  },
  {
    key: 'overdue',
    label: 'Overdue',
    icon: FiAlertTriangle,
    tone: 'danger',
    filterValue: 'OVERDUE',
    value: (s) => s?.overdue ?? 0,
  },
  {
    key: 'paid',
    label: 'Paid',
    icon: FiCheckCircle,
    tone: 'success',
    filterValue: 'PAID',
    value: (s) => s?.paid ?? 0,
  },
  {
    key: 'outstanding',
    label: 'Outstanding',
    icon: FiDollarSign,
    tone: 'warning',
    filterValue: '__outstanding',
    value: (s) => {
      const n = Number(s?.outstanding ?? 0);
      return n.toLocaleString('en-IN', { maximumFractionDigits: 0 });
    },
  },
];

export function buildFeesSummaryItems(summary = {}) {
  return FEES_SUMMARY_CARDS.map((card) => ({
    key: card.key,
    label: card.label,
    icon: card.icon,
    tone: card.tone,
    filterValue: card.filterValue,
    value: card.value(summary),
  }));
}
