import { useEffect, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useParams } from 'react-router-dom';
import { Provider, useDispatch } from 'react-redux';
import ToastProvider from './components/ui/ToastProvider';
import AntdProvider from './components/providers/AntdProvider';
import MuiProvider from './components/providers/MuiProvider';
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
import ReminderAlertHost from './components/layout/ReminderAlertHost';
import { lazyImport } from './utils/lazyImport';

const LandingPage = lazyImport(() => import('./pages/landing/LandingPage'));
const AuthLoginForm = lazyImport(() => import('./components/auth/AuthLoginForm'));
const StudentRegisterPage = lazyImport(() => import('./pages/auth/StudentRegisterPage'));
const StudentForgotPasswordPage = lazyImport(() => import('./pages/auth/StudentForgotPasswordPage'));
const AgentRegisterPage = lazyImport(() => import('./pages/auth/AgentRegisterPage'));
const ApplyHubPage = lazyImport(() => import('./features/role-applications/pages/ApplyHubPage'));
const RoleApplyPage = lazyImport(() => import('./features/role-applications/pages/RoleApplyPage'));
const RoleApplicationsPage = lazyImport(() => import('./features/role-applications/pages/RoleApplicationsPage'));
const DashboardPage = lazyImport(() => import('./pages/dashboard/DashboardPage'));
const StudentsPage = lazyImport(() => import('./pages/students/StudentsPage'));
const EnquiryPage = lazyImport(() => import('./features/enquiry/pages/EnquiryPage'));
const UnassignedLeadsPage = lazyImport(() => import('./features/assignment/pages/UnassignedLeadsPage'));
const CourseCounsellorMappingPage = lazyImport(() => import('./features/assignment/pages/CourseCounsellorMappingPage'));
const AutomationCenterPage = lazyImport(() => import('./features/automation/pages/AutomationCenterPage'));
const SlaCenterPage = lazyImport(() => import('./features/automation/pages/SlaCenterPage'));
const EnquiryCreatePage = lazyImport(() => import('./features/enquiry/pages/EnquiryCreatePage'));
const EnquiryDetailPage = lazyImport(() => import('./features/enquiry/pages/EnquiryDetailPage'));
const CalendarPage = lazyImport(() => import('./features/calendar/pages/CalendarPage'));
const WalkInPage = lazyImport(() => import('./features/walkin/pages/WalkInPage'));
const ReceptionDashboardPage = lazyImport(() => import('./features/reception/pages/ReceptionDashboardPage'));
const SettingsPage = lazyImport(() => import('./pages/settings/SettingsPage'));
const ProfilePage = lazyImport(() => import('./pages/profile/ProfilePage'));
const UsersPage = lazyImport(() => import('./pages/users/UsersPage'));
const ReportsPage = lazyImport(() => import('./features/reports/pages/ReportsPage'));
const ReportsLeadsPage = lazyImport(() => import('./features/reports/pages/ReportsLeadsPage'));
const ReportsOperationsPage = lazyImport(() => import('./features/reports/pages/ReportsOperationsPage'));
const ReportsAcademicPage = lazyImport(() => import('./features/reports/pages/ReportsAcademicPage'));
const ReportsApplicationVisaPage = lazyImport(() => import('./features/reports/pages/ReportsApplicationVisaPage'));
const ReportsFinancePage = lazyImport(() => import('./features/reports/pages/ReportsFinancePage'));
const ReportsTargetsPage = lazyImport(() => import('./features/reports/pages/ReportsTargetsPage'));
const ReportsExportPage = lazyImport(() => import('./features/reports/pages/ReportsExportPage'));
const FeatureTogglePage = lazyImport(() => import('./features/feature/pages/FeatureTogglePage'));
const MasterHubPage = lazyImport(() => import('./features/master/pages/MasterHubPage'));
const StudentDetailPage = lazyImport(() => import('./features/student/pages/StudentDetailPage'));
const StudentProfilePage = lazyImport(() => import('./pages/student-portal/StudentProfilePage'));
const MasterDataPage = lazyImport(() => import('./features/master/pages/MasterDataPage'));
const DemoPage = lazyImport(() => import('./features/demo/pages/DemoPage'));
const BatchListPage = lazyImport(() => import('./features/attendance/pages/BatchListPage'));
const BatchDetailPage = lazyImport(() => import('./features/attendance/pages/BatchDetailPage'));
const TakeAttendancePage = lazyImport(() => import('./features/attendance/pages/TakeAttendancePage'));
const TeacherDashboardPage = lazyImport(() => import('./features/attendance/pages/TeacherDashboardPage'));
const TeacherClassesPage = lazyImport(() => import('./features/attendance/pages/TeacherClassesPage'));
const TeacherStudentsPage = lazyImport(() => import('./features/attendance/pages/TeacherStudentsPage'));
const TeacherStudentProfilePage = lazyImport(() => import('./features/attendance/pages/TeacherStudentProfilePage'));
const TeacherAssignmentsPage = lazyImport(() => import('./features/attendance/pages/TeacherAssignmentsPage'));
const TeacherTestsPage = lazyImport(() => import('./features/attendance/pages/TeacherTestsPage'));
const TeacherMaterialsPage = lazyImport(() => import('./features/attendance/pages/TeacherMaterialsPage'));
const TeacherPerformancePage = lazyImport(() => import('./features/attendance/pages/TeacherPerformancePage'));
const TeacherAttendanceHubPage = lazyImport(() => import('./features/attendance/pages/TeacherAttendanceHubPage'));
const FeesPage = lazyImport(() => import('./features/fees/pages/FeesPage'));
const ApplicationsPage = lazyImport(() => import('./features/applications/pages/ApplicationsPage'));
const VisasPage = lazyImport(() => import('./features/visas/pages/VisasPage'));
const CourseFinderPage = lazyImport(() => import('./features/master/pages/CourseFinderPage'));
const ForbiddenPage = lazyImport(() => import('./pages/errors/ForbiddenPage'));
const StudentDashboardPage = lazyImport(() => import('./pages/student-portal/StudentDashboardPage'));
const StudentAttendancePage = lazyImport(() => import('./pages/student-portal/StudentAttendancePage'));
const StudentApplicationsPage = lazyImport(() => import('./pages/student-portal/StudentApplicationsPage'));
const StudentCoursesPage = lazyImport(() => import('./pages/student-portal/StudentCoursesPage'));
const StudentAssignmentsPage = lazyImport(() => import('./pages/student-portal/StudentAssignmentsPage'));
const StudentTestsPage = lazyImport(() => import('./pages/student-portal/StudentTestsPage'));
const StudentMaterialsPage = lazyImport(() => import('./pages/student-portal/StudentMaterialsPage'));
const StudentPerformancePage = lazyImport(() => import('./pages/student-portal/StudentPerformancePage'));
const StudentFeesPage = lazyImport(() => import('./pages/student-portal/StudentFeesPage'));
const StudentReceiptsPage = lazyImport(() => import('./pages/student-portal/StudentReceiptsPage'));
const StudentDocumentsPage = lazyImport(() => import('./pages/student-portal/StudentDocumentsPage'));
const StudentVisaPage = lazyImport(() => import('./pages/student-portal/StudentVisaPage'));
const StudentCounselingPage = lazyImport(() => import('./pages/student-portal/StudentCounselingPage'));
const StudentReportsPage = lazyImport(() => import('./pages/student-portal/StudentReportsPage'));
const StudentNotificationsPage = lazyImport(() => import('./pages/student-portal/StudentNotificationsPage'));
const StudentCalendarPage = lazyImport(() => import('./pages/student-portal/StudentCalendarPage'));
const StudentHelpPage = lazyImport(() => import('./pages/student-portal/StudentHelpPage'));
const AgentDashboardPage = lazyImport(() => import('./pages/agent-portal/AgentDashboardPage'));
const AgentStudentsPage = lazyImport(() => import('./pages/agent-portal/AgentStudentsPage'));

