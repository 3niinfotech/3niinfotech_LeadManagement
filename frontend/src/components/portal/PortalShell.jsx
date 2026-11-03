import { Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import { NavLink, Outlet, Link, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  FiChevronLeft,
  FiChevronRight,
  FiMoreHorizontal,
  FiX,
} from 'react-icons/fi';
import { selectUser } from '../../redux/slices/authSlice';
import { usePermissions } from '../../hooks/usePermissions';
import {
  fetchNotifications,
  selectUnreadCount,
} from '../../modules/notification/redux/notificationSlice';
import {
  filterBottomNav,
  filterPortalNav,
  PORTAL_BOTTOM_NAV,
  PORTAL_NAV,
} from '../../config/portal-nav.config';
import { ROUTES } from '../../config/routes';
import RouteProgress from '../ui/RouteProgress';
import PortalHeader from './PortalHeader';
import { useCompanyRuntime } from '../../features/organization/CompanyRuntime';
import { resolvePublicAssetUrl } from '../../config/company-settings.config';
import './portal.theme.css';

const MOBILE_BREAK = 1024;

function useMediaQuery(query) {
  const [matches, setMatches] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia(query).matches;
  });

  useEffect(() => {
    const mq = window.matchMedia(query);
    const handler = (e) => setMatches(e.matches);
    mq.addEventListener('change', handler);
    setMatches(mq.matches);
    return () => mq.removeEventListener('change', handler);
  }, [query]);

  return matches;
}

function isNavActive(pathname, to) {
  const cleanPath = (pathname || '').split('?')[0].split('#')[0].replace(/\/+$/, '') || '/';
  const cleanTo = (to || '').split('?')[0].split('#')[0].replace(/\/+$/, '') || '/';
  if (to === ROUTES.STUDENT_DASHBOARD || to === ROUTES.TEACHER_DASHBOARD) {
    return cleanPath === cleanTo;
  }
  return cleanPath === cleanTo || (cleanTo !== '/' && cleanPath.startsWith(`${cleanTo}/`));
}

