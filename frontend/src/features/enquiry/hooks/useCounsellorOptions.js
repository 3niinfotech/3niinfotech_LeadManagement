import { useEffect, useState } from 'react';
import { apiGet } from '../../../api/apiClient';
import { API } from '../../../config/api';

/** Active users for counsellor dropdown */
export function useCounsellorOptions() {
  const [options, setOptions] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const res = await apiGet(API.USERS, { limit: 100, status: 'ACTIVE' });
        const users = res?.data || res || [];
        if (!cancelled) {
          setOptions(users.map((u) => ({
            value: u.id,
            label: `${u.firstName} ${u.lastName || ''}`.trim(),
          })));
          setUsers(users);
        }
      } catch {
        if (!cancelled) setOptions([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  return { options, users, loading };
}
