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

export function useWalkInDuplicateCheck({ phone, email, branchId, enabled = true }) {
  const [checkDuplicate, { isFetching }] = useLazyCheckWalkInDuplicateQuery();
  const [match, setMatch] = useState(null);
  const debouncedPhone = useDebounced(phone?.trim() || '');
  const debouncedEmail = useDebounced(email?.trim() || '');

  useEffect(() => {
    const hasPhone = debouncedPhone.length >= 8;
    const hasEmail = debouncedEmail.includes('@') && debouncedEmail.length >= 5;

    if (!enabled || !branchId || (!hasPhone && !hasEmail)) {
      setMatch(null);
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const params = { branchId };
        if (hasPhone) params.phone = debouncedPhone;
        if (hasEmail) params.email = debouncedEmail;

        const result = await checkDuplicate(params).unwrap();
        if (!cancelled) {
          const matchData = result?.existing || (result?.hasDuplicate ? result?.identity : null);
          setMatch(matchData || null);
        }
      } catch {
        if (!cancelled) setMatch(null);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [debouncedPhone, debouncedEmail, branchId, enabled, checkDuplicate]);

  return { match, checking: isFetching, hasDuplicate: Boolean(match) };
}
