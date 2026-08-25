import { useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useSelector } from 'react-redux';
import { HEADER_ACTIONS, HEADER_ACTION_TONES } from '../../config/headerActions.config';
import { hasAnyPermission } from '../../config/permissions';
import { REMINDER_ITEMS, ANNOUNCEMENTS, TASK_PREVIEW } from '../../config/headerMock.data';
import { selectUnreadCount } from '../../modules/notification/redux/notificationSlice';
import { selectPermissions } from '../../redux/slices/authSlice';
import { iconSize } from '../../theme/icons';
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

function getBadgeCount(key, unreadNotifications) {
  switch (key) {
    case 'reminder':
      return REMINDER_ITEMS.filter((r) => r.isToday).length;
    case 'notification':
      return unreadNotifications || 0;
    case 'announcement':
      return ANNOUNCEMENTS.length;
    case 'task':
      return TASK_PREVIEW.filter((t) => t.status === 'Pending').length;
    default:
      return 0;
  }
}

function CountBadge({ count, tone }) {
  const label = count > 9 ? '9+' : String(count);
  const wide = label.length > 1;

  return (
    <span
      className={`
        pointer-events-none absolute z-10 flex items-center justify-center
        font-bold tabular-nums leading-none
        ${wide ? 'min-w-[14px] h-3 px-0.5 text-[7px]' : 'w-3 h-3 text-[8px]'}
        rounded-full ${tone.badge} ${tone.badgeText}
        ring-1 ring-card-bg
        -top-1 -right-1.5
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
        w-9 h-9 rounded-lg transition-all duration-200 focus-ring
        ${isActive ? tone.active : `text-text-muted ${tone.hover}`}
      `}
    >
      <span className="relative inline-flex items-center justify-center">
        <Icon className={`${iconSize.sm} transition-transform duration-200 group-hover:scale-105`} />
        {badge > 0 && <CountBadge count={badge} tone={tone} />}
      </span>

      {tip && createPortal(
        <span
          className="fixed z-[1500] px-2.5 py-1 rounded-md bg-text text-white text-[10px] font-medium whitespace-nowrap
            shadow-lg border border-white/10 pointer-events-none -translate-x-1/2"
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

export default function NavbarQuickActions() {
  const unreadCount = useSelector(selectUnreadCount);
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
          acc[action.id] = getBadgeCount(action.badgeKey, unreadCount);
        }
        return acc;
      }, {}),
    [unreadCount],
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
        className="flex items-center h-11 rounded-xl border border-border/70 bg-card-bg/90 shadow-sm backdrop-blur-sm px-1.5 overflow-visible"
      >
        <div className="flex items-center gap-1">
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
            <span className="w-px h-5 bg-border/60 mx-0.5" aria-hidden />
            <div className="flex items-center gap-1">
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