export default function PortalShell({
  role = 'student',
  portalLabel = 'Student',
  profileRoute,
  notificationsRoute,
}) {
  const dispatch = useDispatch();
  const user = useSelector(selectUser);
  const unreadCount = useSelector(selectUnreadCount);
  const { can } = usePermissions();
  const location = useLocation();
  const isDesktop = useMediaQuery(`(min-width: ${MOBILE_BREAK}px)`);

  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);

  const navGroups = useMemo(
    () => filterPortalNav(PORTAL_NAV[role] || [], can),
    [role, can],
  );

  const bottomNav = useMemo(
    () => filterBottomNav(PORTAL_BOTTOM_NAV[role] || [], can),
    [role, can],
  );

  const profileTo = profileRoute || (role === 'teacher' ? ROUTES.PROFILE : ROUTES.STUDENT_PROFILE);
  const notifyTo = notificationsRoute || (role === 'teacher' ? ROUTES.NOTIFICATIONS : ROUTES.STUDENT_NOTIFICATIONS);

  useEffect(() => {
    dispatch(fetchNotifications({ limit: 30 }));
  }, [dispatch]);

  useEffect(() => {
    setMobileOpen(false);
    setMoreOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (isDesktop) setMobileOpen(false);
  }, [isDesktop]);

  useEffect(() => {
    if (!isDesktop && mobileOpen) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => { document.body.style.overflow = prev; };
    }
    return undefined;
  }, [isDesktop, mobileOpen]);

  useEffect(() => {
    if (isDesktop || (!mobileOpen && !moreOpen)) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') {
        setMobileOpen(false);
        setMoreOpen(false);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isDesktop, mobileOpen, moreOpen]);

  const { company } = useCompanyRuntime() || {};
  const activeCompany = company || user?.company;
  const companyName = (activeCompany?.name || user?.company?.name || 'VisaERP').trim();
  const companyLogo = activeCompany?.logo || user?.company?.logo || '';
  const companyInitial = companyName.charAt(0).toUpperCase() || 'C';

  const [directLogo, setDirectLogo] = useState('');
  const [logoFailed, setLogoFailed] = useState(false);

  useEffect(() => {
    if (!companyLogo) {
      import('../../features/master/services/organizationApi.service')
        .then((m) => m.organizationApi.getCompany())
        .then((res) => {
          if (res?.logo) setDirectLogo(res.logo);
        })
        .catch(() => {});
    }
  }, [companyLogo]);

  const finalLogo = companyLogo || directLogo;
  const logoUrl = finalLogo ? resolvePublicAssetUrl(finalLogo) : '';

  const sidebarClass = [
    'crm-portal-sidebar',
    collapsed && isDesktop ? 'crm-portal-sidebar--collapsed' : '',
    !isDesktop && mobileOpen ? 'crm-portal-sidebar--mobile-open' : '',
    !isDesktop && !mobileOpen ? 'crm-portal-sidebar--mobile-hidden' : '',
  ].filter(Boolean).join(' ');

  const mainClass = [
    'crm-portal-main',
    collapsed && isDesktop ? 'crm-portal-main--collapsed' : '',
    !isDesktop ? 'crm-portal-main--mobile' : '',
  ].filter(Boolean).join(' ');

  const toggleSidebar = useCallback(() => {
    if (isDesktop) {
      setCollapsed((v) => !v);
    } else {
      setMobileOpen((v) => !v);
    }
  }, [isDesktop]);

  const currentPageTitle = useMemo(() => {
    for (const group of navGroups) {
      for (const item of group.items) {
        if (isNavActive(location.pathname, item.to)) return item.label;
      }
    }
    return portalLabel;
  }, [navGroups, location.pathname, portalLabel]);

  return (
    <div className={`crm-portal-root crm-portal-root--${role}${mobileOpen && !isDesktop ? ' crm-portal-root--drawer-open' : ''}`}>
      {!isDesktop && mobileOpen && (
        <button
          type="button"
          className="crm-portal-overlay"
          aria-label="Close menu"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className={sidebarClass}
        aria-label="Portal navigation"
        aria-hidden={!isDesktop && !mobileOpen ? 'true' : undefined}
      >
        <div className="crm-portal-sidebar__brand">
          <div className="crm-portal-sidebar__logo" aria-hidden>
            {logoUrl && !logoFailed ? (
              <img
                src={logoUrl}
                alt={companyName}
                onError={() => setLogoFailed(true)}
              />
            ) : (
              <span>{companyInitial}</span>
            )}
          </div>
          <div className="crm-portal-sidebar__brand-copy">
            <div className="crm-portal-sidebar__company">{companyName}</div>
          </div>
          {!isDesktop && (
            <button
              type="button"
              className="crm-portal-sidebar__close"
              aria-label="Close menu"
              onClick={() => setMobileOpen(false)}
            >
              <FiX />
            </button>
          )}
        </div>

        <nav className="crm-portal-sidebar__nav">
          {navGroups.map((group, idx) => (
            <div key={group.label || `g-${idx}`} className="crm-portal-sidebar__group">
              {group.label && (
                <div className="crm-portal-sidebar__group-label">{group.label}</div>
              )}
              {group.items.map(({ to, label, icon: Icon }) => (
                <NavLink
                  key={`${to}-${label}`}
                  to={to}
                  title={collapsed && isDesktop ? label : undefined}
                  className={({ isActive }) =>
                    `crm-portal-sidebar__link${isActive || isNavActive(location.pathname, to) ? ' crm-portal-sidebar__link--active' : ''}`
                  }
                >
                  <Icon aria-hidden />
                  <span>{label}</span>
                </NavLink>
              ))}
            </div>
          ))}
        </nav>

        {isDesktop && (
          <div className="crm-portal-sidebar__foot">
            <button
              type="button"
              className="crm-portal-sidebar__collapse-btn"
              onClick={() => setCollapsed((v) => !v)}
              aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              aria-expanded={!collapsed}
            >
              {collapsed ? <FiChevronRight /> : <FiChevronLeft />}
              <span>{collapsed ? 'Open' : 'Close'}</span>
            </button>
          </div>
        )}
      </aside>

      {isDesktop && collapsed && (
        <button
          type="button"
          className="crm-portal-sidebar-rail"
          onClick={() => setCollapsed(false)}
          aria-label="Open sidebar"
          title="Open menu"
        >
          <FiChevronRight />
        </button>
      )}

      <div className={mainClass}>
        <PortalHeader
          title={currentPageTitle}
          user={user}
          profileTo={profileTo}
          notifyTo={notifyTo}
          notifyCount={unreadCount}
          portalLabel={portalLabel}
          isDesktop={isDesktop}
          collapsed={collapsed}
          mobileOpen={mobileOpen}
          onToggleSidebar={toggleSidebar}
        />

        <main className="crm-portal-content" data-page-scroll>
          <div className="crm-portal-content__inner">
            <Suspense fallback={<RouteProgress />}>
              <Outlet />
            </Suspense>
          </div>
        </main>
      </div>

      {!isDesktop && (
        <nav className="crm-portal-bottom-nav" aria-label="Quick navigation">
          {bottomNav.filter((item) => !item.isMore).map(({ to, label, icon: Icon, id }) => (
            <NavLink
              key={id}
              to={to}
              className={({ isActive }) =>
                `crm-portal-bottom-nav__link${isActive || isNavActive(location.pathname, to) ? ' crm-portal-bottom-nav__link--active' : ''}`
              }
            >
              <Icon aria-hidden />
              <span>{label}</span>
            </NavLink>
          ))}
          <button
            type="button"
            className={`crm-portal-bottom-nav__link${moreOpen ? ' crm-portal-bottom-nav__link--active' : ''}`}
            onClick={() => setMoreOpen((v) => !v)}
            aria-expanded={moreOpen}
            aria-label="More navigation"
          >
            <FiMoreHorizontal aria-hidden />
            <span>More</span>
          </button>
        </nav>
      )}

      {!isDesktop && moreOpen && (
        <>
          <button
            type="button"
            className="crm-portal-overlay crm-portal-overlay--more"
            aria-label="Close more menu"
            onClick={() => setMoreOpen(false)}
          />
          <div className="crm-portal-more-sheet" role="dialog" aria-label="More pages">
            <div className="crm-portal-more-sheet__head">
              <h2>More</h2>
              <button type="button" className="crm-portal-sidebar__close" aria-label="Close" onClick={() => setMoreOpen(false)}>
                <FiX />
              </button>
            </div>
            <div className="crm-portal-more-sheet__body">
              <div className="crm-portal-quick-actions">
                {navGroups.flatMap((g) => g.items).map(({ to, label, icon: Icon }) => (
                  <Link
                    key={`${to}-${label}`}
                    to={to}
                    className="crm-portal-quick-action"
                    onClick={() => setMoreOpen(false)}
                  >
                    <Icon aria-hidden />
                    {label}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
