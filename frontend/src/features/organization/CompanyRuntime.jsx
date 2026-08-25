import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { selectUser, logoutUser } from '../../redux/slices/authSlice';
import { organizationApi } from '../master/services/organizationApi.service';
import { parseCompanySettings, resolvePublicAssetUrl } from '../../config/company-settings.config';

const CompanyRuntimeContext = createContext({
  company: null,
  settings: parseCompanySettings(null),
  loading: false,
  applyCompany: () => {},
});

function applyFavicon(href) {
  if (typeof document === 'undefined') return;
  let link = document.querySelector("link[rel='icon']");
  if (!href) return;
  if (!link) {
    link = document.createElement('link');
    link.rel = 'icon';
    document.head.appendChild(link);
  }
  link.href = href;
}

function applyBranding(settings, company) {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  if (settings.primaryColour) root.style.setProperty('--color-primary-600', settings.primaryColour);
  if (settings.secondaryColour) root.style.setProperty('--color-primary-700', settings.secondaryColour);
  if (settings.headerColour) root.style.setProperty('--navbar-bg', settings.headerColour);
  if (settings.fontColour) root.style.setProperty('--color-text', settings.fontColour);
  if (settings.favicon) applyFavicon(resolvePublicAssetUrl(settings.favicon));
  if (settings.portalTitle || company?.name) {
    document.title = settings.portalTitle || company.name;
  }
}

export function CompanyRuntimeProvider({ children }) {
  const user = useSelector(selectUser);
  const dispatch = useDispatch();
  const [company, setCompany] = useState(null);
  const [loading, setLoading] = useState(false);
  const idleRef = useRef(null);

  useEffect(() => {
    if (!user?.companyId && !user?.id) {
      setCompany(null);
      return undefined;
    }
    let cancelled = false;
    setLoading(true);
    organizationApi.getCompany()
      .then((data) => { if (!cancelled) setCompany(data); })
      .catch(() => { if (!cancelled) setCompany(null); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [user?.id, user?.companyId]);

  const settings = useMemo(() => parseCompanySettings(company?.settings), [company]);

  useEffect(() => {
    applyBranding(settings, company);
  }, [settings, company]);

  useEffect(() => {
    const minutes = Number(settings.autoLogoutMinutes) || 0;
    if (!user || minutes <= 0) return undefined;
    const ms = minutes * 60 * 1000;
    const bump = () => {
      window.clearTimeout(idleRef.current);
      idleRef.current = window.setTimeout(() => dispatch(logoutUser()), ms);
    };
    const events = ['mousemove', 'keydown', 'click', 'scroll'];
    events.forEach((ev) => window.addEventListener(ev, bump, { passive: true }));
    bump();
    return () => {
      events.forEach((ev) => window.removeEventListener(ev, bump));
      window.clearTimeout(idleRef.current);
    };
  }, [settings.autoLogoutMinutes, user, dispatch]);

  const applyCompany = useCallback((data) => {
    setCompany(data || null);
  }, []);

  const value = useMemo(
    () => ({ company, settings, loading, applyCompany }),
    [company, settings, loading, applyCompany],
  );

  return (
    <CompanyRuntimeContext.Provider value={value}>
      {children}
    </CompanyRuntimeContext.Provider>
  );
}

export function useCompanyRuntime() {
  return useContext(CompanyRuntimeContext);
}

export default CompanyRuntimeProvider;
