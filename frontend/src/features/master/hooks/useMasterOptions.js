import { useEffect, useState, useCallback, useMemo } from 'react';
import { apiGet, apiPost } from '../../../api/apiClient';
import { API } from '../../../config/api';
import { VISIT_PURPOSES } from '../../assignment/config/assignment.constants';
import { ENQUIRY_TAGS } from '../../enquiry/config/enquiryTags.config';

const FALLBACK_OPTIONS = {
  'visit-purpose': VISIT_PURPOSES.map((label) => ({ value: label, label })),
  tags: ENQUIRY_TAGS.map(({ value, label }) => ({ value, label })),
};

/** One fetch per master category for the whole page (avoids per-row storms). */
const optionsCache = new Map();
const inflightCache = new Map();

/**
 * Master lookup options for dropdowns (visit-purpose, etc.)
 * Supports creatable values — call ensureOption to persist custom entries.
 */
export function useMasterOptions(category, { enabled = true } = {}) {
  const [options, setOptions] = useState(() => optionsCache.get(category) || []);
  const [loading, setLoading] = useState(() => Boolean(enabled && category && !optionsCache.has(category)));

  const fallback = useMemo(
    () => FALLBACK_OPTIONS[category] || [],
    [category],
  );

  const load = useCallback(async (force = false) => {
    if (!category || !enabled) return;

    if (!force && optionsCache.has(category)) {
      setOptions(optionsCache.get(category));
      setLoading(false);
      return optionsCache.get(category);
    }

    if (!force && inflightCache.has(category)) {
      setLoading(true);
      try {
        const rows = await inflightCache.get(category);
        setOptions(rows);
        return rows;
      } finally {
        setLoading(false);
      }
    }

    setLoading(true);
    const request = (async () => {
      try {
        const res = await apiGet(API.MASTER_OPTIONS(category));
        const rows = res?.data ?? res ?? [];
        const next = Array.isArray(rows) && rows.length ? rows : fallback;
        optionsCache.set(category, next);
        return next;
      } catch {
        const next = optionsCache.get(category) || fallback;
        optionsCache.set(category, next);
        return next;
      } finally {
        inflightCache.delete(category);
      }
    })();
    inflightCache.set(category, request);

    try {
      const rows = await request;
      setOptions(rows);
      return rows;
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
          const next = [...prev, { value: row.value, label: row.label || row.value }];
          optionsCache.set(category, next);
          return next;
        });
      }
      return row?.value || trimmed;
    } catch {
      return trimmed;
    }
  }, [category, options]);

  return { options, loading, reload: () => load(true), ensureOption };
}
