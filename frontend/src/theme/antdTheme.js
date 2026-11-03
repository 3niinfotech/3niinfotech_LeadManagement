import { theme as antdThemeApi } from 'antd';
import { getTokens } from './tokens';

const { defaultAlgorithm, darkAlgorithm } = antdThemeApi;

/**
 * Ant Design theme — synced with CRM tokens (light/dark).
 */
export function getAntdTheme(isDark = false) {
  const t = getTokens(isDark ? 'dark' : 'light');

  return {
    algorithm: isDark ? darkAlgorithm : defaultAlgorithm,
    token: {
      colorPrimary: t.brand,
      colorPrimaryHover: t['brand-hover'],
      colorError: t.danger,
      colorSuccess: t.success,
      colorWarning: t.warning,
      colorInfo: t.info,
      colorBgContainer: t['bg-card'],
      colorBgElevated: t['bg-card'],
      colorBorder: t.border,
      colorBorderSecondary: t['border-strong'],
      colorText: t['text-primary'],
      colorTextSecondary: t['text-secondary'],
      colorTextPlaceholder: t['text-muted'],
      colorTextQuaternary: t['text-muted'],
      borderRadius: 8,
      borderRadiusLG: 10,
      borderRadiusSM: 6,
      fontFamily: "'Inter', system-ui, sans-serif",
      fontSize: 13,
      controlHeight: 36,
      controlHeightLG: 40,
      controlHeightSM: 36,
      boxShadowSecondary: t['shadow-dropdown'],
      zIndexPopupBase: 99999999,
    },
    components: {
      Select: {
        optionSelectedBg: t['brand-soft'],
        optionActiveBg: t['row-hover'],
        optionSelectedFontWeight: 600,
        controlHeight: 36,
        controlHeightLG: 40,
        controlHeightSM: 36,
        borderRadius: 8,
        colorBorder: t.border,
        colorPrimaryHover: t['brand-hover'],
        activeBorderColor: t.brand,
        hoverBorderColor: t['border-hover'],
      },
    },
  };
}
