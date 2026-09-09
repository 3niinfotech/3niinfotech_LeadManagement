import { useEffect, useRef, useState } from 'react';
import { useLazyCheckDuplicatesQuery } from '../redux/enquiryApiSlice';

function useDebouncedValue(value, delay = 450) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

export function useDuplicateDetection({
  email,
  mobile,
  alternateNo,
  passportNo,
  excludeId,
  enabled = true,
}) {
  const [checkDuplicates] = useLazyCheckDuplicatesQuery();
  const [matches, setMatches] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [acknowledged, setAcknowledged] = useState(false);
  const dismissedRef = useRef('');

  const debounced = useDebouncedValue(
    JSON.stringify({ email, mobile, alternateNo, passportNo, excludeId }),
  );

  useEffect(() => {
    if (!enabled) {
      setMatches([]);
      setModalOpen(false);
      return;
    }

    const payload = JSON.parse(debounced);
    const hasInput = [payload.email, payload.mobile, payload.alternateNo, payload.passportNo]
      .some((v) => String(v || '').trim().length >= 4);

    if (!hasInput) {
      setMatches([]);
      setModalOpen(false);
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const result = await checkDuplicates({
          email: payload.email,
          mobile: payload.mobile,
          alternateNo: payload.alternateNo,
          passportNo: payload.passportNo,
          excludeId: payload.excludeId,
        }).unwrap();

        if (cancelled) return;
        const nextMatches = result?.matches || [];
        setMatches(nextMatches);

        const signature = nextMatches.map((m) => m.id).sort().join(',');
        if (nextMatches.length > 0 && signature !== dismissedRef.current) {
          setModalOpen(true);
        }
        if (nextMatches.length === 0) {
          setModalOpen(false);
          dismissedRef.current = '';
        }
      } catch {
        if (!cancelled) setMatches([]);
      }
    })();

    return () => { cancelled = true; };
  }, [debounced, enabled, checkDuplicates]);

  const dismissModal = () => {
    dismissedRef.current = matches.map((m) => m.id).sort().join(',');
    setModalOpen(false);
    setAcknowledged(true);
  };

  return {
    matches,
    hasDuplicate: matches.length > 0,
    duplicateAcknowledged: acknowledged,
    modalOpen,
    dismissModal,
  };
}
