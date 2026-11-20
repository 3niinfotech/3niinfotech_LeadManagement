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
} from 'react-icons/fi';
import {
  closeCommandPalette,
  openCommandPalette,
  selectCommandPaletteOpen,
  selectCommandPaletteQuery,
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

  const { listening, supported, toggle: toggleMic, stop: stopMic } = useVoiceSearch((text) => {
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
    if (!open) stopMic();
  }, [open, stopMic]);

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
            className="absolute inset-0 backdrop-blur-md"
            style={{ background: 'var(--overlay)' }}
            onClick={close}
          />

          <motion.div
            initial={{ opacity: 0, y: -24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -16, scale: 0.98 }}
            transition={{ type: 'spring', damping: 28, stiffness: 320 }}
            className="relative w-full max-w-4xl bg-card rounded-2xl shadow-dropdown overflow-hidden border border-border"
            role="dialog"
            aria-modal="true"
            aria-label="Global search"
          >
            {/* ── Seamless Advance Search Header ── */}
            <div className="flex items-center gap-3 px-4.5 py-3.5 border-b border-border bg-card">
              <FiSearch className="w-5 h-5 text-primary-500 shrink-0" />

              <input
                ref={inputRef}
                value={query}
                onChange={(e) => syncQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Search students, enquiries, leads, invoices, or jump to pages..."
                className="flex-1 min-w-0 bg-transparent border-0 outline-none text-[15px] font-medium text-text placeholder:text-text-muted/60"
                autoComplete="off"
                spellCheck={false}
              />

              {query && (
                <button
                  type="button"
                  onClick={() => syncQuery('')}
                  className="p-1 rounded-md text-text-muted hover:text-text hover:bg-row-hover transition-colors cursor-pointer"
                  title="Clear input"
                >
                  <FiX className="w-4 h-4" />
                </button>
              )}

              {supported && (
                <button
                  type="button"
                  onClick={toggleMic}
                  title={listening ? 'Stop listening' : 'Voice search'}
                  className={`p-1.5 rounded-lg transition-all shrink-0 cursor-pointer ${
                    listening
                      ? 'bg-danger text-white shadow-md animate-pulse'
                      : 'bg-page border border-border text-text-muted hover:text-primary-500 hover:border-primary-500/40'
                  }`}
                >
                  {listening ? <FiMicOff className="w-4 h-4" /> : <FiMic className="w-4 h-4" />}
                </button>
              )}

              <kbd className="hidden sm:inline-flex items-center gap-0.5 px-2 py-0.5 rounded-md bg-page border border-border text-[10px] font-mono font-semibold text-text-muted shrink-0 shadow-2xs">
                ESC
              </kbd>
            </div>

            {/* ── Category Quick-Filter Chips ── */}
            <div className="px-4 py-2 border-b border-border/70 bg-page/50 flex items-center justify-between gap-2 overflow-x-auto no-scrollbar">
              <div className="flex items-center gap-1.5 shrink-0">
                {CATEGORIES.map((cat) => {
                  const Icon = cat.icon;
                  const count = categoryCounts[cat.id];
                  const isActive = activeCategory === cat.id;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setActiveCategory(cat.id)}
                      className={`px-3 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                        isActive
                          ? 'bg-primary-600 text-white shadow-xs'
                          : 'text-text-muted hover:text-text hover:bg-card/80 border border-transparent'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      <span>{cat.label}</span>
                      {count > 0 && (
                        <span
                          className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold tabular-nums ${
                            isActive
                              ? 'bg-white/20 text-white'
                              : 'bg-slate-200 dark:bg-slate-800 text-text-muted'
                          }`}
                        >
                          {count}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              <span className="shrink-0 hidden lg:inline-flex rounded-md border border-border bg-card px-2 py-0.5 text-[11px] font-medium text-text-muted">
                {user?.role?.name || 'Workspace Search'}
              </span>
            </div>

            {/* Voice Listening Banner */}
            {listening && (
              <div className="px-5 py-2.5 bg-danger-soft/50 border-b border-danger/10 text-[12px] text-danger font-medium flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-danger animate-pulse" />
                Listening… say a student name, enquiry code, phone number, or page
              </div>
            )}

            {/* Loading Banner */}
            {(loading || suggestLoading) && trimmed && (
              <div className="px-5 py-2 border-b border-border/60 flex items-center gap-2 text-xs text-text-muted bg-page/40">
                <Loader size="xs" variant="flow" />
                {loading ? 'Searching real-time across CRM records…' : 'Fetching suggestions…'}
              </div>
            )}

            {/* Quick Actions Row (When Empty Query) */}
            {!trimmed && (
              <div className="px-4 py-2 bg-page/30 border-b border-border/60 flex items-center gap-2 overflow-x-auto no-scrollbar">
                <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider shrink-0 mr-1">
                  Quick Actions:
                </span>
                <button
                  type="button"
                  onClick={() => { close(); navigate(ROUTES.ENQUIRY_CREATE); }}
                  className="px-2.5 py-1 rounded-lg bg-card hover:bg-primary-50 dark:hover:bg-primary-950/40 border border-border hover:border-primary-500/40 text-xs font-semibold text-text flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs shrink-0"
                >
                  <FiPlus className="w-3.5 h-3.5 text-primary-500" />
                  New Enquiry
                </button>
                <button
                  type="button"
                  onClick={() => { close(); navigate(ROUTES.STUDENTS); }}
                  className="px-2.5 py-1 rounded-lg bg-card hover:bg-emerald-50 dark:hover:bg-emerald-950/40 border border-border hover:border-emerald-500/40 text-xs font-semibold text-text flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs shrink-0"
                >
                  <FiUsers className="w-3.5 h-3.5 text-emerald-500" />
                  Students Hub
                </button>
                <button
                  type="button"
                  onClick={() => { close(); navigate(ROUTES.FEES); }}
                  className="px-2.5 py-1 rounded-lg bg-card hover:bg-amber-50 dark:hover:bg-amber-950/40 border border-border hover:border-amber-500/40 text-xs font-semibold text-text flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs shrink-0"
                >
                  <FiDollarSign className="w-3.5 h-3.5 text-amber-500" />
                  Fees &amp; Invoices
                </button>
                <button
                  type="button"
                  onClick={() => { close(); navigate(ROUTES.CALENDAR); }}
                  className="px-2.5 py-1 rounded-lg bg-card hover:bg-purple-50 dark:hover:bg-purple-950/40 border border-border hover:border-purple-500/40 text-xs font-semibold text-text flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs shrink-0"
                >
                  <FiCalendar className="w-3.5 h-3.5 text-purple-500" />
                  Calendar
                </button>
              </div>
            )}

            {/* Results Scroll View */}
            <ScrollArea axis="y" hideBar className="max-h-[min(520px,58vh)] py-2.5 px-3">
              {!trimmed && history.length > 0 && activeCategory === 'all' && (
                <div className="flex items-center justify-between px-3 py-1.5 mb-1">
                  <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Recent Searches</span>
                  <button
                    type="button"
                    onClick={handleClearHistory}
                    className="text-[11px] text-text-muted hover:text-danger flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <FiTrash2 className="w-3 h-3" /> Clear history
                  </button>
                </div>
              )}

              {loading && isFullSearch && (
                <div className="py-16 flex flex-col items-center gap-3">
                  <Loader size="sm" variant="flow" />
                  <p className="text-sm text-text-muted">Searching for &ldquo;{trimmed}&rdquo;…</p>
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
                  <div className="w-14 h-14 rounded-2xl bg-page border border-border flex items-center justify-center mx-auto mb-4">
                    <FiSearch className="w-6 h-6 text-text-muted" />
                  </div>
                  <p className="text-base font-semibold text-text">No results for &ldquo;{trimmed}&rdquo;</p>
                  <p className="text-sm text-text-muted mt-2 max-w-md mx-auto">
                    Try refining your keyword, selecting another category tab, or searching by phone / student ID.
                  </p>
                </div>
              )}
            </ScrollArea>

            {/* Footer Toolbar */}
            <div className="px-5 py-3 border-t border-border flex items-center justify-between text-[11px] text-text-muted bg-page/60">
              <div className="flex items-center gap-4 flex-wrap">
                <span className="flex items-center gap-1.5">
                  <kbd className="px-1.5 py-0.5 rounded-md bg-card border border-border font-mono text-[10px] shadow-2xs">↑↓</kbd>
                  navigate
                </span>
                <span className="flex items-center gap-1.5">
                  <kbd className="px-1.5 py-0.5 rounded-md bg-card border border-border font-mono text-[10px] shadow-2xs">↵</kbd>
                  open
                </span>
                <span className="flex items-center gap-1.5">
                  <kbd className="px-1.5 py-0.5 rounded-md bg-card border border-border font-mono text-[10px] shadow-2xs">tab</kbd>
                  switch category
                </span>
                <span className="flex items-center gap-1.5">
                  <kbd className="px-1.5 py-0.5 rounded-md bg-card border border-border font-mono text-[10px] shadow-2xs">esc</kbd>
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
            <p className="px-3 py-1.5 text-[10px] font-bold text-text-muted uppercase tracking-widest flex items-center gap-1.5">
              <span>{group.label}</span>
              <span className="text-[10px] text-text-muted/70 font-mono font-normal">
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
