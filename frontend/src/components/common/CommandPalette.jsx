import { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiSearch,
  FiMic,
  FiMicOff,
  FiCommand,
  FiTrash2,
  FiX,
  FiSliders,
  FiUsers,
  FiInbox,
  FiDollarSign,
  FiFileText,
  FiPlus,
  FiCalendar,
  FiArrowRight,
  FiLayers,
  FiAlertTriangle,
} from 'react-icons/fi';
import {
  closeCommandPalette,
  openCommandPalette,
  selectCommandPaletteOpen,
  selectCommandPaletteQuery,
  selectCommandPaletteStartVoice,
  consumeCommandPaletteVoiceTrigger,
  setCommandPaletteQuery,
} from '../../redux/slices/uiSlice';
import { selectUser } from '../../redux/slices/authSlice';
import { ROUTES } from '../../config/routes';
import { apiGet } from '../../api/apiClient';
import { API } from '../../config/api';
import { useVoiceSearch } from '../../hooks/useVoiceSearch';
import {
  buildSearchGroups,
  buildIdleGroups,
  buildSuggestionGroups,
  flattenGroups,
  getTotalCount,
} from '../../utils/globalSearch';
import {
  getSearchHistory,
  addSearchHistory,
  removeSearchHistoryItem,
  clearSearchHistory,
  getTrendingQueries,
} from '../../utils/searchHistory';
import SearchResultItem from '../search/SearchResultItem';
import Loader from '../ui/Loader';
import ScrollArea from '../ui/ScrollArea';
import { iconSize } from '../../theme/icons';
import { usePermissions } from '../../hooks/usePermissions';
import { PERMISSIONS } from '../../config/permissions';
import { navPages } from '../../config/navIcons.config';
import {
  isMastersForcedHidden,
  isReceptionForcedHidden,
} from '../../config/access-policy';

const SEARCH_ENTITY_PERMISSIONS = {
  enquiries: PERMISSIONS.ENQUIRIES_VIEW,
  students: PERMISSIONS.STUDENTS_VIEW,
  leads: PERMISSIONS.LEADS_VIEW,
  visas: PERMISSIONS.VISAS_VIEW,
  applications: PERMISSIONS.APPLICATIONS_VIEW,
  invoices: PERMISSIONS.INVOICES_VIEW,
  partners: PERMISSIONS.PARTNERS_VIEW,
  users: PERMISSIONS.USERS_VIEW,
};

const CATEGORIES = [
  { id: 'all', label: 'All', icon: FiSearch },
  { id: 'students', label: 'Students', icon: FiUsers },
  { id: 'enquiries', label: 'Enquiries', icon: FiInbox },
  { id: 'invoices', label: 'Invoices & Fees', icon: FiDollarSign },
  { id: 'applications', label: 'Applications', icon: FiFileText },
  { id: 'pages', label: 'Pages & Tools', icon: FiSliders },
];

