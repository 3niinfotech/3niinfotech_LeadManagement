import { createTheme } from '@mui/material/styles';
import { getTokens } from './tokens';

/**
 * MUI theme synced with CRM design tokens (light/dark).
 * Used by Material components (dialogs, pickers) inside the app.
 */
export function getMuiTheme(isDark = false) {
  const t = getTokens(isDark ? 'dark' : 'light');

  return createTheme({
    cssVariables: false,
    palette: {
      mode: isDark ? 'dark' : 'light',
      primary: {
        main: t.brand,
        dark: t['brand-hover'],
        light: t['brand-accent'],
        contrastText: '#ffffff',
      },
      secondary: {
        main: t.info,
      },
      success: { main: t.success },
      warning: { main: t.warning },
      error: { main: t.danger },
      info: { main: t.info },
      background: {
        default: t['bg-page'],
        paper: t['bg-card'],
      },
      text: {
        primary: t['text-primary'],
        secondary: t['text-secondary'],
        disabled: t['text-muted'],
      },
      divider: t.border,
    },
    typography: {
      fontFamily: "'Inter', system-ui, sans-serif",
      fontSize: 13,
    },
    shape: {
      borderRadius: 8,
    },
  });
}
