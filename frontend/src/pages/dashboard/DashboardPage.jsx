import { Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import PageShell from '../../components/layout/PageShell';
import { getRoleDefaultRoute } from '../../config/role-workspace.config';
import { ROUTES } from '../../config/routes';
import { selectUser } from '../../redux/slices/authSlice';
import AdminDashboard from '../../features/dashboard/components/AdminDashboard';
import CounsellorDashboard from '../../features/dashboard/components/CounsellorDashboard';

/** Roles that render their home on /admin/dashboard itself (do not bounce elsewhere). */
const DASHBOARD_HOME_ROLES = new Set([
  'counsellor',
  'team_leader',
  'super_admin',
  'company_admin',
  'operational_head',
  'branch_manager',
  'marketing_manager',
  'viewer',
  'custom_role',
]);

export default function DashboardPage() {
  const user = useSelector(selectUser);
  const slug = user?.role?.slug;
  const home = user?.defaultRoute || getRoleDefaultRoute(slug, ROUTES.DASHBOARD);
  const staysOnDashboard = DASHBOARD_HOME_ROLES.has(slug) || home === ROUTES.DASHBOARD;

  if (!staysOnDashboard && home) {
    return <Navigate to={home} replace />;
  }

  if (slug === 'counsellor' || slug === 'team_leader') {
    return (
      <PageShell>
        <CounsellorDashboard />
      </PageShell>
    );
  }

  return (
    <PageShell>
      <AdminDashboard />
    </PageShell>
  );
}
