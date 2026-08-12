import { getChartPalette, getChartTheme } from './tokens';

/** @deprecated Use useChartTheme hook in components for reactive theme */
export const chartColors = getChartPalette('light');

export const chartTheme = getChartTheme('light');

export { getChartPalette, getChartTheme };
