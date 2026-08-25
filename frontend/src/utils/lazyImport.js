import { lazy } from 'react';

const CHUNK_RELOAD_KEY = 'crm-chunk-reload';
const CHUNK_RELOAD_AT_KEY = 'crm-chunk-reload-at';
/** Allow another auto-reload only after this many ms (avoids sticky failure after HMR). */
const RELOAD_COOLDOWN_MS = 30_000;

function isChunkLoadError(error) {
  const message = error?.message || String(error || '');
  return message.includes('Failed to fetch dynamically imported module')
    || message.includes('Importing a module script failed')
    || message.includes('error loading dynamically imported module')
    || message.includes('Loading chunk')
    || message.includes('ChunkLoadError');
}

function extractFailedUrl(error) {
  const message = error?.message || String(error || '');
  const match = message.match(/https?:\/\/[^\s)'"]+/);
  return match?.[0] || null;
}

function shouldAutoReload() {
  try {
    const flagged = sessionStorage.getItem(CHUNK_RELOAD_KEY) === '1';
    if (!flagged) return true;
    const at = Number(sessionStorage.getItem(CHUNK_RELOAD_AT_KEY) || 0);
    if (!at || Number.isNaN(at)) return false;
    return Date.now() - at > RELOAD_COOLDOWN_MS;
  } catch {
    return false;
  }
}

function markReloaded() {
  try {
    sessionStorage.setItem(CHUNK_RELOAD_KEY, '1');
    sessionStorage.setItem(CHUNK_RELOAD_AT_KEY, String(Date.now()));
  } catch { /* ignore */ }
}

/**
 * Lazy import with at most one automatic reload per cooldown window on stale Vite/chunk errors.
 * Never infinite-loops — subsequent failures surface a clear ErrorBoundary message.
 */
export function lazyImport(importFactory) {
  return lazy(() => importFactory()
    .then((module) => {
      clearChunkReloadFlag();
      return module;
    })
    .catch((error) => {
      if (isChunkLoadError(error) && shouldAutoReload()) {
        markReloaded();
        window.location.reload();
        // Keep promise pending while reload starts — avoid double throw flash
        return new Promise(() => {});
      }

      clearChunkReloadFlag();

      const failedUrl = extractFailedUrl(error);
      const detail = failedUrl
        ? ` (${failedUrl.replace(window.location.origin, '')})`
        : '';
      const friendly = new Error(
        isChunkLoadError(error)
          ? `Failed to load this page module${detail}. Please refresh once, or clear cache and try again.`
          : (error?.message || 'Failed to load this page.'),
      );
      friendly.cause = error;
      throw friendly;
    }));
}

export function clearChunkReloadFlag() {
  try {
    sessionStorage.removeItem(CHUNK_RELOAD_KEY);
    sessionStorage.removeItem(CHUNK_RELOAD_AT_KEY);
  } catch { /* ignore */ }
}
