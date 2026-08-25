import { useCallback, useEffect, useState } from 'react';
import { masterApi } from '../services/masterApi.service';
import { apiGet } from '../../../api/apiClient';
import { API } from '../../../config/api';

const optionsCache = new Map();
const inflightCache = new Map();

/**
 * Relational master options (always source=relational).
 * Independent from useMasterOptions (MasterItem / legacy).
 */
export function useRelationalMasterOptions(entity, params = {}, { enabled = true } = {}) {
  const paramsKey = JSON.stringify(params || {});
  const cacheKey = `${entity}::${paramsKey}`;
  const [options, setOptions] = useState(() => optionsCache.get(cacheKey) || []);
  const [loading, setLoading] = useState(() => Boolean(enabled && entity && !optionsCache.has(cacheKey)));

  const load = useCallback(async (force = false) => {
    if (!entity || !enabled) {
      setOptions([]);
      return;
    }

    if (!force && optionsCache.has(cacheKey)) {
      setOptions(optionsCache.get(cacheKey));
      setLoading(false);
      return optionsCache.get(cacheKey);
    }

    if (!force && inflightCache.has(cacheKey)) {
      setLoading(true);
      try {
        const rows = await inflightCache.get(cacheKey);
        setOptions(rows);
        return rows;
      } finally {
        setLoading(false);
      }
    }

    setLoading(true);
    const request = (async () => {
      try {
        const parsed = JSON.parse(paramsKey);
        const res = await masterApi.options(entity, { limit: 80, ...parsed });
        const rows = res?.data ?? res ?? [];
        const next = Array.isArray(rows) ? rows : [];
        optionsCache.set(cacheKey, next);
        return next;
      } catch {
        const next = optionsCache.get(cacheKey) || [];
        optionsCache.set(cacheKey, next);
        return next;
      } finally {
        inflightCache.delete(cacheKey);
      }
    })();
    inflightCache.set(cacheKey, request);

    try {
      const rows = await request;
      setOptions(rows);
      return rows;
    } finally {
      setLoading(false);
    }
  }, [entity, enabled, paramsKey, cacheKey]);

  useEffect(() => {
    load();
  }, [load]);

  return { options, loading, reload: () => load(true) };
}

/** Company branches for Department.branchId (Organization module not in engine yet). */
export function useBranchOptions({ enabled = true } = {}) {
  const [options, setOptions] = useState([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (!enabled) return;
    setLoading(true);
    try {
      const res = await apiGet(API.ENQUIRIES_BRANCHES);
      const rows = res?.data ?? res ?? [];
      setOptions(
        (Array.isArray(rows) ? rows : []).map((b) => ({
          value: b.id,
          label: b.name || b.code || b.id,
        })),
      );
    } catch {
      try {
        const res = await apiGet(API.WALK_IN_BRANCHES);
        const rows = res?.data ?? res ?? [];
        setOptions(
          (Array.isArray(rows) ? rows : []).map((b) => ({
            value: b.id,
            label: b.name || b.code || b.id,
          })),
        );
      } catch {
        setOptions([]);
      }
    } finally {
      setLoading(false);
    }
  }, [enabled]);

  useEffect(() => {
    load();
  }, [load]);

  return { options, loading, reload: load };
}
