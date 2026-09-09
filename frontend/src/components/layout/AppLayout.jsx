import Sidebar from './Sidebar';
import Navbar from './Navbar';
import AppFooter from './AppFooter';
import PageTransition from './PageTransition';
import GlobalDrawer from '../common/GlobalDrawer';
import CommandPalette from '../common/CommandPalette';
import TeacherPortalShell from './TeacherPortalShell';
import { useSelector } from 'react-redux';
import { selectSidebarCollapsed } from '../../redux/slices/uiSlice';
import { selectUser } from '../../redux/slices/authSlice';
import { sidebar as sidebarTheme } from '../../theme';
import { CompanyRuntimeProvider, useCompanyRuntime } from '../../features/organization/CompanyRuntime';

function ScrollingBanner() {
  const { settings } = useCompanyRuntime();
  if (!settings?.scrollingText) return null;
  return (
    <div className="bg-primary-600 text-white text-xs py-1 px-3 overflow-hidden whitespace-nowrap shrink-0">
      {settings.scrollingText}
    </div>
  );
}

function AdminAppLayout() {
  const collapsed = useSelector(selectSidebarCollapsed);
  const sidebarWidth = collapsed ? sidebarTheme.collapsedWidth : sidebarTheme.width;
  const { settings } = useCompanyRuntime();
  const compactNav = settings?.navbarType === 'compact';

  return (
    <div className="h-screen overflow-hidden bg-background">
      <Sidebar />
      <div
        className="flex flex-col h-screen min-h-0 transition-[margin-left] duration-300 ease-out"
        style={{ marginLeft: sidebarWidth }}
      >
        <ScrollingBanner />
        <div className={`relative z-[1100] shrink-0 overflow-visible ${compactNav ? '[&_header]:h-12' : ''}`}>
          <Navbar />
        </div>
        <main className="relative z-0 flex-1 min-h-0 overflow-hidden flex flex-col p-3">
          <PageTransition />
        </main>
        <AppFooter />
      </div>
      <GlobalDrawer />
      <CommandPalette />
    </div>
  );
}

function AppLayoutInner() {
  const user = useSelector(selectUser);
  const roleSlug = user?.role?.slug;

  if (roleSlug === 'teacher') {
    return (
      <>
        <TeacherPortalShell />
        <GlobalDrawer />
      </>
    );
  }

  return <AdminAppLayout />;
}

export default function AppLayout() {
  return (
    <CompanyRuntimeProvider>
      <AppLayoutInner />
    </CompanyRuntimeProvider>
  );
}
