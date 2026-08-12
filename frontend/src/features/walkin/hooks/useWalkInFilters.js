import { useCallback, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { DEFAULT_PAGE_SIZE } from '../../../config/constants';
import { setWalkInSummaryFilter, setWalkInActiveView } from '../redux/walkinUiSlice';
import { selectWalkInUi } from '../redux/walkinUiSlice';

export function useWalkInFilters() {
  const dispatch = useDispatch();
  const { activeView, activeSummaryFilter } = useSelector(selectWalkInUi);
  const [filters, setFilters] = useState({});
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize] = useState(DEFAULT_PAGE_SIZE);

  const queryParams = useMemo(() => ({
    page,
    limit: pageSize,
    view: activeView === 'all' ? undefined : activeView,
    status: activeSummaryFilter || filters.status || undefined,
    priority: filters.priority || undefined,
    search: search || undefined,
    branchId: filters.branchId || undefined,
    assignedToId: filters.assignedToId || undefined,
  }), [page, pageSize, activeView, activeSummaryFilter, search, filters]);

  const applyFilters = useCallback((next) => {
    setFilters(next);
    setPage(1);
  }, []);

  const resetFilters = useCallback(() => {
    setFilters({});
    setSearch('');
    setPage(1);
    dispatch(setWalkInSummaryFilter(null));
    dispatch(setWalkInActiveView('all'));
  }, [dispatch]);

  const selectSummaryCard = useCallback((filterValue) => {
    if (['today', 'waiting', 'in_counselling', 'completed', 'cancelled', 'appointment'].includes(filterValue)) {
      dispatch(setWalkInActiveView(filterValue === 'today' ? 'today' : 'all'));
      dispatch(setWalkInSummaryFilter(
        ['WAITING', 'IN_COUNSELLING', 'COMPLETED', 'CANCELLED', 'APPOINTMENT'].includes(filterValue)
          ? filterValue
          : null,
      ));
    } else {
      dispatch(setWalkInSummaryFilter(filterValue));
    }
    setPage(1);
  }, [dispatch]);

  return {
    queryParams, search, setSearch, page, setPage, pageSize,
    filters, applyFilters, resetFilters, selectSummaryCard,
    activeView, activeSummaryFilter,
  };
}
