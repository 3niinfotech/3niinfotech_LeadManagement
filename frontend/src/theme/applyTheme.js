import { getTokens } from './tokens.js';
import { THEMES } from '../config/constants.js';
import { STORAGE_KEYS } from '../config/storageKeys.js';

/** Apply semantic tokens as CSS custom properties on :root and sync DOM attributes */
export function applyThemeVariables(mode = THEMES.LIGHT) {
  if (typeof document === 'undefined') return;

  const isDark = mode === THEMES.DARK;
  const root = document.documentElement;
  const body = document.body;

  // Force class, attribute, and browser native color-scheme
  root.classList.toggle('dark', isDark);
  root.setAttribute('data-theme', mode);
  root.style.colorScheme = isDark ? 'dark' : 'light';

  if (body) {
    body.classList.toggle('dark', isDark);
    body.setAttribute('data-theme', mode);
    body.style.colorScheme = isDark ? 'dark' : 'light';
  }

  const tokens = getTokens(mode);
  Object.entries(tokens).forEach(([key, value]) => {
    root.style.setProperty(`--${key}`, value);
  });
}

export function initThemeFromStorage() {
  const stored = localStorage.getItem(STORAGE_KEYS.THEME);
  const prefersDark = window.matchMedia?.('(prefers-color-scheme: dark)').matches;
  const mode = stored || (prefersDark ? THEMES.DARK : THEMES.LIGHT);

  applyThemeVariables(mode);
  return mode;
}
