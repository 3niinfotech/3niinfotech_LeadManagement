import { useDispatch, useSelector } from 'react-redux';
import { FiCheck, FiExternalLink } from 'react-icons/fi';
import { Link } from 'react-router-dom';
import Button from '../../ui/Button';
import {
  markRead,
  selectNotifications,
  selectUnreadCount,
} from '../../../modules/notification/redux/notificationSlice';
import { ROUTES } from '../../../config/routes';

const FALLBACK_NOTIFICATIONS = [
  {
    id: 'n1',
    category: "Today's Follow-up",
    title: 'Follow-up due today',
    body: 'Rahul Sharma — call scheduled for 4:00 PM',
    isRead: false,
    time: 'Today',
  },
  {
    id: 'n2',
    category: 'Appointment',
    title: 'Appointment today',
    body: 'Online counselling · Google Meet at 2:30 PM',
    isRead: false,
    time: '2:30 PM',
  },
  {
    id: 'n3',
    category: 'Demo',
    title: 'Demo scheduled today',
    body: 'IELTS Speaking · Batch A — mark attendance',
    isRead: false,
    time: '11:00 AM',
  },
  {
    id: 'n4',
    category: 'Document Missing',
    title: '2 documents missing',
    body: 'Upload: Passport, 10th Marksheet',
    isRead: false,
    time: 'Pending',
  },
  {
    id: 'n5',
    category: 'Payment Pending',
    title: 'Payment pending',
    body: '₹25,000 counselling fee awaiting collection',
    isRead: false,
    time: 'Due',
  },
  {
    id: 'n6',
    category: 'Appointment',
    title: 'Upcoming appointment',
    body: 'In-person meeting — Room 2',
    isRead: true,
    time: 'Tomorrow',
  },
];

export default function NotificationPanel() {
  const dispatch = useDispatch();
  const storeList = useSelector(selectNotifications);
  const unreadCount = useSelector(selectUnreadCount);
  const list = storeList.length ? storeList : FALLBACK_NOTIFICATIONS;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-text-secondary">
          {unreadCount || list.filter((n) => !n.isRead).length} unread
        </p>
        <button
          type="button"
          className="text-[12px] font-medium text-brand hover:text-brand-hover"
          onClick={() => list.filter((n) => !n.isRead).forEach((n) => dispatch(markRead(n.id)))}
        >
          Mark all read
        </button>
      </div>

      <ul className="space-y-2">
        {list.map((item) => (
          <li
            key={item.id}
            className={`p-3 rounded-lg border transition-colors cursor-pointer ${
              item.isRead
                ? 'border-border bg-page opacity-75'
                : 'border-brand/20 bg-brand-soft/40 hover:border-brand/40'
            }`}
            onClick={() => !item.isRead && dispatch(markRead(item.id))}
          >
            <div className="flex items-start gap-2">
              {!item.isRead && <span className="w-2 h-2 rounded-full bg-brand shrink-0 mt-1.5" />}
              <div className="flex-1 min-w-0">
                {item.category && (
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-text-muted mb-0.5">
                    {item.category}
                  </p>
                )}
                <p className="text-sm font-medium text-text">{item.title}</p>
                <p className="text-[12px] text-text-muted mt-0.5 truncate">{item.body}</p>
                <p className="text-[11px] text-text-muted mt-1">{item.time}</p>
              </div>
              {item.isRead && <FiCheck className="w-3.5 h-3.5 text-success shrink-0 mt-1" />}
            </div>
          </li>
        ))}
      </ul>

      <Link to={ROUTES.NOTIFICATIONS} className="block">
        <Button variant="outline" className="w-full" icon={FiExternalLink}>
          View all notifications
        </Button>
      </Link>
    </div>
  );
}
