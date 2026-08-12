import { useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { selectIsAuthenticated } from '../redux/slices/authSlice';
import { sidebarConfig } from '../config/sidebar.config';
import { filterMenuToPhase1 } from '../config/phase1-sidebar.config';
import { useFeatures } from './useFeature';
import { ROUTES } from '../config/routes';

function applyFeatureFilters(items, flags) {
  return items
    .filter((item) => {
      if (item.feature && !flags[item.feature]) return false;
      if (item.path === ROUTES.COUNSELLOR_QUEUE && !flags['reception.auto_counsellor_assignment']) {
        return false;
      }
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
 * (Dashboard, Masters, Enquiry, Demo, Students, Fees, Reports, Settings).
 * Legacy RBAC DB menus are ignored so old IDs do not wipe the sidebar.
 */
export function useSidebarMenu() {
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const { flags, isLoading: featuresLoading } = useFeatures();
  const [baseMenu, setBaseMenu] = useState(() => filterMenuToPhase1(sidebarConfig));

  useEffect(() => {
    setBaseMenu(filterMenuToPhase1(sidebarConfig));
  }, [isAuthenticated]);

  return useMemo(() => {
    if (featuresLoading) return baseMenu;
    return applyFeatureFilters(baseMenu, flags);
  }, [baseMenu, flags, featuresLoading]);
}
