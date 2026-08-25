import { useEffect, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useParams } from 'react-router-dom';
import { Provider, useDispatch } from 'react-redux';
import ToastProvider from './components/ui/ToastProvider';
import AntdProvider from './components/providers/AntdProvider';
import { store } from './redux/store';
import ProtectedRoute from './components/common/ProtectedRoute';
import RequirePortal from './components/common/RequirePortal';
import PermissionRoute from './components/common/PermissionRoute';
import ErrorBoundary from './components/common/ErrorBoundary';
import AuthInitGate from './components/common/AuthInitGate';
import AssignmentHeartbeat from './components/common/AssignmentHeartbeat';
import FeatureBootstrap from './components/common/FeatureBootstrap';
import RoleHomeRedirect from './components/common/RoleHomeRedirect';
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

const PortalSelectorPage = lazyImport(() => import('./pages/auth/PortalSelectorPage'));
const AuthLoginForm = lazyImport(() => import('./components/auth/AuthLoginForm'));
const StudentRegisterPage = lazyImport(() => import('./pages/auth/StudentRegisterPage'));
const AgentRegisterPage = lazyImport(() => import('./pages/auth/AgentRegisterPage'));
const DashboardPage = lazyImport(() => import('./pages/dashboard/DashboardPage'));
const StudentsPage = lazyImport(() => import('./pages/students/StudentsPage'));
const EnquiryPage = lazyImport(() => import('./features/enquiry/pages/EnquiryPage'));
const EnquiryCreatePage = lazyImport(() => import('./features/enquiry/pages/EnquiryCreatePage'));
const EnquiryDetailPage = lazyImport(() => import('./features/enquiry/pages/EnquiryDetailPage'));
const CalendarPage = lazyImport(() => import('./features/calendar/pages/CalendarPage'));
const WalkInPage = lazyImport(() => import('./features/walkin/pages/WalkInPage'));
const ReceptionDashboardPage = lazyImport(() => import('./features/reception/pages/ReceptionDashboardPage'));
const SettingsPage = lazyImport(() => import('./pages/settings/SettingsPage'));
const ProfilePage = lazyImport(() => import('./pages/profile/ProfilePage'));
const UsersPage = lazyImport(() => import('./pages/users/UsersPage'));
const RolesPage = lazyImport(() => import('./features/rbac/pages/RolesPage'));
const AdvancedAccessPage = lazyImport(() => import('./features/rbac/pages/AdvancedAccessPage'));
const ReportsPage = lazyImport(() => import('./features/reports/pages/ReportsPage'));
const FeatureTogglePage = lazyImport(() => import('./features/feature/pages/FeatureTogglePage'));
const MasterHubPage = lazyImport(() => import('./features/master/pages/MasterHubPage'));
const StudentDetailPage = lazyImport(() => import('./features/student/pages/StudentDetailPage'));
const MasterDataPage = lazyImport(() => import('./features/master/pages/MasterDataPage'));
const DemoPage = lazyImport(() => import('./features/demo/pages/DemoPage'));
const BatchListPage = lazyImport(() => import('./features/attendance/pages/BatchListPage'));
const BatchDetailPage = lazyImport(() => import('./features/attendance/pages/BatchDetailPage'));
const TakeAttendancePage = lazyImport(() => import('./features/attendance/pages/TakeAttendancePage'));
const FeesPage = lazyImport(() => import('./features/fees/pages/FeesPage'));
const AdmissionsPage = lazyImport(() => import('./features/admissions/pages/AdmissionsPage'));
const VisasPage = lazyImport(() => import('./features/visas/pages/VisasPage'));
const CourseFinderPage = lazyImport(() => import('./features/master/pages/CourseFinderPage'));
const ForbiddenPage = lazyImport(() => import('./pages/errors/ForbiddenPage'));
const StudentDashboardPage = lazyImport(() => import('./pages/student-portal/StudentDashboardPage'));
const StudentAttendancePage = lazyImport(() => import('./pages/student-portal/StudentAttendancePage'));
const StudentApplicationsPage = lazyImport(() => import('./pages/student-portal/StudentApplicationsPage'));
const AgentDashboardPage = lazyImport(() => import('./pages/agent-portal/AgentDashboardPage'));
const AgentStudentsPage = lazyImport(() => import('./pages/agent-portal/AgentStudentsPage'));

