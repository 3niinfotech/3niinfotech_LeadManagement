import {
  FiUsers,
  FiUserCheck,
  FiUserX,
  FiBookOpen,
  FiAlertCircle,
  FiPercent,
  FiCalendar,
  FiClock,
} from 'react-icons/fi';

export function buildBatchListSummary(batches = []) {
  const total = batches.length;
  const assigned = batches.filter((b) => b.instructorId || b.instructor).length;
  const unassigned = total - assigned;
  const students = batches.reduce((n, b) => n + (b._count?.enrollments || 0), 0);
  const withSessions = batches.filter((b) => (b._count?.sessions || 0) > 0).length;
  const active = batches.filter((b) => b.isActive !== false).length;

  return { total, assigned, unassigned, students, withSlots: withSessions, active };
}

export function buildBatchListSummaryItems(summary = {}) {
  return [
    {
      key: 'total',
      label: 'Total batches',
      icon: FiUsers,
      tone: 'neutral',
      filterValue: null,
      value: summary.total ?? 0,
    },
    {
      key: 'active',
      label: 'Active',
      icon: FiBookOpen,
      tone: 'primary',
      filterValue: 'active',
      value: summary.active ?? 0,
    },
    {
      key: 'assigned',
      label: 'With instructor',
      icon: FiUserCheck,
      tone: 'success',
      filterValue: 'assigned',
      value: summary.assigned ?? 0,
    },
    {
      key: 'unassigned',
      label: 'Unassigned',
      icon: FiUserX,
      tone: 'warning',
      filterValue: 'unassigned',
      value: summary.unassigned ?? 0,
    },
    {
      key: 'students',
      label: 'Enrolled students',
      icon: FiUsers,
      tone: 'info',
      filterValue: 'students',
      value: summary.students ?? 0,
    },
    {
      key: 'withSlots',
      label: 'With sessions',
      icon: FiCalendar,
      tone: 'primary',
      filterValue: 'withSlots',
      value: summary.withSlots ?? 0,
    },
  ];
}

export function buildBatchDetailSummaryItems(summary = {}, extras = {}) {
  return [
    {
      key: 'students',
      label: 'Students',
      icon: FiUsers,
      tone: 'neutral',
      filterValue: null,
      value: summary.totalStudents ?? 0,
    },
    {
      key: 'avg',
      label: 'Avg attendance',
      icon: FiPercent,
      tone: 'primary',
      filterValue: 'avg',
      value: `${summary.averageAttendance ?? 0}%`,
    },
    {
      key: 'atRisk',
      label: 'At risk',
      icon: FiAlertCircle,
      tone: 'danger',
      filterValue: 'atRisk',
      value: summary.lowAttendanceStudents ?? 0,
    },
    {
      key: 'slots',
      label: 'Weekly slots',
      icon: FiClock,
      tone: 'info',
      filterValue: 'slots',
      value: extras.slotCount ?? 0,
    },
    {
      key: 'sessions',
      label: 'Sessions',
      icon: FiCalendar,
      tone: 'success',
      filterValue: 'sessions',
      value: extras.sessionCount ?? 0,
    },
  ];
}

export const BATCH_WEEKDAYS = [
  'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday',
];
