import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { FiBell, FiLogOut, FiMenu, FiVolume2, FiX } from 'react-icons/fi';
import { logoutUser } from '../../redux/slices/authSlice';
import { useAnnouncementCount } from '../../hooks/useAnnouncementCount';
import HeaderActionPopover from '../layout/HeaderActionPopover';
import AnnouncementPanel from '../layout/header-panels/AnnouncementPanel';
import { announcementApi } from '../../features/announcement/services/announcementApi.service';

function HeaderBadge({ count }) {
  if (!count) return null;
  return (
    <span className="crm-portal-header__badge">
      {count > 99 ? '99+' : count}
    </span>
  );
}

export default function PortalHeader({
  title,
  subtitle,
  user,
  profileTo,
  notifyTo,
  notifyCount = 0,
  portalLabel = 'Student',
  isDesktop,
  collapsed,
  mobileOpen,
  onToggleSidebar,
}) {
  const dispatch = useDispatch();
  const announcementCount = useAnnouncementCount();
  const announceBtnRef = useRef(null);
  const [announceOpen, setAnnounceOpen] = useState(false);
  const [ticker, setTicker] = useState(null);
  const [tickerDismissed, setTickerDismissed] = useState(false);

  const userInitial = (user?.firstName || user?.email || '?').charAt(0).toUpperCase();
  const fullName = [user?.firstName, user?.lastName].filter(Boolean).join(' ') || portalLabel;

  useEffect(() => {
    setAnnounceOpen(false);
  }, [title]);

  useEffect(() => {
    let cancelled = false;
    announcementApi.list({ pageSize: 5 })
      .then((res) => {
        if (cancelled) return;
        const rows = res?.data || [];
        const top = rows.find((r) => r?.isUnread || r?.unread) || rows[0] || null;
        setTicker(top);
      })
      .catch(() => {
        if (!cancelled) setTicker(null);
      });
    return () => { cancelled = true; };
  }, [announcementCount]);

  const showTicker = Boolean(ticker && !tickerDismissed && announcementCount > 0);

  return (
    <>
      <header className="crm-portal-header">
        <div className="crm-portal-header__left">
          <button
            type="button"
            className="crm-portal-header__menu-btn"
            aria-label={isDesktop ? (collapsed ? 'Expand menu' : 'Collapse menu') : (mobileOpen ? 'Close menu' : 'Open menu')}
            aria-expanded={isDesktop ? !collapsed : mobileOpen}
            onClick={onToggleSidebar}
          >
            {!isDesktop && mobileOpen ? <FiX /> : <FiMenu />}
          </button>

          <div className="crm-portal-header__title-block min-w-0">
            <div className="crm-portal-header__title">{title}</div>
            {subtitle && (
              <div className="crm-portal-header__subtitle">{subtitle}</div>
            )}
          </div>
          <span className="crm-portal-header__brand">{portalLabel}</span>
        </div>

        <div className="crm-portal-header__actions">
          <div className="crm-portal-header__cluster" role="group" aria-label="Alerts">
            <button
              ref={announceBtnRef}
              type="button"
              className={`crm-portal-header__icon-btn${announceOpen ? ' crm-portal-header__icon-btn--active' : ''}`}
              aria-label={announcementCount > 0 ? `Announcements, ${announcementCount} unread` : 'Announcements'}
              aria-expanded={announceOpen}
              aria-haspopup="dialog"
              onClick={() => setAnnounceOpen((v) => !v)}
            >
              <FiVolume2 />
              <HeaderBadge count={announcementCount} />
            </button>

            <Link
              to={notifyTo}
              className="crm-portal-header__icon-btn"
              aria-label={notifyCount > 0 ? `Notifications, ${notifyCount} unread` : 'Notifications'}
              onClick={() => setAnnounceOpen(false)}
            >
              <FiBell />
              <HeaderBadge count={notifyCount} />
            </Link>
          </div>

          <Link to={profileTo} className="crm-portal-header__user" title={fullName}>
            <span className="crm-portal-header__avatar">{userInitial}</span>
            <span className="crm-portal-header__user-name">{fullName}</span>
          </Link>

          <button
            type="button"
            className="crm-portal-header__icon-btn crm-portal-header__icon-btn--danger"
            aria-label="Sign out"
            onClick={() => dispatch(logoutUser())}
          >
            <FiLogOut />
          </button>
        </div>
      </header>

      {showTicker && (
        <div className="crm-portal-ann-ticker crm-print-hide" role="status">
          <span className="crm-portal-ann-ticker__dot" aria-hidden />
          <button
            type="button"
            className="crm-portal-ann-ticker__body"
            onClick={() => setAnnounceOpen(true)}
          >
            <strong>Announcement</strong>
            <span>{ticker.name || ticker.title || 'New update for you'}</span>
          </button>
          <button
            type="button"
            className="crm-portal-ann-ticker__dismiss"
            aria-label="Dismiss announcement preview"
            onClick={() => setTickerDismissed(true)}
          >
            <FiX />
          </button>
        </div>
      )}

      <HeaderActionPopover
        open={announceOpen}
        onClose={() => setAnnounceOpen(false)}
        anchorEl={announceBtnRef.current}
        title="Announcements"
        width={420}
        maxHeight={560}
      >
        <AnnouncementPanel onClose={() => setAnnounceOpen(false)} />
      </HeaderActionPopover>
    </>
  );
}
