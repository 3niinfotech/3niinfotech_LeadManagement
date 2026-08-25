import { useCallback, useEffect, useMemo, useState } from 'react';
import { STUDENT_STATUSES } from '../../../config/constants';
import { masterApi } from '../../master/services/masterApi.service';

const VALID_CODES = new Set(STUDENT_STATUSES.map((s) => s.value));

function toStatusOption(row) {
  const fallback = STUDENT_STATUSES.find((s) => s.value === row.value);
  return {
    value: row.value,
    label: row.label,
    color: row.colorCode || fallback?.color || 'info',
    defaultStatus: row.defaultStatus,
  };
}

function resolvePillStyle(colorCode) {
  if (!colorCode) return null;
  if (colorCode.startsWith('#')) {
    return {
      style: {
        backgroundColor: `${colorCode}18`,
        color: colorCode,
        borderColor: `${colorCode}33`,
      },
      className: 'border',
    };
  }
  return null;
}

/**
 * Student statuses from student-status-master (code must match StudentStatus enum).
 */
export function useStudentStatusOptions() {
  const [workflow, setWorkflow] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await masterApi.studentStatusWorkflow();
      const rows = Array.isArray(res?.data) ? res.data : (res || []);
      setWorkflow(rows);
    } catch {
      setWorkflow([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const statusOptions = useMemo(() => {
    if (!workflow.length) {
      return STUDENT_STATUSES.map(({ value, label, color }) => ({ value, label, color }));
    }
    return workflow
      .filter((s) => VALID_CODES.has(s.value))
      .map(toStatusOption);
  }, [workflow]);

  const getStatusMeta = useCallback(
    (value) => statusOptions.find((s) => s.value === value)
      || STUDENT_STATUSES.find((s) => s.value === value),
    [statusOptions],
  );

  const getStatusStyle = useCallback((value) => {
    const meta = getStatusMeta(value);
    return resolvePillStyle(meta?.color?.startsWith?.('#') ? meta.color : null);
  }, [getStatusMeta]);

  return { statusOptions, getStatusMeta, getStatusStyle, loading, reload: load };
}

export default useStudentStatusOptions;
