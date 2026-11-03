import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useDispatch, useSelector } from 'react-redux';
import { FiSun, FiMoon, FiMaximize, FiMinimize } from 'react-icons/fi';
import { HEADER_ACTIONS, HEADER_ACTION_TONES } from '../../config/headerActions.config';
import { hasAnyPermission } from '../../config/permissions';
import { THEMES } from '../../config/constants';
import { setTheme, selectTheme } from '../../redux/slices/uiSlice';
import { selectUnreadCount } from '../../modules/notification/redux/notificationSlice';
import { selectReminderBadge, selectReminderFeed } from '../../modules/reminder/redux/reminderSlice';
import { selectPermissions } from '../../redux/slices/authSlice';
import { useAnnouncementCount } from '../../hooks/useAnnouncementCount';
import HeaderActionPopover from './HeaderActionPopover';
import NotificationPanel, { NotificationHeaderActions } from './header-panels/NotificationPanel';
import ReminderPanel from './header-panels/ReminderPanel';
import AnnouncementPanel from './header-panels/AnnouncementPanel';
import CourseFinderPanel from './header-panels/CourseFinderPanel';
import TaskPanel from './header-panels/TaskPanel';

const PANEL_MAP = {
  reminder: ReminderPanel,
  notification: NotificationPanel,
  announcement: AnnouncementPanel,
  courseFinder: CourseFinderPanel,
  task: TaskPanel,
};

function getBadgeCount(key, unreadNotifications, reminderBadge, reminderFeed, announcementCount) {
  switch (key) {
    case 'reminder':
      return reminderBadge || 0;
    case 'notification':
      return unreadNotifications || 0;
    case 'announcement':
      return announcementCount || 0;
    case 'task':
      return (reminderFeed?.counts?.overdue || 0) + (reminderFeed?.counts?.dueToday || 0);
    default:
      return 0;
  }
}

function CountBadge({ count, tone }) {
  const label = count > 9 ? '9+' : String(count);

  return (
    <span
      className={`
        pointer-events-none absolute -top-1 -right-1 z-10 flex items-center justify-center
        min-w-[15px] h-[15px] px-1 text-[9px] font-bold leading-none tabular-nums
        rounded-full text-white ${tone.badge || 'bg-brand'}
        ring-2 ring-white dark:ring-slate-900 shadow-2xs
      `}
      aria-hidden
    >
      {label}
    </span>
  );
}

function QuickActionButton({ action, badge, isActive, onClick, buttonRef }) {
  const Icon = action.icon;
  const tone = HEADER_ACTION_TONES[action.tone] || HEADER_ACTION_TONES.brand;
  const [tip, setTip] = useState(null);

  const showTip = (el) => {
    if (!el || isActive) return;
    const rect = el.getBoundingClientRect();
    setTip({
      top: rect.bottom + 8,
      left: rect.left + rect.width / 2,
    });
  };

  return (
    <button
      ref={buttonRef}
      type="button"
      onClick={(e) => {
        setTip(null);
        onClick?.(e);
      }}
      onMouseEnter={(e) => showTip(e.currentTarget)}
      onMouseLeave={() => setTip(null)}
      onFocus={(e) => showTip(e.currentTarget)}
      onBlur={() => setTip(null)}
      aria-label={badge > 0 ? `${action.label}, ${badge} unread` : action.label}
      aria-pressed={isActive}
      className={`
        group relative flex items-center justify-center
        w-8 h-8 rounded-md transition-all duration-150 focus-ring
        ${isActive
          ? 'bg-brand-soft text-brand ring-1 ring-brand/20'
          : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800/80'
        }
      `}
    >
      <Icon className="w-4 h-4 transition-transform duration-150 group-hover:scale-105" />
      {badge > 0 && <CountBadge count={badge} tone={tone} />}

      {tip && createPortal(
        <span
          className="fixed z-[1500] px-2 py-0.5 rounded-md bg-slate-900 text-white text-[10px] font-medium whitespace-nowrap
            shadow-md border border-white/10 pointer-events-none -translate-x-1/2"
          style={{ top: tip.top, left: tip.left }}
          role="tooltip"
        >
          {action.label}
        </span>,
        document.body,
      )}
    </button>
  );
}

function UtilityActionButton({ icon: Icon, label, onClick, active, className = '' }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      aria-label={label}
      className={`
        flex items-center justify-center w-8 h-8 rounded-md transition-all duration-150 focus-ring
        ${active
          ? 'bg-brand-soft text-brand'
          : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800/80'
        } ${className}
      `}
    >
      <Icon className="w-4 h-4" />
    </button>
  );
}

