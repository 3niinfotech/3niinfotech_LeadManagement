import { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiSearch, FiMic, FiMicOff, FiCommand, FiTrash2, FiX, FiSliders,
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

export default function CommandPalette() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const open = useSelector(selectCommandPaletteOpen);
  const reduxQuery = useSelector(selectCommandPaletteQuery);
  const user = useSelector(selectUser);
  const userId = user?.id;
  const { can, canAny, roleSlug } = usePermissions();

  const [query, setQuery] = useState('');
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

  const groups = useMemo(() => {
    if (!trimmed) return buildIdleGroups(history, trending, searchAccess);
    if (!isFullSearch || (loading && !apiResults)) {
      return buildSuggestionGroups(trimmed, history, apiSuggestions, searchAccess);
    }
    return buildSearchGroups(trimmed, apiResults, searchAccess);
  }, [trimmed, isFullSearch, loading, apiResults, apiSuggestions, history, trending, searchAccess]);

  const flatItems = useMemo(() => flattenGroups(groups), [groups]);
  const resultCount = getTotalCount(groups);

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
  }, [query, groups.length]);

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
            className="relative w-full max-w-4xl bg-card-bg rounded-2xl shadow-dropdown overflow-hidden border border-border/80"
            role="dialog"
            aria-modal="true"
            aria-label="Global search"
          >
            {/* Search header */}
            <div className="flex items-center gap-2.5 px-4 py-3 border-b border-border bg-card-bg">
              <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-brand text-white shrink-0 shadow-sm shadow-brand/20">
                <FiSearch className="w-4 h-4" />
              </span>

              <div className="flex-1 min-w-0 relative">
                <input
                  ref={inputRef}
                  value={query}
                  onChange={(e) => syncQuery(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Search students, enquiries, leads, pages…"
                  className="crm-field crm-input w-full crm-field--sm pl-3.5 pr-9"
                  autoComplete="off"
                  spellCheck={false}
                />
                {query && (
                  <button
                    type="button"
                    onClick={() => syncQuery('')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-md text-text-muted hover:text-text hover:bg-row-hover"
                  >
                    <FiX className={iconSize.sm} />
                  </button>
                )}
              </div>

              {supported && (
                <button
                  type="button"
                  onClick={toggleMic}
                  title={listening ? 'Stop listening' : 'Voice search'}
                  className={`p-2 rounded-lg transition-all shrink-0 ${
                    listening
                      ? 'bg-danger text-white shadow-md animate-pulse'
                      : 'bg-page border border-border text-text-muted hover:text-brand hover:border-brand/30'
                  }`}
                >
                  {listening ? <FiMicOff className="w-4 h-4" /> : <FiMic className="w-4 h-4" />}
                </button>
              )}

              <kbd className="hidden md:inline-flex items-center gap-1 px-2 py-1.5 rounded-lg bg-page border border-border text-[10px] font-medium text-text-muted shrink-0">
                <FiCommand className="w-3 h-3" />K
              </kbd>
            </div>

            {listening && (
              <div className="px-5 py-2.5 bg-danger-soft/50 border-b border-danger/10 text-[12px] text-danger font-medium flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-danger animate-pulse" />
                Listening… say a name, email, enquiry code, or page
              </div>
            )}

            <div className="px-5 py-1.5 border-b border-border/60 bg-page/50 flex items-center justify-between gap-3 text-[11px]">
              <span className="text-text-muted">
                Search is limited to records and pages available in your workspace.
              </span>
              <span className="shrink-0 rounded-md border border-border bg-card-bg px-2 py-0.5 font-medium text-text-secondary">
                {user?.role?.name || 'Your access'}
              </span>
            </div>

            {/* Status bar */}
            {(loading || suggestLoading) && trimmed && (
              <div className="px-5 py-2 border-b border-border/60 flex items-center gap-2 text-xs text-text-muted bg-page/50">
                <Loader size="xs" variant="flow" />
                {loading ? 'Searching across CRM records…' : 'Fetching suggestions…'}
              </div>
            )}

            <ScrollArea axis="y" hideBar className="max-h-[min(520px,58vh)] py-2 px-2">
              {!trimmed && history.length > 0 && (
                <div className="flex items-center justify-between px-3 py-1.5 mb-1">
                  <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Your search history</span>
                  <button
                    type="button"
                    onClick={handleClearHistory}
                    className="text-[11px] text-text-muted hover:text-danger flex items-center gap-1 transition-colors"
                  >
                    <FiTrash2 className="w-3 h-3" /> Clear all
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
                  groups={groups}
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
                  <p className="text-base font-medium text-text">No results for &ldquo;{trimmed}&rdquo;</p>
                  <p className="text-sm text-text-muted mt-2 max-w-md mx-auto">
                    Try a full name like &ldquo;Rahul Sharma&rdquo;, enquiry code, email, or a page name
                  </p>
                </div>
              )}
            </ScrollArea>

            <div className="px-5 py-3 border-t border-border flex items-center justify-between text-[11px] text-text-muted bg-page/60">
              <div className="flex items-center gap-4 flex-wrap">
                <span className="flex items-center gap-1.5">
                  <kbd className="px-1.5 py-0.5 rounded-md bg-card-bg border border-border font-mono text-[10px]">↑↓</kbd>
                  navigate
                </span>
                <span className="flex items-center gap-1.5">
                  <kbd className="px-1.5 py-0.5 rounded-md bg-card-bg border border-border font-mono text-[10px]">↵</kbd>
                  open
                </span>
                <span className="flex items-center gap-1.5">
                  <kbd className="px-1.5 py-0.5 rounded-md bg-card-bg border border-border font-mono text-[10px]">esc</kbd>
                  close
                </span>
              </div>
              <div className="flex items-center gap-3">
                {!trimmed && history.length > 0 && (
                  <span className="hidden sm:inline">{history.length} recent</span>
                )}
                {resultCount > 0 && (
                  <span className="font-semibold text-brand tabular-nums">{resultCount} results</span>
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
            <p className="px-3 py-1.5 text-[10px] font-bold text-text-muted uppercase tracking-widest">
              {group.label}
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
