import { lazy } from 'react';

const CHUNK_RELOAD_KEY = 'crm-chunk-reload';

/**
 * Lazy import with one automatic reload on stale Vite chunk errors (dev/HMR).
 */
export function lazyImport(importFactory) {
  return lazy(() => importFactory()
    .then((module) => {
      sessionStorage.removeItem(CHUNK_RELOAD_KEY);
      return module;
    })
    .catch((error) => {
      const message = error?.message || '';
      const isChunkError = message.includes('Failed to fetch dynamically imported module')
        || message.includes('Importing a module script failed')
        || message.includes('error loading dynamically imported module');

      if (isChunkError && !sessionStorage.getItem(CHUNK_RELOAD_KEY)) {
        sessionStorage.setItem(CHUNK_RELOAD_KEY, '1');
        window.location.reload();
      }

      sessionStorage.removeItem(CHUNK_RELOAD_KEY);
      throw error;
    }));
}

export function clearChunkReloadFlag() {
  sessionStorage.removeItem(CHUNK_RELOAD_KEY);
}
