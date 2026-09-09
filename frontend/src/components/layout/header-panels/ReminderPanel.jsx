import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { FiClock, FiCalendar, FiAlertTriangle, FiArrowUpRight, FiUser } from 'react-icons/fi';
import { ROUTES } from '../../../config/routes';
import {
  fetchReminders,
  selectReminderFeed,
  selectReminderLoading,
} from '../../../modules/reminder/redux/reminderSlice';

const TYPE_DOT = {
  Enquiry: 'bg-brand',
  Visa: 'bg-info',
  Student: 'bg-success',
  Fees: 'bg-warning',
  Application: 'bg-info',
  Demo: 'bg-success',
  Class: 'bg-brand',
  Lead: 'bg-warning',
};

export default function ReminderPanel({ onClose }) {
  const dispatch = useDispatch();
  const feed = useSelector(selectReminderFeed);
  const loading = useSelector(selectReminderLoading);

  useEffect(() => {
    dispatch(fetchReminders());
  }, [dispatch]);

  const overdue = feed.overdue || [];
  const today = feed.dueToday || [];
  const upcoming = feed.upcoming || [];
  const total = (feed.counts?.total) || (overdue.length + today.length + upcoming.length);
  const scopeHint = feed.scopeMode === 'OWN'
    ? 'Showing your assigned reminders'
    : feed.scopeMode
      ? `Scope: ${String(feed.scopeMode).toLowerCase()}`
      : null;

  return (
    <div>
      <div className="px-4 pt-3 pb-2 border-b border-border bg-page/40 space-y-1">
        <p className="text-[12px] text-text-secondary">
          {overdue.length > 0 && (
            <>
              <span className="font-semibold text-danger">{overdue.length}</span> overdue
              {(today.length > 0 || upcoming.length > 0) ? ' · ' : ''}
            </>
          )}
          <span className="font-semibold text-warning">{today.length}</span> due today
          {upcoming.length > 0 && (
            <>
              {' · '}
              <span className="font-semibold text-text">{upcoming.length}</span> upcoming
            </>
          )}
        </p>
        {scopeHint && (
          <p className="text-[11px] text-text-muted inline-flex items-center gap-1">
            <FiUser className="w-3 h-3" />
            {scopeHint}
            {feed.roleSlug ? ` · ${feed.roleSlug.replace(/_/g, ' ')}` : ''}
          </p>
        )}
      </div>

      <div className="px-2 py-2">
        {loading && !total ? (
          <div className="py-8 text-center text-[12px] text-text-muted">Loading reminders…</div>
        ) : !total ? (
          <div className="py-10 text-center px-4">
            <FiCalendar className="w-9 h-9 text-text-muted mx-auto mb-2 opacity-45" />
            <p className="text-sm font-medium text-text">No reminders</p>
            <p className="text-[12px] text-text-muted mt-1">
              Follow-ups, dues and appointments for your role will show here.
            </p>
          </div>
        ) : (
          <div className="space-y-3 max-h-[380px] overflow-y-auto no-scrollbar">
            {overdue.length > 0 && (
              <Section label="Overdue">
                {overdue.map((item) => (
                  <ReminderRow key={item.id} item={item} urgent onClose={onClose} />
                ))}
              </Section>
            )}
            {today.length > 0 && (
              <Section label="Due today">
                {today.map((item) => (
                  <ReminderRow key={item.id} item={item} urgent onClose={onClose} />
                ))}
              </Section>
            )}
            {upcoming.length > 0 && (
              <Section label="Upcoming">
                {upcoming.map((item) => (
                  <ReminderRow key={item.id} item={item} onClose={onClose} />
                ))}
              </Section>
            )}
          </div>
        )}
      </div>

      <div className="px-3 py-2.5 border-t border-border bg-page/30">
        <Link
          to={ROUTES.CALENDAR}
          onClick={() => onClose?.()}
          className="h-9 w-full rounded-lg border border-brand/25 bg-brand-soft text-brand text-[12px] font-semibold
            inline-flex items-center justify-center gap-1.5 hover:bg-brand-soft/80 transition-colors"
        >
          Open calendar
          <FiArrowUpRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
}

function Section({ label, children }) {
  return (
    <section>
      <h3 className="px-2 mb-1 text-[10px] font-semibold uppercase tracking-wider text-text-muted">
        {label}
      </h3>
      <ul className="space-y-0.5">{children}</ul>
    </section>
  );
}

function ReminderRow({ item, urgent = false, onClose }) {
  const content = (
    <div
      className={`w-full text-left px-3 py-2.5 rounded-xl transition-colors ${
        urgent || item.isOverdue
          ? 'bg-warning-soft/55 hover:bg-warning-soft'
          : 'hover:bg-row-hover'
      }`}
    >
      <div className="flex items-start gap-2.5">
        <span
          className={`mt-1.5 w-1.5 h-1.5 rounded-full shrink-0 ${
            item.isOverdue ? 'bg-danger' : (TYPE_DOT[item.type] || TYPE_DOT.Enquiry)
          }`}
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <p className="text-[13px] font-semibold text-text line-clamp-1">{item.title}</p>
            <span className="text-[10px] font-medium text-text-muted shrink-0">{item.type}</span>
          </div>
          <p className="mt-0.5 inline-flex items-center gap-1 text-[11px] text-text-muted">
            {item.isOverdue ? <FiAlertTriangle className="w-3 h-3 text-danger" /> : <FiClock className="w-3 h-3" />}
            {item.dueAt}
          </p>
        </div>
      </div>
    </div>
  );

  if (item.link) {
    return (
      <li>
        <Link to={item.link} onClick={() => onClose?.()} className="block">
          {content}
        </Link>
      </li>
    );
  }
  return <li>{content}</li>;
}
