import { useEffect, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Provider, useDispatch } from 'react-redux';
import ToastProvider from './components/ui/ToastProvider';
import AntdProvider from './components/providers/AntdProvider';
import { store } from './redux/store';
import ProtectedRoute from './components/common/ProtectedRoute';
import RequirePortal from './components/common/RequirePortal';
import PermissionRoute from './components/common/PermissionRoute';
import ErrorBoundary from './components/common/ErrorBoundary';
import AppLayout from './components/layout/AppLayout';
import StudentShell from './components/layout/StudentShell';
import AgentShell from './components/layout/AgentShell';
import GlobalLoader from './components/ui/GlobalLoader';
import { useAppTheme } from './hooks/useAppTheme';
import toastService from './services/toast/toast.service';
import { ROUTES } from './config/routes';
import { PERMISSIONS } from './config/permissions';
import { PORTALS } from './config/portal.config';
import { useSocket } from './hooks/useSocket';
import { lazyImport } from './utils/lazyImport';
import AssignmentHeartbeat from './components/common/AssignmentHeartbeat';
import FeatureBootstrap from './components/common/FeatureBootstrap';
import AuthInitGate from './components/common/AuthInitGate';

const PortalSelectorPage = lazyImport(() => import('./pages/auth/PortalSelectorPage'));
const AuthLoginForm = lazyImport(() => import('./components/auth/AuthLoginForm'));
const StudentRegisterPage = lazyImport(() => import('./pages/auth/StudentRegisterPage'));
const AgentRegisterPage = lazyImport(() => import('./pages/auth/AgentRegisterPage'));
const DashboardPage = lazyImport(() => import('./pages/dashboard/DashboardPage'));
const StudentsPage = lazyImport(() => import('./pages/students/StudentsPage'));
const EnquiryPage = lazyImport(() => import('./features/enquiry/pages/EnquiryPage'));
const EnquiryCreatePage = lazyImport(() => import('./features/enquiry/pages/EnquiryCreatePage'));
const EnquiryDetailPage = lazyImport(() => import('./features/enquiry/pages/EnquiryDetailPage'));
const CounsellorQueuePage = lazyImport(() => import('./features/assignment/pages/CounsellorQueuePage'));
const SettingsPage = lazyImport(() => import('./pages/settings/SettingsPage'));
const PlaceholderPage = lazyImport(() => import('./pages/common/PlaceholderPage'));
const ProfilePage = lazyImport(() => import('./pages/profile/ProfilePage'));
const UsersPage = lazyImport(() => import('./pages/users/UsersPage'));
const RolesPage = lazyImport(() => import('./features/rbac/pages/RolesPage'));
const ReportsPage = lazyImport(() => import('./features/reports/pages/ReportsPage'));
const FeatureTogglePage = lazyImport(() => import('./features/feature/pages/FeatureTogglePage'));
const MasterHubPage = lazyImport(() => import('./features/master/pages/MasterHubPage'));
const StudentDetailPage = lazyImport(() => import('./features/student/pages/StudentDetailPage'));
const MasterDataPage = lazyImport(() => import('./features/master/pages/MasterDataPage'));
const DemoPage = lazyImport(() => import('./features/demo/pages/DemoPage'));
const FeesPage = lazyImport(() => import('./features/fees/pages/FeesPage'));
const ForbiddenPage = lazyImport(() => import('./pages/errors/ForbiddenPage'));
const StudentDashboardPage = lazyImport(() => import('./pages/student-portal/StudentDashboardPage'));
const AgentDashboardPage = lazyImport(() => import('./pages/agent-portal/AgentDashboardPage'));
const AgentStudentsPage = lazyImport(() => import('./pages/agent-portal/AgentStudentsPage'));

