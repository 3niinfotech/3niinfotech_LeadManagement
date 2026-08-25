import {
  FiUserPlus, FiClock, FiUsers, FiCheckCircle,
} from 'react-icons/fi';

/** Clear operational KPIs only — no fake % trends */
export function buildReceptionKpiItems(metrics = {}, summary = {}) {
  const {
    todayCount = 0,
    waitingCount = 0,
    inCounsellingCount = 0,
    completedCount = 0,
    convertedCount = 0,
  } = metrics;

  const converted = convertedCount ?? summary.convertedToday ?? 0;

  return [
    {
      key: 'todayWalkIns',
      label: 'Today',
      value: todayCount,
      hint: 'Registered today',
      tone: 'primary',
      icon: FiUserPlus,
      filterValue: 'today',
    },
    {
      key: 'waiting',
      label: 'Waiting',
      value: waitingCount,
      hint: waitingCount ? 'Need counsellor' : 'No one waiting',
      tone: 'warning',
      icon: FiClock,
      filterValue: 'waiting',
    },
    {
      key: 'inCounselling',
      label: 'In session',
      value: inCounsellingCount,
      hint: 'With counsellor now',
      tone: 'info',
      icon: FiUsers,
      filterValue: 'in_counselling',
    },
    {
      key: 'completed',
      label: 'Done',
      value: completedCount,
      hint: converted ? `${converted} became enquiry` : 'Completed today',
      tone: 'success',
      icon: FiCheckCircle,
      filterValue: 'completed',
    },
  ];
}
