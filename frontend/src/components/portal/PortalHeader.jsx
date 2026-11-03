import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  FiBell,
  FiCheck,
  FiChevronDown,
  FiLogOut,
  FiMail,
  FiMapPin,
  FiMenu,
  FiPhone,
  FiUser,
  FiVolume2,
  FiX,
  FiSun,
  FiMoon,
  FiMaximize,
  FiMinimize,
} from 'react-icons/fi';
import { logoutUser } from '../../redux/slices/authSlice';
import { setTheme, selectTheme } from '../../redux/slices/uiSlice';
import { THEMES } from '../../config/constants';
import { useAnnouncementCount } from '../../hooks/useAnnouncementCount';
import HeaderActionPopover from '../layout/HeaderActionPopover';
import AnnouncementPanel from '../layout/header-panels/AnnouncementPanel';
import NotificationPanel from '../layout/header-panels/NotificationPanel';
import Avatar from '../ui/Avatar';
import { resolveStudentPhotoUrl } from '../../features/student/config/studentDocument.config';
import { resolvePublicAssetUrl } from '../../config/company-settings.config';
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
  const navigate = useNavigate();
  const announcementCount = useAnnouncementCount();

  const announceBtnRef = useRef(null);
  const notifyBtnRef = useRef(null);
  const profileBtnRef = useRef(null);

  const [announceOpen, setAnnounceOpen] = useState(false);
  const [notifyOpen, setNotifyOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const [fullscreen, setFullscreen] = useState(false);

  const theme = useSelector(selectTheme);
  const isDark = theme === THEMES.DARK;

  useEffect(() => {
    const onFsChange = () => setFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener('fullscreenchange', onFsChange);
    return () => document.removeEventListener('fullscreenchange', onFsChange);
  }, []);

  const toggleFullscreen = () => {
    if (document.fullscreenElement) {
      document.exitFullscreen?.();
    } else {
      document.documentElement.requestFullscreen?.();
    }
  };

  const toggleTheme = () => {
    dispatch(setTheme(isDark ? THEMES.LIGHT : THEMES.DARK));
  };

  const [ticker, setTicker] = useState(null);
  const [tickerDismissed, setTickerDismissed] = useState(false);

  const avatarSrc = resolveStudentPhotoUrl(user) || resolvePublicAssetUrl(user?.avatar || user?.photoUrl);
  const fullName = [user?.firstName, user?.lastName].filter(Boolean).join(' ') || portalLabel;
  const studentId = user?.studentId || user?.student?.studentId || user?.code || '';
  const email = user?.email || '';
  const phone = user?.phone || user?.student?.phone || '';

  useEffect(() => {
    setAnnounceOpen(false);
    setNotifyOpen(false);
    setProfileOpen(false);
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
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {!isDesktop && mobileOpen ? <FiX /> : <FiMenu />}
          </button>

          <div className="crm-portal-header__title-block min-w-0">
            <div className="flex items-center gap-2">
              <span className="crm-portal-header__title">
                {title || 'Dashboard'}
              </span>
            </div>
            {subtitle && (
              <div className="crm-portal-header__subtitle">
                <FiMapPin className="w-2.5 h-2.5 text-brand shrink-0" />
                <span className="truncate">{subtitle}</span>
              </div>
            )}
          </div>
        </div>

        <div className="crm-portal-header__actions">
          <div className="crm-portal-header__cluster" role="group" aria-label="Portal Controls">
            {/* Theme Toggle (Light / Dark) */}
            <button
              type="button"
              className="crm-portal-header__icon-btn"
              aria-label={isDark ? 'Switch to Light mode' : 'Switch to Dark mode'}
              title={isDark ? 'Switch to Light mode' : 'Switch to Dark mode'}
              onClick={toggleTheme}
            >
              {isDark ? <FiSun className="text-amber-400" /> : <FiMoon />}
            </button>

            {/* Fullscreen Toggle */}
            <button
              type="button"
              className="crm-portal-header__icon-btn hidden sm:grid"
              aria-label={fullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
              title={fullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
              onClick={toggleFullscreen}
            >
              {fullscreen ? <FiMinimize /> : <FiMaximize />}
            </button>

            {/* Announcements Popover Button */}
            <button
              ref={announceBtnRef}
              type="button"
              className={`crm-portal-header__icon-btn${announceOpen ? ' crm-portal-header__icon-btn--active' : ''}`}
              aria-label={announcementCount > 0 ? `Announcements, ${announcementCount} unread` : 'Announcements'}
              title="Announcements"
              aria-expanded={announceOpen}
              aria-haspopup="dialog"
              onClick={() => {
                setAnnounceOpen((v) => !v);
                setNotifyOpen(false);
                setProfileOpen(false);
              }}
            >
              <FiVolume2 />
              <HeaderBadge count={announcementCount} />
            </button>

            {/* Notifications Popover Modal Button */}
            <button
              ref={notifyBtnRef}
              type="button"
              className={`crm-portal-header__icon-btn${notifyOpen ? ' crm-portal-header__icon-btn--active' : ''}`}
              aria-label={notifyCount > 0 ? `Notifications, ${notifyCount} unread` : 'Notifications'}
              title="Notifications"
              aria-expanded={notifyOpen}
              aria-haspopup="dialog"
              onClick={() => {
                setNotifyOpen((v) => !v);
                setAnnounceOpen(false);
                setProfileOpen(false);
              }}
            >
              <FiBell />
              <HeaderBadge count={notifyCount} />
            </button>
          </div>

          {/* Profile Popover Modal Button with Profile Photo & Details */}
          <button
            ref={profileBtnRef}
            type="button"
            className={`crm-portal-header__user-pill ${profileOpen ? 'is-active' : ''}`}
            title={fullName}
            aria-expanded={profileOpen}
            aria-haspopup="dialog"
            onClick={() => {
              setProfileOpen((v) => !v);
              setAnnounceOpen(false);
              setNotifyOpen(false);
            }}
          >
            <div className="relative shrink-0">
              <Avatar
                src={avatarSrc}
                name={fullName}
                size="sm"
                className="!w-7 !h-7 !rounded-full object-cover shrink-0 ring-1 ring-brand/30"
              />
              <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-slate-900" />
            </div>
            <div className="flex flex-col text-left leading-tight hidden sm:flex">
              <span className="text-[12px] font-bold text-text truncate max-w-[110px]">{fullName}</span>
              <span className="text-[10px] font-medium text-text-muted capitalize">{user?.role?.name || portalLabel}</span>
            </div>
            <FiChevronDown className={`w-3.5 h-3.5 text-text-muted transition-transform duration-200 ${profileOpen ? 'rotate-180 text-brand' : ''}`} />
          </button>
        </div>
      </header>

      {showTicker && (
        <div className="crm-portal-ann-ticker crm-print-hide" role="status">
          <span className="crm-portal-ann-ticker__dot" aria-hidden />
          <button
            type="button"
            className="crm-portal-ann-ticker__body"
            onClick={() => {
              setAnnounceOpen(true);
              setNotifyOpen(false);
              setProfileOpen(false);
            }}
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

      {/* Announcements Popover Modal */}
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

      {/* Notifications Popover Modal */}
      <HeaderActionPopover
        open={notifyOpen}
        onClose={() => setNotifyOpen(false)}
        anchorEl={notifyBtnRef.current}
        title="Notifications"
        width={420}
        maxHeight={560}
      >
        <NotificationPanel onClose={() => setNotifyOpen(false)} />
      </HeaderActionPopover>

      {/* Profile Popover Modal with Head Office — Ahmedabad */}
      <HeaderActionPopover
        open={profileOpen}
        onClose={() => setProfileOpen(false)}
        anchorEl={profileBtnRef.current}
        title="My Profile"
        hideHeader
        width={250}
        maxHeight={520}
      >
        <div className="p-3 flex flex-col gap-2">
          {/* User Profile Header */}
          <div className="flex items-center gap-2.5 pb-2.5 border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/60 dark:bg-slate-800/40 -mx-3 -mt-3 p-3">
            <div className="relative shrink-0">
              <Avatar
                src={avatarSrc}
                name={fullName}
                size="sm"
                className="!w-9 !h-9 !rounded-xl object-cover ring-2 ring-primary/20 shadow-xs"
              />
              <span className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-slate-900" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 flex-wrap">
                <h3 className="text-[13px] font-bold text-slate-900 dark:text-white truncate leading-tight">{fullName}</h3>
                <span className="inline-flex items-center text-xs font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 px-1.5 py-0.2 rounded-full border border-emerald-200/50">
                  Active
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">{email || studentId}</p>
            </div>
          </div>

          {/* Contact quick strip */}
          {phone ? (
            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 px-1 py-0.5">
              <FiPhone className="w-3 h-3 text-slate-400 shrink-0" />
              <span className="truncate">{phone}</span>
            </div>
          ) : null}

          {/* Navigation Actions */}
          <div className="pt-1 border-t border-slate-100 dark:border-slate-800/80 flex flex-col gap-0.5">
            <button
              type="button"
              className="w-full flex items-center justify-between px-2.5 py-2 text-[13px] font-medium text-slate-700 dark:text-slate-200 hover:text-primary hover:bg-slate-100/70 dark:hover:bg-slate-800/60 rounded-lg transition-colors text-left group"
              onClick={() => {
                setProfileOpen(false);
                navigate(profileTo);
              }}
            >
              <span className="flex items-center gap-2.5">
                <FiUser className="w-4 h-4 text-slate-400 group-hover:text-primary transition-colors" />
                View Full Profile
              </span>
              <span className="text-[12px] text-slate-300 group-hover:text-primary transition-colors font-semibold">→</span>
            </button>

            <button
              type="button"
              className="w-full flex items-center gap-2.5 px-2.5 py-2 text-[13px] font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition-colors text-left group"
              onClick={() => {
                setProfileOpen(false);
                dispatch(logoutUser());
              }}
            >
              <FiLogOut className="w-4 h-4 text-rose-500 group-hover:text-rose-600 transition-colors" />
              Sign Out
            </button>
          </div>
        </div>
      </HeaderActionPopover>
    </>
  );
}