export default function CommandPalette() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const open = useSelector(selectCommandPaletteOpen);
  const reduxQuery = useSelector(selectCommandPaletteQuery);
  const user = useSelector(selectUser);
  const userId = user?.id;
  const { can, canAny, roleSlug } = usePermissions();

  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [apiResults, setApiResults] = useState(null);
  const [apiSuggestions, setApiSuggestions] = useState(null);
  const [loading, setLoading] = useState(false);
  const [suggestLoading, setSuggestLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [history, setHistory] = useState([]);
  const inputRef = useRef(null);
  const itemRefs = useRef([]);

  const syncQuery = useCallback((value) => {
    setQuery(value);
    dispatch(setCommandPaletteQuery(value));
  }, [dispatch]);

  const close = useCallback(() => {
    dispatch(closeCommandPalette());
    setQuery('');
    setActiveCategory('all');
    setApiResults(null);
    setApiSuggestions(null);
    setActiveIndex(0);
  }, [dispatch]);

  const refreshHistory = useCallback(() => {
    setHistory(getSearchHistory(userId));
  }, [userId]);

  const autoStartVoice = useSelector(selectCommandPaletteStartVoice);

  const {
    listening,
    supported,
    error: voiceError,
    clearError: clearVoiceError,
    start: startMic,
    toggle: toggleMic,
    stop: stopMic,
  } = useVoiceSearch((text) => {
    syncQuery(text);
    setActiveIndex(0);
  });

  const trimmed = query.trim();
  const isFullSearch = trimmed.length >= 2;
  const trending = useMemo(() => getTrendingQueries(userId), [userId, history]);

  const searchAccess = useMemo(() => {
    const extraPages = roleSlug === 'receptionist'
      ? [{
          id: 'personal-settings',
          label: 'Settings',
          description: 'Personal profile and preferences',
          path: ROUTES.PROFILE,
          icon: FiSliders,
        }]
      : [];
    const canAccessPage = (page) => {
      if (!page?.path) return false;
      if ((page.path === ROUTES.MASTER || page.path.startsWith(`${ROUTES.MASTER}/`))
        && isMastersForcedHidden(roleSlug)) return false;
      if ((page.path === ROUTES.WALK_INS || page.path.startsWith(`${ROUTES.WALK_INS}/`))
        && isReceptionForcedHidden(roleSlug)) return false;
      const required = page.permissions || (page.permission ? [page.permission] : []);
      return !required.length || canAny(required);
    };

    const allowedPages = [...navPages, ...extraPages].filter(canAccessPage);
    return {
      extraPages,
      canAccessPage,
      canAccessPath: (path) => allowedPages.some(
        (page) => path === page.path || path.startsWith(`${page.path}/`),
      ),
      canSearchEntity: (entity) => {
        const permission = SEARCH_ENTITY_PERMISSIONS[entity];
        return permission ? can(permission) : false;
      },
    };
  }, [can, canAny, roleSlug]);

  // Base unfiltered groups
  const allGroups = useMemo(() => {
    if (!trimmed) return buildIdleGroups(history, trending, searchAccess);
    if (!isFullSearch || (loading && !apiResults)) {
      return buildSuggestionGroups(trimmed, history, apiSuggestions, searchAccess);
    }
    return buildSearchGroups(trimmed, apiResults, searchAccess);
  }, [trimmed, isFullSearch, loading, apiResults, apiSuggestions, history, trending, searchAccess]);

  // Count items per category
  const categoryCounts = useMemo(() => {
    const counts = { all: 0, students: 0, enquiries: 0, invoices: 0, applications: 0, pages: 0 };
    allGroups.forEach((g) => {
      counts.all += g.items.length;
      if (g.id === 'students') counts.students += g.items.length;
      else if (g.id === 'enquiries' || g.id === 'leads') counts.enquiries += g.items.length;
      else if (g.id === 'invoices') counts.invoices += g.items.length;
      else if (g.id === 'applications' || g.id === 'visas') counts.applications += g.items.length;
      else if (g.id === 'pages' || g.id === 'suggest-pages') counts.pages += g.items.length;
      else {
        // Fallback checks item types
        g.items.forEach((it) => {
          if (it.type === 'student') counts.students += 1;
          else if (it.type === 'enquiry' || it.type === 'lead') counts.enquiries += 1;
          else if (it.type === 'invoices' || it.type === 'invoice') counts.invoices += 1;
          else if (it.type === 'applications' || it.type === 'visa') counts.applications += 1;
          else if (it.type === 'page') counts.pages += 1;
        });
      }
    });
    return counts;
  }, [allGroups]);

  // Filter groups according to activeCategory
  const displayedGroups = useMemo(() => {
    if (activeCategory === 'all') return allGroups;
    if (activeCategory === 'students') {
      return allGroups
        .map((g) => {
          if (g.id === 'students') return g;
          const items = g.items.filter((it) => it.type === 'student' || it.badge === 'Student');
          return items.length ? { ...g, items } : null;
        })
        .filter(Boolean);
    }
    if (activeCategory === 'enquiries') {
      return allGroups
        .map((g) => {
          if (g.id === 'enquiries' || g.id === 'leads') return g;
          const items = g.items.filter((it) => it.type === 'enquiry' || it.type === 'lead' || it.badge === 'Enquiry' || it.badge === 'Lead');
          return items.length ? { ...g, items } : null;
        })
        .filter(Boolean);
    }
    if (activeCategory === 'invoices') {
      return allGroups
        .map((g) => {
          if (g.id === 'invoices') return g;
          const items = g.items.filter((it) => it.type === 'invoices' || it.type === 'invoice' || it.badge === 'Invoice');
          return items.length ? { ...g, items } : null;
        })
        .filter(Boolean);
    }
    if (activeCategory === 'applications') {
      return allGroups
        .map((g) => {
          if (g.id === 'applications' || g.id === 'visas') return g;
          const items = g.items.filter((it) => it.type === 'applications' || it.type === 'visa' || it.badge === 'App' || it.badge === 'Visa');
          return items.length ? { ...g, items } : null;
        })
        .filter(Boolean);
    }
    if (activeCategory === 'pages') {
      return allGroups
        .map((g) => {
          if (g.id === 'pages' || g.id === 'suggest-pages') return g;
          const items = g.items.filter((it) => it.type === 'page' || it.badge === 'Page');
          return items.length ? { ...g, items } : null;
        })
        .filter(Boolean);
    }
    return allGroups;
  }, [allGroups, activeCategory]);

  const flatItems = useMemo(() => flattenGroups(displayedGroups), [displayedGroups]);
  const resultCount = getTotalCount(displayedGroups);

  const saveToHistory = useCallback((entry) => {
    addSearchHistory(userId, entry);
    refreshHistory();
  }, [userId, refreshHistory]);

  const runAction = useCallback((action, item) => {
    if (!action) return;

    if (action.kind === 'search') {
      syncQuery(action.query);
      setActiveIndex(0);
      saveToHistory({ query: action.query, type: 'query' });
      return;
    }

    const label = item?.title || trimmed;
    const subtitle = item?.subtitle;

    if (action.kind === 'enquiry') {
      saveToHistory({
        query: trimmed || label,
        label,
        subtitle,
        type: 'result',
        action,
      });
      navigate(ROUTES.ENQUIRY_DETAIL(action.id));
    } else if (action.path) {
      saveToHistory({
        query: trimmed || label,
        label,
        subtitle,
        type: 'result',
        action,
      });
      navigate(action.path);
    } else if (trimmed) {
      saveToHistory({ query: trimmed, type: 'query' });
    }

    stopMic();
    close();
  }, [navigate, close, stopMic, syncQuery, saveToHistory, trimmed]);

  useEffect(() => {
    const handler = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        if (open) close();
        else dispatch(openCommandPalette());
      }
      if (e.key === 'Escape' && open) {
        stopMic();
        close();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [dispatch, close, open, stopMic]);

  useEffect(() => {
    if (open) {
      refreshHistory();
      if (reduxQuery) syncQuery(reduxQuery);
    }
  }, [open, refreshHistory, reduxQuery, syncQuery]);

  useEffect(() => {
    if (!open) return;
    const timer = setTimeout(() => inputRef.current?.focus(), 60);
    return () => clearTimeout(timer);
  }, [open]);

  useEffect(() => {
    if (!open) {
      stopMic();
      clearVoiceError();
    } else if (autoStartVoice) {
      dispatch(consumeCommandPaletteVoiceTrigger());
      const timer = setTimeout(() => {
        startMic();
      }, 120);
      return () => clearTimeout(timer);
    }
  }, [open, autoStartVoice, dispatch, startMic, stopMic, clearVoiceError]);

  useEffect(() => {
    setActiveIndex(0);
  }, [query, displayedGroups.length, activeCategory]);

  // Autocomplete suggestions (1+ chars)
  useEffect(() => {
    if (!trimmed) {
      setApiSuggestions(null);
      setSuggestLoading(false);
      return undefined;
    }
    setSuggestLoading(true);
    const timer = setTimeout(async () => {
      try {
        const res = await apiGet(API.SEARCH_SUGGESTIONS, { q: trimmed });
        setApiSuggestions(res.data);
      } catch {
        setApiSuggestions(null);
      } finally {
        setSuggestLoading(false);
      }
    }, 180);
    return () => clearTimeout(timer);
  }, [trimmed]);

  // Full search (2+ chars)
  useEffect(() => {
    if (!isFullSearch) {
      setApiResults(null);
      setLoading(false);
      return undefined;
    }
    setLoading(true);
    const timer = setTimeout(async () => {
      try {
        const res = await apiGet(API.GLOBAL_SEARCH, { q: trimmed });
        setApiResults(res.data);
      } catch {
        setApiResults(null);
      } finally {
        setLoading(false);
      }
    }, 320);
    return () => clearTimeout(timer);
  }, [trimmed, isFullSearch]);

  useEffect(() => {
    itemRefs.current[activeIndex]?.scrollIntoView({ block: 'nearest' });
  }, [activeIndex]);

  const handleRemoveHistory = (historyId) => {
    removeSearchHistoryItem(userId, historyId);
    refreshHistory();
  };

  const handleClearHistory = () => {
    clearSearchHistory(userId);
    refreshHistory();
  };

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, flatItems.length - 1));
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    }
    if (e.key === 'Tab') {
      e.preventDefault();
      const catKeys = CATEGORIES.map((c) => c.id);
      const currIdx = catKeys.indexOf(activeCategory);
      const nextIdx = (currIdx + 1) % catKeys.length;
      setActiveCategory(catKeys[nextIdx]);
    }
    if (e.key === 'Enter') {
      e.preventDefault();
      if (flatItems[activeIndex]) {
        runAction(flatItems[activeIndex].action, flatItems[activeIndex]);
      } else if (trimmed) {
        saveToHistory({ query: trimmed, type: 'query' });
      }
    }
  };

  const showEmpty = !loading && !suggestLoading && trimmed && flatItems.length === 0;

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[1300] flex items-start justify-center pt-[6vh] px-4 sm:px-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-slate-900/60 dark:bg-black/75 backdrop-blur-sm"
            onClick={close}
          />

          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -14, scale: 0.98 }}
            transition={{ type: 'spring', damping: 28, stiffness: 320 }}
            className="relative w-full max-w-4xl bg-white dark:bg-[#0c1322] rounded-2xl shadow-2xl shadow-black/30 dark:shadow-black/70 overflow-hidden border border-slate-200 dark:border-slate-800/80 ring-1 ring-black/5 dark:ring-white/5"
            role="dialog"
            aria-modal="true"
            aria-label="Global search"
          >
            {/* ── Seamless Advance Search Header ── */}
            <div className="flex items-center gap-3.5 px-6 py-4 border-b border-slate-200/90 dark:border-slate-800/80 bg-white dark:bg-[#0c1322]">
              <FiSearch className="w-5 h-5 text-primary-500 shrink-0" />

              <input
                ref={inputRef}
                value={query}
                onChange={(e) => syncQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Search students, enquiries, leads, invoices, or jump to pages..."
                className="crm-search-input-seamless flex-1 min-w-0 bg-transparent border-0 outline-none text-[15px] font-medium text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 p-0 focus:outline-none focus:ring-0 shadow-none"
                autoComplete="off"
                spellCheck={false}
              />

              {query && (
                <button
                  type="button"
                  onClick={() => syncQuery('')}
                  className="p-1 rounded-md text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                  title="Clear input"
                >
                  <FiX className="w-4 h-4" />
                </button>
              )}

              <button
                type="button"
                onClick={toggleMic}
                title={
                  !supported
                    ? 'Voice search not supported in this browser'
                    : listening
                    ? 'Stop listening'
                    : voiceError
                    ? voiceError
                    : 'Voice search (Speak to search)'
                }
                aria-label="Voice search"
                className={`p-1.5 rounded-lg transition-all shrink-0 cursor-pointer ${
                  listening
                    ? 'bg-danger text-white shadow-md animate-pulse ring-2 ring-danger-400/50'
                    : voiceError
                    ? 'bg-danger-500/15 border border-danger-500/50 text-danger-500 dark:text-danger-400 hover:bg-danger-500/25'
                    : 'bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:text-primary-600 dark:hover:text-primary-400 hover:border-primary-500/40'
                }`}
              >
                {listening ? <FiMicOff className="w-4 h-4" /> : <FiMic className="w-4 h-4" />}
              </button>

              <kbd className="hidden sm:inline-flex items-center gap-0.5 px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-[10px] font-mono font-semibold text-slate-500 dark:text-slate-400 shrink-0 shadow-2xs">
                ESC
              </kbd>
            </div>

            {/* ── Voice Search Active Listening Banner ── */}
            <AnimatePresence>
              {listening && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.15 }}
                  className="px-6 py-2.5 bg-primary-50 dark:bg-primary-950/40 border-b border-primary-100 dark:border-primary-500/20 flex items-center justify-between text-xs text-primary-700 dark:text-primary-300"
                >
                  <div className="flex items-center gap-2">
                    <span className="flex h-2.5 w-2.5 relative">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-danger-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-danger-500"></span>
                    </span>
                    <span className="font-semibold">Listening... Speak now to search</span>
                  </div>
                  <button
                    type="button"
                    onClick={stopMic}
                    className="text-[11px] font-semibold text-danger hover:underline cursor-pointer"
                  >
                    Cancel
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            {/* ── Voice Search Error Banner ── */}
            <AnimatePresence>
              {voiceError && !listening && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.15 }}
                  className="px-6 py-2.5 bg-danger-50 dark:bg-danger-950/50 border-b border-danger-200 dark:border-danger-500/25 flex items-center justify-between gap-3 text-xs text-danger-700 dark:text-danger-300"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <FiAlertTriangle className="w-4 h-4 shrink-0 text-danger-500" />
                    <span className="font-medium leading-relaxed">{voiceError}</span>
                  </div>
                  <button
                    type="button"
                    onClick={clearVoiceError}
                    className="p-1 rounded text-danger-400 hover:text-danger-600 dark:hover:text-danger-200 hover:bg-danger-100 dark:hover:bg-danger-500/20 transition-colors shrink-0 cursor-pointer"
                    title="Dismiss"
                  >
                    <FiX className="w-3.5 h-3.5" />
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            {/* ── Category Quick-Filter Chips ── */}
            <div className="px-6 py-2.5 border-b border-slate-200/90 dark:border-slate-800/70 bg-slate-50 dark:bg-slate-900/40 flex items-center justify-between gap-3 overflow-x-auto no-scrollbar">
              <div className="flex items-center gap-2 shrink-0">
                {CATEGORIES.map((cat) => {
                  const Icon = cat.icon;
                  const count = categoryCounts[cat.id];
                  const isActive = activeCategory === cat.id;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setActiveCategory(cat.id)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                        isActive
                          ? 'bg-primary-600 text-white shadow-xs'
                          : 'bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700/80 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/80 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      <span>{cat.label}</span>
                      {count > 0 && (
                        <span
                          className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold tabular-nums ${
                            isActive
                              ? 'bg-white/20 text-white'
                              : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                          }`}
                        >
                          {count}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              <span className="shrink-0 hidden lg:inline-flex rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/90 px-2.5 py-1 text-[11px] font-medium text-slate-500 dark:text-slate-400">
                {user?.role?.name || 'Workspace Search'}
              </span>
            </div>

            {/* Loading Banner */}
            {(loading || suggestLoading) && trimmed && (
              <div className="px-6 py-2 border-b border-slate-200 dark:border-slate-800/60 flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-900/40">
                <Loader size="xs" variant="flow" />
                {loading ? 'Searching real-time across CRM records…' : 'Fetching suggestions…'}
              </div>
            )}

            {/* Results Scroll View */}
            <ScrollArea axis="y" hideBar className="max-h-[min(520px,58vh)] py-3 px-5 bg-white dark:bg-[#0c1322]">
              {!trimmed && history.length > 0 && activeCategory === 'all' && (
                <div className="flex items-center justify-between px-3 py-1.5 mb-1.5">
                  <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Recent Searches</span>
                  <button
                    type="button"
                    onClick={handleClearHistory}
                    className="text-[11px] text-slate-400 hover:text-danger dark:hover:text-danger flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <FiTrash2 className="w-3 h-3" /> Clear history
                  </button>
                </div>
              )}

              {loading && isFullSearch && (
                <div className="py-16 flex flex-col items-center gap-3">
                  <Loader size="sm" variant="flow" />
                  <p className="text-sm text-slate-500 dark:text-slate-400">Searching for &ldquo;{trimmed}&rdquo;…</p>
                </div>
              )}

              {!loading && flatItems.length > 0 && (
                <SearchGroups
                  groups={displayedGroups}
                  activeIndex={activeIndex}
                  itemRefs={itemRefs}
                  query={trimmed}
                  onSelect={runAction}
                  onRemoveHistory={handleRemoveHistory}
                />
              )}

              {showEmpty && (
                <div className="py-16 text-center px-8">
                  <div className="w-14 h-14 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center mx-auto mb-4">
                    <FiSearch className="w-6 h-6 text-slate-400" />
                  </div>
                  <p className="text-base font-semibold text-slate-800 dark:text-slate-100">No results for &ldquo;{trimmed}&rdquo;</p>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 max-w-md mx-auto">
                    Try refining your keyword, selecting another category tab, or searching by phone / student ID.
                  </p>
                </div>
              )}
            </ScrollArea>

            {/* Footer Toolbar */}
            <div className="px-6 py-3 border-t border-slate-200/90 dark:border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-900/60">
              <div className="flex items-center gap-4 flex-wrap">
                <span className="flex items-center gap-1.5">
                  <kbd className="px-1.5 py-0.5 rounded-md bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono text-[10px] text-slate-600 dark:text-slate-300 shadow-2xs font-semibold">↑↓</kbd>
                  navigate
                </span>
                <span className="flex items-center gap-1.5">
                  <kbd className="px-1.5 py-0.5 rounded-md bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono text-[10px] text-slate-600 dark:text-slate-300 shadow-2xs font-semibold">↵</kbd>
                  open
                </span>
                <span className="flex items-center gap-1.5">
                  <kbd className="px-1.5 py-0.5 rounded-md bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono text-[10px] text-slate-600 dark:text-slate-300 shadow-2xs font-semibold">tab</kbd>
                  switch category
                </span>
                <span className="flex items-center gap-1.5">
                  <kbd className="px-1.5 py-0.5 rounded-md bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono text-[10px] text-slate-600 dark:text-slate-300 shadow-2xs font-semibold">esc</kbd>
                  close
                </span>
              </div>
              <div className="flex items-center gap-3">
                {resultCount > 0 && (
                  <span className="font-semibold text-primary-600 dark:text-primary-400 tabular-nums">
                    {resultCount} {resultCount === 1 ? 'result' : 'results'} found
                  </span>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

function SearchGroups({ groups, activeIndex, itemRefs, onSelect, onRemoveHistory, query }) {
  let offset = 0;
  return (
    <div className="space-y-4">
      {groups.map((group) => {
        const groupOffset = offset;
        offset += group.items.length;
        return (
          <div key={group.id}>
            <p className="px-3 py-1.5 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
              <span>{group.label}</span>
              <span className="text-[10px] text-slate-400/80 dark:text-slate-500/80 font-mono font-normal">
                ({group.items.length})
              </span>
            </p>
            <div className="space-y-0.5">
              {group.items.map((item, idx) => {
                const flatIdx = groupOffset + idx;
                const variant = item.type === 'history' ? 'history' : item.type === 'suggestion' ? 'suggestion' : 'default';
                return (
                  <div key={item.id} ref={(el) => { itemRefs.current[flatIdx] = el; }}>
                    <SearchResultItem
                      icon={item.icon}
                      title={item.title}
                      subtitle={item.subtitle}
                      hint={item.hint}
                      meta={item.meta}
                      badge={item.badge}
                      badgeColor={item.badgeColor}
                      active={flatIdx === activeIndex}
                      query={query}
                      variant={variant}
                      onRemove={item.historyId ? () => onRemoveHistory(item.historyId) : undefined}
                      onClick={() => onSelect(item.action, item)}
                    />
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
