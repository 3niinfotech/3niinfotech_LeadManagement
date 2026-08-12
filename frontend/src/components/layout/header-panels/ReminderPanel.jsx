import { FiAlertCircle, FiExternalLink } from 'react-icons/fi';
import { Link } from 'react-router-dom';
import Button from '../../ui/Button';
import { REMINDER_ITEMS } from '../../../config/headerMock.data';
import { ROUTES } from '../../../config/routes';

export default function ReminderPanel() {
  const todayCount = REMINDER_ITEMS.filter((r) => r.isToday).length;

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-2.5 p-3 rounded-lg bg-warning-soft border border-warning/20">
        <FiAlertCircle className="w-4 h-4 text-warning shrink-0 mt-0.5" />
        <p className="text-[13px] text-text leading-snug">
          Only <strong>1 day</strong> reminder available. Today you have{' '}
          <strong>{todayCount}</strong> reminder{todayCount !== 1 ? 's' : ''}.
        </p>
      </div>

      <ul className="space-y-2">
        {REMINDER_ITEMS.map((item) => (
          <li
            key={item.id}
            className="p-3 rounded-lg border border-border bg-page hover:border-brand/30 transition-colors"
          >
            <p className="text-sm font-medium text-text">{item.title}</p>
            <div className="mt-1 flex items-center justify-between gap-2 text-[12px] text-text-muted">
              <span>{item.dueAt}</span>
              <span className="px-2 py-0.5 rounded-full bg-brand-soft text-brand text-[11px] font-medium">
                {item.type}
              </span>
            </div>
          </li>
        ))}
      </ul>

      <Link to={ROUTES.REMINDERS} className="block">
        <Button variant="outline" className="w-full" icon={FiExternalLink}>
          View all reminders
        </Button>
      </Link>
    </div>
  );
}
