import { useCallback, useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import {
  FiArrowUpRight,
  FiCalendar,
  FiClock,
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
  FiCheck,
  FiCheckSquare,
  FiClock as FiClockIcon,
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
    <div>
      <div className="crm-task-panel__hero">
        <p className="crm-task-panel__hero-title">
          <strong className="text-text">{pendingCount}</strong>
          {' '}
          action items need attention
        </p>
        <div className="crm-task-panel__metrics">
          {(['overdue', 'today', 'upcoming']).map((key) => {
            const meta = TASK_BUCKETS[key];
            const value = key === 'overdue'
              ? counts.overdue || 0
              : key === 'today'
                ? counts.dueToday || 0
                : counts.upcoming || 0;
            return (
              <button
                key={key}
                type="button"
                className={`crm-task-metric crm-task-metric--${meta.tone} ${bucket === key ? 'crm-task-metric--active' : ''}`}
                onClick={() => {
                  setBucket(key);
                  setTypeFilter('all');
                }}
              >
                <p className="crm-task-metric__value">{value}</p>
                <p className="crm-task-metric__label">{meta.label}</p>
              </button>
            );
          })}
        </div>
      </div>

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
        {scopeHint && (
          <span className="crm-task-panel__scope">
            <FiUser className="w-3 h-3" />
            {scopeHint}
          </span>
        )}
      </div>

      <div className="crm-task-panel__list">
        {loading && !buckets.all.length ? (
          <p className="py-10 text-center text-sm text-text-muted">Loading tasks…</p>
        ) : tasks.length === 0 ? (
          <div className="crm-task-empty">
            <div className="crm-task-empty__icon">
              <FiCheckSquare className="w-6 h-6" />
            </div>
            <p className="text-sm font-semibold text-text">
              {bucket === 'overdue' ? 'No overdue tasks' : bucket === 'today' ? 'Nothing due today' : 'No upcoming tasks'}
            </p>
            <p className="text-[12px] text-text-muted mt-1 leading-relaxed px-4">
              Follow-ups, demos, classes and dues from your live calendar feed appear here.
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

      <div className="crm-task-panel__footer">
        <button
          type="button"
          className="crm-task-panel__footer-btn"
          onClick={reload}
          disabled={loading}
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
          Open calendar
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

  const inner = (
    <>
      <div className="crm-task-card__main">
        <span className={`crm-task-card__icon ${resolveTaskIconWrap(typeMeta.tone)}`}>
          <Icon className="w-4 h-4" />
        </span>
        <div className="crm-task-card__body">
          <div className="crm-task-card__head">
            <p className="crm-task-card__title">{task.title}</p>
            <span className={`crm-task-card__status ${statusClass}`}>
              {task.statusLabel}
            </span>
          </div>

          <div className="crm-task-card__meta">
            <span className={`crm-task-pill ${task.isHigh ? 'crm-task-pill--high' : 'crm-task-pill--medium'}`}>
              {task.priorityLabel}
            </span>
            <span className="crm-task-pill">
              <FiClockIcon className="w-3 h-3" />
              {task.dueLabel}
            </span>
            <span className="crm-task-pill">
              <FiUser className="w-3 h-3" />
              {task.assignedTo}
            </span>
            <span className="crm-task-pill">{typeMeta.chip}</span>
          </div>

          {task.description && (
            <p className="crm-task-card__desc">{task.description}</p>
          )}
        </div>
      </div>

      <div className="crm-task-card__actions">
        {task.canComplete && (
          <button
            type="button"
            className="crm-task-action crm-task-action--success"
            disabled={busy}
            onClick={(e) => onComplete(task, e)}
          >
            <FiCheck className="w-3.5 h-3.5" />
            Done
          </button>
        )}
        {task.canReschedule && (
          <button
            type="button"
            className="crm-task-action crm-task-action--primary"
            disabled={busy}
            onClick={(e) => onSnooze(task, e)}
          >
            <FiClock className="w-3.5 h-3.5" />
            Snooze
          </button>
        )}
        {task.link ? (
          <Link
            to={task.link}
            onClick={() => onClose?.()}
            className="crm-task-action"
          >
            Open
            <FiArrowUpRight className="w-3 h-3" />
          </Link>
        ) : (
          <button type="button" className="crm-task-action" disabled>
            Open
          </button>
        )}
      </div>
    </>
  );

  return (
    <article className={`crm-task-card ${cardClass}`}>
      {inner}
    </article>
  );
}
