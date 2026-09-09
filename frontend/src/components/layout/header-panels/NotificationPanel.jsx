import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import {
  FiBell,
  FiCheckCircle,
  FiSettings,
  FiVolume2,
  FiVolumeX,
  FiAlertTriangle,
  FiInfo,
  FiClock,
  FiUserPlus,
} from 'react-icons/fi';
import {
  markNotificationRead,
  markAllNotificationsRead,
  selectNotifications,
  selectUnreadCount,
  selectNotificationsLoading,
} from '../../../modules/notification/redux/notificationSlice';
import { useNotificationPreferences } from '../../../hooks/useNotificationPreferences';
import { ROUTES } from '../../../config/routes';
import { trackAnnouncementView } from '../../../features/announcement/utils/announcement.utils';
import { selectUser } from '../../../redux/slices/authSlice';

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
  return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
}

function parseNotificationMeta(item) {
  const raw = item?.metadata;
  if (!raw) return {};
  if (typeof raw === 'object') return raw;
  if (typeof raw === 'string') {
    try {
      const parsed = JSON.parse(raw);
      return parsed && typeof parsed === 'object' ? parsed : {};
    } catch {
      return {};
    }
  }
  return {};
}

function resolveTone(item) {
  const meta = parseNotificationMeta(item);
  const event = meta.event || meta.audience;
  const type = String(item?.type || '').toUpperCase();

  if (event === 'ANNOUNCEMENT_PUBLISHED') {
    return {
      key: 'info',
      label: 'Announcement',
      Icon: FiVolume2,
      iconWrap: 'bg-info-soft text-info',
      unread: 'border-info/25 bg-info-soft/50 hover:border-info/40',
      dot: 'bg-info',
    };
  }
  if (event === 'VISITOR_REGISTERED' || event === 'ACTOR') {
    return {
      key: 'success',
      label: 'Walk-in',
      Icon: FiUserPlus,
      iconWrap: 'bg-success-soft text-success',
      unread: 'border-success/20 bg-success-soft/40 hover:border-success/35',
      dot: 'bg-success',
    };
  }
  if (event === 'COUNSELLOR_ASSIGNED' || event === 'ASSIGNEE') {
    return {
      key: 'brand',
      label: 'Assignment',
      Icon: FiBell,
      iconWrap: 'bg-brand-soft text-brand',
      unread: 'border-brand/20 bg-brand-soft/40 hover:border-brand/35',
      dot: 'bg-brand',
    };
  }
  if (event === 'MANAGEMENT') {
    return {
      key: 'brand',
      label: 'Walk-in',
      Icon: FiBell,
      iconWrap: 'bg-brand-soft text-brand',
      unread: 'border-brand/20 bg-brand-soft/40 hover:border-brand/35',
      dot: 'bg-brand',
    };
  }
  if (type === 'REMINDER') {
    return {
      key: 'warning',
      label: 'Reminder',
      Icon: FiClock,
      iconWrap: 'bg-warning-soft text-warning',
      unread: 'border-warning/25 bg-warning-soft/50 hover:border-warning/40',
      dot: 'bg-warning',
    };
  }
  if (type === 'WARNING') {
    return {
      key: 'warning',
      label: 'Alert',
      Icon: FiAlertTriangle,
      iconWrap: 'bg-warning-soft text-warning',
      unread: 'border-warning/25 bg-warning-soft/50 hover:border-warning/40',
      dot: 'bg-warning',
    };
  }
  if (type === 'SUCCESS') {
    return {
      key: 'success',
      label: 'Update',
      Icon: FiCheckCircle,
      iconWrap: 'bg-success-soft text-success',
      unread: 'border-success/20 bg-success-soft/40 hover:border-success/35',
      dot: 'bg-success',
    };
  }
  if (type === 'ERROR' || type === 'DANGER') {
    return {
      key: 'danger',
      label: 'Error',
      Icon: FiAlertTriangle,
      iconWrap: 'bg-danger-soft text-danger',
      unread: 'border-danger/25 bg-danger-soft/45 hover:border-danger/40',
      dot: 'bg-danger',
    };
  }
  return {
    key: 'info',
    label: 'Info',
    Icon: FiInfo,
    iconWrap: 'bg-info-soft text-info',
    unread: 'border-info/20 bg-info-soft/40 hover:border-info/35',
    dot: 'bg-info',
  };
}