export default function NavbarQuickActions() {
  const dispatch = useDispatch();
  const theme = useSelector(selectTheme);
  const isDark = theme === THEMES.DARK;
  const [fullscreen, setFullscreen] = useState(false);

  useEffect(() => {
    const onFsChange = () => setFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener('fullscreenchange', onFsChange);
    return () => document.removeEventListener('fullscreenchange', onFsChange);
  }, []);

  const toggleTheme = () => {
    dispatch(setTheme(isDark ? THEMES.LIGHT : THEMES.DARK));
  };

  const toggleFullscreen = () => {
    if (document.fullscreenElement) {
      document.exitFullscreen?.();
    } else {
      document.documentElement.requestFullscreen?.();
    }
  };

  const unreadCount = useSelector(selectUnreadCount);
  const reminderBadge = useSelector(selectReminderBadge);
  const reminderFeed = useSelector(selectReminderFeed);
  const announcementCount = useAnnouncementCount();
  const permissions = useSelector(selectPermissions);
  const [activeAction, setActiveAction] = useState(null);
  const buttonRefs = useRef({});

  const visibleActions = useMemo(
    () => HEADER_ACTIONS.filter((action) => {
      if (!action.permissions?.length) return true;
      return hasAnyPermission(permissions, action.permissions);
    }),
    [permissions],
  );

  const badges = useMemo(
    () =>
      HEADER_ACTIONS.reduce((acc, action) => {
        if (action.badgeKey) {
          acc[action.id] = getBadgeCount(
            action.badgeKey,
            unreadCount,
            reminderBadge,
            reminderFeed,
            announcementCount,
          );
        }
        return acc;
      }, {}),
    [unreadCount, reminderBadge, reminderFeed, announcementCount],
  );

  const handleClick = (actionId) => {
    setActiveAction((prev) => (prev === actionId ? null : actionId));
  };

  const close = () => setActiveAction(null);

  const activeMeta = visibleActions.find((a) => a.id === activeAction);
  const Panel = activeAction ? PANEL_MAP[activeAction] : null;

  const primaryActions = visibleActions.filter((a) => a.badgeKey);
  const secondaryActions = visibleActions.filter((a) => !a.badgeKey);

  return (
    <>
      <nav
        aria-label="Quick actions"
        className="flex items-center h-9 rounded-lg border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs px-1 overflow-visible"
      >
        <div className="flex items-center gap-0.5">
          {primaryActions.map((action) => (
            <QuickActionButton
              key={action.id}
              action={action}
              badge={badges[action.id] || 0}
              isActive={activeAction === action.id}
              buttonRef={(el) => {
                buttonRefs.current[action.id] = el;
              }}
              onClick={() => handleClick(action.id)}
            />
          ))}
        </div>

        {secondaryActions.length > 0 && (
          <>
            <span className="w-px h-4 bg-slate-200 dark:bg-slate-800 mx-1 shrink-0" aria-hidden />
            <div className="flex items-center gap-0.5">
              {secondaryActions.map((action) => (
                <QuickActionButton
                  key={action.id}
                  action={action}
                  badge={badges[action.id] || 0}
                  isActive={activeAction === action.id}
                  buttonRef={(el) => {
                    buttonRefs.current[action.id] = el;
                  }}
                  onClick={() => handleClick(action.id)}
                />
              ))}
            </div>
          </>
        )}

        <span className="w-px h-4 bg-slate-200 dark:bg-slate-800 mx-1 shrink-0" aria-hidden />

        <div className="flex items-center gap-0.5">
          <UtilityActionButton
            icon={isDark ? FiSun : FiMoon}
            label={isDark ? 'Light mode' : 'Dark mode'}
            onClick={toggleTheme}
          />
          <UtilityActionButton
            icon={fullscreen ? FiMinimize : FiMaximize}
            label={fullscreen ? 'Exit fullscreen' : 'Fullscreen'}
            onClick={toggleFullscreen}
            className="hidden sm:flex"
          />
        </div>
      </nav>

      <HeaderActionPopover
        open={Boolean(activeAction && Panel)}
        onClose={close}
        anchorEl={buttonRefs.current[activeAction]}
        title={activeMeta?.label || ''}
        width={activeMeta?.width || 400}
        maxHeight={560}
        headerRight={
          activeAction === 'notification'
            ? <NotificationHeaderActions onClose={close} />
            : null
        }
      >
        {Panel ? <Panel onClose={close} compact /> : null}
      </HeaderActionPopover>
    </>
  );
}
