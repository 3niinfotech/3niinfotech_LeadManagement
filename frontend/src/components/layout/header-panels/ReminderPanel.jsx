import { FiClock, FiCalendar } from 'react-icons/fi';
import { REMINDER_ITEMS } from '../../../config/headerMock.data';

const TYPE_DOT = {
  Enquiry: 'bg-brand',
  Visa: 'bg-info',
  Student: 'bg-success',
};

export default function ReminderPanel({ onClose }) {
  const today = REMINDER_ITEMS.filter((r) => r.isToday);
  const upcoming = REMINDER_ITEMS.filter((r) => !r.isToday);

  return (
    <div>
      <div className="px-4 pt-3 pb-2 border-b border-border bg-page/40">
        <p className="text-[12px] text-text-secondary">
          <span className="font-semibold text-warning">{today.length}</span> due today
          {upcoming.length > 0 && (
            <>
              {' · '}
              <span className="font-semibold text-text">{upcoming.length}</span> upcoming
            </>
          )}
        </p>
      </div>

      <div className="px-2 py-2">
        {!REMINDER_ITEMS.length ? (
          <div className="py-10 text-center px-4">
            <FiCalendar className="w-9 h-9 text-text-muted mx-auto mb-2 opacity-45" />
            <p className="text-sm font-medium text-text">No reminders</p>
            <p className="text-[12px] text-text-muted mt-1">
              Follow-ups and due items will show here.
            </p>
          </div>
        ) : (
          <div className="space-y-3 max-h-[360px] overflow-y-auto no-scrollbar">
            {today.length > 0 && (
              <Section label="Due today">
                {today.map((item) => (
                  <ReminderRow key={item.id} item={item} urgent />
                ))}
              </Section>
            )}
            {upcoming.length > 0 && (
              <Section label="Upcoming">
                {upcoming.map((item) => (
                  <ReminderRow key={item.id} item={item} />
                ))}
              </Section>
            )}
          </div>
        )}
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

function ReminderRow({ item, urgent = false }) {
  return (
    <li>
      <div
        className={`w-full text-left px-3 py-2.5 rounded-xl transition-colors ${
          urgent ? 'bg-warning-soft/50 hover:bg-warning-soft' : 'hover:bg-row-hover'
        }`}
      >
        <div className="flex items-start gap-2.5">
          <span
            className={`mt-1.5 w-1.5 h-1.5 rounded-full shrink-0 ${
              TYPE_DOT[item.type] || TYPE_DOT.Enquiry
            }`}
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <p className="text-[13px] font-semibold text-text line-clamp-1">{item.title}</p>
              <span className="text-[10px] font-medium text-text-muted shrink-0">{item.type}</span>
            </div>
            <p className="mt-0.5 inline-flex items-center gap-1 text-[11px] text-text-muted">
              <FiClock className="w-3 h-3" />
              {item.dueAt}
            </p>
          </div>
        </div>
      </div>
    </li>
  );
}
