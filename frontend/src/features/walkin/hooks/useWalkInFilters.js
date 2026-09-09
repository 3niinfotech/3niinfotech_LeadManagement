import { useCallback, useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { DEFAULT_PAGE_SIZE } from '../../../config/constants';
import { setWalkInSummaryFilter, setWalkInActiveView } from '../redux/walkinUiSlice';
import { selectWalkInUi } from '../redux/walkinUiSlice';
import { useViewingBranchFilter } from '../../../hooks/useViewingBranchFilter';

export function useWalkInFilters() {
  const dispatch = useDispatch();
  const { activeView, activeSummaryFilter } = useSelector(selectWalkInUi);
  const [filters, setFilters] = useState({});
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize] = useState(DEFAULT_PAGE_SIZE);
  const {
    branchId: viewingBranchId,
    branchLocked,
    canViewAllBranches,
  } = useViewingBranchFilter();

  useEffect(() => {
    setFilters((prev) => {
      const nextId = viewingBranchId || undefined;
      if ((prev.branchId || undefined) === nextId) return prev;
      return { ...prev, branchId: nextId };
    });
    setPage(1);
  }, [viewingBranchId]);

  const queryParams = useMemo(() => {
    const effectiveBranchId = branchLocked
      ? (viewingBranchId || undefined)
      : (filters.branchId || viewingBranchId || undefined);

    return {
      page,
      limit: pageSize,
      view: activeView === 'all' ? undefined : activeView,
      status: filters.status || undefined,
      priority: filters.priority || undefined,
      search: search || undefined,
      branchId: effectiveBranchId,
      assignedToId: filters.assignedToId || undefined,
    };
  }, [page, pageSize, activeView, search, filters, branchLocked, viewingBranchId]);

  const applyFilters = useCallback((next) => {
    const patched = branchLocked
      ? { ...next, branchId: viewingBranchId || undefined }
      : next;
    setFilters(patched);
    setPage(1);
  }, [branchLocked, viewingBranchId]);

  const resetFilters = useCallback(() => {
    setFilters(branchLocked ? { branchId: viewingBranchId || undefined } : {});
    setSearch('');
    setPage(1);
    dispatch(setWalkInSummaryFilter(null));
    dispatch(setWalkInActiveView('today'));
  }, [dispatch, branchLocked, viewingBranchId]);

  const selectSummaryCard = useCallback((filterValue) => {
    const nextView = filterValue === 'waiting' ? 'unassigned' : (filterValue || 'today');
    dispatch(setWalkInActiveView(nextView));
    dispatch(setWalkInSummaryFilter(null));
    setPage(1);
  }, [dispatch]);

  useEffect(() => {
    if (activeView === 'waiting') {
      dispatch(setWalkInActiveView('unassigned'));
    }
  }, [activeView, dispatch]);

  return {
    queryParams, search, setSearch, page, setPage, pageSize,
    filters, applyFilters, resetFilters, selectSummaryCard,
    activeView, activeSummaryFilter,
    branchLocked,
    canViewAllBranches,
  };
}
