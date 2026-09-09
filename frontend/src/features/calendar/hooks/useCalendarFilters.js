import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  CALENDAR_CATEGORIES,
  CALENDAR_EVENT_TYPES,
  DEFAULT_CALENDAR_FILTERS,
} from '../constants/calendar.constants';
import { useViewingBranchFilter } from '../../../hooks/useViewingBranchFilter';

export function useCalendarFilters() {
  const [filters, setFilters] = useState(DEFAULT_CALENDAR_FILTERS);
  const [searchInput, setSearchInput] = useState('');
  const [activePreset, setActivePreset] = useState('all');
  const {
    branchId: viewingBranchId,
    branchLocked,
    canViewAllBranches,
  } = useViewingBranchFilter();

  useEffect(() => {
    const t = setTimeout(() => {
      setFilters((prev) => ({ ...prev, search: searchInput.trim() }));
    }, 350);
    return () => clearTimeout(t);
  }, [searchInput]);

  useEffect(() => {
    setFilters((prev) => {
      const nextId = viewingBranchId || '';
      if ((prev.branchId || '') === nextId) return prev;
      return { ...prev, branchId: nextId };
    });
  }, [viewingBranchId]);

  const toggleCategory = useCallback((id) => {
    setActivePreset(null);
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
    setActivePreset(null);
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

  const setCategories = useCallback((ids) => {
    setActivePreset(null);
    setFilters((prev) => ({ ...prev, categories: ids }));
  }, []);

  const setEventTypes = useCallback((ids) => {
    setActivePreset(null);
    setFilters((prev) => ({ ...prev, eventTypes: ids }));
  }, []);

  const setField = useCallback((key, value) => {
    if (key === 'branchId' && branchLocked) return;
    setActivePreset(null);
    setFilters((prev) => ({ ...prev, [key]: value }));
  }, [branchLocked]);

  const reset = useCallback(() => {
    setFilters({
      ...DEFAULT_CALENDAR_FILTERS,
      branchId: branchLocked ? (viewingBranchId || '') : '',
    });
    setSearchInput('');
    setActivePreset('all');
  }, [branchLocked, viewingBranchId]);

  const applyPreset = useCallback((patch, presetId = null) => {
    setFilters((prev) => ({
      ...prev,
      ...patch,
      ...(branchLocked ? { branchId: viewingBranchId || '' } : {}),
    }));
    if (presetId != null) setActivePreset(presetId);
    else setActivePreset(null);
  }, [branchLocked, viewingBranchId]);

  const applySmartPreset = useCallback((presetId) => {
    const allCats = CALENDAR_CATEGORIES.map((c) => c.id);
    const allTypes = CALENDAR_EVENT_TYPES.map((t) => t.id);
    const lockedBranch = branchLocked ? (viewingBranchId || '') : undefined;

    if (presetId === 'all') {
      setFilters({
        ...DEFAULT_CALENDAR_FILTERS,
        ...(lockedBranch != null ? { branchId: lockedBranch } : {}),
      });
      setSearchInput('');
      setActivePreset('all');
      return;
    }
    if (presetId === 'overdue') {
      setFilters((prev) => ({
        ...prev,
        status: 'OVERDUE',
        eventTypes: allTypes,
        categories: allCats,
        priority: '',
        ...(lockedBranch != null ? { branchId: lockedBranch } : {}),
      }));
      setActivePreset('overdue');
      return;
    }
    if (presetId === 'followups') {
      setFilters((prev) => ({
        ...prev,
        status: '',
        eventTypes: ['FOLLOWUP'],
        categories: allCats,
        ...(lockedBranch != null ? { branchId: lockedBranch } : {}),
      }));
      setActivePreset('followups');
      return;
    }
    if (presetId === 'appointments') {
      setFilters((prev) => ({
        ...prev,
        status: '',
        eventTypes: ['APPOINTMENT'],
        categories: allCats,
        ...(lockedBranch != null ? { branchId: lockedBranch } : {}),
      }));
      setActivePreset('appointments');
      return;
    }
    if (presetId === 'due') {
      setFilters((prev) => ({
        ...prev,
        status: '',
        eventTypes: ['DUE_DATE', 'OFFER', 'EXPIRY'],
        categories: allCats,
        ...(lockedBranch != null ? { branchId: lockedBranch } : {}),
      }));
      setActivePreset('due');
      return;
    }
    if (presetId === 'classes') {
      setFilters((prev) => ({
        ...prev,
        status: '',
        eventTypes: ['DEMO', 'CLASS'],
        categories: ['DEMO', 'CLASS', 'STUDENT', 'ENQUIRY'],
        ...(lockedBranch != null ? { branchId: lockedBranch } : {}),
      }));
      setActivePreset('classes');
    }
  }, [branchLocked, viewingBranchId]);

  const queryParams = useMemo(() => {
    const effectiveBranch = branchLocked
      ? (viewingBranchId || undefined)
      : (filters.branchId || viewingBranchId || undefined);

    return {
      category: filters.categories.length === CALENDAR_CATEGORIES.length
        ? undefined
        : (filters.categories.join(',') || '__NONE__'),
      eventType: filters.eventTypes.length === CALENDAR_EVENT_TYPES.length
        ? undefined
        : (filters.eventTypes.join(',') || '__NONE__'),
      assignedTo: filters.assignedTo || undefined,
      branchId: effectiveBranch,
      status: filters.status || undefined,
      priority: filters.priority || undefined,
      search: filters.search || undefined,
    };
  }, [filters, branchLocked, viewingBranchId]);

  const activeFilterCount = useMemo(() => {
    let n = 0;
    if (filters.categories.length !== CALENDAR_CATEGORIES.length) n += 1;
    if (filters.eventTypes.length !== CALENDAR_EVENT_TYPES.length) n += 1;
    if (filters.assignedTo) n += 1;
    if (filters.branchId && !branchLocked) n += 1;
    if (filters.status) n += 1;
    if (filters.priority) n += 1;
    if (filters.search) n += 1;
    return n;
  }, [filters, branchLocked]);

  return {
    filters,
    searchInput,
    setSearchInput,
    toggleCategory,
    toggleEventType,
    setCategories,
    setEventTypes,
    setField,
    applyPreset,
    applySmartPreset,
    activePreset,
    activeFilterCount,
    reset,
    queryParams,
    branchLocked,
    canViewAllBranches,
  };
}
