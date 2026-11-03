import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  FiClock,
  FiCalendar,
  FiAlertCircle,
  FiArrowUpRight,
  FiUser,
  FiCheckCircle,
  FiRefreshCw,
} from 'react-icons/fi';
import { ROUTES } from '../../../config/routes';
import {
  fetchReminders,
  selectReminderFeed,
  selectReminderLoading,
} from '../../../modules/reminder/redux/reminderSlice';

const TYPE_STYLES = {
  Enquiry: 'bg-indigo-50 text-indigo-700 border-indigo-200/70 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-900/50',
  Visa: 'bg-emerald-50 text-emerald-700 border-emerald-200/70 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-900/50',
  Student: 'bg-blue-50 text-blue-700 border-blue-200/70 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-900/50',
  Fees: 'bg-amber-50 text-amber-700 border-amber-200/70 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-900/50',
  Application: 'bg-violet-50 text-violet-700 border-violet-200/70 dark:bg-violet-950/40 dark:text-violet-300 dark:border-violet-900/50',
  Demo: 'bg-teal-50 text-teal-700 border-teal-200/70 dark:bg-teal-950/40 dark:text-teal-300 dark:border-teal-900/50',
  Class: 'bg-sky-50 text-sky-700 border-sky-200/70 dark:bg-sky-950/40 dark:text-sky-300 dark:border-sky-900/50',
  Lead: 'bg-amber-50 text-amber-700 border-amber-200/70 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-900/50',
};

export default function ReminderPanel({ onClose }) {
  const dispatch = useDispatch();
  const feed = useSelector(selectReminderFeed);
  const loading = useSelector(selectReminderLoading);
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    dispatch(fetchReminders());
  }, [dispatch]);

  const overdue = feed.overdue || [];
  const today = feed.dueToday || [];
  const upcoming = feed.upcoming || [];
  const total = feed.counts?.total ?? (overdue.length + today.length + upcoming.length);

  const scopeHint = feed.scopeMode === 'OWN'
    ? 'Assigned to you'
    : feed.scopeMode
      ? `Scope: ${String(feed.scopeMode).toLowerCase()}`
      : 'Assigned reminders';

  const roleText = feed.roleSlug ? feed.roleSlug.replace(/_/g, ' ') : '';

  // Filter list by selected tab
  const displayItems = useMemo(() => {
    if (activeTab === 'overdue') return overdue;
    if (activeTab === 'today') return today;
    if (activeTab === 'upcoming') return upcoming;
    return null; // 'all' uses grouped view
  }, [activeTab, overdue, today, upcoming]);

  return (
    <div className="flex flex-col bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 select-none">
      {/* Top Filter Bar & Scope */}
      <div className="px-3.5 pt-3 pb-2.5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/60">
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
          <TabButton
            active={activeTab === 'all'}
            onClick={() => setActiveTab('all')}
            label="All"
            count={total}
          />
          <TabButton
            active={activeTab === 'overdue'}
            onClick={() => setActiveTab('overdue')}
            label="Overdue"
            count={overdue.length}
            tone="danger"
          />
          <TabButton
            active={activeTab === 'today'}
            onClick={() => setActiveTab('today')}
            label="Today"
            count={today.length}
            tone="warning"
          />
          <TabButton
            active={activeTab === 'upcoming'}
            onClick={() => setActiveTab('upcoming')}
            label="Upcoming"
            count={upcoming.length}
          />
        </div>

        <div className="flex items-center justify-between mt-2 pt-1.5 border-t border-slate-200/50 dark:border-slate-800/80 text-[11px] text-slate-500 dark:text-slate-400">
          <span className="inline-flex items-center gap-1.5">
            <FiUser className="w-3 h-3 text-brand opacity-80" />
            <span className="capitalize">{scopeHint}</span>
            {roleText && <span className="opacity-60">· {roleText}</span>}
          </span>
          <span className="font-medium text-slate-600 dark:text-slate-300">
            {activeTab === 'all' ? `${total} reminders` : `${displayItems?.length || 0} items`}
          </span>
        </div>
      </div>

      {/* Reminders List Body */}
      <div className="px-3 py-2.5 max-h-[360px] overflow-y-auto no-scrollbar">
        {loading && !total ? (
          <div className="py-12 flex flex-col items-center justify-center text-slate-400">
            <FiRefreshCw className="w-5 h-5 animate-spin text-brand mb-2" />
            <span className="text-xs font-medium">Loading reminders…</span>
          </div>
        ) : total === 0 ? (
          <div className="py-12 text-center px-4">
            <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto mb-2 text-slate-400">
              <FiCheckCircle className="w-5 h-5" />
            </div>
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">No reminders</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              You are all caught up! Scheduled dues and follow-ups will appear here.
            </p>
          </div>
        ) : activeTab === 'all' ? (
          <div className="space-y-3.5">
            {overdue.length > 0 && (
              <Section label="Overdue" count={overdue.length} tone="danger">
                {overdue.map((item) => (
                  <ReminderCard key={item.id} item={item} status="overdue" onClose={onClose} />
                ))}
              </Section>
            )}
            {today.length > 0 && (
              <Section label="Due today" count={today.length} tone="warning">
                {today.map((item) => (
                  <ReminderCard key={item.id} item={item} status="today" onClose={onClose} />
                ))}
              </Section>
            )}
            {upcoming.length > 0 && (
              <Section label="Upcoming" count={upcoming.length}>
                {upcoming.map((item) => (
                  <ReminderCard key={item.id} item={item} status="upcoming" onClose={onClose} />
                ))}
              </Section>
            )}
          </div>
        ) : displayItems && displayItems.length > 0 ? (
          <div className="space-y-2">
            {displayItems.map((item) => (
              <ReminderCard
                key={item.id}
                item={item}
                status={activeTab}
                onClose={onClose}
              />
            ))}
          </div>
        ) : (
          <div className="py-10 text-center px-4">
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
              No reminders in this tab
            </p>
          </div>
        )}
      </div>

      {/* Clean Footer */}
      <div className="p-2.5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
        <Link
          to={ROUTES.CALENDAR}
          onClick={() => onClose?.()}
          className="h-8.5 w-full rounded-lg border border-slate-200/90 dark:border-slate-700/80 bg-white dark:bg-slate-800
            text-slate-700 dark:text-slate-200 text-xs font-semibold inline-flex items-center justify-center gap-1.5
            hover:text-brand dark:hover:text-brand hover:border-brand/40 dark:hover:border-brand/40 hover:bg-slate-50
            dark:hover:bg-slate-750 transition-all shadow-2xs"
        >
          <FiCalendar className="w-3.5 h-3.5 text-slate-400" />
          <span>Open calendar</span>
          <FiArrowUpRight className="w-3 h-3 opacity-60 ml-0.5" />
        </Link>
      </div>
    </div>
  );
}