function AppRoutes() {
  useSocket();
  return (
    <Routes>
      {/* Public auth */}
      <Route path="/login" element={<Suspense fallback={<GlobalLoader />}><PortalSelectorPage /></Suspense>} />
      <Route path="/login/admin" element={<Suspense fallback={<GlobalLoader />}><AuthLoginForm portal={PORTALS.ADMIN} /></Suspense>} />
      <Route path="/login/student" element={<Suspense fallback={<GlobalLoader />}><AuthLoginForm portal={PORTALS.STUDENT} /></Suspense>} />
      <Route path="/login/agent" element={<Suspense fallback={<GlobalLoader />}><AuthLoginForm portal={PORTALS.AGENT} /></Suspense>} />
      <Route path="/register/student" element={<Suspense fallback={<GlobalLoader />}><StudentRegisterPage /></Suspense>} />
      <Route path="/register/agent" element={<Suspense fallback={<GlobalLoader />}><AgentRegisterPage /></Suspense>} />

      {/* Legacy redirects */}
      <Route path="/dashboard" element={<Navigate to={ROUTES.DASHBOARD} replace />} />
      <Route path="/enquiries/*" element={<Navigate to={ROUTES.ENQUIRIES} replace />} />
      <Route path="/students/*" element={<Navigate to={ROUTES.STUDENTS} replace />} />

      {/* Student portal */}
      <Route path="/student" element={
        <ProtectedRoute portal={PORTALS.STUDENT}>
          <RequirePortal portal={PORTALS.STUDENT}><StudentShell /></RequirePortal>
        </ProtectedRoute>
      }>
        <Route index element={<Navigate to={ROUTES.STUDENT_DASHBOARD} replace />} />
        <Route path="dashboard" element={<StudentDashboardPage />} />
        <Route path="profile" element={<ProfilePage />} />
      </Route>

      {/* Agent portal */}
      <Route path="/agent" element={
        <ProtectedRoute portal={PORTALS.AGENT}>
          <RequirePortal portal={PORTALS.AGENT}><AgentShell /></RequirePortal>
        </ProtectedRoute>
      }>
        <Route index element={<Navigate to={ROUTES.AGENT_DASHBOARD} replace />} />
        <Route path="dashboard" element={<AgentDashboardPage />} />
        <Route path="students" element={
          <PermissionRoute permission={PERMISSIONS.STUDENTS_VIEW}>
            <AgentStudentsPage />
          </PermissionRoute>
        } />
      </Route>

      {/* Admin portal */}
      <Route path="/admin" element={
        <ProtectedRoute portal={PORTALS.ADMIN}>
          <RequirePortal portal={PORTALS.ADMIN}><AppLayout /></RequirePortal>
        </ProtectedRoute>
      }>
        <Route index element={<Navigate to={ROUTES.DASHBOARD} replace />} />
        <Route path="dashboard" element={
          <PermissionRoute permission={PERMISSIONS.DASHBOARD_VIEW}>
            <DashboardPage />
          </PermissionRoute>
        } />
        <Route path="reception/walk-ins" element={<Navigate to={ROUTES.ENQUIRIES} replace />} />
        <Route path="enquiries/new/:tab" element={<EnquiryCreatePage />} />
        <Route path="enquiries/new" element={<EnquiryCreatePage />} />
        <Route path="enquiries/:id/:tab" element={<EnquiryDetailPage />} />
        <Route path="enquiries/:id" element={<EnquiryDetailPage />} />
        <Route path="enquiries" element={
          <PermissionRoute permission={PERMISSIONS.ENQUIRIES_VIEW}>
            <EnquiryPage />
          </PermissionRoute>
        } />
        <Route path="counsellor/queue" element={
          <PermissionRoute permission={PERMISSIONS.ENQUIRIES_VIEW}>
            <CounsellorQueuePage />
          </PermissionRoute>
        } />
        <Route path="students" element={
          <PermissionRoute permission={PERMISSIONS.STUDENTS_VIEW}>
            <StudentsPage />
          </PermissionRoute>
        } />
        <Route path="students/:id/:tab" element={
          <PermissionRoute permission={PERMISSIONS.STUDENTS_VIEW}>
            <StudentDetailPage />
          </PermissionRoute>
        } />
        <Route path="students/:id" element={
          <PermissionRoute permission={PERMISSIONS.STUDENTS_VIEW}>
            <StudentDetailPage />
          </PermissionRoute>
        } />
        <Route path="leads" element={<Navigate to={ROUTES.ENQUIRIES} replace />} />
        <Route path="leads/:id" element={<Navigate to={ROUTES.ENQUIRIES} replace />} />
        <Route path="applications" element={<Navigate to={ROUTES.DASHBOARD} replace />} />
        <Route path="visas" element={<Navigate to={ROUTES.DASHBOARD} replace />} />
        <Route path="invoices" element={<Navigate to={ROUTES.FEES} replace />} />
        <Route path="partners" element={<Navigate to={ROUTES.DASHBOARD} replace />} />
        <Route path="documents" element={<Navigate to={ROUTES.DASHBOARD} replace />} />
        <Route path="demo" element={
          <PermissionRoute permissions={[PERMISSIONS.ENQUIRIES_VIEW, PERMISSIONS.STUDENTS_VIEW]}>
            <DemoPage />
          </PermissionRoute>
        } />
        <Route path="fees" element={
          <PermissionRoute permission={PERMISSIONS.INVOICES_VIEW}>
            <FeesPage />
          </PermissionRoute>
        } />
        <Route path="reports" element={
          <PermissionRoute permission={PERMISSIONS.REPORTS_VIEW}>
            <ReportsPage />
          </PermissionRoute>
        } />
        <Route path="users" element={
          <PermissionRoute permission={PERMISSIONS.USERS_VIEW}>
            <UsersPage />
          </PermissionRoute>
        } />
        <Route path="roles" element={
          <PermissionRoute permission={PERMISSIONS.ROLES_VIEW}>
            <RolesPage />
          </PermissionRoute>
        } />
        <Route path="403" element={<ForbiddenPage />} />
        <Route path="profile" element={<ProfilePage />} />
        <Route path="settings" element={
          <PermissionRoute permission={PERMISSIONS.SETTINGS_VIEW}>
            <SettingsPage />
          </PermissionRoute>
        } />
        <Route path="master" element={
          <PermissionRoute permissions={[PERMISSIONS.MASTERS_VIEW, PERMISSIONS.SETTINGS_VIEW]}>
            <MasterHubPage />
          </PermissionRoute>
        } />
        <Route path="master/:slug" element={
          <PermissionRoute permissions={[PERMISSIONS.MASTERS_VIEW, PERMISSIONS.SETTINGS_VIEW]}>
            <MasterDataPage />
          </PermissionRoute>
        } />
        <Route path="settings/feature-toggle" element={
          <PermissionRoute permission={PERMISSIONS.SETTINGS_UPDATE}>
            <FeatureTogglePage />
          </PermissionRoute>
        } />
        <Route path="terms" element={<PlaceholderPage title="Terms of Use" module="Legal" />} />
        <Route path="privacy" element={<PlaceholderPage title="Privacy Policy" module="Legal" />} />
        <Route path="blog" element={<PlaceholderPage title="Blog" module="Blog" />} />
        <Route path="help" element={<PlaceholderPage title="Help & Support" module="Support" />} />
        <Route path="documentation" element={<PlaceholderPage title="Documentation" module="Documentation" />} />
        <Route path="reminders" element={<PlaceholderPage title="Reminders" module="Reminders" />} />
        <Route path="notifications" element={<PlaceholderPage title="Notifications" module="Notifications" />} />
        <Route path="announcements" element={<PlaceholderPage title="Announcements" module="Announcements" />} />
        <Route path="course-finder" element={<PlaceholderPage title="Course Finder" module="Course Finder" />} />
        <Route path="tasks" element={<PlaceholderPage title="View Task" module="Tasks" />} />
      </Route>

      <Route path="/" element={<Navigate to={ROUTES.LOGIN} replace />} />
      <Route path="*" element={<Navigate to={ROUTES.LOGIN} replace />} />
    </Routes>
  );
}

function AppShell() {
  useAppTheme();
  const dispatch = useDispatch();

  useEffect(() => {
    toastService.dismissAll();
  }, []);

  return (
    <ErrorBoundary>
      <BrowserRouter>
        <AuthInitGate>
          <FeatureBootstrap />
          <AssignmentHeartbeat />
          <AppRoutes />
          <ToastProvider />
        </AuthInitGate>
      </BrowserRouter>
    </ErrorBoundary>
  );
}

export default function App() {
  return (
    <Provider store={store}>
      <AntdProvider>
        <AppShell />
      </AntdProvider>
    </Provider>
  );
}
