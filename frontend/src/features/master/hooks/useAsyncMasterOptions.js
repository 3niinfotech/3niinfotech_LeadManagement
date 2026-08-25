import { useCallback, useEffect, useRef, useState } from 'react';
import { masterApi } from '../services/masterApi.service';

/**
 * Debounced server-side master options for large datasets (Course, University).
 * Never loads the full table into the client.
 */
export function useAsyncMasterOptions(entity, extraParams = {}, { enabled = true, limit = 40 } = {}) {
  const [options, setOptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const timerRef = useRef(null);
  const paramsKey = JSON.stringify(extraParams || {});

  const load = useCallback(async (term) => {
    if (!entity || !enabled) {
      setOptions([]);
      return;
    }
    setLoading(true);
    try {
      const parsed = JSON.parse(paramsKey);
      const res = await masterApi.options(entity, {
        ...parsed,
        search: term || undefined,
        limit,
      });
      const rows = res?.data ?? res ?? [];
      setOptions(Array.isArray(rows) ? rows : []);
    } catch {
      setOptions([]);
    } finally {
      setLoading(false);
    }
  }, [entity, enabled, paramsKey, limit]);

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      load(search.trim());
    }, 250);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [search, load]);

  return {
    options,
    loading,
    search,
    setSearch,
    reload: () => load(search.trim()),
  };
}

export default useAsyncMasterOptions;
