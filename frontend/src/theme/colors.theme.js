/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  GLOBAL THEME COLORS — edit ONLY this file
 *
 *  • Light + Dark palettes
 *  • Flows to: CSS variables, Tailwind, Ant Design, charts, loaders, toasts
 *  • After changes run: npm run sync:theme  (or npm run dev — runs automatically)
 * ═══════════════════════════════════════════════════════════════════════════
 */

export const COLORS = {
  light: {
    brand: {
      main: '#2563EB',
      hover: '#1D4ED8',
      soft: '#EFF6FF',
      accent: '#60A5FA',
    },
    surface: {
      page: '#F7F8FA',
      card: '#FFFFFF',
      sidebar: '#F1F5F9',
      navbar: '#FFFFFF',
      input: '#FFFFFF',
      gridHeader: '#EEF3FA',
      gridFooter: '#F4F7FB',
      rowHover: '#FAFAFB',
    },
    text: {
      primary: '#111827',
      secondary: '#6B7280',
      muted: '#9CA3AF',
      gridCell: '#334155',
      gridHeader: '#64748B',
    },
    border: {
      default: '#E5E7EB',
      strong: '#D1D5DB',
      hover: '#CBD5E1',
      field: '#E2E8F0',
      grid: '#F1F5F9',
    },
    semantic: {
      success: { main: '#16A34A', soft: '#ECFDF3', action: '#059669' },
      warning: { main: '#D97706', soft: '#FFFBEB' },
      danger: { main: '#DC2626', soft: '#FEF2F2' },
      info: { main: '#0891B2', soft: '#ECFEFF' },
    },
    sidebar: {
      hover: '#E2E8F0',
      activeBg: '#DBEAFE',
      activeText: '#2563EB',
      activeBar: '#2563EB',
      submenuBg: '#F8FAFC',
      groupOpen: '#EEF2F7',
      submenuText: '#64748B',
      submenuLine: '#CBD5E1',
    },
    grid: {
      rowSelected: 'rgba(37, 99, 235, 0.05)',
      rowHover: '#F0F5FF',
      oddRow: '#FFFFFF',
      headerBorder: '#D8E2F0',
      columnBorder: '#E8EDF4',
      selectedAccent: '#3B82F6',
      checkboxBorder: '#94A3B8',
      checkboxBg: '#FFFFFF',
      checkboxChecked: '#2563EB',
      actionEdit: '#059669',
      actionDelete: '#DC2626',
      actionHoverBg: '#F8FAFC',
      pinShadow: 'rgba(15, 23, 42, 0.06)',
    },
    loader: {
      track: '#E8EDF3',
      overlay: 'rgba(255, 255, 255, 0.78)',
      skeleton: '#F1F5F9',
      skeletonHighlight: 'rgba(255, 255, 255, 0.65)',
    },
    calendar: {
      outsideMonth: '#CBD5E1',
      disabled: '#E2E8F0',
      hoverBg: '#EFF6FF',
      hoverText: '#2563EB',
      dialogShadow: 'rgba(15, 23, 42, 0.12)',
    },
    select: {
      clearBg: '#F1F5F9',
      clearBgHover: '#E2E8F0',
      clearText: '#64748B',
      clearTextHover: '#334155',
    },
    shadow: {
      card: '0 1px 2px rgba(0, 0, 0, 0.04)',
      dropdown: '0 4px 12px rgba(0, 0, 0, 0.08)',
      sidebar: '2px 0 12px rgba(15, 23, 42, 0.04)',
      loaderCard: '0 20px 50px rgba(15, 23, 42, 0.12)',
    },
    scrollbar: {
      thumb: '#CBD5E1',
      thumbHover: '#94A3B8',
    },
    overlay: 'rgba(15, 23, 42, 0.4)',
    toast: {
      success: { border: '#22C55E', icon: '#22C55E', iconBg: '#DCFCE7' },
      error: { border: '#EF4444', icon: '#EF4444', iconBg: '#FEE2E2' },
      warning: { border: '#F59E0B', icon: '#F59E0B', iconBg: '#FEF3C7' },
      info: { border: '#3B82F6', icon: '#3B82F6', iconBg: '#DBEAFE' },
    },
    chart: {
      accent: '#8B5CF6',
    },
  },

  dark: {
    brand: {
      main: '#3B82F6',
      hover: '#60A5FA',
      soft: '#1E3A8A',
      accent: '#93C5FD',
    },
    surface: {
      page: '#0B1120',
      card: '#1E293B',
      sidebar: '#0F172A',
      navbar: '#0F172A',
      input: '#1E293B',
      gridHeader: '#141F33',
      gridFooter: '#141F33',
      rowHover: '#1E293B',
    },
    text: {
      primary: '#F1F5F9',
      secondary: '#94A3B8',
      muted: '#64748B',
      gridCell: '#CBD5E1',
      gridHeader: '#94A3B8',
    },
    border: {
      default: '#334155',
      strong: '#475569',
      hover: '#475569',
      field: '#334155',
      grid: '#1E293B',
    },
    semantic: {
      success: { main: '#22C55E', soft: '#14532D', action: '#4ADE80' },
      warning: { main: '#F59E0B', soft: '#78350F' },
      danger: { main: '#EF4444', soft: '#7F1D1D' },
      info: { main: '#22D3EE', soft: '#164E63' },
    },
    sidebar: {
      hover: '#1E293B',
      activeBg: '#1E3A8A',
      activeText: '#60A5FA',
      activeBar: '#3B82F6',
      submenuBg: '#111827',
      groupOpen: '#172033',
      submenuText: '#94A3B8',
      submenuLine: '#334155',
    },
    grid: {
      rowSelected: 'rgba(59, 130, 246, 0.08)',
      rowHover: '#1A2436',
      oddRow: '#1E293B',
      headerBorder: '#334155',
      columnBorder: '#1E293B',
      selectedAccent: '#3B82F6',
      checkboxBorder: '#475569',
      checkboxBg: '#1E293B',
      checkboxChecked: '#3B82F6',
      actionEdit: '#4ADE80',
      actionDelete: '#F87171',
      actionHoverBg: '#1E293B',
      pinShadow: 'rgba(0, 0, 0, 0.25)',
    },
    loader: {
      track: '#334155',
      overlay: 'rgba(15, 23, 42, 0.82)',
      skeleton: '#1E293B',
      skeletonHighlight: 'rgba(255, 255, 255, 0.08)',
    },
    calendar: {
      outsideMonth: '#475569',
      disabled: '#334155',
      hoverBg: '#1E3A8A',
      hoverText: '#60A5FA',
      dialogShadow: 'rgba(0, 0, 0, 0.45)',
    },
    select: {
      clearBg: '#334155',
      clearBgHover: '#475569',
      clearText: '#94A3B8',
      clearTextHover: '#F1F5F9',
    },
    shadow: {
      card: '0 1px 2px rgba(0, 0, 0, 0.2)',
      dropdown: '0 4px 16px rgba(0, 0, 0, 0.35)',
      sidebar: '2px 0 16px rgba(0, 0, 0, 0.25)',
      loaderCard: '0 20px 50px rgba(0, 0, 0, 0.35)',
    },
    scrollbar: {
      thumb: '#475569',
      thumbHover: '#64748B',
    },
    overlay: 'rgba(0, 0, 0, 0.6)',
    toast: {
      success: { border: '#22C55E', icon: '#4ADE80', iconBg: '#14532D' },
      error: { border: '#EF4444', icon: '#F87171', iconBg: '#7F1D1D' },
      warning: { border: '#F59E0B', icon: '#FBBF24', iconBg: '#78350F' },
      info: { border: '#3B82F6', icon: '#60A5FA', iconBg: '#1E3A8A' },
    },
    chart: {
      accent: '#A78BFA',
    },
  },
};
