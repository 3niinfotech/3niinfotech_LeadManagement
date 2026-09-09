import { useCallback, useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { DEFAULT_PAGE_SIZE } from '../../../config/constants';
import {
  selectDemoUi,
  setDemoSummaryFilter,
  setActiveDemoView,
} from '../redux/demoUiSlice';
import { useViewingBranchFilter } from '../../../hooks/useViewingBranchFilter';

export function useDemoFilters() {
  const dispatch = useDispatch();
  const { activeView, activeSummaryFilter } = useSelector(selectDemoUi);
  const [filters, setFilters] = useState({});
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize] = useState(DEFAULT_PAGE_SIZE || 25);
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
    let sessionStatus = filters.sessionStatus || undefined;
    let attendance = filters.attendance || undefined;
    let result = filters.result || undefined;
    let view = activeView === 'all' ? undefined : activeView;

    if (activeSummaryFilter === '__today') {
      view = 'today';
    } else if (activeSummaryFilter === '__scheduled') {
      sessionStatus = 'SCHEDULED';
      view = undefined;
    } else if (activeSummaryFilter === '__attended') {
      attendance = 'PRESENT';
      view = undefined;
    } else if (activeSummaryFilter === '__converted') {
      result = 'CONVERTED';
      view = undefined;
    } else if (activeSummaryFilter === '__missed') {
      attendance = 'ABSENT';
      view = undefined;
    } else if (activeSummaryFilter === '__notMarked') {
      attendance = 'NOT_MARKED';
      view = undefined;
    } else if (activeSummaryFilter === '__pendingOutcome') {
      attendance = 'PRESENT';
      result = 'PENDING';
      view = undefined;
    }

    const effectiveBranchId = branchLocked
      ? (viewingBranchId || undefined)
      : (filters.branchId || viewingBranchId || undefined);

    return {
      page,
      limit: pageSize,
      view,
      sessionStatus,
      attendance,
      result,
      search: search || undefined,
      facultyId: filters.facultyId || undefined,
      branchId: effectiveBranchId,
      course: filters.course || filters.className || undefined,
      from: filters.from || undefined,
      to: filters.to || undefined,
    };
  }, [page, pageSize, activeView, activeSummaryFilter, search, filters, branchLocked, viewingBranchId]);

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
    dispatch(setDemoSummaryFilter(null));
    dispatch(setActiveDemoView('all'));
  }, [dispatch, branchLocked, viewingBranchId]);

  const selectSummaryCard = useCallback((filterValue) => {
    if (filterValue == null) {
      dispatch(setActiveDemoView('all'));
      dispatch(setDemoSummaryFilter(null));
    } else if (filterValue === '__today') {
      dispatch(setActiveDemoView('today'));
      dispatch(setDemoSummaryFilter('__today'));
    } else {
      dispatch(setActiveDemoView('all'));
      dispatch(setDemoSummaryFilter(filterValue));
    }
    setPage(1);
  }, [dispatch]);

  return {
    queryParams,
    search,
    setSearch,
    page,
    setPage,
    pageSize,
    filters,
    applyFilters,
    resetFilters,
    selectSummaryCard,
    activeView,
    activeSummaryFilter,
    branchLocked,
    canViewAllBranches,
  };
}
