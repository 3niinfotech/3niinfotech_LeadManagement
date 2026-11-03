import { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import {
  FiBell,
  FiFileText,
  FiCalendar,
  FiAward,
  FiShield,
  FiCheckCircle,
  FiClock,
  FiArrowRight,
  FiCheck,
  FiSearch,
  FiRefreshCw,
  FiX,
} from 'react-icons/fi';
import {
  fetchNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  selectNotifications,
  selectNotificationsLoading,
  selectUnreadCount,
} from '../../modules/notification/redux/notificationSlice';
import { PortalSkeletonPage } from '../../components/portal/PortalUi';
import Button from '../../components/ui/Button';
import SummaryStatBar from '../../components/ui/SummaryStatBar';
import toastService from '../../services/toast/toast.service';
import { formatDate } from './components/portalFormat';
import {
  defaultNotificationLink,
  notificationCategory,
  notificationCategoryLabel,
  studentSafeLink,
} from './components/studentPortal.utils';
import './student-notifications.theme.css';

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
  { id: 'all', label: 'All Updates' },
  { id: 'unread', label: 'Unread Only' },
  { id: 'appointments', label: 'Appointments' },
  { id: 'documents', label: 'Documents' },
  { id: 'academic', label: 'Academic & Tests' },
  { id: 'journey', label: 'Application & Visa' },
];

const CATEGORY_CONFIG = {
  documents: {
    icon: FiFileText,
    iconBoxClass: 'bg-blue-50 text-blue-600 border border-blue-200/60',
    chipClass: 'bg-blue-50 text-blue-700 border border-blue-200/80',
    label: 'Documents',
  },
  appointments: {
    icon: FiCalendar,
    iconBoxClass: 'bg-amber-50 text-amber-600 border border-amber-200/60',
    chipClass: 'bg-amber-50 text-amber-700 border border-amber-200/80',
    label: 'Appointments',
  },
  academic: {
    icon: FiAward,
    iconBoxClass: 'bg-purple-50 text-purple-600 border border-purple-200/60',
    chipClass: 'bg-purple-50 text-purple-700 border border-purple-200/80',
    label: 'Academic',
  },
  journey: {
    icon: FiShield,
    iconBoxClass: 'bg-emerald-50 text-emerald-600 border border-emerald-200/60',
    chipClass: 'bg-emerald-50 text-emerald-700 border border-emerald-200/80',
    label: 'Visa & Admission',
  },
  general: {
    icon: FiBell,
    iconBoxClass: 'bg-slate-100 text-slate-600 border border-slate-200/60',
    chipClass: 'bg-slate-100 text-slate-700 border border-slate-200/80',
    label: 'Updates',
  },
};