function TabButton({ active, onClick, label, count, tone }) {
  const badgeColors = tone === 'danger' && count > 0
    ? active
      ? 'bg-rose-500 text-white'
      : 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
    : tone === 'warning' && count > 0
      ? active
        ? 'bg-amber-500 text-white'
        : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
      : active
        ? 'bg-brand text-white'
        : 'bg-slate-200/80 text-slate-600 dark:bg-slate-700 dark:text-slate-300';

  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-2.5 py-1 rounded-md text-xs font-medium inline-flex items-center gap-1.5 transition-all ${
        active
          ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs border border-slate-200/80 dark:border-slate-700'
          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100/70 dark:hover:bg-slate-800/60'
      }`}
    >
      <span>{label}</span>
      {typeof count === 'number' && (
        <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full leading-tight ${badgeColors}`}>
          {count}
        </span>
      )}
    </button>
  );
}

function Section({ label, count, tone, children }) {
  const dotColor = tone === 'danger'
    ? 'bg-rose-500'
    : tone === 'warning'
      ? 'bg-amber-500'
      : 'bg-brand';

  return (
    <section>
      <div className="flex items-center gap-1.5 px-1 mb-1.5">
        <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`} />
        <h3 className="text-[10.5px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          {label}
        </h3>
        <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500">
          ({count})
        </span>
      </div>
      <div className="space-y-1.5">{children}</div>
    </section>
  );
}

function ReminderCard({ item, status, onClose }) {
  const isOverdue = status === 'overdue' || item.isOverdue;
  const isToday = status === 'today';

  const typeStyle = TYPE_STYLES[item.type] || 'bg-slate-100 text-slate-600 border-slate-200/60 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700/60';

  const cardBorder = isOverdue
    ? 'border-l-[3px] border-l-rose-500 border-slate-200/90 dark:border-slate-800'
    : isToday
      ? 'border-l-[3px] border-l-amber-500 border-slate-200/90 dark:border-slate-800'
      : 'border-slate-200/90 dark:border-slate-800';

  const content = (
    <div
      className={`group relative w-full p-2.5 rounded-xl border bg-white dark:bg-slate-900/90
        hover:border-brand/40 dark:hover:border-brand/40 hover:shadow-xs transition-all duration-150 cursor-pointer ${cardBorder}`}
    >
      {/* Top Header: Title + Type Badge + Hover Link */}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded border leading-none ${typeStyle}`}>
              {item.type || 'Reminder'}
            </span>
            {isOverdue && (
              <span className="inline-flex items-center gap-0.5 text-[9.5px] font-bold px-1.5 py-0.5 rounded bg-rose-50 text-rose-600 border border-rose-200/80 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-900/60 leading-none">
                <FiAlertCircle className="w-2.5 h-2.5" />
                OVERDUE
              </span>
            )}
            {isToday && !isOverdue && (
              <span className="text-[9.5px] font-bold px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200/80 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-900/60 leading-none">
                TODAY
              </span>
            )}
          </div>
          <p className="mt-1 text-[13px] font-semibold text-slate-800 dark:text-slate-100 group-hover:text-brand transition-colors line-clamp-1">
            {item.title}
          </p>
        </div>

        <FiArrowUpRight className="w-3.5 h-3.5 text-slate-400 opacity-0 group-hover:opacity-100 group-hover:text-brand transition-all shrink-0 mt-0.5" />
      </div>

      {/* Description / Subtitle if available */}
      {item.description && (
        <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1">
          {item.description}
        </p>
      )}

      {/* Bottom Meta: Due Date & Assignee */}
      <div className="mt-2 pt-1.5 border-t border-slate-100 dark:border-slate-800/70 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
        <span className={`inline-flex items-center gap-1 font-medium ${isOverdue ? 'text-rose-600 dark:text-rose-400 font-semibold' : ''}`}>
          {isOverdue ? (
            <FiAlertCircle className="w-3 h-3 text-rose-500 shrink-0" />
          ) : (
            <FiClock className="w-3 h-3 text-slate-400 shrink-0" />
          )}
          <span>{item.dueAt}</span>
        </span>

        {item.assignedUserName && (
          <span className="inline-flex items-center gap-1 truncate max-w-[140px] text-[10.5px]">
            <FiUser className="w-3 h-3 text-slate-400 shrink-0" />
            <span className="truncate">{item.assignedUserName}</span>
          </span>
        )}
      </div>
    </div>
  );

  if (item.link) {
    return (
      <Link to={item.link} onClick={() => onClose?.()} className="block">
        {content}
      </Link>
    );
  }

  return <div>{content}</div>;
}