function MasterRecordRoute() {
  const { slug } = useParams();
  const isPartners = slug === 'partners';
  const isStaff = slug === 'staff' || slug === 'contact-list';
  return (
    <PermissionRoute
      permissions={isPartners
        ? [PERMISSIONS.PARTNERS_VIEW, PERMISSIONS.MASTERS_VIEW, PERMISSIONS.MASTERS_MANAGE]
        : isStaff
          ? [PERMISSIONS.USERS_VIEW, PERMISSIONS.MASTERS_VIEW, PERMISSIONS.MASTERS_MANAGE, PERMISSIONS.ROLES_VIEW]
          : [PERMISSIONS.MASTERS_VIEW, PERMISSIONS.MASTERS_MANAGE, PERMISSIONS.ROLES_VIEW]}
      denyMastersForcedRoles={!isPartners && !isStaff}
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
      <Route path="/login" element={<Navigate to={ROUTES.LANDING} replace />} />
      <Route path="/login/admin" element={<Suspense fallback={<GlobalLoader />}><AuthLoginForm portal={PORTALS.ADMIN} /></Suspense>} />
      <Route path="/login/student" element={<Suspense fallback={<GlobalLoader />}><AuthLoginForm portal={PORTALS.STUDENT} /></Suspense>} />
      <Route path="/login/agent" element={<Suspense fallback={<GlobalLoader />}><AuthLoginForm portal={PORTALS.AGENT} /></Suspense>} />
      <Route path="/forgot-password/student" element={<Suspense fallback={<GlobalLoader />}><StudentForgotPasswordPage /></Suspense>} />
      <Route path="/register/student" element={<Suspense fallback={<GlobalLoader />}><StudentRegisterPage /></Suspense>} />
      <Route path="/register/agent" element={<Suspense fallback={<GlobalLoader />}><AgentRegisterPage /></Suspense>} />
      <Route path="/apply" element={<Suspense fallback={<GlobalLoader />}><ApplyHubPage /></Suspense>} />
      <Route path="/apply/:roleSlug" element={<Suspense fallback={<GlobalLoader />}><RoleApplyPage /></Suspense>} />

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
        <Route path="courses" element={
          <PermissionRoute permissions={[PERMISSIONS.ATTENDANCE_VIEW, PERMISSIONS.STUDENTS_VIEW]}>
            <StudentCoursesPage />
          </PermissionRoute>
        } />
        <Route path="assignments" element={
          <PermissionRoute permission={PERMISSIONS.ATTENDANCE_VIEW}>
            <StudentAssignmentsPage />
          </PermissionRoute>
        } />
        <Route path="tests" element={
          <PermissionRoute permission={PERMISSIONS.ATTENDANCE_VIEW}>
            <StudentTestsPage />
          </PermissionRoute>
        } />
        <Route path="materials" element={
          <PermissionRoute permission={PERMISSIONS.ATTENDANCE_VIEW}>
            <StudentMaterialsPage />
          </PermissionRoute>
        } />
        <Route path="performance" element={
          <PermissionRoute permission={PERMISSIONS.ATTENDANCE_VIEW}>
            <StudentPerformancePage />
          </PermissionRoute>
        } />
        <Route path="classes" element={<Navigate to={ROUTES.STUDENT_COURSES} replace />} />
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
        <Route path="fees" element={
          <PermissionRoute permission={PERMISSIONS.STUDENTS_VIEW}>
            <StudentFeesPage />
          </PermissionRoute>
        } />
        <Route path="fees/receipts" element={
          <PermissionRoute permission={PERMISSIONS.STUDENTS_VIEW}>
            <StudentReceiptsPage />
          </PermissionRoute>
        } />
        <Route path="documents" element={
          <PermissionRoute permission={PERMISSIONS.DOCUMENTS_VIEW}>
            <StudentDocumentsPage />
          </PermissionRoute>
        } />
        <Route path="visa" element={
          <PermissionRoute permission={PERMISSIONS.VISAS_VIEW}>
            <StudentVisaPage />
          </PermissionRoute>
        } />
        <Route path="counseling" element={
          <PermissionRoute permission={PERMISSIONS.CALENDAR_VIEW}>
            <StudentCounselingPage />
          </PermissionRoute>
        } />
        <Route path="reports" element={
          <PermissionRoute permission={PERMISSIONS.ATTENDANCE_VIEW}>
            <StudentReportsPage />
          </PermissionRoute>
        } />
        <Route path="notifications" element={<StudentNotificationsPage />} />
        <Route path="calendar" element={<StudentCalendarPage />} />
        <Route path="help" element={<StudentHelpPage />} />
        <Route path="profile" element={<StudentProfilePage />} />
      </Route>

      {/* Agent portal */}
      <Route path="/agent" element={
        <ProtectedRoute portal={PORTALS.AGENT}>
          <RequirePortal portal={PORTALS.AGENT}><AgentShell /></RequirePortal>
        </ProtectedRoute>
      }>
        <Route index element={<Navigate to={ROUTES.AGENT_DASHBOARD} replace />} />
        <Route path="dashboard" element={<AgentDashboardPage />} />
        <Route path="enquiries" element={
          <PermissionRoute permission={PERMISSIONS.ENQUIRIES_VIEW}>
            <EnquiryPage />
          </PermissionRoute>
        } />
        <Route path="students" element={
          <PermissionRoute permission={PERMISSIONS.STUDENTS_VIEW}>
            <AgentStudentsPage />
          </PermissionRoute>
        } />
        <Route path="applications" element={
          <PermissionRoute permission={PERMISSIONS.APPLICATIONS_VIEW}>
            <ApplicationsPage />
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
        <Route path="enquiries/unassigned" element={
          <PermissionRoute permission={PERMISSIONS.ENQUIRIES_VIEW}>
            <UnassignedLeadsPage />
          </PermissionRoute>
        } />
        <Route path="assignment/course-counsellor-mapping" element={
          <PermissionRoute permissions={[PERMISSIONS.MASTERS_VIEW, PERMISSIONS.SETTINGS_VIEW]}>
            <CourseCounsellorMappingPage />
          </PermissionRoute>
        } />
        <Route path="automation" element={
          <PermissionRoute permission={PERMISSIONS.SETTINGS_VIEW}>
            <AutomationCenterPage />
          </PermissionRoute>
        } />
        <Route path="sla" element={
          <PermissionRoute permission={PERMISSIONS.ENQUIRIES_VIEW}>
            <SlaCenterPage />
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
            <ApplicationsPage />
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
        <Route path="teacher/dashboard" element={
          <PermissionRoute permission={PERMISSIONS.ATTENDANCE_VIEW}>
            <TeacherDashboardPage />
          </PermissionRoute>
        } />
        <Route path="teacher/classes" element={
          <PermissionRoute permission={PERMISSIONS.ATTENDANCE_VIEW}>
            <TeacherClassesPage />
          </PermissionRoute>
        } />
        <Route path="teacher/students" element={
          <PermissionRoute permission={PERMISSIONS.ATTENDANCE_VIEW}>
            <TeacherStudentsPage />
          </PermissionRoute>
        } />
        <Route path="teacher/students/:id" element={
          <PermissionRoute permission={PERMISSIONS.ATTENDANCE_VIEW}>
            <TeacherStudentProfilePage />
          </PermissionRoute>
        } />
        <Route path="teacher/assignments" element={
          <PermissionRoute permission={PERMISSIONS.ATTENDANCE_VIEW}>
            <TeacherAssignmentsPage />
          </PermissionRoute>
        } />
        <Route path="teacher/tests" element={
          <PermissionRoute permission={PERMISSIONS.ATTENDANCE_VIEW}>
            <TeacherTestsPage />
          </PermissionRoute>
        } />
        <Route path="teacher/materials" element={
          <PermissionRoute permission={PERMISSIONS.ATTENDANCE_VIEW}>
            <TeacherMaterialsPage />
          </PermissionRoute>
        } />
        <Route path="teacher/performance" element={
          <PermissionRoute permission={PERMISSIONS.ATTENDANCE_VIEW}>
            <TeacherPerformancePage />
          </PermissionRoute>
        } />
        <Route path="teacher/attendance" element={
          <PermissionRoute permission={PERMISSIONS.ATTENDANCE_VIEW}>
            <TeacherAttendanceHubPage />
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
        <Route path="reports/leads" element={
          <PermissionRoute permission={PERMISSIONS.REPORTS_VIEW}>
            <ReportsLeadsPage />
          </PermissionRoute>
        } />
        <Route path="reports/leads/:view" element={
          <PermissionRoute permission={PERMISSIONS.REPORTS_VIEW}>
            <ReportsLeadsPage />
          </PermissionRoute>
        } />
        <Route path="reports/operations" element={
          <PermissionRoute permission={PERMISSIONS.REPORTS_VIEW}>
            <ReportsOperationsPage />
          </PermissionRoute>
        } />
        <Route path="reports/operations/:view" element={
          <PermissionRoute permission={PERMISSIONS.REPORTS_VIEW}>
            <ReportsOperationsPage />
          </PermissionRoute>
        } />
        <Route path="reports/academic" element={
          <PermissionRoute permission={PERMISSIONS.REPORTS_VIEW}>
            <ReportsAcademicPage />
          </PermissionRoute>
        } />
        <Route path="reports/academic/:view" element={
          <PermissionRoute permission={PERMISSIONS.REPORTS_VIEW}>
            <ReportsAcademicPage />
          </PermissionRoute>
        } />
        <Route path="reports/application-visa" element={
          <PermissionRoute permission={PERMISSIONS.REPORTS_VIEW}>
            <ReportsApplicationVisaPage />
          </PermissionRoute>
        } />
        <Route path="reports/application-visa/:view" element={
          <PermissionRoute permission={PERMISSIONS.REPORTS_VIEW}>
            <ReportsApplicationVisaPage />
          </PermissionRoute>
        } />
        <Route path="reports/finance" element={
          <PermissionRoute permission={PERMISSIONS.REPORTS_VIEW}>
            <ReportsFinancePage />
          </PermissionRoute>
        } />
        <Route path="reports/finance/:view" element={
          <PermissionRoute permission={PERMISSIONS.REPORTS_VIEW}>
            <ReportsFinancePage />
          </PermissionRoute>
        } />
        <Route path="reports/targets" element={
          <PermissionRoute permission={PERMISSIONS.REPORTS_VIEW}>
            <ReportsTargetsPage />
          </PermissionRoute>
        } />
        <Route path="reports/export" element={
          <PermissionRoute permission={PERMISSIONS.REPORTS_VIEW}>
            <ReportsExportPage />
          </PermissionRoute>
        } />
        <Route path="users" element={
          <PermissionRoute permissions={[PERMISSIONS.USERS_VIEW, PERMISSIONS.ROLES_VIEW]}>
            <UsersPage />
          </PermissionRoute>
        } />
        <Route path="role-applications" element={
          <PermissionRoute permission={PERMISSIONS.ROLE_APPLICATION_VIEW}>
            <RoleApplicationsPage />
          </PermissionRoute>
        } />
        <Route path="roles" element={<Navigate to={`${ROUTES.USERS}?tab=roles`} replace />} />
        <Route path="master/advanced-access" element={<Navigate to={`${ROUTES.USERS}?tab=roles`} replace />} />
        <Route path="master/staff" element={<Navigate to={ROUTES.USERS} replace />} />
        <Route path="master/contact-list" element={<Navigate to={ROUTES.USERS} replace />} />
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
        <Route path="notifications" element={<StudentNotificationsPage />} />
        <Route path="tasks" element={<RoleHomeRedirect />} />
        <Route path="announcements" element={<Navigate to="/admin/master/announcements" replace />} />
        <Route path="course-finder" element={
          <PermissionRoute permissions={[PERMISSIONS.MASTERS_VIEW, PERMISSIONS.SETTINGS_VIEW]}>
            <CourseFinderPage />
          </PermissionRoute>
        } />
      </Route>

      <Route path="/" element={<Suspense fallback={<GlobalLoader />}><LandingPage /></Suspense>} />
      <Route path="*" element={<Navigate to={ROUTES.LANDING} replace />} />
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
          <ReminderAlertHost />
        </AuthInitGate>
      </BrowserRouter>
    </ErrorBoundary>
  );
}

export default function App() {
  return (
    <Provider store={store}>
      <AntdProvider>
        <MuiProvider>
          <AppShell />
        </MuiProvider>
      </AntdProvider>
    </Provider>
  );
}
