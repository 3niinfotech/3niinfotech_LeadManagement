import { useCallback, useEffect, useRef, useState } from 'react';
import { masterApi, getApiErrorMessage } from '../services/masterApi.service';

const DEFAULT_PAGE_SIZE = 25;

/**
 * Server-driven list state for relational masters.
 */
export function useMasterList(entity, { enabled = true, defaultSort = 'sortOrder', defaultSortDirection = 'asc', initialFilters = {} } = {}) {
  const [rows, setRows] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: DEFAULT_PAGE_SIZE,
    total: 0,
    totalPages: 0,
  });
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const initialKey = JSON.stringify(initialFilters || {});
  const [filters, setFilters] = useState({ status: 'all', ...initialFilters });
  const [sort, setSort] = useState(defaultSort);
  const [sortDirection, setSortDirection] = useState(defaultSortDirection);
  const [loading, setLoading] = useState(Boolean(entity && enabled));
  const [fetching, setFetching] = useState(false);
  const [error, setError] = useState(null);
  const requestId = useRef(0);
  const hasLoaded = useRef(false);

  useEffect(() => {
    hasLoaded.current = false;
    setRows([]);
    setLoading(Boolean(entity && enabled));
    setFetching(false);
    setError(null);
    setPagination((p) => ({ ...p, page: 1, total: 0, totalPages: 0 }));
    setSearch('');
    setDebouncedSearch('');
    setFilters({ status: 'all', ...JSON.parse(initialKey) });
    setSort(defaultSort);
    setSortDirection(defaultSortDirection);
  }, [entity, enabled, defaultSort, defaultSortDirection, initialKey]);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search.trim()), 300);
    return () => clearTimeout(t);
  }, [search]);

  const load = useCallback(async () => {
    if (!entity || !enabled) return;
    const id = ++requestId.current;
    const isFirst = !hasLoaded.current;
    if (isFirst) setLoading(true);
    else setFetching(true);
    setError(null);

    try {
      const params = {
        page: pagination.page,
        pageSize: pagination.limit,
        search: debouncedSearch || undefined,
        sort,
        sortDirection,
      };

      Object.entries(filters || {}).forEach(([key, value]) => {
        if (value === undefined || value === null || value === '' || value === 'all') return;
        params[key] = value;
      });

      const res = await masterApi.list(entity, params);
      if (id !== requestId.current) return;
      setRows(Array.isArray(res?.data) ? res.data : []);
      setPagination((prev) => ({
        ...prev,
        ...(res?.pagination || {}),
        page: res?.pagination?.page || prev.page,
        limit: res?.pagination?.limit || prev.limit,
        total: res?.pagination?.total ?? 0,
        totalPages: res?.pagination?.totalPages ?? 0,
      }));
      hasLoaded.current = true;
    } catch (err) {
      if (id !== requestId.current) return;
      setError(getApiErrorMessage(err, 'Failed to load master records'));
      setRows([]);
    } finally {
      if (id === requestId.current) {
        setLoading(false);
        setFetching(false);
      }
    }
  }, [entity, enabled, pagination.page, pagination.limit, debouncedSearch, filters, sort, sortDirection]);

  useEffect(() => {
    load();
  }, [load]);

  // Reset page when search/filters/sort change
  const setSearchAndReset = useCallback((value) => {
    setSearch(value);
    setPagination((p) => ({ ...p, page: 1 }));
  }, []);

  const applyFilters = useCallback((next) => {
    setFilters(next);
    setPagination((p) => ({ ...p, page: 1 }));
  }, []);

  const setPage = useCallback((page) => {
    setPagination((p) => ({ ...p, page }));
  }, []);

  const setPageSize = useCallback((limit) => {
    setPagination((p) => ({ ...p, limit: Math.min(100, Math.max(1, limit)), page: 1 }));
  }, []);

  const setSortState = useCallback((field, direction = 'asc') => {
    setSort(field);
    setSortDirection(direction);
    setPagination((p) => ({ ...p, page: 1 }));
  }, []);

  return {
    rows,
    pagination,
    search,
    setSearch: setSearchAndReset,
    filters,
    applyFilters,
    sort,
    sortDirection,
    setSortState,
    setPage,
    setPageSize,
    loading,
    fetching,
    error,
    reload: load,
    hasSearchOrFilters: Boolean(debouncedSearch) || Object.entries(filters).some(([k, v]) => {
      if (k === 'status') return v && v !== 'all';
      return v !== undefined && v !== null && v !== '';
    }),
  };
}
