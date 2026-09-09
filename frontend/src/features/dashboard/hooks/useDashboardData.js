import { useCallback, useEffect, useState } from 'react';
import { apiGet } from '../../../api/apiClient';
import { API } from '../../../config/api';
import { useReportFilters } from '../../reports/hooks/useReportFilters';

const LOAD_TIMEOUT_MS = 20000;

function withTimeout(promise, ms) {
  return Promise.race([
    promise,
    new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Request timed out')), ms);
    }),
  ]);
}

export function useDashboardData(defaultPreset = 'this_month') {
  const filters = useReportFilters(defaultPreset);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await withTimeout(
        apiGet(API.DASHBOARD_ANALYTICS, filters.queryParams),
        LOAD_TIMEOUT_MS,
      );
      setData(res?.data || null);
    } catch (e) {
      setData(null);
      setError(e?.message || 'Unable to load dashboard');
    } finally {
      setLoading(false);
    }
  }, [filters.queryParams]);

  useEffect(() => {
    load();
  }, [load, filters.refreshKey]);

  return {
    data,
    loading,
    error,
    reload: load,
    filters,
  };
}
