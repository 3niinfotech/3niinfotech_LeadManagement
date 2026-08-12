import { getLoaderTheme as getLoader, getToastTheme as getToast } from './tokens';

export { getLoaderTheme, getToastTheme } from './tokens';

/** @deprecated Use getLoaderTheme(mode) for reactive theme */
export const loaderTheme = getLoader('light');

/** @deprecated Use getToastTheme(mode) for reactive theme */
export const toastTheme = getToast('light');