export default function StudentNotificationsPage() {
  const dispatch = useDispatch();
  const rawList = useSelector(selectNotifications);
  const loading = useSelector(selectNotificationsLoading);

  const [activeFilter, setActiveFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    dispatch(fetchNotifications({ limit: 50 }));
  }, [dispatch]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await dispatch(fetchNotifications({ limit: 50 }));
      toastService.success('Notifications updated');
    } catch {
      toastService.error('Unable to refresh notifications');
    } finally {
      setTimeout(() => setIsRefreshing(false), 450);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await dispatch(markAllNotificationsRead());
      toastService.success('All notifications marked as read');
    } catch {
      toastService.error('Failed to mark all as read');
    }
  };

  const activeList = useMemo(() => {
    return Array.isArray(rawList) ? rawList : [];
  }, [rawList]);

  // Compute category counts
  const counts = useMemo(() => {
    const list = activeList.filter((item) => !item.link || studentSafeLink(item.link));
    return {
      all: list.length,
      unread: list.filter((i) => !i.isRead).length,
      appointments: list.filter((i) => notificationCategory(i) === 'appointments').length,
      documents: list.filter((i) => notificationCategory(i) === 'documents').length,
      academic: list.filter((i) => notificationCategory(i) === 'academic').length,
      journey: list.filter((i) => notificationCategory(i) === 'journey').length,
    };
  }, [activeList]);

  // Summary Stat Bar Items (CRM Design System)
  const summaryItems = useMemo(() => [
    {
      key: 'all',
      label: 'Total Updates',
      value: counts.all,
      icon: FiBell,
      tone: 'neutral',
      filterValue: 'all',
      badge: 'All Activity',
      badgeTone: 'bg-slate-100 text-slate-700',
    },
    {
      key: 'unread',
      label: 'Unread Alerts',
      value: counts.unread,
      icon: FiClock,
      tone: counts.unread > 0 ? 'warning' : 'neutral',
      filterValue: 'unread',
      badge: counts.unread > 0 ? 'Action Req' : 'Cleared',
      badgeTone: counts.unread > 0 ? 'bg-amber-100 text-amber-800' : 'bg-emerald-50 text-emerald-700',
    },
    {
      key: 'documents',
      label: 'Document Alerts',
      value: counts.documents,
      icon: FiFileText,
      tone: 'info',
      filterValue: 'documents',
      badge: 'Compliance',
      badgeTone: 'bg-cyan-50 text-cyan-700',
    },
    {
      key: 'appointments',
      label: 'Appointments',
      value: counts.appointments,
      icon: FiCalendar,
      tone: 'warning',
      filterValue: 'appointments',
      badge: 'Scheduled',
      badgeTone: 'bg-amber-50 text-amber-700',
    },
    {
      key: 'academic',
      label: 'Academic & Tests',
      value: counts.academic,
      icon: FiAward,
      tone: 'primary',
      filterValue: 'academic',
      badge: 'Classroom',
      badgeTone: 'bg-blue-50 text-blue-700',
    },
    {
      key: 'journey',
      label: 'Admissions & Visa',
      value: counts.journey,
      icon: FiShield,
      tone: 'success',
      filterValue: 'journey',
      badge: 'Milestones',
      badgeTone: 'bg-emerald-50 text-emerald-700',
    },
  ], [counts]);

  // Filtered notifications list
  const filtered = useMemo(() => {
    let list = activeList.filter((item) => {
      const link = studentSafeLink(item.link);
      if (item.link && !link) return false;
      return true;
    });

    if (activeFilter === 'unread') {
      list = list.filter((item) => !item.isRead);
    } else if (activeFilter !== 'all') {
      list = list.filter((item) => notificationCategory(item) === activeFilter);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter((item) => {
        const title = (item.title || '').toLowerCase();
        const msg = (item.message || '').toLowerCase();
        return title.includes(q) || msg.includes(q);
      });
    }

    return list;
  }, [activeList, activeFilter, searchQuery]);

  if (loading && !activeList.length) return <PortalSkeletonPage />;

  return (
    <div className="crm-notif-page">
      {/* ── Summary KPI Strip (Connected Standard CRM System) ── */}
      <div className="rounded-xl border border-border bg-card-bg shadow-xs overflow-hidden">
        <SummaryStatBar
          items={summaryItems}
          activeFilter={activeFilter}
          onSelect={(val) => setActiveFilter(val || 'all')}
          layout="grid"
          ariaLabel="Notification Summary Statistics"
        />
      </div>

      {/* ── Search & Filter Toolbar ── */}
      <div className="crm-notif-toolbar flex flex-wrap items-center justify-between gap-2.5">
        <div className="flex flex-wrap items-center gap-2 flex-1 min-w-0">
          {/* Search */}
          <div className="crm-notif-search">
            <FiSearch className="text-slate-400 shrink-0" size={14} />
            <input
              type="text"
              placeholder="Search updates, documents, or exams..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <FiX size={14} />
              </button>
            )}
          </div>

          {/* Filter Pills */}
          <div className="crm-notif-pills">
            {FILTER_TABS.map((tab) => {
              const isSelected = activeFilter === tab.id;
              const count = counts[tab.id] ?? 0;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveFilter(tab.id)}
                  className={`crm-notif-pill ${isSelected ? 'is-active' : ''}`}
                >
                  {tab.label}
                  <span className="crm-notif-pill__badge">{count}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 ml-auto">
          {counts.unread > 0 && (
            <Button
              size="sm"
              variant="outline"
              icon={FiCheck}
              onClick={handleMarkAllRead}
              className="text-xs font-semibold shadow-xs"
            >
              Mark all as read
            </Button>
          )}

          <Button
            size="sm"
            variant="outline"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-1.5 text-xs font-semibold shadow-xs"
          >
            <FiRefreshCw size={13} className={isRefreshing ? 'animate-spin' : ''} />
            Refresh
          </Button>
        </div>
      </div>

      {/* ── Main Notification Feed Card ── */}
      <div className="rounded-xl border border-border bg-card-bg shadow-xs overflow-hidden">
        <div className="px-4 py-2.5 border-b border-border bg-surface-2/40 flex items-center justify-between text-xs font-semibold text-text-muted">
          <span>
            {activeFilter === 'all'
              ? 'All Updates'
              : FILTER_TABS.find((t) => t.id === activeFilter)?.label}{' '}
            ({filtered.length})
          </span>
          {counts.unread > 0 && (
            <span className="text-[11px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
              {counts.unread} unread
            </span>
          )}
        </div>

        {filtered.length === 0 ? (
          <div className="py-12 px-4 text-center">
            <FiCheckCircle size={44} className="text-emerald-500 mx-auto mb-2" />
            <h4 className="text-sm font-bold text-text mb-1">
              You're all caught up!
            </h4>
            <p className="text-xs text-text-muted max-w-sm mx-auto mb-4">
              {searchQuery
                ? `No notifications found matching "${searchQuery}".`
                : 'No updates or pending actions in this category.'}
            </p>
            {(activeFilter !== 'all' || searchQuery) && (
              <Button
                size="xs"
                variant="outline"
                onClick={() => {
                  setActiveFilter('all');
                  setSearchQuery('');
                }}
              >
                Reset Filters
              </Button>
            )}
          </div>
        ) : (
          <div className="divide-y divide-border">
            {filtered.map((item) => {
              const cat = notificationCategory(item);
              const link = studentSafeLink(item.link) || defaultNotificationLink(cat);
              const isUnread = !item.isRead;
              const cfg = CATEGORY_CONFIG[cat] || CATEGORY_CONFIG.general;
              const IconComp = cfg.icon;

              return (
                <div
                  key={item.id}
                  className={`crm-notif-card group ${isUnread ? 'is-unread' : ''}`}
                >
                  <Link
                    to={link}
                    onClick={() => isUnread && dispatch(markNotificationRead(item.id))}
                    className="flex items-start gap-3 flex-1 min-w-0 text-inherit no-underline"
                  >
                    {/* Category Icon */}
                    <div
                      className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 text-base ${cfg.iconBoxClass}`}
                    >
                      <IconComp />
                    </div>

                    {/* Notification Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        {isUnread && <span className="crm-notif-dot" title="Unread" />}
                        <strong className="text-xs font-bold text-text group-hover:text-primary-600 transition-colors">
                          {item.title || 'Update'}
                        </strong>
                      </div>

                      {item.message && (
                        <p className="m-0 text-xs text-text-secondary leading-relaxed line-clamp-2">
                          {item.message}
                        </p>
                      )}

                      <div className="flex items-center gap-1.5 mt-1.5 text-[11px] font-medium text-text-muted">
                        <FiClock size={11} />
                        <span>{formatRelativeTime(item.createdAt)}</span>
                      </div>
                    </div>
                  </Link>

                  {/* Right Action & Category Pill */}
                  <div className="flex items-center gap-2 shrink-0 pt-0.5">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${cfg.chipClass}`}
                    >
                      {notificationCategoryLabel(cat)}
                    </span>

                    {isUnread && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          dispatch(markNotificationRead(item.id));
                          toastService.success('Marked as read');
                        }}
                        className="p-1 rounded-md text-text-muted hover:text-primary-600 hover:bg-primary-50 transition-colors"
                        title="Mark as read"
                      >
                        <FiCheck size={13} />
                      </button>
                    )}

                    <Link
                      to={link}
                      onClick={() => isUnread && dispatch(markNotificationRead(item.id))}
                      className="text-text-muted hover:text-primary-600 transition-colors p-1"
                      title="Open page"
                    >
                      <FiArrowRight size={14} />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
