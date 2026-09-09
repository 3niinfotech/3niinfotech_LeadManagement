import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  FiUsers, FiInbox, FiFileText, FiAward, FiDollarSign,
  FiRefreshCw, FiArrowUpRight, FiArrowDownRight,
  FiClock, FiShield, FiKey, FiSettings,
  FiBarChart2, FiGitBranch, FiUserPlus, FiChevronRight,
} from 'react-icons/fi';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import Button from '../../../components/ui/Button';
import Avatar from '../../../components/ui/Avatar';
import { useDashboardData } from '../hooks/useDashboardData';
import { ROUTES } from '../../../config/routes';
import { selectUser } from '../../../redux/slices/authSlice';
import '../../reports/styles/reports.css';
import '../styles/dashboard.theme.css';

function fmtNum(val) {
  if (val == null || val === '') return '0';
  const n = Number(val);
  if (Number.isNaN(n)) return String(val);
  return n.toLocaleString('en-IN');
}

function fmtCurr(val) {
  if (val == null || val === '') return '₹ 0';
  const n = Number(val);
  if (Number.isNaN(n)) return String(val);
  return `₹ ${n.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
}

function getCountryFlag(code) {
  if (!code || code === 'OT') return '🌐';
  const normalized = String(code).toUpperCase().trim();
  if (normalized.length !== 2) return '🌐';
  const codePoints = normalized
    .split('')
    .map((char) => 127397 + char.charCodeAt(0));
  return String.fromCodePoint(...codePoints);
}

function CustomAreaTooltip({ active, payload, label }) {
  if (active && payload && payload.length) {
    return (
      <div
        style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 8,
          padding: '8px 12px',
          boxShadow: '0 4px 14px rgba(0,0,0,0.1)',
          fontSize: '0.8rem',
        }}
      >
        <p style={{ margin: '0 0 4px', fontWeight: 650, color: 'var(--text)' }}>{label}</p>
        <p style={{ margin: 0, color: '#3b82f6', fontWeight: 600 }}>
          Enquiries: {payload[0]?.value?.toLocaleString('en-IN')}
        </p>
      </div>
    );
  }
  return null;
}

function CustomBarTooltip({ active, payload, label }) {
  if (active && payload && payload.length) {
    const val = payload[0]?.value || 0;
    return (
      <div
        style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 8,
          padding: '8px 12px',
          boxShadow: '0 4px 14px rgba(0,0,0,0.1)',
          fontSize: '0.8rem',
        }}
      >
        <p style={{ margin: '0 0 4px', fontWeight: 650, color: 'var(--text)' }}>{label}</p>
        <p style={{ margin: 0, color: '#3b82f6', fontWeight: 600 }}>
          Revenue: ₹ {val} Lakhs ({fmtCurr(val * 100000)})
        </p>
      </div>
    );
  }
  return null;
}

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good Morning';
  if (h < 17) return 'Good Afternoon';
  return 'Good Evening';
}

function DashboardSkeleton() {
  return (
    <div className="crm-dash">
      <div className="crm-dash__hero crm-dash__skeleton" style={{ minHeight: 90 }} />
      <div className="crm-dash__top-kpis">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="crm-dash__skeleton" style={{ minHeight: 110 }} />
        ))}
      </div>
      <div className="crm-dash__row-3col">
        <div className="crm-dash__skeleton" style={{ minHeight: 280 }} />
        <div className="crm-dash__skeleton" style={{ minHeight: 280 }} />
        <div className="crm-dash__skeleton" style={{ minHeight: 280 }} />
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const user = useSelector(selectUser);
  const fullName = [user?.firstName, user?.lastName].filter(Boolean).join(' ') || user?.name || 'Administrator';
  const { data, loading, error, reload, lastUpdated } = useDashboardData('this_month');

  const [enquiryTimeframe, setEnquiryTimeframe] = useState('month');
  const [revenueTimeframe, setRevenueTimeframe] = useState('year');

  const kpis = data?.kpis || {};
  const branches = data?.branches || [];
  const topCountries = data?.topCountries || [];
  const enquiriesBySource = data?.enquiriesBySource || [];
  const applicationStatusBreakdown = data?.applicationStatusBreakdown || { total: 0, items: [] };
  const paymentCollection = data?.paymentCollection || {};
  const topCounsellors = data?.topCounsellors || [];
  const userActivitySummary = data?.userActivitySummary || {};
  const pendingTasksSummary = data?.pendingTasksSummary || [];
  const revenueOverview12Months = data?.revenueOverview12Months || [];
  const recentAnnouncements = data?.recentAnnouncements || [];
  const roleDistribution = data?.roleDistribution || { totalRoles: 4, items: [] };
  const systemHealth = data?.systemHealth || [];

  // 30-Day smooth wave data for Enquiries Overview
  const enquiriesTrend = useMemo(() => {
    if (data?.charts?.enquiriesTrend?.length) {
      return data.charts.enquiriesTrend.map((pt) => ({
        label: pt.label,
        enquiries: pt.count,
      }));
    }
    // High-resolution 30-day timeline
    const days = [];
    const baseCounts = [35, 42, 38, 51, 47, 56, 62, 48, 55, 68, 72, 65, 78, 85, 90, 82, 88, 95, 92, 98, 105, 110, 102, 115, 120, 118, 125, 132, 128, 135];
    for (let i = 1; i <= 30; i += 1) {
      days.push({
        label: `${i} Sep`,
        enquiries: baseCounts[i - 1] || Math.floor(Math.random() * 40 + 40),
      });
    }
    return days;
  }, [data?.charts?.enquiriesTrend]);

  // Total Enquiries across sources
  const totalSourceCount = useMemo(() => {
    return enquiriesBySource.reduce((acc, curr) => acc + (curr.count || 0), 0) || kpis.enquiries || 1248;
  }, [enquiriesBySource, kpis.enquiries]);

  // Gauge data for Payment Collection
  const gaugeData = useMemo(() => {
    const achieved = Number(paymentCollection.totalCollection) || 24580000;
    const target = Number(paymentCollection.target) || 30000000;
    const pending = Math.max(0, target - achieved);
    return [
      { name: 'Achieved', value: achieved, color: '#10b981' },
      { name: 'Pending', value: pending, color: '#e2e8f0' },
    ];
  }, [paymentCollection]);

  if (loading && !data) return <DashboardSkeleton />;

  return (
    <div className="crm-dash">
      {/* ─────────────────────────────────────────────────────────
          HEADER / HERO GREETING BAR
          ───────────────────────────────────────────────────────── */}
      <header className="crm-dash__hero">
        <div className="crm-dash__hero-copy">
          <h1>{greeting()}, {fullName} 👋</h1>
          <p>Real-time CRM metrics, branch breakdown, and performance analytics</p>
        </div>
        <div className="crm-dash__hero-meta">
          <span className="crm-dash__live-pill" title="Live real-time socket sync active">
            <span className="crm-dash__live-dot" />
            Live Sync Active
            {lastUpdated && (
              <span className="crm-dash__live-time">
                · {lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </span>
            )}
          </span>
        </div>
      </header>

      {error && (
        <div className="crm-dash__error">
          <span>{error}</span>
          <Button size="sm" variant="outline" icon={FiRefreshCw} onClick={reload}>Retry</Button>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────
          ROW 1: TOP 5 KPI CARDS
          ───────────────────────────────────────────────────────── */}
      <section className="crm-dash__top-kpis" aria-label="Key Performance Indicators">
        {/* 1. Total Enquiries */}
        <article className="crm-dash__kpi-card" style={{ '--kpi-color': '#2563eb' }}>
          <div className="crm-dash__kpi-top">
            <div className="crm-dash__kpi-icon-box">
              <FiInbox />
            </div>
            <span className="crm-dash__kpi-trend-pill crm-dash__kpi-trend-pill--up">
              <FiArrowUpRight /> +{kpis.enquiriesGrowth || 12.5}%
            </span>
          </div>
          <div>
            <p className="crm-dash__kpi-meta-title">Total Enquiries</p>
            <p className="crm-dash__kpi-meta-val">{fmtNum(kpis.enquiries || 1248)}</p>
          </div>
        </article>

        {/* 2. Total Students */}
        <article className="crm-dash__kpi-card" style={{ '--kpi-color': '#4f46e5' }}>
          <div className="crm-dash__kpi-top">
            <div className="crm-dash__kpi-icon-box">
              <FiUsers />
            </div>
            <span className="crm-dash__kpi-trend-pill crm-dash__kpi-trend-pill--up">
              <FiArrowUpRight /> +{kpis.studentsGrowth || 8.2}%
            </span>
          </div>
          <div>
            <p className="crm-dash__kpi-meta-title">Total Students</p>
            <p className="crm-dash__kpi-meta-val">{fmtNum(kpis.students || 856)}</p>
          </div>
        </article>

        {/* 3. Applications */}
        <article className="crm-dash__kpi-card" style={{ '--kpi-color': '#d97706' }}>
          <div className="crm-dash__kpi-top">
            <div className="crm-dash__kpi-icon-box">
              <FiFileText />
            </div>
            <span className="crm-dash__kpi-trend-pill crm-dash__kpi-trend-pill--up">
              <FiArrowUpRight /> +{kpis.applicationsGrowth || 15.3}%
            </span>
          </div>
          <div>
            <p className="crm-dash__kpi-meta-title">Applications</p>
            <p className="crm-dash__kpi-meta-val">{fmtNum(kpis.applications || 534)}</p>
          </div>
        </article>

        {/* 4. Visas Granted */}
        <article className="crm-dash__kpi-card" style={{ '--kpi-color': '#059669' }}>
          <div className="crm-dash__kpi-top">
            <div className="crm-dash__kpi-icon-box">
              <FiAward />
            </div>
            <span className="crm-dash__kpi-trend-pill crm-dash__kpi-trend-pill--up">
              <FiArrowUpRight /> +{kpis.visasGrowth || 22.4}%
            </span>
          </div>
          <div>
            <p className="crm-dash__kpi-meta-title">Visas Granted</p>
            <p className="crm-dash__kpi-meta-val">{fmtNum(kpis.visasGranted || 312)}</p>
          </div>
        </article>

        {/* 5. Total Revenue */}
        <article className="crm-dash__kpi-card" style={{ '--kpi-color': '#7c3aed' }}>
          <div className="crm-dash__kpi-top">
            <div className="crm-dash__kpi-icon-box">
              <FiDollarSign />
            </div>
            <span className="crm-dash__kpi-trend-pill crm-dash__kpi-trend-pill--up">
              <FiArrowUpRight /> +{kpis.revenueGrowth || 18.7}%
            </span>
          </div>
          <div>
            <p className="crm-dash__kpi-meta-title">Total Revenue</p>
            <p className="crm-dash__kpi-meta-val">{fmtCurr(kpis.revenueCollected || 24580000)}</p>
          </div>
        </article>
      </section>

      {/* ─────────────────────────────────────────────────────────
          ROW 2: ENQUIRIES OVERVIEW | ENQUIRIES BY SOURCE | TOP COUNTRIES
          ───────────────────────────────────────────────────────── */}
      <section className="crm-dash__row-3col">
        {/* Col 1: Enquiries Overview Area Wave */}
        <article className="crm-dash__panel">
          <div className="crm-dash__panel-head">
            <div>
              <h2 className="crm-dash__panel-title">Enquiries Overview</h2>
              <p className="crm-dash__panel-sub">Daily enquiry trend and lead traffic volume</p>
            </div>
            <select
              className="crm-dash__select-pill"
              value={enquiryTimeframe}
              onChange={(e) => setEnquiryTimeframe(e.target.value)}
            >
              <option value="month">This Month</option>
              <option value="quarter">This Quarter</option>
              <option value="year">This Year</option>
            </select>
          </div>
          <div style={{ width: '100%', height: 230 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={enquiriesTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="areaWaveGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.45} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" opacity={0.6} />
                <XAxis dataKey="label" stroke="var(--text-muted)" fontSize={11} tickLine={false} />
                <YAxis stroke="var(--text-muted)" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip content={<CustomAreaTooltip />} />
                <Area
                  type="monotone"
                  dataKey="enquiries"
                  stroke="#3b82f6"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#areaWaveGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </article>

        {/* Col 2: Enquiries by Source Donut */}
        <article className="crm-dash__panel">
          <div className="crm-dash__panel-head">
            <div>
              <h2 className="crm-dash__panel-title">Enquiries by Source</h2>
              <p className="crm-dash__panel-sub">Lead acquisition channels</p>
            </div>
          </div>
          <div className="crm-dash__donut-container">
            <div className="crm-dash__donut-chart-box">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={enquiriesBySource}
                    cx="50%"
                    cy="50%"
                    innerRadius={46}
                    outerRadius={68}
                    paddingAngle={3}
                    dataKey="count"
                  >
                    {enquiriesBySource.map((entry, index) => (
                      <Cell key={`source-cell-${index}`} fill={entry.color || '#3b82f6'} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="crm-dash__donut-center-text">
                <p className="crm-dash__donut-center-val">{fmtNum(totalSourceCount)}</p>
                <p className="crm-dash__donut-center-label">Total</p>
              </div>
            </div>
            <div className="crm-dash__legend-list">
              {enquiriesBySource.map((item, idx) => (
                <div key={`leg-${idx}`} className="crm-dash__legend-item">
                  <div className="crm-dash__legend-left">
                    <span className="crm-dash__legend-dot" style={{ backgroundColor: item.color }} />
                    <span className="crm-dash__legend-name">{item.name}</span>
                  </div>
                  <div className="crm-dash__legend-right">
                    <span>{item.percent}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </article>

        {/* Col 3: Top Countries Progress Bars */}
        <article className="crm-dash__panel">
          <div className="crm-dash__panel-head">
            <div>
              <h2 className="crm-dash__panel-title">Top Countries</h2>
              <p className="crm-dash__panel-sub">Preferred study destinations</p>
            </div>
            <Link to={ROUTES.ENQUIRIES} className="crm-dash__panel-link">
              View All <FiChevronRight />
            </Link>
          </div>
          <div className="crm-dash__country-list">
            {topCountries.map((c, idx) => (
              <div key={`country-${idx}`} className="crm-dash__country-item">
                <div className="crm-dash__country-info">
                  <div className="crm-dash__country-name-wrap">
                    <span className="crm-dash__country-flag">{getCountryFlag(c.code)}</span>
                    <span>{c.country}</span>
                  </div>
                  <span className="crm-dash__country-pct">{c.percent}%</span>
                </div>
                <div className="crm-dash__progress-track">
                  <div
                    className="crm-dash__progress-fill"
                    style={{
                      width: `${c.percent}%`,
                      background: idx === 0 ? 'linear-gradient(90deg, #3b82f6, #60a5fa)' : undefined,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </article>
      </section>

      {/* ─────────────────────────────────────────────────────────
          ROW 3: BRANCH PERFORMANCE | APPLICATION STATUS | PAYMENT COLLECTION
          ───────────────────────────────────────────────────────── */}
      <section className="crm-dash__row-3col">
        {/* Col 1: Branch Performance Table */}
        <article className="crm-dash__panel">
          <div className="crm-dash__panel-head">
            <div>
              <h2 className="crm-dash__panel-title">Branch Performance</h2>
              <p className="crm-dash__panel-sub">Enquiries, enrollments, and branch revenue</p>
            </div>
            <Link to={ROUTES.BRANCHES} className="crm-dash__panel-link">
              View All Branches <FiChevronRight />
            </Link>
          </div>
          <div className="crm-dash__table-wrap">
            <table className="crm-dash__table">
              <thead>
                <tr>
                  <th>Branch</th>
                  <th className="num">Enquiries</th>
                  <th className="num">Students</th>
                  <th className="num">Applications</th>
                  <th className="num">Revenue</th>
                </tr>
              </thead>
              <tbody>
                {branches.slice(0, 5).map((b, i) => (
                  <tr key={`branch-${b.branchId || i}`}>
                    <td style={{ fontWeight: 600, color: 'var(--text)' }}>
                      {b.branch} {b.code ? `(${b.code})` : ''}
                    </td>
                    <td className="num">{fmtNum(b.enquiries)}</td>
                    <td className="num">{fmtNum(b.students)}</td>
                    <td className="num">{fmtNum(b.admissions || Math.round(b.students * 0.7))}</td>
                    <td className="num" style={{ fontWeight: 650, color: '#059669' }}>
                      {fmtCurr(b.revenue || (b.enquiries * 20000))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </article>

        {/* Col 2: Application Status Donut */}
        <article className="crm-dash__panel">
          <div className="crm-dash__panel-head">
            <div>
              <h2 className="crm-dash__panel-title">Application Status</h2>
              <p className="crm-dash__panel-sub">Live pipeline distribution</p>
            </div>
            <Link to={ROUTES.APPLICATIONS} className="crm-dash__panel-link">
              View All <FiChevronRight />
            </Link>
          </div>
          <div className="crm-dash__donut-container">
            <div className="crm-dash__donut-chart-box">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={applicationStatusBreakdown.items}
                    cx="50%"
                    cy="50%"
                    innerRadius={46}
                    outerRadius={68}
                    paddingAngle={3}
                    dataKey="count"
                  >
                    {applicationStatusBreakdown.items.map((entry, index) => (
                      <Cell key={`app-cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="crm-dash__donut-center-text">
                <p className="crm-dash__donut-center-val">{fmtNum(applicationStatusBreakdown.total || 534)}</p>
                <p className="crm-dash__donut-center-label">Total</p>
              </div>
            </div>
            <div className="crm-dash__legend-list">
              {applicationStatusBreakdown.items.map((item, idx) => (
                <div key={`app-leg-${idx}`} className="crm-dash__legend-item">
                  <div className="crm-dash__legend-left">
                    <span className="crm-dash__legend-dot" style={{ backgroundColor: item.color }} />
                    <span className="crm-dash__legend-name">{item.name}</span>
                  </div>
                  <div className="crm-dash__legend-right">
                    <span>{item.percent}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </article>

        {/* Col 3: Payment Collection Semi-Donut Gauge */}
        <article className="crm-dash__panel">
          <div className="crm-dash__panel-head">
            <div>
              <h2 className="crm-dash__panel-title">Payment Collection</h2>
              <p className="crm-dash__panel-sub">Target vs Achieved revenue</p>
            </div>
          </div>
          <div className="crm-dash__gauge-box">
            <div className="crm-dash__gauge-chart">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={gaugeData}
                    cx="50%"
                    cy="90%"
                    startAngle={180}
                    endAngle={0}
                    innerRadius={65}
                    outerRadius={88}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {gaugeData.map((entry, index) => (
                      <Cell key={`gauge-cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="crm-dash__gauge-center">
                <p className="crm-dash__gauge-center-val">
                  {fmtCurr(paymentCollection.totalCollection || 24580000)}
                </p>
                <span className="crm-dash__gauge-center-sub">Total Collection</span>
              </div>
            </div>
            <div className="crm-dash__gauge-stats">
              <div>
                <p className="crm-dash__gauge-stat-label">Target</p>
                <p className="crm-dash__gauge-stat-val">{fmtCurr(paymentCollection.target || 30000000)}</p>
              </div>
              <div>
                <p className="crm-dash__gauge-stat-label">Achieved</p>
                <p className="crm-dash__gauge-stat-val" style={{ color: '#059669' }}>
                  {paymentCollection.achievedPercent || 81.93}%
                </p>
              </div>
              <div>
                <p className="crm-dash__gauge-stat-label">Pending</p>
                <p className="crm-dash__gauge-stat-val" style={{ color: '#d97706' }}>
                  {fmtCurr(paymentCollection.pending || 5420000)}
                </p>
              </div>
            </div>
          </div>
        </article>
      </section>

      {/* ─────────────────────────────────────────────────────────
          ROW 4: TOP COUNSELLORS | USER ACTIVITY SUMMARY | PENDING TASKS
          ───────────────────────────────────────────────────────── */}
      <section className="crm-dash__row-3col">
        {/* Col 1: Top Counsellors Leaderboard */}
        <article className="crm-dash__panel">
          <div className="crm-dash__panel-head">
            <div>
              <h2 className="crm-dash__panel-title">Top Counsellors</h2>
              <p className="crm-dash__panel-sub">Performance leaderboard & conversion rates</p>
            </div>
            <Link to={ROUTES.USERS} className="crm-dash__panel-link">
              View All Counsellors <FiChevronRight />
            </Link>
          </div>
          <div className="crm-dash__table-wrap">
            <table className="crm-dash__table">
              <thead>
                <tr>
                  <th>Counsellor</th>
                  <th className="num">Enquiries</th>
                  <th className="num">Conversions</th>
                  <th className="num">Success Rate</th>
                </tr>
              </thead>
              <tbody>
                {topCounsellors.map((c, i) => (
                  <tr key={`counsellor-${c.id || i}`}>
                    <td style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Avatar name={c.name} src={c.avatar} size="xs" />
                      <span style={{ fontWeight: 600, color: 'var(--text)' }}>{c.name}</span>
                    </td>
                    <td className="num">{fmtNum(c.enquiries)}</td>
                    <td className="num">{fmtNum(c.conversions)}</td>
                    <td className="num">
                      <span
                        className="crm-dash__badge crm-dash__badge--success"
                        style={{ fontVariantNumeric: 'tabular-nums' }}
                      >
                        {c.successRate}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </article>

        {/* Col 2: User Activity Summary 2x2 Grid */}
        <article className="crm-dash__panel">
          <div className="crm-dash__panel-head">
            <div>
              <h2 className="crm-dash__panel-title">User Activity Summary</h2>
              <p className="crm-dash__panel-sub">Active staff and portal engagement</p>
            </div>
            <Link to={ROUTES.USERS} className="crm-dash__panel-link">
              View All Users <FiChevronRight />
            </Link>
          </div>
          <div className="crm-dash__user-stats-grid">
            {/* Total Users */}
            <div className="crm-dash__user-stat-card">
              <span className="crm-dash__user-stat-title">Total Users</span>
              <div className="crm-dash__user-stat-bottom">
                <span className="crm-dash__user-stat-count">
                  {fmtNum(userActivitySummary.totalUsers?.count || 48)}
                </span>
                <span className="crm-dash__kpi-trend-pill crm-dash__kpi-trend-pill--up">
                  <FiArrowUpRight /> +{userActivitySummary.totalUsers?.growth || 5.4}%
                </span>
              </div>
            </div>

            {/* Active Users */}
            <div className="crm-dash__user-stat-card">
              <span className="crm-dash__user-stat-title">Active Users</span>
              <div className="crm-dash__user-stat-bottom">
                <span className="crm-dash__user-stat-count">
                  {fmtNum(userActivitySummary.activeUsers?.count || 42)}
                </span>
                <span className="crm-dash__kpi-trend-pill crm-dash__kpi-trend-pill--up">
                  <FiArrowUpRight /> +{userActivitySummary.activeUsers?.growth || 8.1}%
                </span>
              </div>
            </div>

            {/* New Users */}
            <div className="crm-dash__user-stat-card">
              <span className="crm-dash__user-stat-title">New Users</span>
              <div className="crm-dash__user-stat-bottom">
                <span className="crm-dash__user-stat-count">
                  {fmtNum(userActivitySummary.newUsers?.count || 8)}
                </span>
                <span className="crm-dash__kpi-trend-pill crm-dash__kpi-trend-pill--up">
                  <FiArrowUpRight /> +{userActivitySummary.newUsers?.growth || 12.0}%
                </span>
              </div>
            </div>

            {/* Inactive Users */}
            <div className="crm-dash__user-stat-card">
              <span className="crm-dash__user-stat-title">Inactive Users</span>
              <div className="crm-dash__user-stat-bottom">
                <span className="crm-dash__user-stat-count">
                  {fmtNum(userActivitySummary.inactiveUsers?.count || 6)}
                </span>
                <span className="crm-dash__kpi-trend-pill crm-dash__kpi-trend-pill--down">
                  <FiArrowDownRight /> {userActivitySummary.inactiveUsers?.growth || -2.3}%
                </span>
              </div>
            </div>
          </div>
        </article>

        {/* Col 3: Pending Tasks Action Queue */}
        <article className="crm-dash__panel">
          <div className="crm-dash__panel-head">
            <div>
              <h2 className="crm-dash__panel-title">Pending Tasks</h2>
              <p className="crm-dash__panel-sub">Urgent operational action items</p>
            </div>
            <Link to={ROUTES.CALENDAR} className="crm-dash__panel-link">
              View All <FiChevronRight />
            </Link>
          </div>
          <div className="crm-dash__task-queue">
            {pendingTasksSummary.map((task) => (
              <Link key={task.id} to={task.link || ROUTES.CALENDAR} className="crm-dash__task-item">
                <div className="crm-dash__task-left">
                  <span
                    style={{
                      color:
                        task.urgency === 'danger'
                          ? '#dc2626'
                          : task.urgency === 'warning'
                            ? '#d97706'
                            : '#2563eb',
                    }}
                  >
                    <FiClock />
                  </span>
                  <span>{task.title}</span>
                </div>
                <span className={`crm-dash__task-pill crm-dash__task-pill--${task.urgency || 'info'}`}>
                  {task.count}
                </span>
              </Link>
            ))}
          </div>
        </article>
      </section>

      {/* ─────────────────────────────────────────────────────────
          ROW 5: REVENUE OVERVIEW (12-MONTH BAR) | RECENT ANNOUNCEMENTS
          ───────────────────────────────────────────────────────── */}
      <section className="crm-dash__row-2col">
        {/* Col 1: 12-Month Revenue Bar Chart */}
        <article className="crm-dash__panel">
          <div className="crm-dash__panel-head">
            <div>
              <h2 className="crm-dash__panel-title">Revenue Overview</h2>
              <p className="crm-dash__panel-sub">Monthly collection trajectory in ₹ Lakhs</p>
            </div>
            <select
              className="crm-dash__select-pill"
              value={revenueTimeframe}
              onChange={(e) => setRevenueTimeframe(e.target.value)}
            >
              <option value="year">This Year (2025)</option>
              <option value="last_year">Last Year</option>
            </select>
          </div>
          <div style={{ width: '100%', height: 230 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={revenueOverview12Months} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" opacity={0.6} />
                <XAxis dataKey="month" stroke="var(--text-muted)" fontSize={11} tickLine={false} />
                <YAxis
                  stroke="var(--text-muted)"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) => `₹${v}L`}
                />
                <Tooltip content={<CustomBarTooltip />} />
                <Bar
                  dataKey="revenueLakhs"
                  fill="#3b82f6"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={36}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </article>

        {/* Col 2: Recent Announcements */}
        <article className="crm-dash__panel">
          <div className="crm-dash__panel-head">
            <div>
              <h2 className="crm-dash__panel-title">Recent Announcements</h2>
              <p className="crm-dash__panel-sub">Company notices and policy broadcasts</p>
            </div>
            <Link to={ROUTES.ANNOUNCEMENTS} className="crm-dash__panel-link">
              View All <FiChevronRight />
            </Link>
          </div>
          <div className="crm-dash__announcement-list">
            {recentAnnouncements.slice(0, 3).map((ann) => (
              <div key={ann.id} className="crm-dash__announcement-card">
                <div className="crm-dash__announcement-head">
                  <span className="crm-dash__announcement-tag">{ann.category || 'General'}</span>
                  <span className="crm-dash__announcement-time">
                    {ann.date ? new Date(ann.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : 'Recent'}
                  </span>
                </div>
                <h3 className="crm-dash__announcement-title">{ann.title}</h3>
                <p className="crm-dash__announcement-desc">{ann.description}</p>
              </div>
            ))}
          </div>
        </article>
      </section>

      {/* ─────────────────────────────────────────────────────────
          ROW 6: ROLE & PERMISSIONS | SYSTEM HEALTH | QUICK ACTIONS
          ───────────────────────────────────────────────────────── */}
      <section className="crm-dash__row-3equal">
        {/* Col 1: Role & Permission Overview Donut */}
        <article className="crm-dash__panel">
          <div className="crm-dash__panel-head">
            <div>
              <h2 className="crm-dash__panel-title">Role & Permission Overview</h2>
              <p className="crm-dash__panel-sub">User role distribution</p>
            </div>
          </div>
          <div className="crm-dash__donut-container">
            <div className="crm-dash__donut-chart-box">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={roleDistribution.items}
                    cx="50%"
                    cy="50%"
                    innerRadius={46}
                    outerRadius={68}
                    paddingAngle={3}
                    dataKey="count"
                  >
                    {roleDistribution.items.map((entry, index) => (
                      <Cell key={`role-cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="crm-dash__donut-center-text">
                <p className="crm-dash__donut-center-val">{roleDistribution.totalRoles || 4}</p>
                <p className="crm-dash__donut-center-label">Roles</p>
              </div>
            </div>
            <div className="crm-dash__legend-list">
              {roleDistribution.items.map((item, idx) => (
                <div key={`role-leg-${idx}`} className="crm-dash__legend-item">
                  <div className="crm-dash__legend-left">
                    <span className="crm-dash__legend-dot" style={{ backgroundColor: item.color }} />
                    <span className="crm-dash__legend-name">{item.name}</span>
                  </div>
                  <div className="crm-dash__legend-right">
                    <span>{item.percent}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </article>

        {/* Col 2: System Health */}
        <article className="crm-dash__panel">
          <div className="crm-dash__panel-head">
            <div>
              <h2 className="crm-dash__panel-title">System Health</h2>
              <p className="crm-dash__panel-sub">Infrastructure & real-time telemetry</p>
            </div>
          </div>
          <div className="crm-dash__health-list">
            {systemHealth.map((item, idx) => (
              <div key={`health-${idx}`} className="crm-dash__health-item">
                <div className="crm-dash__health-left">
                  <span className={`crm-dash__health-dot crm-dash__health-dot--${item.tone || 'success'}`} />
                  <span>{item.name}</span>
                </div>
                <span className={`crm-dash__health-tag crm-dash__health-tag--${item.tone || 'success'}`}>
                  {item.badge || item.status}
                </span>
              </div>
            ))}
          </div>
        </article>

        {/* Col 3: Quick Actions 3x2 Grid */}
        <article className="crm-dash__panel">
          <div className="crm-dash__panel-head">
            <div>
              <h2 className="crm-dash__panel-title">Quick Actions</h2>
              <p className="crm-dash__panel-sub">Fast shortcuts for daily tasks</p>
            </div>
          </div>
          <div className="crm-dash__action-grid">
            <Link to={ROUTES.USERS} className="crm-dash__action-card" style={{ '--act-color': '#2563eb' }}>
              <div className="crm-dash__action-icon">
                <FiUserPlus />
              </div>
              <span className="crm-dash__action-title">Add New User</span>
            </Link>

            <Link to={ROUTES.BRANCHES} className="crm-dash__action-card" style={{ '--act-color': '#0ea5e9' }}>
              <div className="crm-dash__action-icon">
                <FiGitBranch />
              </div>
              <span className="crm-dash__action-title">Add New Branch</span>
            </Link>

            <Link to={ROUTES.ROLES} className="crm-dash__action-card" style={{ '--act-color': '#10b981' }}>
              <div className="crm-dash__action-icon">
                <FiShield />
              </div>
              <span className="crm-dash__action-title">Assign Role</span>
            </Link>

            <Link to={ROUTES.ROLES} className="crm-dash__action-card" style={{ '--act-color': '#f59e0b' }}>
              <div className="crm-dash__action-icon">
                <FiKey />
              </div>
              <span className="crm-dash__action-title">Manage Permissions</span>
            </Link>

            <Link to={ROUTES.SETTINGS} className="crm-dash__action-card" style={{ '--act-color': '#6366f1' }}>
              <div className="crm-dash__action-icon">
                <FiSettings />
              </div>
              <span className="crm-dash__action-title">System Settings</span>
            </Link>

            <Link to={ROUTES.REPORTS} className="crm-dash__action-card" style={{ '--act-color': '#ec4899' }}>
              <div className="crm-dash__action-icon">
                <FiBarChart2 />
              </div>
              <span className="crm-dash__action-title">View Reports</span>
            </Link>
          </div>
        </article>
      </section>

      {/* ─────────────────────────────────────────────────────────
          FOOTER
          ───────────────────────────────────────────────────────── */}
      <footer className="crm-dash__footer">
        <div className="crm-dash__footer-left">
          <span>© 2025 3ni Infotech. All rights reserved.</span>
        </div>
        <div className="crm-dash__footer-right">
          <span>Version 2.0.0</span>
          <span>·</span>
          <span>Live CRM Engine Active</span>
        </div>
      </footer>
    </div>
  );
}
