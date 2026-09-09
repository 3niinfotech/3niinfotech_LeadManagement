import { useCallback, useMemo, useState } from 'react';
import { DEFAULT_PAGE_SIZE } from '../../../config/constants';

export function useVisaFilters() {
  const [filters, setFilters] = useState({});
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE || 25);
  const [activeSummaryFilter, setActiveSummaryFilter] = useState(null);

  const queryParams = useMemo(() => {
    let status = filters.status || undefined;
    let statusGroup;

    if (activeSummaryFilter === '__pending') {
      status = undefined;
      statusGroup = 'pending';
    } else if (activeSummaryFilter === '__approved') {
      status = undefined;
      statusGroup = 'approved';
    } else if (activeSummaryFilter === '__rejected') {
      status = undefined;
      statusGroup = 'rejected';
    } else if (activeSummaryFilter && !activeSummaryFilter.startsWith('__')) {
      status = activeSummaryFilter;
    }

    return {
      page,
      limit: pageSize,
      search: search || undefined,
      countryId: filters.countryId || undefined,
      studentId: filters.studentId || undefined,
      status,
      statusGroup,
      sortBy: filters.sortBy || 'createdAt',
      sortOrder: filters.sortOrder || 'desc',
    };
  }, [page, pageSize, search, filters, activeSummaryFilter]);

  const summaryParams = useMemo(() => {
    const { status, statusGroup, page: _p, limit: _l, sortBy, sortOrder, ...rest } = queryParams;
    return rest;
  }, [queryParams]);

  const applyFilters = useCallback((next) => {
    setFilters(next);
    setPage(1);
  }, []);

  const resetFilters = useCallback(() => {
    setFilters({});
    setSearch('');
    setPage(1);
    setActiveSummaryFilter(null);
  }, []);

  const selectSummaryCard = useCallback((filterValue) => {
    setActiveSummaryFilter((prev) => (prev === filterValue ? null : filterValue));
    setPage(1);
  }, []);

  return {
    queryParams,
    summaryParams,
    search,
    setSearch,
    page,
    setPage,
    pageSize,
    setPageSize,
    filters,
    applyFilters,
    resetFilters,
    selectSummaryCard,
    activeSummaryFilter,
  };
}
