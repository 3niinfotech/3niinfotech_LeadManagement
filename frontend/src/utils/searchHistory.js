import { STORAGE_KEYS } from '../config/storageKeys';

const MAX_ITEMS = 20;

function readStore() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.SEARCH_HISTORY) || '{}');
  } catch {
    return {};
  }
}

function writeStore(store) {
  localStorage.setItem(STORAGE_KEYS.SEARCH_HISTORY, JSON.stringify(store));
}

function userKey(userId) {
  return userId || 'anonymous';
}

/** @typedef {{ id: string, query: string, label?: string, subtitle?: string, timestamp: number, type: 'query'|'result', action?: object }} HistoryEntry */

/** @returns {HistoryEntry[]} */
export function getSearchHistory(userId) {
  const store = readStore();
  return store[userKey(userId)] || [];
}

/** @param {Omit<HistoryEntry, 'id'|'timestamp'> & { id?: string, timestamp?: number }} entry */
export function addSearchHistory(userId, entry) {
  const key = userKey(userId);
  const store = readStore();
  const list = store[key] || [];

  const normalized = {
    id: entry.id || crypto.randomUUID(),
    query: entry.query?.trim() || '',
    label: entry.label,
    subtitle: entry.subtitle,
    type: entry.type || 'query',
    action: entry.action,
    timestamp: entry.timestamp || Date.now(),
  };

  if (!normalized.query && !normalized.label) return list;

  const dedupeKey = normalized.action
    ? `${normalized.type}:${JSON.stringify(normalized.action)}`
    : `query:${normalized.query.toLowerCase()}`;

  const filtered = list.filter((item) => {
    const itemKey = item.action
      ? `${item.type}:${JSON.stringify(item.action)}`
      : `query:${item.query.toLowerCase()}`;
    return itemKey !== dedupeKey;
  });

  const next = [normalized, ...filtered].slice(0, MAX_ITEMS);
  store[key] = next;
  writeStore(store);
  return next;
}

export function removeSearchHistoryItem(userId, id) {
  const key = userKey(userId);
  const store = readStore();
  store[key] = (store[key] || []).filter((item) => item.id !== id);
  writeStore(store);
  return store[key];
}

export function clearSearchHistory(userId) {
  const key = userKey(userId);
  const store = readStore();
  store[key] = [];
  writeStore(store);
}

/** History items matching query prefix */
export function filterSearchHistory(userId, query) {
  const q = query?.trim().toLowerCase();
  if (!q) return getSearchHistory(userId);
  return getSearchHistory(userId).filter(
    (item) =>
      item.query.toLowerCase().includes(q)
      || item.label?.toLowerCase().includes(q)
      || item.subtitle?.toLowerCase().includes(q),
  );
}

/** Most frequent queries for "trending" section */
export function getTrendingQueries(userId, limit = 5) {
  const history = getSearchHistory(userId).filter((h) => h.type === 'query' && h.query);
  const freq = {};
  history.forEach((h) => {
    const k = h.query.toLowerCase();
    freq[k] = (freq[k] || 0) + 1;
  });
  return Object.entries(freq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([query, count]) => ({ query, count }));
}

export function formatHistoryAge(timestamp) {
  const diff = Date.now() - timestamp;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(timestamp).toLocaleDateString();
}
