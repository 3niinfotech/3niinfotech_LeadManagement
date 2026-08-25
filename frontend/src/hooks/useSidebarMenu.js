import { useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { selectIsAuthenticated, selectUser } from '../redux/slices/authSlice';
import { sidebarConfig } from '../config/sidebar.config';
import { filterMenuToPhase1 } from '../config/phase1-sidebar.config';
import { applyRoleNavLabels } from '../config/role-workspace.config';
import { useFeatures } from './useFeature';

function applyFeatureFilters(items, flags) {
  return items
    .filter((item) => {
      if (item.feature && !flags[item.feature]) return false;
      return true;
    })
    .map((item) => ({
      ...item,
      children: item.children ? applyFeatureFilters(item.children, flags) : undefined,
    }))
    .filter((item) => !item.children || item.children.length > 0);
}

/**
 * Phase 1 uses the static sidebar config as source of truth
 * (Dashboard, Masters, Reception, Enquiry, Calendar, Demo, Students, Fees, Reports, Settings).
 * Legacy RBAC DB menus are ignored so old IDs do not wipe the sidebar.
 */
export function useSidebarMenu() {
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const roleSlug = useSelector(selectUser)?.role?.slug;
  const { flags, isLoading: featuresLoading } = useFeatures();
  const [baseMenu, setBaseMenu] = useState(() => filterMenuToPhase1(sidebarConfig));

  useEffect(() => {
    setBaseMenu(filterMenuToPhase1(sidebarConfig));
  }, [isAuthenticated]);

  return useMemo(() => {
    const withFlags = featuresLoading ? baseMenu : applyFeatureFilters(baseMenu, flags);
    return applyRoleNavLabels(withFlags, roleSlug);
  }, [baseMenu, flags, featuresLoading, roleSlug]);
}
