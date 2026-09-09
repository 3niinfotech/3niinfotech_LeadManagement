import { useEffect, useState } from 'react';
import { useGetViewingBranchQuery } from '../features/organization/redux/organizationApiSlice';
import { onViewingBranchChanged } from '../config/viewingBranch.events';

/**
 * Keep local page branch filters in lockstep with navbar Active Branch.
 * When Active Branch is set, page branch filters should show that branch and stay locked.
 */
export function useViewingBranchFilter(initialBranchId = '') {
  const { data: viewing } = useGetViewingBranchQuery();
  const viewingBranchId = viewing?.viewingBranchId || '';
  const [branchId, setBranchId] = useState(initialBranchId || viewingBranchId || '');

  useEffect(() => {
    setBranchId(viewingBranchId || '');
  }, [viewingBranchId]);

  useEffect(() => onViewingBranchChanged((detail) => {
    setBranchId(detail?.viewingBranchId || '');
  }), []);

  const branchLocked = Boolean(viewing?.canSwitch && viewingBranchId);
  const effectiveBranchId = branchId || viewingBranchId || '';

  return {
    branchId: effectiveBranchId,
    setBranchId,
    branchLocked,
    viewingBranchId,
    canViewAllBranches: Boolean(viewing?.canViewAll),
    canSwitch: Boolean(viewing?.canSwitch),
  };
}
