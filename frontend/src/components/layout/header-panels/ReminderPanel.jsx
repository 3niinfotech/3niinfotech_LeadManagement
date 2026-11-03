import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  FiClock,
  FiCalendar,
  FiAlertCircle,
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

  const tabs = [
    { id: 'all', label: 'All', count: total },
    { id: 'overdue', label: 'Overdue', count: overdue.length, tone: 'danger' },
    { id: 'today', label: 'Today', count: today.length },
    { id: 'upcoming', label: 'Upcoming', count: upcoming.length },
  ];

  const currentList = useMemo(() => {
    if (activeTab === 'overdue') return overdue;
    if (activeTab === 'today') return today;
    if (activeTab === 'upcoming') return upcoming;
    return null; // 'all' uses grouped view
  }, [activeTab, overdue, today, upcoming]);

  return (
    <div className="flex flex-col bg-card text-text select-none">
      {/* ── Modern Underline Tabs ── */}
      <div className="px-4 border-b border-border bg-card">
        <div className="flex items-center gap-5 overflow-x-auto no-scrollbar">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`py-2.5 text-xs font-medium border-b-2 transition-colors inline-flex items-center gap-1.5 whitespace-nowrap ${
                  isActive
                    ? 'border-brand text-brand font-semibold'
                    : 'border-transparent text-text-muted hover:text-text'
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`text-[11px] ${
                    tab.tone === 'danger' && tab.count > 0 && !isActive
                      ? 'text-danger font-semibold'
                      : 'opacity-70'
                  }`}
                >
                  ({tab.count})
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Scope Subheader */}
      <div className="px-4 py-2 border-b border-border/60 bg-page/30 flex items-center justify-between text-[11px] text-text-muted">
        <span className="inline-flex items-center gap-1.5 truncate">
          <FiUser className="w-3 h-3 text-text-muted shrink-0" />
          <span className="capitalize">{scopeHint}</span>
          {roleText && <span className="opacity-60">· {roleText}</span>}
        </span>
        <span className="shrink-0 font-medium text-text-secondary">
          {activeTab === 'all' ? `${total} reminders` : `${currentList?.length || 0} items`}
        </span>
      </div>

      {/* ── Reminders List ── */}
      <div className="px-3 py-2.5 max-h-[360px] overflow-y-auto no-scrollbar">
        {loading && !total ? (
          <div className="py-12 flex flex-col items-center justify-center text-text-muted">
            <FiRefreshCw className="w-5 h-5 animate-spin text-brand mb-2" />
            <span className="text-xs">Loading reminders…</span>
          </div>
        ) : total === 0 ? (
          <div className="py-12 text-center px-4">
            <div className="w-9 h-9 rounded-full bg-page flex items-center justify-center mx-auto mb-2 text-text-muted">
              <FiCheckCircle className="w-4.5 h-4.5" />
            </div>
            <p className="text-xs font-semibold text-text">No reminders</p>
            <p className="text-[11px] text-text-muted mt-0.5">
              Scheduled dues and follow-ups will appear here.
            </p>
          </div>
        ) : activeTab === 'all' ? (
          <div className="space-y-3">
            {overdue.length > 0 && (
              <GroupSection label="Overdue" count={overdue.length} isOverdue>
                {overdue.map((item) => (
                  <CleanReminderItem key={item.id} item={item} isOverdue onClose={onClose} />
                ))}
              </GroupSection>
            )}
            {today.length > 0 && (
              <GroupSection label="Due today" count={today.length}>
                {today.map((item) => (
                  <CleanReminderItem key={item.id} item={item} isToday onClose={onClose} />
                ))}
              </GroupSection>
            )}
            {upcoming.length > 0 && (
              <GroupSection label="Upcoming" count={upcoming.length}>
                {upcoming.map((item) => (
                  <CleanReminderItem key={item.id} item={item} onClose={onClose} />
                ))}
              </GroupSection>
            )}
          </div>
        ) : currentList && currentList.length > 0 ? (
          <div className="space-y-2">
            {currentList.map((item) => (
              <CleanReminderItem
                key={item.id}
                item={item}
                isOverdue={activeTab === 'overdue' || item.isOverdue}
                isToday={activeTab === 'today'}
                onClose={onClose}
              />
            ))}
          </div>
        ) : (
          <div className="py-10 text-center px-4">
            <p className="text-xs text-text-muted">No reminders in this view</p>
          </div>
        )}
      </div>

      {/* ── Professional Solid Action Button ── */}
      <div className="p-3 border-t border-border bg-page/40">
        <Link
          to={ROUTES.CALENDAR}
          onClick={() => onClose?.()}
          className="w-full h-8.5 px-3 rounded-lg bg-brand hover:bg-brand/90 text-white text-xs font-medium
            inline-flex items-center justify-center gap-1.5 transition-colors shadow-2xs"
        >
          <FiCalendar className="w-3.5 h-3.5" />
          <span>View all in Calendar</span>
        </Link>
      </div>
    </div>
  );
}

function GroupSection({ label, count, isOverdue, children }) {
  return (
    <section>
      <div className="flex items-center gap-1.5 px-1 mb-1.5">
        <span
          className={`w-1.5 h-1.5 rounded-full ${isOverdue ? 'bg-danger' : 'bg-brand'}`}
        />
        <h3 className="text-[10px] font-bold uppercase tracking-wider text-text-muted">
          {label}
        </h3>
        <span className="text-[10px] font-medium text-text-muted">({count})</span>
      </div>
      <div className="space-y-1.5">{children}</div>
    </section>
  );
}

function CleanReminderItem({ item, isOverdue = false, isToday = false, onClose }) {
  const content = (
    <div
      className="w-full p-2.5 rounded-lg border border-border/70 bg-card hover:bg-row-hover transition-colors"
    >
      {/* Top: Type tag + Status */}
      <div className="flex items-center justify-between gap-2">
        <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-page text-text-muted border border-border/50">
          {item.type || 'Reminder'}
        </span>
        {isOverdue && (
          <span className="text-[10px] font-semibold text-danger inline-flex items-center gap-1">
            <FiAlertCircle className="w-3 h-3" />
            Overdue
          </span>
        )}
        {isToday && !isOverdue && (
          <span className="text-[10px] font-semibold text-warning">
            Due Today
          </span>
        )}
      </div>

      {/* Title */}
      <p className="mt-1 text-xs font-semibold text-text line-clamp-1">
        {item.title}
      </p>

      {/* Description / Extra details */}
      {item.description && (
        <p className="mt-0.5 text-[11px] text-text-muted line-clamp-1">
          {item.description}
        </p>
      )}

      {/* Bottom info: Date & Assignee */}
      <div className="mt-2 pt-1.5 border-t border-border/50 flex items-center justify-between text-[11px] text-text-muted">
        <span
          className={`inline-flex items-center gap-1 ${
            isOverdue ? 'text-danger font-medium' : ''
          }`}
        >
          <FiClock className="w-3 h-3 text-text-muted shrink-0" />
          <span>{item.dueAt}</span>
        </span>

        {item.assignedUserName && (
          <span className="inline-flex items-center gap-1 truncate max-w-[140px] text-[10.5px]">
            <FiUser className="w-3 h-3 text-text-muted shrink-0" />
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
