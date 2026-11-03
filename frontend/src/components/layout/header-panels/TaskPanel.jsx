import { useCallback, useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import {
  FiAlertCircle,
  FiArrowUpRight,
  FiCalendar,
  FiCheck,
  FiCheckSquare,
  FiClock,
  FiFilter,
  FiRefreshCw,
  FiUser,
} from 'react-icons/fi';
import {
  fetchReminders,
  selectReminderFeed,
  selectReminderLoading,
} from '../../../modules/reminder/redux/reminderSlice';
import { calendarApi } from '../../../features/calendar/services/calendarApi.service';
import toastService from '../../../services/toast/toast.service';
import { ROUTES } from '../../../config/routes';
import {
  TASK_BUCKETS,
  buildTaskBuckets,
  collectTypeFilters,
  filterTasksByType,
  resolveTaskIconWrap,
  resolveTaskTypeMeta,
  snoozeToTomorrowIso,
} from '../../../features/tasks/utils/task.utils';
import './tasks.theme.css';

export default function TaskPanel({ onClose }) {
  const dispatch = useDispatch();
  const feed = useSelector(selectReminderFeed);
  const loading = useSelector(selectReminderLoading);

  const [bucket, setBucket] = useState('overdue');
  const [typeFilter, setTypeFilter] = useState('all');
  const [busyId, setBusyId] = useState(null);

  const reload = useCallback(() => {
    dispatch(fetchReminders({ limit: 40 }));
  }, [dispatch]);

  useEffect(() => {
    reload();
    const interval = setInterval(reload, 45000);
    return () => clearInterval(interval);
  }, [reload]);

  const buckets = useMemo(() => buildTaskBuckets(feed), [feed]);

  const counts = feed.counts || {
    overdue: buckets.overdue.length,
    dueToday: buckets.today.length,
    upcoming: buckets.upcoming.length,
  };

  const tasks = useMemo(() => {
    const list = bucket === 'today'
      ? buckets.today
      : bucket === 'upcoming'
        ? buckets.upcoming
        : buckets.overdue;
    return filterTasksByType(list, typeFilter);
  }, [buckets, bucket, typeFilter]);

  const typeOptions = useMemo(
    () => collectTypeFilters(
      bucket === 'today' ? buckets.today : bucket === 'upcoming' ? buckets.upcoming : buckets.overdue,
    ),
    [buckets, bucket],
  );

  const pendingCount = (counts.overdue || 0) + (counts.dueToday || 0);
  const scopeHint = feed.scopeMode === 'OWN'
    ? 'Your assigned tasks'
    : feed.scopeMode
      ? `Scope: ${String(feed.scopeMode).toLowerCase()}`
      : null;

  const handleComplete = async (task, e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!task.canComplete || busyId) return;
    setBusyId(task.id);
    try {
      await calendarApi.complete(task.id);
      toastService.success('Task marked complete');
      reload();
    } catch (err) {
      toastService.error(err?.response?.data?.message || err?.message || 'Could not complete task');
    } finally {
      setBusyId(null);
    }
  };

  const handleSnooze = async (task, e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!task.canReschedule || busyId) return;
    setBusyId(task.id);
    try {
      await calendarApi.reschedule(task.id, { startAt: snoozeToTomorrowIso(task.startAt) });
      toastService.success('Snoozed to tomorrow');
      reload();
    } catch (err) {
      toastService.error(err?.response?.data?.message || err?.message || 'Could not snooze task');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="crm-task-panel">
      {/* Hero Metric Header */}
      <div className="crm-task-panel__hero">
        <div className="crm-task-panel__hero-head">
          <div className="flex items-center gap-2">
            <span className="crm-task-pulse-dot" />
            <p className="crm-task-panel__hero-title">
              <strong>{pendingCount}</strong> action items need attention
            </p>
          </div>
          {scopeHint && (
            <span className="crm-task-panel__scope">
              <FiUser className="w-3 h-3 text-brand" />
              {scopeHint}
            </span>
          )}
        </div>

        <div className="crm-task-panel__metrics">
          {[
            { key: 'overdue', icon: FiAlertCircle, tone: 'danger' },
            { key: 'today', icon: FiClock, tone: 'warning' },
            { key: 'upcoming', icon: FiCalendar, tone: 'brand' },
          ].map(({ key, icon: Icon, tone }) => {
            const meta = TASK_BUCKETS[key];
            const value = key === 'overdue'
              ? counts.overdue || 0
              : key === 'today'
                ? counts.dueToday || 0
                : counts.upcoming || 0;
            const isActive = bucket === key;
            return (
              <button
                key={key}
                type="button"
                className={`crm-task-metric crm-task-metric--${tone} ${isActive ? 'crm-task-metric--active' : ''}`}
                onClick={() => {
                  setBucket(key);
                  setTypeFilter('all');
                }}
              >
                <div className="crm-task-metric__top">
                  <span className="crm-task-metric__value">{value}</span>
                  <Icon className="w-3.5 h-3.5 crm-task-metric__icon" />
                </div>
                <span className="crm-task-metric__label">{meta.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Filter Chips Toolbar */}
      <div className="crm-task-panel__toolbar">
        <div className="crm-task-panel__types">
          {typeOptions.map((type) => (
            <button
              key={type}
              type="button"
              className={`crm-task-type-chip ${typeFilter === type ? 'crm-task-type-chip--active' : ''}`}
              onClick={() => setTypeFilter(type)}
            >
              {type === 'all' ? 'All types' : (resolveTaskTypeMeta(type).chip || type)}
            </button>
          ))}
        </div>
      </div>

      {/* Task List */}
      <div className="crm-task-panel__list">
        {loading && !buckets.all.length ? (
          <div className="py-12 text-center text-sm text-text-muted">
            <FiRefreshCw className="w-5 h-5 mx-auto mb-2 animate-spin text-brand" />
            Loading live tasks…
          </div>
        ) : tasks.length === 0 ? (
          <div className="crm-task-empty">
            <div className="crm-task-empty__icon">
              <FiCheckSquare className="w-6 h-6" />
            </div>
            <p className="crm-task-empty__title">
              {bucket === 'overdue' ? 'No overdue tasks' : bucket === 'today' ? 'All caught up today!' : 'No upcoming tasks'}
            </p>
            <p className="crm-task-empty__subtitle">
              Follow-ups, demos, batch schedules and reminders will appear here automatically.
            </p>
          </div>
        ) : (
          tasks.map((task) => (
            <TaskCard
              key={`${task.id}-${task.bucket}`}
              task={task}
              busy={busyId === task.id}
              onClose={onClose}
              onComplete={handleComplete}
              onSnooze={handleSnooze}
            />
          ))
        )}
      </div>

      {/* Footer Quick Actions */}
      <div className="crm-task-panel__footer">
        <button
          type="button"
          className="crm-task-panel__footer-btn"
          onClick={reload}
          disabled={loading}
          title="Reload tasks"
        >
          <FiRefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
        <Link
          to={ROUTES.CALENDAR}
          onClick={() => onClose?.()}
          className="crm-task-panel__footer-btn crm-task-panel__footer-btn--brand"
        >
          <FiCalendar className="w-3.5 h-3.5" />
          Open Calendar
          <FiArrowUpRight className="w-3 h-3 opacity-70" />
        </Link>
      </div>
    </div>
  );
}

function TaskCard({ task, busy, onClose, onComplete, onSnooze }) {
  const typeMeta = resolveTaskTypeMeta(task.type);
  const Icon = typeMeta.Icon;

  const cardClass = task.bucket === 'overdue'
    ? 'crm-task-card--overdue'
    : task.bucket === 'today'
      ? 'crm-task-card--today'
      : '';

  const statusClass = task.bucket === 'overdue'
    ? 'crm-task-card__status--overdue'
    : task.bucket === 'today'
      ? 'crm-task-card__status--today'
      : 'crm-task-card__status--upcoming';

  const hasExtraActions = task.canComplete || task.canReschedule;

  return (
    <article className={`crm-task-card ${cardClass}`}>
      <div className="crm-task-card__main">
        {/* Type Icon Badge */}
        <span className={`crm-task-card__icon ${resolveTaskIconWrap(typeMeta.tone)}`}>
          <Icon className="w-4 h-4" />
        </span>

        {/* Content Body */}
        <div className="crm-task-card__body">
          <div className="crm-task-card__head">
            {task.link ? (
              <Link
                to={task.link}
                onClick={() => onClose?.()}
                className="crm-task-card__title crm-task-card__title--link"
                title={task.title}
              >
                {task.title}
              </Link>
            ) : (
              <p className="crm-task-card__title" title={task.title}>
                {task.title}
              </p>
            )}

            <div className="flex items-center gap-1.5 flex-shrink-0">
              <span className={`crm-task-card__status ${statusClass}`}>
                {task.statusLabel}
              </span>
              {task.link && (
                <Link
                  to={task.link}
                  onClick={() => onClose?.()}
                  className="crm-task-inline-open"
                  title="Open details"
                >
                  <FiArrowUpRight className="w-3.5 h-3.5" />
                </Link>
              )}
            </div>
          </div>

          {/* Metadata Pills */}
          <div className="crm-task-card__meta">
            <span className={`crm-task-pill ${task.isHigh ? 'crm-task-pill--high' : 'crm-task-pill--medium'}`}>
              {task.priorityLabel}
            </span>
            <span className="crm-task-pill">
              <FiClock className="w-3 h-3 text-muted-foreground" />
              {task.dueLabel}
            </span>
            <span className="crm-task-pill">
              <FiUser className="w-3 h-3 text-muted-foreground" />
              {task.assignedTo}
            </span>
            <span className="crm-task-pill crm-task-pill--type">
              {typeMeta.chip}
            </span>
          </div>

          {/* Description */}
          {task.description && (
            <p className="crm-task-card__desc">{task.description}</p>
          )}

          {/* Actions: only render when actionable buttons exist */}
          {hasExtraActions && (
            <div className="crm-task-card__actions">
              {task.canComplete && (
                <button
                  type="button"
                  className="crm-task-action crm-task-action--success"
                  disabled={busy}
                  onClick={(e) => onComplete(task, e)}
                >
                  <FiCheck className="w-3 h-3" />
                  Mark Done
                </button>
              )}
              {task.canReschedule && (
                <button
                  type="button"
                  className="crm-task-action crm-task-action--snooze"
                  disabled={busy}
                  onClick={(e) => onSnooze(task, e)}
                >
                  <FiClock className="w-3 h-3" />
                  Snooze
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </article>
  );
}
