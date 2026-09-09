import {
  FiAlertTriangle,
  FiBookOpen,
  FiCalendar,
  FiCheck,
  FiCheckSquare,
  FiClock,
  FiDollarSign,
  FiFileText,
  FiGlobe,
  FiUser,
  FiVideo,
} from 'react-icons/fi';

export const TASK_BUCKETS = {
  overdue: { label: 'Overdue', tone: 'danger' },
  today: { label: 'Today', tone: 'warning' },
  upcoming: { label: 'Upcoming', tone: 'brand' },
};

export const TASK_TYPE_META = {
  Enquiry: { Icon: FiUser, tone: 'brand', chip: 'Enquiry' },
  Demo: { Icon: FiVideo, tone: 'success', chip: 'Demo' },
  Class: { Icon: FiBookOpen, tone: 'brand', chip: 'Class' },
  Fees: { Icon: FiDollarSign, tone: 'warning', chip: 'Fees' },
  Application: { Icon: FiFileText, tone: 'info', chip: 'Application' },
  Visa: { Icon: FiGlobe, tone: 'info', chip: 'Visa' },
  Student: { Icon: FiUser, tone: 'success', chip: 'Student' },
  Lead: { Icon: FiUser, tone: 'warning', chip: 'Lead' },
  Reminder: { Icon: FiClock, tone: 'neutral', chip: 'Reminder' },
};

const ICON_WRAP = {
  brand: 'bg-brand-soft text-brand',
  success: 'bg-success-soft text-success',
  warning: 'bg-warning-soft text-warning',
  info: 'bg-info-soft text-info',
  danger: 'bg-danger-soft text-danger',
  neutral: 'bg-page text-text-muted border border-border',
};

export function resolveTaskTypeMeta(type) {
  return TASK_TYPE_META[type] || TASK_TYPE_META.Reminder;
}

export function resolveTaskIconWrap(tone) {
  return ICON_WRAP[tone] || ICON_WRAP.neutral;
}

export function mapReminderToTask(row, bucket) {
  const priority = String(row.priority || 'MEDIUM').toUpperCase();
  const isHigh = priority === 'HIGH' || priority === 'URGENT';
  const statusLabel = bucket === 'overdue' || row.isOverdue
    ? 'Overdue'
    : bucket === 'today'
      ? 'Due today'
      : 'Upcoming';

  return {
    id: row.id,
    title: row.title || 'Follow-up',
    description: row.description || null,
    type: row.type || 'Reminder',
    eventType: row.eventType,
    bucket,
    statusLabel,
    priority,
    priorityLabel: isHigh ? 'High' : priority === 'LOW' ? 'Low' : 'Medium',
    isHigh,
    dueLabel: row.dueAt || '—',
    startAt: row.startAt,
    link: row.link || null,
    assignedTo: row.assignedUserName || 'You',
    branchName: row.branchName || null,
    canComplete: Boolean(row.canComplete),
    canReschedule: Boolean(row.canReschedule),
    relatedEntity: row.relatedEntity || null,
  };
}

export function buildTaskBuckets(feed = {}) {
  const overdue = (feed.overdue || []).map((r) => mapReminderToTask(r, 'overdue'));
  const today = (feed.dueToday || []).map((r) => mapReminderToTask(r, 'today'));
  const upcoming = (feed.upcoming || []).map((r) => mapReminderToTask(r, 'upcoming'));
  return { overdue, today, upcoming, all: [...overdue, ...today, ...upcoming] };
}

export function filterTasksByType(tasks, typeFilter) {
  if (!typeFilter || typeFilter === 'all') return tasks;
  return tasks.filter((t) => t.type === typeFilter);
}

export function collectTypeFilters(tasks) {
  const types = new Set(tasks.map((t) => t.type).filter(Boolean));
  return ['all', ...Array.from(types).sort()];
}

export function snoozeToTomorrowIso(startAt) {
  const base = startAt ? new Date(startAt) : new Date();
  const next = new Date(base);
  next.setDate(next.getDate() + 1);
  if (Number.isNaN(next.getTime())) {
    const fallback = new Date();
    fallback.setDate(fallback.getDate() + 1);
    fallback.setHours(10, 0, 0, 0);
    return fallback.toISOString();
  }
  next.setHours(next.getHours() || 10, next.getMinutes() || 0, 0, 0);
  return next.toISOString();
}

export function taskActionHint(task) {
  if (task.canComplete) return 'Mark appointment complete';
  if (task.canReschedule) return 'Snooze to tomorrow';
  return 'Open record to action';
}

export { FiAlertTriangle, FiCheck, FiCheckSquare, FiClock };
