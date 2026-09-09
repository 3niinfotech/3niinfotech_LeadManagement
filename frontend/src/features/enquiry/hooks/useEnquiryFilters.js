import { useCallback, useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { DEFAULT_PAGE_SIZE } from '../../../config/constants';
import { setSummaryFilter, setActiveView } from '../redux/enquiryUiSlice';
import { selectEnquiryUi } from '../redux/enquiryUiSlice';
import { useViewingBranchFilter } from '../../../hooks/useViewingBranchFilter';

export function useEnquiryFilters() {
  const dispatch = useDispatch();
  const { activeView, activeSummaryFilter } = useSelector(selectEnquiryUi);
  const [filters, setFilters] = useState({});
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize] = useState(DEFAULT_PAGE_SIZE);
  const {
    branchId: viewingBranchId,
    branchLocked,
    canViewAllBranches,
  } = useViewingBranchFilter();

  // Force page branch filter to match navbar Active Branch
  useEffect(() => {
    setFilters((prev) => {
      const nextId = viewingBranchId || undefined;
      if ((prev.branchId || undefined) === nextId) return prev;
      return { ...prev, branchId: nextId };
    });
    setPage(1);
  }, [viewingBranchId]);

  const queryParams = useMemo(() => {
    let status = filters.status || undefined;
    let statusIn;
    let view = activeView === 'all' ? undefined : activeView;

    if (activeSummaryFilter === '__demo') {
      status = undefined;
      statusIn = 'DEMO_SCHEDULED,DEMO_ATTENDED';
      view = undefined;
    } else if (activeSummaryFilter) {
      status = activeSummaryFilter;
    }

    const effectiveBranchId = branchLocked
      ? (viewingBranchId || undefined)
      : (filters.branchId || viewingBranchId || undefined);

    return {
      page,
      limit: pageSize,
      view,
      status,
      statusIn,
      priority: filters.priority || undefined,
      tag: filters.tag || undefined,
      search: search || undefined,
      keyword: filters.keyword || undefined,
      enquiryId: filters.enquiryId || undefined,
      country: filters.country || undefined,
      branchId: effectiveBranchId,
      staffId: filters.staffId || undefined,
      source: filters.source || undefined,
      otherReference: filters.otherReference || undefined,
      applyLevel: filters.applyLevel || undefined,
      intake: filters.intake || undefined,
      course: filters.course || undefined,
      createdFrom: filters.createdFrom || undefined,
      createdTo: filters.createdTo || undefined,
      updatedFrom: filters.updatedFrom || undefined,
      updatedTo: filters.updatedTo || undefined,
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
    dispatch(setSummaryFilter(null));
    dispatch(setActiveView('all'));
  }, [dispatch, branchLocked, viewingBranchId]);

  const selectSummaryCard = useCallback((filterValue) => {
    if (filterValue === '__closed') {
      dispatch(setActiveView('closed'));
      dispatch(setSummaryFilter(null));
    } else if (filterValue === '__demo') {
      dispatch(setActiveView('all'));
      dispatch(setSummaryFilter('__demo'));
    } else if (filterValue == null) {
      dispatch(setActiveView('all'));
      dispatch(setSummaryFilter(null));
    } else {
      dispatch(setActiveView('all'));
      dispatch(setSummaryFilter(filterValue));
    }
    setPage(1);
  }, [dispatch]);

  return {
    queryParams, search, setSearch, page, setPage, pageSize,
    filters, applyFilters, resetFilters, selectSummaryCard,
    activeView, activeSummaryFilter,
    branchLocked,
    canViewAllBranches,
  };
}
