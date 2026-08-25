import { useCallback, useEffect, useMemo, useState } from 'react';
import { ENQUIRY_STATUSES } from '../../../config/constants';
import { masterApi } from '../../master/services/masterApi.service';

const VALID_CODES = new Set(ENQUIRY_STATUSES.map((s) => s.value));

/** Shared across all grid pills — prevents N× API storm on view/tab changes. */
let cachedWorkflow = null;
let inflight = null;

function toStatusOption(row) {
  const fallback = ENQUIRY_STATUSES.find((s) => s.value === row.value);
  return {
    value: row.value,
    label: row.label,
    color: row.colorCode || fallback?.color || 'info',
    defaultStatus: row.defaultStatus,
  };
}

/**
 * Enquiry statuses from lead-status master (code must match EnquiryStatus enum).
 */
export function useEnquiryStatusOptions() {
  const [workflow, setWorkflow] = useState(() => cachedWorkflow || []);
  const [loading, setLoading] = useState(() => !cachedWorkflow);

  const load = useCallback(async (force = false) => {
    if (!force && cachedWorkflow) {
      setWorkflow(cachedWorkflow);
      setLoading(false);
      return cachedWorkflow;
    }

    if (!force && inflight) {
      setLoading(true);
      try {
        const rows = await inflight;
        setWorkflow(rows);
        return rows;
      } finally {
        setLoading(false);
      }
    }

    setLoading(true);
    inflight = (async () => {
      try {
        const res = await masterApi.leadStatusWorkflow();
        const rows = Array.isArray(res?.data) ? res.data : (res || []);
        cachedWorkflow = rows;
        return rows;
      } catch {
        cachedWorkflow = cachedWorkflow || [];
        return cachedWorkflow;
      } finally {
        inflight = null;
      }
    })();

    try {
      const rows = await inflight;
      setWorkflow(rows);
      return rows;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const statusOptions = useMemo(() => {
    if (!workflow.length) {
      return ENQUIRY_STATUSES.map(({ value, label, color }) => ({ value, label, color }));
    }
    return workflow
      .filter((s) => VALID_CODES.has(s.value))
      .map(toStatusOption);
  }, [workflow]);

  const getStatusMeta = useCallback(
    (value) => statusOptions.find((s) => s.value === value)
      || ENQUIRY_STATUSES.find((s) => s.value === value),
    [statusOptions],
  );

  return { statusOptions, getStatusMeta, loading, reload: () => load(true) };
}
