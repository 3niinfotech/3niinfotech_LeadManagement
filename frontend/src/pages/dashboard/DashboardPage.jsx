import { useEffect, useState } from 'react';
import { FiHome, FiUsers, FiUserPlus, FiFileText, FiGlobe, FiCalendar, FiDollarSign } from 'react-icons/fi';
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

const DASHBOARD_LOAD_TIMEOUT_MS = 12000;

function withTimeout(promise, ms) {
  return Promise.race([
    promise,
    new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Request timed out')), ms);
    }),
  ]);
}

export default function DashboardPage() {
  const { colors: chartColors, theme: chartTheme } = useChartTheme();
  const [stats, setStats] = useState(null);
  const [activity, setActivity] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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
        setStats({ cards: {}, leadsByStatus: [], studentsByCountry: [] });
        setActivity([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) return <ContentLoader variant="dashboard" />;

  const cards = stats?.cards || {};

  return (
    <PageShell>
      <PageHeader
        title="Dashboard"
        subtitle="Overview of your CRM performance"
        icon={FiHome}
        iconColor="primary"
      />
      <div className="grid grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6 gap-4">
        <StatCard title="Total Leads" value={cards.totalLeads || 0} icon={FiUserPlus} color="primary" />
        <StatCard title="Students" value={cards.totalStudents || 0} icon={FiUsers} color="success" />
        <StatCard title="Applications" value={cards.activeApplications || 0} icon={FiFileText} color="info" />
        <StatCard title="Pending Visas" value={cards.pendingVisas || 0} icon={FiGlobe} color="warning" />
        <StatCard title="Today's Follow-ups" value={cards.todayFollowUps || 0} icon={FiCalendar} color="danger" />
        <StatCard title="Revenue (Month)" value={`$${Number(cards.revenueThisMonth || 0).toLocaleString()}`} icon={FiDollarSign} color="success" />
      </div>
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
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
      </div>
      <ActivityFeed activity={activity} />
    </PageShell>
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