function MasterRecordRoute() {
  const { slug } = useParams();
  const isPartners = slug === 'partners';
  return (
    <PermissionRoute
      permissions={isPartners
        ? [PERMISSIONS.PARTNERS_VIEW, PERMISSIONS.MASTERS_VIEW, PERMISSIONS.MASTERS_MANAGE]
        : [PERMISSIONS.MASTERS_VIEW, PERMISSIONS.MASTERS_MANAGE, PERMISSIONS.ROLES_VIEW]}
      denyMastersForcedRoles={!isPartners}
    >
      <MasterDataPage />
    </PermissionRoute>
  );
}

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
        <Route path="attendance" element={
          <PermissionRoute permissions={[PERMISSIONS.ATTENDANCE_VIEW, PERMISSIONS.STUDENTS_VIEW]}>
            <StudentAttendancePage />
          </PermissionRoute>
        } />
        <Route path="applications" element={
          <PermissionRoute permission={PERMISSIONS.APPLICATIONS_VIEW}>
            <StudentApplicationsPage />
          </PermissionRoute>
        } />
        <Route path="calendar" element={
          <PermissionRoute permission={PERMISSIONS.CALENDAR_VIEW}>
            <CalendarPage />
          </PermissionRoute>
        } />
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
        <Route path="calendar" element={
          <PermissionRoute permission={PERMISSIONS.CALENDAR_VIEW}>
            <CalendarPage />
          </PermissionRoute>
        } />
        <Route path="profile" element={<ProfilePage />} />
      </Route>

      {/* Admin portal */}
      <Route path="/admin" element={
        <ProtectedRoute portal={PORTALS.ADMIN}>
          <RequirePortal portal={PORTALS.ADMIN}><AppLayout /></RequirePortal>
        </ProtectedRoute>
      }>
        <Route index element={<RoleHomeRedirect />} />
        <Route path="dashboard" element={
          <PermissionRoute permission={PERMISSIONS.DASHBOARD_VIEW}>
            <DashboardPage />
          </PermissionRoute>
        } />
        <Route path="reception" element={
          <PermissionRoute
            permissions={[PERMISSIONS.DASHBOARD_VIEW, PERMISSIONS.WALKIN_VIEW]}
            denyRoleSlugs={['counsellor']}
            redirectTo={ROUTES.ENQUIRIES}
          >
            <ReceptionDashboardPage />
          </PermissionRoute>
        } />
        <Route path="reception/walk-ins" element={
          <PermissionRoute
            permission={PERMISSIONS.WALKIN_VIEW}
            denyRoleSlugs={['counsellor']}
            redirectTo={ROUTES.ENQUIRIES}
          >
            <WalkInPage />
          </PermissionRoute>
        } />
        <Route path="enquiries/new/:tab" element={
          <PermissionRoute permissions={[PERMISSIONS.ENQUIRIES_CREATE, PERMISSIONS.WALKIN_CREATE]}>
            <EnquiryCreatePage />
          </PermissionRoute>
        } />
        <Route path="enquiries/new" element={
          <PermissionRoute permissions={[PERMISSIONS.ENQUIRIES_CREATE, PERMISSIONS.WALKIN_CREATE]}>
            <EnquiryCreatePage />
          </PermissionRoute>
        } />
        <Route path="enquiries/:id/:tab" element={
          <PermissionRoute permission={PERMISSIONS.ENQUIRIES_VIEW}>
            <EnquiryDetailPage />
          </PermissionRoute>
        } />
        <Route path="enquiries/:id" element={
          <PermissionRoute permission={PERMISSIONS.ENQUIRIES_VIEW}>
            <EnquiryDetailPage />
          </PermissionRoute>
        } />
        <Route path="enquiries" element={
          <PermissionRoute permission={PERMISSIONS.ENQUIRIES_VIEW}>
            <EnquiryPage />
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
        <Route path="applications" element={
          <PermissionRoute permission={PERMISSIONS.APPLICATIONS_VIEW}>
            <AdmissionsPage />
          </PermissionRoute>
        } />
        <Route path="visas" element={
          <PermissionRoute permission={PERMISSIONS.VISAS_VIEW}>
            <VisasPage />
          </PermissionRoute>
        } />
        <Route path="invoices" element={<Navigate to={ROUTES.FEES} replace />} />
        <Route path="partners" element={<Navigate to="/admin/master/partners" replace />} />
        <Route path="documents" element={<Navigate to={ROUTES.DASHBOARD} replace />} />
        <Route path="calendar" element={
          <PermissionRoute permission={PERMISSIONS.CALENDAR_VIEW}>
            <CalendarPage />
          </PermissionRoute>
        } />
        <Route path="demo" element={
          <PermissionRoute permission={PERMISSIONS.ENQUIRIES_VIEW}>
            <DemoPage />
          </PermissionRoute>
        } />
        <Route path="batches" element={
          <PermissionRoute permission={PERMISSIONS.ATTENDANCE_VIEW}>
            <BatchListPage />
          </PermissionRoute>
        } />
        <Route path="batches/:id" element={
          <PermissionRoute permission={PERMISSIONS.ATTENDANCE_VIEW}>
            <BatchDetailPage />
          </PermissionRoute>
        } />
        <Route path="sessions/:id/attendance" element={
          <PermissionRoute permissions={[PERMISSIONS.ATTENDANCE_VIEW, PERMISSIONS.ATTENDANCE_MARK]}>
            <TakeAttendancePage />
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
        <Route path="master/advanced-access" element={
          <PermissionRoute
            permissions={[PERMISSIONS.ROLES_UPDATE, PERMISSIONS.ROLES_VIEW]}
            denyMastersForcedRoles
          >
            <AdvancedAccessPage />
          </PermissionRoute>
        } />
        <Route path="403" element={<ForbiddenPage />} />
        <Route path="profile" element={<ProfilePage />} />
        <Route path="settings" element={
          <PermissionRoute permission={PERMISSIONS.SETTINGS_VIEW} denyMastersForcedRoles>
            <SettingsPage />
          </PermissionRoute>
        } />
        <Route path="master" element={
          <PermissionRoute
            permissions={[PERMISSIONS.MASTERS_VIEW, PERMISSIONS.MASTERS_MANAGE]}
            denyMastersForcedRoles
          >
            <MasterHubPage />
          </PermissionRoute>
        } />
        <Route path="master/:slug" element={<MasterRecordRoute />} />
        <Route path="settings/feature-toggle" element={
          <PermissionRoute permission={PERMISSIONS.SETTINGS_UPDATE} denyMastersForcedRoles>
            <FeatureTogglePage />
          </PermissionRoute>
        } />
        <Route path="terms" element={<RoleHomeRedirect />} />
        <Route path="privacy" element={<RoleHomeRedirect />} />
        <Route path="blog" element={<RoleHomeRedirect />} />
        <Route path="help" element={<RoleHomeRedirect />} />
        <Route path="documentation" element={<RoleHomeRedirect />} />
        <Route path="reminders" element={<RoleHomeRedirect />} />
        <Route path="notifications" element={<RoleHomeRedirect />} />
        <Route path="tasks" element={<RoleHomeRedirect />} />
        <Route path="announcements" element={<Navigate to="/admin/master/announcements" replace />} />
        <Route path="course-finder" element={
          <PermissionRoute permissions={[PERMISSIONS.MASTERS_VIEW, PERMISSIONS.SETTINGS_VIEW]}>
            <CourseFinderPage />
          </PermissionRoute>
        } />
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
