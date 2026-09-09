import {
  FiUserPlus, FiAlertCircle, FiUsers, FiCheckCircle,
} from 'react-icons/fi';

/**
 * Reception KPIs — same item shape as Enquiry / Demo / Applications SummaryStatBar.
 * No waiting-list KPI: course auto-assign covers counsellor routing.
 */
export function buildReceptionKpiItems(metrics = {}) {
  const {
    todayCount = 0,
    unassignedCount = 0,
    inCounsellingCount = 0,
    completedCount = 0,
  } = metrics;

  return [
    {
      key: 'todayWalkIns',
      label: 'Today',
      value: todayCount,
      tone: 'primary',
      icon: FiUserPlus,
      filterValue: 'today',
    },
    {
      key: 'unassigned',
      label: 'Unassigned',
      value: unassignedCount,
      tone: unassignedCount > 0 ? 'danger' : 'secondary',
      icon: FiAlertCircle,
      filterValue: 'unassigned',
    },
    {
      key: 'inCounselling',
      label: 'In Session',
      value: inCounsellingCount,
      tone: 'info',
      icon: FiUsers,
      filterValue: 'in_counselling',
    },
    {
      key: 'completed',
      label: 'Done',
      value: completedCount,
      tone: 'success',
      icon: FiCheckCircle,
      filterValue: 'completed',
    },
  ];
}
