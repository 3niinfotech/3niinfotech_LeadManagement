import { FiMenu, FiBell, FiSun, FiMoon, FiMaximize, FiLogOut } from 'react-icons/fi';

export const navbarConfig = {
  search: {
    placeholder: 'Search students, enquiries, pages…',
    shortcut: 'Ctrl+K',
  },
  actions: [
    { id: 'theme', icons: { light: FiMoon, dark: FiSun } },
    { id: 'fullscreen', icon: FiMaximize },
    { id: 'notifications', icon: FiBell, showBadge: true },
    { id: 'logout', icon: FiLogOut },
  ],
  menu: { icon: FiMenu },
};
