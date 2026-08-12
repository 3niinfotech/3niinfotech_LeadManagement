import Sidebar from './Sidebar';
import Navbar from './Navbar';
import AppFooter from './AppFooter';
import PageTransition from './PageTransition';
import GlobalDrawer from '../common/GlobalDrawer';
import CommandPalette from '../common/CommandPalette';
import { useSelector } from 'react-redux';
import { selectSidebarCollapsed } from '../../redux/slices/uiSlice';
import { sidebar as sidebarTheme } from '../../theme';

export default function AppLayout() {
  const collapsed = useSelector(selectSidebarCollapsed);
  const sidebarWidth = collapsed ? sidebarTheme.collapsedWidth : sidebarTheme.width;

  return (
    <div className="h-screen overflow-hidden bg-background">
      <Sidebar />
      <div
        className="flex flex-col h-screen min-h-0 transition-[margin-left] duration-300 ease-out"
        style={{ marginLeft: sidebarWidth }}
      >
        <Navbar />
        <main className="flex-1 min-h-0 overflow-hidden flex flex-col p-3">
          <PageTransition />
        </main>
        <AppFooter />
      </div>
      <GlobalDrawer />
      <CommandPalette />
    </div>
  );
}
