import { useEffect, useState, Children } from 'react';
import { Link, Navigate } from 'react-router-dom';
import {
  FiHome, FiUsers, FiUserPlus, FiFileText, FiGlobe, FiCalendar, FiDollarSign, FiInbox, FiMonitor,
} from 'react-icons/fi';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import ContentLoader from '../../components/ui/ContentLoader';
import PageHeader from '../../components/layout/PageHeader';
import PageShell from '../../components/layout/PageShell';
import StatCard from '../../components/ui/StatCard';
import ChartCard from '../../components/ui/ChartCard';
import Card from '../../components/ui/Card';
import Avatar from '../../components/ui/Avatar';
import { apiGet } from '../../api/apiClient';
import { API } from '../../config/api';
import { useChartTheme } from '../../hooks/useChartTheme';
import { usePermissions } from '../../hooks/usePermissions';
import { ROLE_WORKSPACE_META, getRoleDefaultRoute } from '../../config/role-workspace.config';
import { ROUTES } from '../../config/routes';
import { PERMISSIONS } from '../../config/permissions';
import { useSelector } from 'react-redux';
import { selectUser } from '../../redux/slices/authSlice';

const DASHBOARD_LOAD_TIMEOUT_MS = 12000;

function withTimeout(promise, ms) {
  return Promise.race([
    promise,
    new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Request timed out')), ms);
    }),
  ]);
}

function WidgetGrid({ children }) {
  const items = Children.toArray(children).filter(Boolean);
  if (!items.length) return null;
  return <div className="grid grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6 gap-4">{items}</div>;
}

