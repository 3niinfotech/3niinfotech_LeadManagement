import { ThemeProvider } from '@mui/material/styles';
import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { selectTheme } from '../../redux/slices/uiSlice';
import { THEMES } from '../../config/constants';
import { getMuiTheme } from '../../theme/muiTheme';

/** MUI ThemeProvider — follows CRM light/dark mode for charts & Material UI. */
export default function MuiProvider({ children }) {
  const theme = useSelector(selectTheme);
  const isDark = theme === THEMES.DARK;
  const muiTheme = useMemo(() => getMuiTheme(isDark), [isDark]);

  return <ThemeProvider theme={muiTheme}>{children}</ThemeProvider>;
}
