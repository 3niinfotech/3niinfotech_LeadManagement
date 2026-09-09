import { useCallback, useEffect, useState } from 'react';
import { apiGet } from '../../../api/apiClient';
import { API } from '../../../config/api';

export function useTeacherBatches() {
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiGet(API.ACADEMIC_BATCHES, { limit: 100 });
      setBatches(res?.data || []);
    } catch {
      setBatches([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const batchOptions = batches.map((b) => ({
    value: b.id,
    label: `${b.name}${b.courseName ? ` · ${b.courseName}` : ''}`,
  }));

  return { batches, batchOptions, loading, reload: load };
}
