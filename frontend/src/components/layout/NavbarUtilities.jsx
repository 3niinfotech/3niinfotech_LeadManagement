import { useDispatch, useSelector } from 'react-redux';
import { FiMaximize, FiMinimize, FiMoon, FiSun } from 'react-icons/fi';
import { useEffect, useState } from 'react';
import { setTheme, selectTheme } from '../../redux/slices/uiSlice';
import { THEMES } from '../../config/constants';
import { iconSize } from '../../theme/icons';
import NavbarProfileMenu from './NavbarProfileMenu';

function UtilityButton({ icon: Icon, label, onClick, active }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      aria-label={label}
      className={`
        flex items-center justify-center w-9 h-9 rounded-lg transition-all duration-200 focus-ring
        ${active
          ? 'bg-brand-soft text-brand'
          : 'text-text-muted hover:text-text hover:bg-page'}
      `}
    >
      <Icon className={iconSize.sm} />
    </button>
  );
}

export default function NavbarUtilities({ profileOpen, onProfileToggle, onProfileClose }) {
  const dispatch = useDispatch();
  const theme = useSelector(selectTheme);
  const isDark = theme === THEMES.DARK;
  const [fullscreen, setFullscreen] = useState(false);

  useEffect(() => {
    const onFsChange = () => setFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener('fullscreenchange', onFsChange);
    return () => document.removeEventListener('fullscreenchange', onFsChange);
  }, []);

  const toggleTheme = () => {
    dispatch(setTheme(isDark ? THEMES.LIGHT : THEMES.DARK));
  };

  const toggleFullscreen = () => {
    if (document.fullscreenElement) {
      document.exitFullscreen?.();
    } else {
      document.documentElement.requestFullscreen?.();
    }
  };

  return (
    <div className="flex items-center gap-2 shrink-0">
      <div className="flex items-center h-10 px-1 rounded-xl border border-border/70 bg-card-bg/80 shadow-sm">
        <UtilityButton
          icon={isDark ? FiSun : FiMoon}
          label={isDark ? 'Light mode' : 'Dark mode'}
          onClick={toggleTheme}
        />
        <UtilityButton
          icon={fullscreen ? FiMinimize : FiMaximize}
          label={fullscreen ? 'Exit fullscreen' : 'Fullscreen'}
          onClick={toggleFullscreen}
        />
      </div>

      <NavbarProfileMenu
        open={profileOpen}
        onToggle={onProfileToggle}
        onClose={onProfileClose}
      />
    </div>
  );
}
