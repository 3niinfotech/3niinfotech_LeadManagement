import { useCallback, useEffect, useState } from 'react';
import { apiGet } from '../../../api/apiClient';
import { API } from '../../../config/api';

function mapCounsellorUser(u) {
  const name = `${u.firstName || ''} ${u.lastName || ''}`.trim() || u.email || u.id;
  const branchLabel = u.branch?.code || u.branch?.name;
  const label = branchLabel ? `${name} (${branchLabel})` : name;
  return {
    value: u.id,
    label,
    user: u,
  };
}

/**
 * Dynamic counsellor options from User + RBAC (not Master).
 * @param {{ branchId?: string, enabled?: boolean }} options
 */
export function useCounsellorOptions({ branchId, enabled = true } = {}) {
  const [options, setOptions] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (!enabled) {
      setOptions([]);
      setUsers([]);
      return;
    }
    setLoading(true);
    try {
      const params = branchId ? { branchId } : undefined;
      const res = await apiGet(API.USERS_COUNSELLORS, params);
      const rows = res?.data ?? res ?? [];
      const list = Array.isArray(rows) ? rows : [];
      setUsers(list);
      setOptions(list.map(mapCounsellorUser));
    } catch {
      setOptions([]);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, [branchId, enabled]);

  useEffect(() => {
    load();
  }, [load]);

  return { options, users, loading, reload: load };
}

export default useCounsellorOptions;
