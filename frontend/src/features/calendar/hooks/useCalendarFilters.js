import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  CALENDAR_CATEGORIES,
  CALENDAR_EVENT_TYPES,
  DEFAULT_CALENDAR_FILTERS,
} from '../constants/calendar.constants';

export function useCalendarFilters() {
  const [filters, setFilters] = useState(DEFAULT_CALENDAR_FILTERS);
  const [searchInput, setSearchInput] = useState('');

  useEffect(() => {
    const t = setTimeout(() => {
      setFilters((prev) => ({ ...prev, search: searchInput.trim() }));
    }, 350);
    return () => clearTimeout(t);
  }, [searchInput]);

  const toggleCategory = useCallback((id) => {
    setFilters((prev) => {
      const has = prev.categories.includes(id);
      return {
        ...prev,
        categories: has
          ? prev.categories.filter((c) => c !== id)
          : [...prev.categories, id],
      };
    });
  }, []);

  const toggleEventType = useCallback((id) => {
    setFilters((prev) => {
      const has = prev.eventTypes.includes(id);
      return {
        ...prev,
        eventTypes: has
          ? prev.eventTypes.filter((c) => c !== id)
          : [...prev.eventTypes, id],
      };
    });
  }, []);

  const setField = useCallback((key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  }, []);

  const reset = useCallback(() => {
    setFilters(DEFAULT_CALENDAR_FILTERS);
    setSearchInput('');
  }, []);

  const applyPreset = useCallback((patch) => {
    setFilters((prev) => ({ ...prev, ...patch }));
  }, []);

  const queryParams = useMemo(() => ({
    category: filters.categories.length === CALENDAR_CATEGORIES.length
      ? undefined
      : (filters.categories.join(',') || '__NONE__'),
    eventType: filters.eventTypes.length === CALENDAR_EVENT_TYPES.length
      ? undefined
      : (filters.eventTypes.join(',') || '__NONE__'),
    assignedTo: filters.assignedTo || undefined,
    branchId: filters.branchId || undefined,
    status: filters.status || undefined,
    priority: filters.priority || undefined,
    search: filters.search || undefined,
  }), [filters]);

  return {
    filters,
    searchInput,
    setSearchInput,
    toggleCategory,
    toggleEventType,
    setField,
    applyPreset,
    reset,
    queryParams,
  };
}
