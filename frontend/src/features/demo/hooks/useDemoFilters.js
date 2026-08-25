import { useCallback, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { DEFAULT_PAGE_SIZE } from '../../../config/constants';
import {
  selectDemoUi,
  setDemoSummaryFilter,
  setActiveDemoView,
} from '../redux/demoUiSlice';

export function useDemoFilters() {
  const dispatch = useDispatch();
  const { activeView, activeSummaryFilter } = useSelector(selectDemoUi);
  const [filters, setFilters] = useState({});
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize] = useState(DEFAULT_PAGE_SIZE || 25);

  const queryParams = useMemo(() => {
    let sessionStatus = filters.sessionStatus || undefined;
    let attendance = filters.attendance || undefined;
    let result = filters.result || undefined;
    let view = activeView === 'all' ? undefined : activeView;

    // Handle Summary Filter overrides
    if (activeSummaryFilter === '__today') {
      view = 'today';
    } else if (activeSummaryFilter === '__scheduled') {
      sessionStatus = 'SCHEDULED';
      view = undefined;
    } else if (activeSummaryFilter === '__attended') {
      attendance = 'ATTENDED';
      view = undefined;
    } else if (activeSummaryFilter === '__converted') {
      result = 'CONVERTED';
      view = undefined;
    } else if (activeSummaryFilter === '__missed') {
      attendance = 'ABSENT';
      view = undefined;
    } else if (activeSummaryFilter === '__pendingOutcome') {
      attendance = 'ATTENDED';
      result = 'PENDING';
      view = undefined;
    }

    return {
      page,
      limit: pageSize,
      view,
      sessionStatus,
      attendance,
      result,
      search: search || undefined,
      facultyId: filters.facultyId || undefined,
      branchId: filters.branchId || undefined,
      course: filters.course || filters.className || undefined,
      from: filters.from || undefined,
      to: filters.to || undefined,
    };
  }, [page, pageSize, activeView, activeSummaryFilter, search, filters]);

  const applyFilters = useCallback((next) => {
    setFilters(next);
    setPage(1);
  }, []);

  const resetFilters = useCallback(() => {
    setFilters({});
    setSearch('');
    setPage(1);
    dispatch(setDemoSummaryFilter(null));
    dispatch(setActiveDemoView('all'));
  }, [dispatch]);

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
  };
}
