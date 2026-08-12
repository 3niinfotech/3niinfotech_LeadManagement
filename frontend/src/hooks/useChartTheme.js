import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { selectTheme } from '../redux/slices/uiSlice';
import { getChartPalette, getChartTheme } from '../theme/tokens';

/** Reactive chart colors that update with light/dark mode */
export function useChartTheme() {
  const theme = useSelector(selectTheme);

  return useMemo(
    () => ({
      colors: getChartPalette(theme),
      theme: getChartTheme(theme),
    }),
    [theme]
  );
}
