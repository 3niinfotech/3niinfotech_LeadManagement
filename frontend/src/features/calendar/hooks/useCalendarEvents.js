import { useCallback, useEffect, useState } from 'react';
import { calendarApi } from '../services/calendarApi.service';
import { rangeForView } from '../utils/calendar-date.utils';
import { getApiErrorMessage } from '../../master/services/masterApi.service';

export function useCalendarEvents({ currentDate, viewId, queryParams }) {
  const [events, setEvents] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reloadToken, setReloadToken] = useState(0);

  const refresh = useCallback(() => setReloadToken((n) => n + 1), []);

  useEffect(() => {
    let cancelled = false;
    const { from, to } = rangeForView(currentDate, viewId);

    (async () => {
      setLoading(true);
      setError(null);
      try {
        const [eventsRes, summaryRes] = await Promise.all([
          calendarApi.getEvents({ from, to, ...queryParams }),
          calendarApi.getSummary({
            from,
            to,
            assignedTo: queryParams.assignedTo,
            branchId: queryParams.branchId,
          }),
        ]);
        if (cancelled) return;
        setEvents(eventsRes?.events || []);
        setSummary(summaryRes || null);
      } catch (err) {
        if (cancelled) return;
        setError(getApiErrorMessage(err, 'Failed to load calendar'));
        setEvents([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [currentDate, viewId, queryParams, reloadToken]);

  return { events, summary, loading, error, refresh };
}
