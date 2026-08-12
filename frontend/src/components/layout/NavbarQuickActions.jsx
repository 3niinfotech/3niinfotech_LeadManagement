import { useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { HEADER_ACTIONS, HEADER_ACTION_TONES } from '../../config/headerActions.config';
import { REMINDER_ITEMS, ANNOUNCEMENTS, TASK_PREVIEW } from '../../config/headerMock.data';
import { selectUnreadCount } from '../../modules/notification/redux/notificationSlice';
import { iconSize } from '../../theme/icons';
import HeaderActionDrawer from './HeaderActionDrawer';

function getBadgeCount(key, unreadNotifications) {
  switch (key) {
    case 'reminder':
      return REMINDER_ITEMS.filter((r) => r.isToday).length;
    case 'notification':
      return unreadNotifications || 2;
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

function QuickActionButton({ action, badge, isActive, onClick }) {
  const Icon = action.icon;
  const tone = HEADER_ACTION_TONES[action.tone] || HEADER_ACTION_TONES.brand;

  return (
    <button
      type="button"
      onClick={onClick}
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

      <span
        className="pointer-events-none absolute top-[calc(100%+6px)] left-1/2 -translate-x-1/2 z-[1050]
          px-2.5 py-1 rounded-md bg-text text-white text-[10px] font-medium whitespace-nowrap
          opacity-0 scale-95 group-hover:opacity-100 group-hover:scale-100
          transition-all duration-150 shadow-lg border border-white/10"
        role="tooltip"
      >
        {action.label}
      </span>
    </button>
  );
}

export default function NavbarQuickActions() {
  const unreadCount = useSelector(selectUnreadCount);
  const [activeAction, setActiveAction] = useState(null);

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

  const closeDrawer = () => setActiveAction(null);

  const primaryActions = HEADER_ACTIONS.filter((a) => a.badgeKey);
  const secondaryActions = HEADER_ACTIONS.filter((a) => !a.badgeKey);

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
                  onClick={() => handleClick(action.id)}
                />
              ))}
            </div>
          </>
        )}
      </nav>

      <HeaderActionDrawer
        actionId={activeAction}
        open={Boolean(activeAction)}
        onClose={closeDrawer}
      />
    </>
  );
}