export default function DashboardPage() {
  const user = useSelector(selectUser);
  const home = user?.defaultRoute || getRoleDefaultRoute(user?.role?.slug, ROUTES.DASHBOARD);
  const { colors: chartColors, theme: chartTheme } = useChartTheme();
  const { can, roleSlug } = usePermissions();
  const [stats, setStats] = useState(null);
  const [activity, setActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const shouldRedirectHome = Boolean(home && home !== ROUTES.DASHBOARD);

  useEffect(() => {
    if (shouldRedirectHome) return undefined;
    const load = async () => {
      try {
        const [statsRes, activityRes] = await withTimeout(
          Promise.all([
            apiGet(API.DASHBOARD_STATS),
            apiGet(API.DASHBOARD_ACTIVITY),
          ]),
          DASHBOARD_LOAD_TIMEOUT_MS,
        );
        setStats(statsRes.data);
        setActivity(activityRes.data);
      } catch {
        setStats({ cards: {}, leadsByStatus: [], studentsByCountry: [], visible: {} });
        setActivity([]);
      } finally {
        setLoading(false);
      }
    };
    load();
    return undefined;
  }, [shouldRedirectHome]);

  if (shouldRedirectHome) {
    return <Navigate to={home} replace />;
  }

  if (loading) return <ContentLoader variant="dashboard" />;

  const cards = stats?.cards || {};
  const visible = stats?.visible || {};
  const attendance = stats?.attendance;
  const meta = stats?.workspace || ROLE_WORKSPACE_META[roleSlug] || {
    title: 'Dashboard',
    subtitle: 'Overview of your CRM workspace',
  };

  const showLeadsChart = visible.leads && (stats?.leadsByStatus || []).length > 0;
  const showStudentsChart = visible.students && (stats?.studentsByCountry || []).length > 0;

  return (
    <PageShell>
      <PageHeader
        title={meta.title || 'Dashboard'}
        subtitle={meta.subtitle || 'Overview of your CRM performance'}
        icon={FiHome}
        iconColor="primary"
      />
      <WidgetGrid>
        {visible.walkins && (
          <StatCard title="Today's Walk-ins" value={cards.todayWalkIns || 0} icon={FiUserPlus} color="primary" />
        )}
        {visible.leads && (
          <StatCard title={roleSlug === 'counsellor' ? 'My Leads' : 'Total Leads'} value={cards.totalLeads || 0} icon={FiUserPlus} color="primary" />
        )}
        {visible.unassignedLeads && (
          <StatCard title="Unassigned Leads" value={cards.unassignedLeads || 0} icon={FiInbox} color="warning" />
        )}
        {visible.enquiries && (
          <StatCard title={roleSlug === 'counsellor' ? 'My Enquiries' : 'Enquiries'} value={cards.totalEnquiries || 0} icon={FiInbox} color="info" />
        )}
        {visible.students && (
          <StatCard title={roleSlug === 'counsellor' ? 'My Students' : 'Students'} value={cards.totalStudents || 0} icon={FiUsers} color="success" />
        )}
        {visible.applications && (
          <StatCard title="Applications" value={cards.activeApplications || 0} icon={FiFileText} color="info" />
        )}
        {visible.visas && (
          <StatCard title="Pending Visas" value={cards.pendingVisas || 0} icon={FiGlobe} color="warning" />
        )}
        {visible.leads && (
          <StatCard title="Today's Follow-ups" value={cards.todayFollowUps || 0} icon={FiCalendar} color="danger" />
        )}
        {visible.calendar && (
          <StatCard title="Today's Appointments" value={cards.todayAppointments || 0} icon={FiCalendar} color="info" />
        )}
        {visible.finance && (
          <StatCard title="Revenue (Month)" value={`$${Number(cards.revenueThisMonth || 0).toLocaleString()}`} icon={FiDollarSign} color="success" />
        )}
      </WidgetGrid>
      {(visible.classes || visible.demos) && attendance && (
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
          {visible.classes && (
            <StatCard title="Today's Classes" value={attendance.todayClasses || 0} icon={FiCalendar} color="info" />
          )}
          {visible.classes && (
            <StatCard title="Attendance Pending" value={attendance.attendancePending || 0} icon={FiCalendar} color="warning" />
          )}
          {visible.demos && (
            <StatCard title="Today's Demos" value={attendance.todayDemos || 0} icon={FiMonitor} color="primary" />
          )}
          {visible.demos && (
            <StatCard title="Demo No-shows" value={attendance.demoNoShows || 0} icon={FiUserPlus} color="danger" />
          )}
        </div>
      )}
      {(showLeadsChart || showStudentsChart) && (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {showLeadsChart && (
            <ChartCard title="Leads by Status">
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={stats?.leadsByStatus || []}>
                  <CartesianGrid strokeDasharray="3 3" stroke={chartTheme.grid} />
                  <XAxis dataKey="status" tick={{ fontSize: 12, fill: chartTheme.axis }} />
                  <YAxis tick={{ fontSize: 12, fill: chartTheme.axis }} />
                  <Tooltip />
                  <Bar dataKey="count" fill={chartTheme.bar} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>
          )}
          {showStudentsChart && (
            <ChartCard title="Students by Country">
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie data={stats?.studentsByCountry || []} dataKey="count" nameKey="country" cx="50%" cy="50%" outerRadius={100} label>
                    {(stats?.studentsByCountry || []).map((_, i) => (
                      <Cell key={i} fill={chartColors[i % chartColors.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </ChartCard>
          )}
        </div>
      )}
      <QuickLinks roleSlug={roleSlug} can={can} />
      <ActivityFeed activity={activity} />
    </PageShell>
  );
}

function QuickLinks({ roleSlug, can }) {
  const links = [];
  if (can(PERMISSIONS.WALKIN_VIEW)) links.push({ to: ROUTES.WALK_INS, label: 'Walk-ins' });
  if (can(PERMISSIONS.ENQUIRIES_VIEW)) links.push({ to: ROUTES.ENQUIRIES, label: 'Enquiries' });
  if (can(PERMISSIONS.ATTENDANCE_VIEW)) links.push({ to: ROUTES.BATCHES, label: roleSlug === 'teacher' ? 'My Batches' : 'Batches' });
  if (can(PERMISSIONS.APPLICATIONS_VIEW)) links.push({ to: ROUTES.APPLICATIONS, label: 'Applications' });
  if (can(PERMISSIONS.VISAS_VIEW)) links.push({ to: ROUTES.VISAS, label: 'Visas' });
  if (can(PERMISSIONS.INVOICES_VIEW)) links.push({ to: ROUTES.FEES, label: 'Fees' });
  if (!links.length) return null;
  return (
    <Card>
      <h3 className="text-base font-semibold text-text mb-3">Workspace</h3>
      <div className="flex flex-wrap gap-2">
        {links.map((link) => (
          <Link
            key={link.to}
            to={link.to}
            className="px-3 py-1.5 text-sm rounded-lg border border-border hover:bg-surface-hover text-text"
          >
            {link.label}
          </Link>
        ))}
      </div>
    </Card>
  );
}

function ActivityFeed({ activity }) {
  return (
    <Card>
      <h3 className="text-base font-semibold text-text mb-4">Recent Activity</h3>
      <div className="space-y-3">
        {activity.length === 0 && <p className="text-sm text-text-muted">No recent activity</p>}
        {activity.map((item) => (
          <div key={item.id} className="flex items-start gap-3 py-2 border-b border-border last:border-0">
            <Avatar name={item.user ? `${item.user.firstName} ${item.user.lastName}` : 'System'} size="sm" />
            <div className="flex-1 min-w-0">
              <p className="text-sm text-text">{item.description || item.action}</p>
              <p className="text-xs text-text-muted mt-0.5">
                {item.user ? `${item.user.firstName} ${item.user.lastName}` : 'System'} · {new Date(item.createdAt).toLocaleString()}
              </p>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
