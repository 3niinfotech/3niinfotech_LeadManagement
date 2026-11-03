import { useCallback, useEffect, useRef, useState } from 'react';
import { apiGet } from '../../../api/apiClient';
import { API } from '../../../config/api';
import { useReportFilters } from '../../reports/hooks/useReportFilters';

const LOAD_TIMEOUT_MS = 20000;
const AUTO_SYNC_INTERVAL_MS = 30000;

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
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [lastUpdated, setLastUpdated] = useState(null);
  const debounceRef = useRef(null);
  const isMountedRef = useRef(true);

  const load = useCallback(async (silent = false) => {
    if (!silent) {
      setLoading(true);
      setError('');
    } else {
      setRefreshing(true);
    }

    try {
      const res = await withTimeout(
        apiGet(API.DASHBOARD_ANALYTICS, filters.queryParams),
        LOAD_TIMEOUT_MS,
      );
      if (!isMountedRef.current) return;
      if (res?.data) {
        setData(res.data);
        setLastUpdated(new Date());
        setError('');
      }
    } catch (e) {
      if (!isMountedRef.current) return;
      if (!silent) {
        setError(e?.message || 'Unable to load dashboard');
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  }, [filters.queryParams]);

  // Initial & filter change load
  useEffect(() => {
    load(false);
  }, [load, filters.refreshKey]);

  // Real-time socket & window event listeners
  useEffect(() => {
    isMountedRef.current = true;

    const handleRealtimeUpdate = () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        if (isMountedRef.current && document.visibilityState === 'visible') {
          load(true);
        }
      }, 1000);
    };

    const handleFocus = () => {
      if (document.visibilityState === 'visible') {
        load(true);
      }
    };

    window.addEventListener('crm-dashboard-update', handleRealtimeUpdate);
    window.addEventListener('visibilitychange', handleFocus);
    window.addEventListener('focus', handleFocus);

    // Periodic live background sync
    const autoSyncTimer = setInterval(() => {
      if (document.visibilityState === 'visible') {
        load(true);
      }
    }, AUTO_SYNC_INTERVAL_MS);

    return () => {
      isMountedRef.current = false;
      if (debounceRef.current) clearTimeout(debounceRef.current);
      clearInterval(autoSyncTimer);
      window.removeEventListener('crm-dashboard-update', handleRealtimeUpdate);
      window.removeEventListener('visibilitychange', handleFocus);
      window.removeEventListener('focus', handleFocus);
    };
  }, [load]);

  return {
    data,
    loading,
    refreshing,
    error,
    lastUpdated,
    isLive: true,
    reload: () => load(false),
    filters,
  };
}
