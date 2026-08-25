export const animation = {
  fadeIn: 'fadeIn 0.2s ease-in-out',
  slideIn: 'slideIn 0.3s ease-out',
  scaleIn: 'scaleIn 0.2s ease-out',
};

export const transition = {
  fast: '150ms ease',
  DEFAULT: '200ms ease',
  slow: '300ms ease',
};

export const opacity = {
  disabled: '0.5',
  hover: '0.8',
};

export const zIndex = {
  dropdown: 1000,
  sticky: 1020,
  modal: 1050,
  popover: 1060,
  tooltip: 1070,
  toast: 1080,
};

export const sidebar = {
  width: '280px',
  collapsedWidth: '76px',
  miniWidth: '76px',
  headerHeight: '64px',
  toggleTop: '64px',
  toggleSize: '28px',
  toggleEdgeOffset: '14px',
  flyoutGap: 12,
  flyoutHideDelay: 180,
};

export const navbar = {
  height: '64px',
};

export const footer = {
  height: 'auto',
  minHeight: '52px',
};

export const layout = {
  contentPadding: '0.75rem',
  maxWidth: '100%',
};

export const table = {
  rowHeight: '48px',
  rowHeightCompact: '36px',
  headerHeight: '44px',
};

export const buttons = {
  height: { sm: '32px', md: '40px', lg: '48px' },
  padding: { sm: '0 12px', md: '0 16px', lg: '0 24px' },
};

export const inputs = {
  height: { sm: '32px', md: '40px', lg: '48px' },
};

export const modals = {
  sm: '400px',
  md: '560px',
  lg: '720px',
  xl: '960px',
};

export const cards = {
  padding: '1.25rem',
  radius: '0.5rem',
};

export const typography = {
  fontFamily: "'Inter', system-ui, sans-serif",
  headingWeight: '600',
  bodyWeight: '400',
};

export { loaderTheme, toastTheme } from './feedback';
export { getAntdTheme } from './antdTheme';
export { iconSize, iconBoxSize } from './icons';
export { chartColors, chartTheme, getChartPalette, getChartTheme } from './charts';
export { lightTokens, darkTokens, themeModes, getTokens, getPalette, getLoaderTheme, getToastTheme } from './tokens';
export { COLORS } from './colors.theme';
export { applyThemeVariables, initThemeFromStorage } from './applyTheme';
export { routeVariants, pageStagger, pageItem, pageEase } from './pageMotion';
