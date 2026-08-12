import { useEffect, useState, useCallback, useMemo } from 'react';
import { apiGet, apiPost } from '../../../api/apiClient';
import { API } from '../../../config/api';
import { VISIT_PURPOSES } from '../../assignment/config/assignment.constants';

const FALLBACK_OPTIONS = {
  'visit-purpose': VISIT_PURPOSES.map((label) => ({ value: label, label })),
};

/**
 * Master lookup options for dropdowns (visit-purpose, etc.)
 * Supports creatable values — call ensureOption to persist custom entries.
 */
export function useMasterOptions(category, { enabled = true } = {}) {
  const [options, setOptions] = useState([]);
  const [loading, setLoading] = useState(false);

  const fallback = useMemo(
    () => FALLBACK_OPTIONS[category] || [],
    [category],
  );

  const load = useCallback(async () => {
    if (!category || !enabled) return;
    setLoading(true);
    try {
      const res = await apiGet(API.MASTER_OPTIONS(category));
      const rows = res?.data ?? res ?? [];
      setOptions(Array.isArray(rows) && rows.length ? rows : fallback);
    } catch {
      setOptions(fallback);
    } finally {
      setLoading(false);
    }
  }, [category, enabled, fallback]);

  useEffect(() => {
    load();
  }, [load]);

  const ensureOption = useCallback(async (label) => {
    const trimmed = label?.trim();
    if (!trimmed || !category) return null;
    const exists = options.some(
      (o) => o.value?.toLowerCase() === trimmed.toLowerCase(),
    );
    if (exists) return trimmed;
    try {
      const res = await apiPost(API.MASTER_OPTIONS(category), { label: trimmed });
      const row = res?.data ?? res;
      if (row?.value) {
        setOptions((prev) => {
          if (prev.some((o) => o.value === row.value)) return prev;
          return [...prev, { value: row.value, label: row.label || row.value }];
        });
      }
      return row?.value || trimmed;
    } catch {
      return trimmed;
    }
  }, [category, options]);

  return { options, loading, reload: load, ensureOption };
}
