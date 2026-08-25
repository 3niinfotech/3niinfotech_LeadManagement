/**
 * Flat CSS-variable tokens — derived from colors.theme.js (do not edit hex here).
 */
import { COLORS } from './colors.theme.js';

/** Flatten nested palette → CSS custom property map */
export function paletteToCssVars(palette) {
  const { brand, surface, text, border, semantic, sidebar, grid, loader, calendar, select, shadow, scrollbar, overlay, toast, chart } = palette;

  return {
    'bg-page': surface.page,
    'bg-card': surface.card,
    'bg-sidebar': surface.sidebar,
    'bg-navbar': surface.navbar,
    'bg-input': surface.input,
    'bg-grid-header': surface.gridHeader,
    'bg-grid-footer': surface.gridFooter,

    'text-primary': text.primary,
    'text-secondary': text.secondary,
    'text-muted': text.muted,
    'text-grid-cell': text.gridCell,
    'text-grid-header': text.gridHeader,

    brand: brand.main,
    'brand-hover': brand.hover,
    'brand-soft': brand.soft,
    'brand-accent': brand.accent,

    border: border.default,
    'border-strong': border.strong,
    'border-hover': border.hover,
    'field-border': border.field,
    'grid-border': border.grid,

    success: semantic.success.main,
    'success-soft': semantic.success.soft,
    'success-action': semantic.success.action,
    warning: semantic.warning.main,
    'warning-soft': semantic.warning.soft,
    danger: semantic.danger.main,
    'danger-soft': semantic.danger.soft,
    info: semantic.info.main,
    'info-soft': semantic.info.soft,

    'sidebar-hover': sidebar.hover,
    'sidebar-active-bg': sidebar.activeBg,
    'sidebar-active-text': sidebar.activeText,
    'sidebar-active-bar': sidebar.activeBar,
    'sidebar-submenu-bg': sidebar.submenuBg,
    'sidebar-group-open': sidebar.groupOpen,
    'sidebar-submenu-text': sidebar.submenuText,
    'sidebar-submenu-line': sidebar.submenuLine,

    'grid-row-selected': grid.rowSelected,
    'grid-row-hover': grid.rowHover,
    'grid-odd-row': grid.oddRow,
    'grid-row-mine': grid.rowMine,
    'grid-row-mine-odd': grid.rowMineOdd,
    'grid-row-mine-hover': grid.rowMineHover,
    'grid-row-mine-selected': grid.rowMineSelected,
    'grid-header-border': grid.headerBorder,
    'grid-column-border': grid.columnBorder,
    'grid-selected-accent': grid.selectedAccent,
    'grid-checkbox-border': grid.checkboxBorder,
    'grid-checkbox-bg': grid.checkboxBg,
    'grid-checkbox-checked': grid.checkboxChecked,
    'grid-action-edit': grid.actionEdit,
    'grid-action-delete': grid.actionDelete,
    'grid-action-hover-bg': grid.actionHoverBg,
    'grid-pin-shadow': grid.pinShadow,

    'loader-track': loader.track,
    'loader-overlay': loader.overlay,
    'skeleton-base': loader.skeleton,
    'skeleton-highlight': loader.skeletonHighlight,

    'cal-outside': calendar.outsideMonth,
    'cal-disabled': calendar.disabled,
    'cal-hover-bg': calendar.hoverBg,
    'cal-hover-text': calendar.hoverText,
    'cal-dialog-shadow': calendar.dialogShadow,

    'select-clear-bg': select.clearBg,
    'select-clear-bg-hover': select.clearBgHover,
    'select-clear-text': select.clearText,
    'select-clear-text-hover': select.clearTextHover,

    'shadow-card': shadow.card,
    'shadow-dropdown': shadow.dropdown,
    'shadow-sidebar': shadow.sidebar,
    'shadow-loader-card': shadow.loaderCard,

    'scrollbar-thumb': scrollbar.thumb,
    'scrollbar-thumb-hover': scrollbar.thumbHover,

    overlay,

    'toast-success-border': toast.success.border,
    'toast-success-icon': toast.success.icon,
    'toast-success-icon-bg': toast.success.iconBg,
    'toast-error-border': toast.error.border,
    'toast-error-icon': toast.error.icon,
    'toast-error-icon-bg': toast.error.iconBg,
    'toast-warning-border': toast.warning.border,
    'toast-warning-icon': toast.warning.icon,
    'toast-warning-icon-bg': toast.warning.iconBg,
    'toast-info-border': toast.info.border,
    'toast-info-icon': toast.info.icon,
    'toast-info-icon-bg': toast.info.iconBg,

    'chart-accent': chart.accent,

    'row-hover': surface.rowHover,
  };
}

export const lightTokens = paletteToCssVars(COLORS.light);
export const darkTokens = paletteToCssVars(COLORS.dark);

export const themeModes = {
  light: lightTokens,
  dark: darkTokens,
};

export function getTokens(mode = 'light') {
  return themeModes[mode] || lightTokens;
}

export function getPalette(mode = 'light') {
  return COLORS[mode] || COLORS.light;
}

/** Chart palette — uses token values per mode */
export function getChartPalette(mode = 'light') {
  const t = getTokens(mode);
  return [t.brand, t.info, t.success, t.warning, t.danger, t['chart-accent']];
}

export function getChartTheme(mode = 'light') {
  const t = getTokens(mode);
  return {
    grid: t.border,
    axis: t['text-muted'],
    bar: t.brand,
    tooltip: {
      bg: t['bg-card'],
      border: t.border,
      text: t['text-primary'],
    },
  };
}

/** Loader / skeleton tokens for JS components */
export function getLoaderTheme(mode = 'light') {
  const t = getTokens(mode);
  return {
    spinner: {
      track: t['loader-track'],
      accent: 'var(--brand)',
      glow: 'color-mix(in srgb, var(--brand) 18%, transparent)',
    },
    shimmer: {
      base: t['skeleton-base'],
      highlight: t['skeleton-highlight'],
    },
    overlay: {
      bg: t['loader-overlay'],
      blur: '10px',
    },
    card: {
      radius: '16px',
      shadow: t['shadow-loader-card'],
    },
    table: {
      headerBg: t['bg-grid-header'],
      rowBorder: t['grid-border'],
    },
  };
}

/** Toast type colors for ThemedToast */
export function getToastTheme(mode = 'light') {
  const t = getTokens(mode);
  const p = getPalette(mode);
  const isDark = mode === 'dark';
  const sem = p.semantic;

  const type = (key, semanticKey) => {
    const soft = sem[semanticKey]?.soft || t['bg-card'];
    const main = t[`toast-${key}-border`];
    return {
      bg: t['bg-card'],
      softBg: soft,
      border: main,
      borderSoft: isDark ? `${main}66` : `${main}33`,
      icon: t[`toast-${key}-icon`],
      iconBg: t[`toast-${key}-icon-bg`],
      text: t['text-primary'],
      progressTrack: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(15,23,42,0.08)',
    };
  };

  return {
    zIndex: 1080,
    duration: {
      success: 3500,
      create: 3500,
      deleted: 3500,
      error: 5200,
      info: 4000,
      warning: 4500,
    },
    types: {
      success: type('success', 'success'),
      error: type('error', 'danger'),
      warning: type('warning', 'warning'),
      info: type('info', 'info'),
    },
    shell: {
      bg: t['bg-card'],
      border: t.border,
      shadow: isDark
        ? '0 12px 40px rgba(0,0,0,0.45)'
        : '0 12px 32px rgba(15,23,42,0.12)',
    },
    isDark,
    palette: p,
  };
}
