import {
  FiUserPlus, FiAlertCircle, FiUsers, FiCheckCircle, FiXCircle, FiCalendar,
} from 'react-icons/fi';
import { buildSummaryStatItems } from '../../../components/ui/summaryStatBar.helpers';

const SUMMARY_ICONS = {
  todayWalkIns: FiUserPlus,
  unassigned: FiAlertCircle,
  inCounselling: FiUsers,
  completed: FiCheckCircle,
  cancelled: FiXCircle,
  appointment: FiCalendar,
};

const SUMMARY_ITEMS = [
  { key: 'todayWalkIns', label: "Today's Walk-ins", tone: 'primary', filterValue: 'today' },
  { key: 'unassigned', label: 'Unassigned', tone: 'danger', filterValue: 'unassigned' },
  { key: 'inCounselling', label: 'In Counselling', tone: 'info', filterValue: 'IN_COUNSELLING' },
  { key: 'completed', label: 'Completed', tone: 'success', filterValue: 'COMPLETED' },
  { key: 'cancelled', label: 'Cancelled', tone: 'danger', filterValue: 'CANCELLED' },
  { key: 'appointment', label: 'Appointments', tone: 'brand', filterValue: 'APPOINTMENT' },
];

export function buildWalkInSummaryItems(summary = {}) {
  return SUMMARY_ITEMS.map((item) => ({
    key: item.key,
    label: item.label,
    value: summary[item.key] ?? 0,
    icon: SUMMARY_ICONS[item.key] || FiUserPlus,
    tone: item.tone,
    filterValue: item.filterValue,
  }));
}
