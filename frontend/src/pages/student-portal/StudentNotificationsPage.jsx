import { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { FiBell } from 'react-icons/fi';
import {
  fetchNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  selectNotifications,
  selectNotificationsLoading,
  selectUnreadCount,
} from '../../modules/notification/redux/notificationSlice';
import {
  PortalPage,
  PortalEmpty,
  PortalSkeletonPage,
  PortalBadge,
  PortalTabs,
} from '../../components/portal/PortalUi';
import Button from '../../components/ui/Button';
import { formatDate } from './components/portalFormat';
import {
  defaultNotificationLink,
  notificationCategory,
  notificationCategoryLabel,
  studentSafeLink,
} from './components/studentPortal.utils';

function formatRelativeTime(value) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const diffMs = Date.now() - date.getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return formatDate(value);
}

const FILTER_TABS = [
  { id: 'all', label: 'All' },
  { id: 'appointments', label: 'Appointments' },
  { id: 'documents', label: 'Documents' },
  { id: 'academic', label: 'Academic' },
  { id: 'journey', label: 'Application & Visa' },
];

export default function StudentNotificationsPage() {
  const dispatch = useDispatch();
  const list = useSelector(selectNotifications);
  const unreadCount = useSelector(selectUnreadCount);
  const loading = useSelector(selectNotificationsLoading);
  const [activeFilter, setActiveFilter] = useState('all');

  useEffect(() => {
    dispatch(fetchNotifications({ limit: 50 }));
  }, [dispatch]);

  const filtered = useMemo(() => {
    const studentList = list.filter((item) => {
      const link = studentSafeLink(item.link);
      if (item.link && !link) return false;
      return true;
    });
    if (activeFilter === 'all') return studentList;
    return studentList.filter((item) => notificationCategory(item) === activeFilter);
  }, [list, activeFilter]);

  const counts = useMemo(() => {
    const studentList = list.filter((item) => !item.link || studentSafeLink(item.link));
    return FILTER_TABS.reduce((acc, tab) => {
      if (tab.id === 'all') acc.all = studentList.length;
      else acc[tab.id] = studentList.filter((i) => notificationCategory(i) === tab.id).length;
      return acc;
    }, {});
  }, [list]);

  if (loading && !list.length) return <PortalSkeletonPage />;

  return (
    <PortalPage className="crm-stu-notify">
      {unreadCount > 0 ? (
        <div className="crm-portal-page-toolbar">
          <Button variant="outline" size="sm" onClick={() => dispatch(markAllNotificationsRead())}>
            Mark all read
          </Button>
        </div>
      ) : null}

      <PortalTabs
        tabs={FILTER_TABS.map((t) => ({
          id: t.id,
          label: t.label,
          count: counts[t.id] ?? 0,
        }))}
        active={activeFilter}
        onChange={setActiveFilter}
      />

      {filtered.length === 0 ? (
        <PortalEmpty
          title="No notifications"
          description="Updates about appointments, documents, classes, and your application will appear here."
          icon={FiBell}
          className="crm-portal-empty--inline"
        />
      ) : (
        <ul className="crm-stu-notify__list">
          {filtered.map((item) => {
            const cat = notificationCategory(item);
            const link = studentSafeLink(item.link) || defaultNotificationLink(cat);
            return (
              <li key={item.id}>
                <Link
                  to={link}
                  className={`crm-stu-notify__item${!item.isRead ? ' crm-stu-notify__item--unread' : ''}`}
                  onClick={() => !item.isRead && dispatch(markNotificationRead(item.id))}
                >
                  {!item.isRead && <span className="crm-stu-notify__dot" aria-hidden />}
                  <div className="crm-stu-notify__body min-w-0">
                    <div className="crm-stu-notify__head">
                      <span className="crm-stu-notify__title">{item.title || 'Update'}</span>
                      <PortalBadge tone={cat === 'documents' ? 'info' : cat === 'appointments' ? 'warning' : 'neutral'}>
                        {notificationCategoryLabel(cat)}
                      </PortalBadge>
                    </div>
                    {item.message && <p className="crm-stu-notify__msg">{item.message}</p>}
                  </div>
                  <span className="crm-stu-notify__time">{formatRelativeTime(item.createdAt)}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </PortalPage>
  );
}
