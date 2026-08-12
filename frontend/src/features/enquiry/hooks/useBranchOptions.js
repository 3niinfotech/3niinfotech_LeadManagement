import { useEffect, useState } from 'react';
import { apiGet } from '../../../api/apiClient';
import { API } from '../../../config/api';

export function useBranchOptions() {
  const [options, setOptions] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const res = await apiGet(API.ENQUIRIES_BRANCHES);
        const branches = res?.data || res || [];
        if (!cancelled) {
          setOptions(branches.map((b) => ({
            value: b.id,
            label: b.code ? `${b.name} (${b.code})` : b.name,
          })));
        }
      } catch {
        if (!cancelled) setOptions([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  return { options, loading };
}
