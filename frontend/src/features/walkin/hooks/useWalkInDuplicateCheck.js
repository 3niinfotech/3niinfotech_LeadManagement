import { useEffect, useState } from 'react';
import { useLazyCheckWalkInDuplicateQuery } from '../redux/walkinApiSlice';

function useDebounced(value, delay = 450) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

export function useWalkInDuplicateCheck({ phone, branchId, enabled = true }) {
  const [checkDuplicate, { isFetching }] = useLazyCheckWalkInDuplicateQuery();
  const [match, setMatch] = useState(null);
  const debouncedPhone = useDebounced(phone?.trim() || '');

  useEffect(() => {
    if (!enabled || !branchId || debouncedPhone.length < 8) {
      setMatch(null);
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const result = await checkDuplicate({ phone: debouncedPhone, branchId }).unwrap();
        if (!cancelled) setMatch(result?.existing || null);
      } catch {
        if (!cancelled) setMatch(null);
      }
    })();

    return () => { cancelled = true; };
  }, [debouncedPhone, branchId, enabled, checkDuplicate]);

  return { match, checking: isFetching, hasDuplicate: Boolean(match) };
}
