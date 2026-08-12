import { useCallback, useEffect, useState } from 'react';
import { masterApi } from '../services/masterApi.service';
import { apiGet } from '../../../api/apiClient';
import { API } from '../../../config/api';

/**
 * Relational master options (always source=relational).
 * Independent from useMasterOptions (MasterItem / legacy).
 */
export function useRelationalMasterOptions(entity, params = {}, { enabled = true } = {}) {
  const [options, setOptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const paramsKey = JSON.stringify(params || {});

  const load = useCallback(async () => {
    if (!entity || !enabled) {
      setOptions([]);
      return;
    }
    setLoading(true);
    try {
      const parsed = JSON.parse(paramsKey);
      const res = await masterApi.options(entity, parsed);
      const rows = res?.data ?? res ?? [];
      setOptions(Array.isArray(rows) ? rows : []);
    } catch {
      setOptions([]);
    } finally {
      setLoading(false);
    }
  }, [entity, enabled, paramsKey]);

  useEffect(() => {
    load();
  }, [load]);

  return { options, loading, reload: load };
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
