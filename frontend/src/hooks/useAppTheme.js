import { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { selectTheme } from '../redux/slices/uiSlice';
import { THEMES } from '../config/constants';
import { applyThemeVariables } from '../theme/applyTheme';

/** Sync Redux theme → DOM class + CSS variables */
export function useAppTheme() {
  const theme = useSelector(selectTheme);

  useEffect(() => {
    const isDark = theme === THEMES.DARK;
    document.documentElement.classList.toggle('dark', isDark);
    applyThemeVariables(theme);
  }, [theme]);
}