/** Title-bar actions: Mute + Settings (sits left of Close) */
export function NotificationHeaderActions({ onClose }) {
  const { prefs, setMuted } = useNotificationPreferences();

  return (
    <div className="flex items-center gap-1 mr-0.5">
      <button
        type="button"
        title={prefs.muted ? 'Unmute alerts' : 'Mute all alerts'}
        onClick={() => setMuted(!prefs.muted)}
        className={`inline-flex items-center gap-1 h-7 px-2 rounded-md text-[11px] font-semibold border transition-colors ${
          prefs.muted
            ? 'bg-warning-soft text-warning border-warning/30'
            : 'border-transparent text-text-muted hover:text-brand hover:bg-brand-soft'
        }`}
      >
        {prefs.muted ? <FiVolumeX className="w-3.5 h-3.5" /> : <FiVolume2 className="w-3.5 h-3.5" />}
        {prefs.muted ? 'Unmute' : 'Mute'}
      </button>
      <Link
        to={ROUTES.SETTINGS}
        onClick={() => onClose?.()}
        title="Notification settings"
        className="inline-flex items-center gap-1 h-7 px-2 rounded-md text-[11px] font-semibold
          text-text-muted hover:text-text hover:bg-row-hover transition-colors"
      >
        <FiSettings className="w-3.5 h-3.5" />
        Settings
      </Link>
    </div>
  );
}

export default function NotificationPanel({ onClose, compact = false }) {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const user = useSelector(selectUser);
  const list = useSelector(selectNotifications);
  const unreadCount = useSelector(selectUnreadCount);
  const loading = useSelector(selectNotificationsLoading);

  const openItem = async (item) => {
    const meta = parseNotificationMeta(item);
    if (!item.isRead) dispatch(markNotificationRead(item.id));
    if (meta.event === 'ANNOUNCEMENT_PUBLISHED' && meta.announcementId) {
      await trackAnnouncementView(user?.id, {
        id: meta.announcementId,
        updatedAt: item.createdAt,
      });
    }
    if (item.link) {
      navigate(item.link);
      onClose?.();
    }
  };

  return (
    <div className={compact ? '' : 'space-y-4'}>
      <div className="px-4 pt-3 pb-2 border-b border-border bg-gradient-to-b from-brand-soft/40 to-page/30">
        <div className="flex items-center justify-between gap-2">
          <p className="text-[12px] text-text-secondary">
            <span className="inline-flex items-center justify-center min-w-[1.25rem] h-5 px-1.5 rounded-md bg-brand text-white text-[11px] font-bold tabular-nums mr-1.5">
              {unreadCount}
            </span>
            unread
          </p>
          <button
            type="button"
            className="text-[12px] font-semibold text-brand hover:text-brand-hover disabled:opacity-40"
            disabled={!unreadCount}
            onClick={() => dispatch(markAllNotificationsRead())}
          >
            Mark all read
          </button>
        </div>
      </div>

      <div className="px-2 py-2">
        {loading && !list.length ? (
          <p className="text-sm text-text-muted py-8 text-center">Loading notifications…</p>
        ) : list.length === 0 ? (
          <div className="py-10 text-center px-4">
            <span className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-soft text-brand">
              <FiBell className="w-6 h-6 opacity-80" />
            </span>
            <p className="text-sm font-semibold text-text">All caught up</p>
            <p className="text-[12px] text-text-muted mt-1 leading-relaxed">
              Walk-ins, assignments, announcements, and alerts appear here in real time.
            </p>
          </div>
        ) : (
          <ul className="space-y-1 max-h-[340px] overflow-y-auto no-scrollbar">
            {list.map((item) => {
              const tone = resolveTone(item);
              const Icon = tone.Icon;
              return (
                <li key={item.id}>
                  <button
                    type="button"
                    className={`w-full text-left px-2.5 py-2.5 rounded-xl border transition-colors ${
                      item.isRead
                        ? 'border-transparent hover:bg-row-hover'
                        : tone.unread
                    }`}
                    onClick={() => openItem(item)}
                  >
                    <div className="flex items-start gap-2.5">
                      <span
                        className={`mt-0.5 flex h-8 w-8 items-center justify-center rounded-xl shrink-0 ${tone.iconWrap}`}
                      >
                        <Icon className="w-3.5 h-3.5" />
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-[10px] font-bold uppercase tracking-wide text-text-muted">
                            {tone.label}
                          </p>
                          <p className="text-[10px] text-text-muted shrink-0">
                            {formatRelativeTime(item.createdAt) || item.time || ''}
                          </p>
                        </div>
                        <p className="text-[13px] font-semibold text-text mt-0.5 line-clamp-1">{item.title}</p>
                        <p className="text-[12px] text-text-muted mt-0.5 line-clamp-2">
                          {item.message || item.body}
                        </p>
                      </div>
                      {!item.isRead ? (
                        <span className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${tone.dot}`} />
                      ) : null}
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {list.length > 0 && (
        <div className="px-3 py-2.5 border-t border-border bg-page/30 flex gap-2">
          <button
            type="button"
            className="flex-1 h-9 rounded-lg border border-border text-[12px] font-semibold text-text hover:bg-row-hover transition-colors"
            onClick={() => dispatch(markAllNotificationsRead())}
          >
            Clear unread
          </button>
        </div>
      )}
    </div>
  );
}
