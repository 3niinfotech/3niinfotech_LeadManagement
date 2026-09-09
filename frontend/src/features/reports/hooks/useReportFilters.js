import { useCallback, useEffect, useMemo, useState } from 'react';
import { resolveReportDateRange } from '../config/reports.config';
import { useGetViewingBranchQuery } from '../../organization/redux/organizationApiSlice';
import { onViewingBranchChanged } from '../../../config/viewingBranch.events';

/** Shared report filters — drives backend query params + follows Active Branch. */
export function useReportFilters(defaultPreset = 'this_month') {
  const { data: viewing } = useGetViewingBranchQuery();
  const viewingBranchId = viewing?.viewingBranchId || '';

  const [preset, setPreset] = useState(defaultPreset);
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');
  const [branchId, setBranchId] = useState(viewingBranchId || '');
  const [refreshKey, setRefreshKey] = useState(0);

  // Force sync page branch filter with navbar Active Branch
  useEffect(() => {
    setBranchId(viewingBranchId || '');
  }, [viewingBranchId]);

  useEffect(() => onViewingBranchChanged((detail) => {
    setBranchId(detail?.viewingBranchId || '');
    setRefreshKey((n) => n + 1);
  }), []);

  const range = useMemo(
    () => resolveReportDateRange(preset, { from: customFrom, to: customTo }),
    [preset, customFrom, customTo],
  );

  const queryParams = useMemo(() => {
    const params = {};
    if (range.from) params.from = range.from;
    if (range.to) params.to = range.to;
    // Prefer explicit filter; fall back to viewing branch (server also clamps)
    const effectiveBranch = branchId || viewingBranchId;
    if (effectiveBranch) params.branchId = effectiveBranch;
    return params;
  }, [range, branchId, viewingBranchId]);

  const refresh = useCallback(() => setRefreshKey((n) => n + 1), []);

  const branchLocked = Boolean(viewing?.canSwitch && viewingBranchId);

  return {
    preset,
    setPreset,
    customFrom,
    setCustomFrom,
    customTo,
    setCustomTo,
    branchId,
    setBranchId,
    branchLocked,
    viewingBranchId,
    canViewAllBranches: Boolean(viewing?.canViewAll),
    range,
    queryParams,
    refreshKey,
    refresh,
  };
}
