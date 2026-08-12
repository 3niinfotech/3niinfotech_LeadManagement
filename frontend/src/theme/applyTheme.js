import { getTokens } from './tokens.js';
import { THEMES } from '../config/constants.js';
import { STORAGE_KEYS } from '../config/storageKeys.js';

/** Apply semantic tokens as CSS custom properties on :root */
export function applyThemeVariables(mode = THEMES.LIGHT) {
  if (typeof document === 'undefined') return;

  const tokens = getTokens(mode);
  const root = document.documentElement;

  Object.entries(tokens).forEach(([key, value]) => {
    root.style.setProperty(`--${key}`, value);
  });
}

export function initThemeFromStorage() {
  const stored = localStorage.getItem(STORAGE_KEYS.THEME);
  const prefersDark = window.matchMedia?.('(prefers-color-scheme: dark)').matches;
  const mode = stored || (prefersDark ? THEMES.DARK : THEMES.LIGHT);

  document.documentElement.classList.toggle('dark', mode === THEMES.DARK);
  applyThemeVariables(mode);
  return mode;
}
