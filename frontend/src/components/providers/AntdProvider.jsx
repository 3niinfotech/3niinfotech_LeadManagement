import { ConfigProvider, App as AntApp } from 'antd';
import { useSelector } from 'react-redux';
import { selectTheme } from '../../redux/slices/uiSlice';
import { THEMES } from '../../config/constants';
import { getAntdTheme } from '../../theme/antdTheme';

/** Wraps app with Ant Design ConfigProvider — theme follows CRM light/dark mode */
export default function AntdProvider({ children }) {
  const theme = useSelector(selectTheme);
  const isDark = theme === THEMES.DARK;

  return (
    <ConfigProvider
      theme={getAntdTheme(isDark)}
      getPopupContainer={() => document.body}
    >
      <AntApp>{children}</AntApp>
    </ConfigProvider>
  );
}
