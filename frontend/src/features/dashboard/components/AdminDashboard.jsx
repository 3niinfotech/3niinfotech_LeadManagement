import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  FiUsers, FiInbox, FiFileText, FiDollarSign, FiGlobe, FiCalendar,
  FiBookOpen, FiUserCheck, FiDownload, FiRefreshCw, FiArrowUpRight,
  FiArrowDownRight, FiPlus, FiAlertTriangle,
} from 'react-icons/fi';
import Button from '../../../components/ui/Button';
import Avatar from '../../../components/ui/Avatar';
import ReportFiltersBar from '../../reports/components/ReportFiltersBar';
import {
  ReportSectionCard,
  ReportAttentionGrid,
  ReportSimpleTable,
} from '../../reports/components/ReportCleanUi';
import {
  ReportBarChart,
  ReportDonutChart,
  ReportFunnelChart,
  ReportMultiBarChart,
  ReportPieChart,
} from '../../reports/components/MuiReportCharts';
import { ReportEmpty, ReportError } from '../../reports/components/ReportPageShell';
import { useDashboardData } from '../hooks/useDashboardData';
import { usePermissions } from '../../../hooks/usePermissions';
import { PERMISSIONS } from '../../../config/permissions';
import { ROUTES } from '../../../config/routes';
import { getEnquiryStatusLabel } from '../../../config/constants';
import { selectUser } from '../../../redux/slices/authSlice';
import '../../reports/styles/reports.css';
import '../styles/dashboard.theme.css';

function fmt(value, isAmount = false) {
  if (value == null || value === '') return '—';
  const n = Number(value);
  if (Number.isNaN(n)) return String(value);
  if (isAmount) return `₹${n.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
  return n.toLocaleString('en-IN');
}

function fmtDate(value) {
  if (!value) return '—';
  return new Date(value).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric',
  });
}

function fmtTime(value) {
  if (!value) return '—';
  return new Date(value).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
}

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good Morning';
  if (h < 17) return 'Good Afternoon';
  return 'Good Evening';
}

function statusBadgeClass(status) {
  const s = String(status || '').toUpperCase();
  if (['NEW', 'DRAFT'].includes(s)) return 'crm-dash__badge--new';
  if (['CONVERTED', 'ENROLLED', 'PAID', 'APPROVED', 'PRESENT'].includes(s)) return 'crm-dash__badge--success';
  if (['PENDING', 'PARTIAL', 'OVERDUE', 'CONTACTED', 'COUNSELING'].includes(s)) return 'crm-dash__badge--warning';
  if (['LOST', 'REJECTED', 'ABSENT'].includes(s)) return 'crm-dash__badge--danger';
  return 'crm-dash__badge--muted';
}

function KpiCard({ className, icon: Icon, label, value, hint, trend }) {
  return (
    <article className={`crm-dash__kpi ${className || ''}`}>
      <div className="crm-dash__kpi-head">
        <span className="crm-dash__kpi-icon"><Icon strokeWidth={1.75} /></span>
        {trend != null && Number.isFinite(Number(trend)) && (
          <span className={`crm-dash__kpi-trend ${Number(trend) >= 0 ? 'crm-dash__kpi-trend--up' : 'crm-dash__kpi-trend--down'}`}>
            {Number(trend) >= 0 ? <FiArrowUpRight /> : <FiArrowDownRight />}
            {Number(trend) >= 0 ? '+' : ''}{Number(trend).toFixed(1)}%
          </span>
        )}
      </div>
      <p className="crm-dash__kpi-label">{label}</p>
      <p className="crm-dash__kpi-value">{value}</p>
      {hint ? <p className="crm-dash__kpi-hint">{hint}</p> : null}
    </article>
  );
}

function DashboardSkeleton() {
  return (
    <div className="crm-dash">
      <div className="crm-dash__hero crm-dash__skeleton" style={{ minHeight: 100 }} />
      <div className="crm-dash__kpi-grid">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="crm-dash__skeleton" />
        ))}
      </div>
      <div className="crm-dash__skeleton" style={{ minHeight: 280 }} />
    </div>
  );
}

export default function AdminDashboard() {
  const user = useSelector(selectUser);
  const { can } = usePermissions();
  const { data, loading, error, reload, filters } = useDashboardData('this_month');

  const visible = data?.visible || {};
  const kpis = data?.kpis || {};
  const charts = data?.charts || {};
  const name = user?.firstName || 'Admin';

  const funnel = useMemo(
    () => (charts.funnel || []).map((row) => ({
      ...row,
      label: getEnquiryStatusLabel(row.status) || row.status,
    })),
    [charts.funnel],
  );

  const monthlyTrend = useMemo(
    () => (charts.monthlyTrend || []).map((row) => ({
      label: row.label,
      enquiries: row.enquiries,
      converted: row.converted,
    })),
    [charts.monthlyTrend],
  );

  const revenueChart = useMemo(() => {
    const collected = Number(kpis.revenueCollected) || 0;
    const pending = Number(kpis.feesOutstanding) || 0;
    const overdue = Number(kpis.feesOverdue) || 0;
    return [
      { label: 'Collected', amount: collected },
      { label: 'Pending', amount: pending },
      { label: 'Overdue', amount: overdue },
    ].filter((r) => r.amount > 0);
  }, [kpis]);

  const collectionPct = useMemo(() => {
    const collected = Number(kpis.revenueCollected) || 0;
    const pending = Number(kpis.feesOutstanding) || 0;
    const total = collected + pending;
    if (!total) return null;
    return Math.round((collected / total) * 1000) / 10;
  }, [kpis]);

  const attention = useMemo(
    () => (data?.alerts || []).map((item) => ({
      ...item,
      icon: FiAlertTriangle,
      tone: item.isAmount || /overdue/i.test(item.label || '') ? 'danger' : 'warning',
      count: item.isAmount ? fmt(item.count, true) : fmt(item.count),
    })),
    [data?.alerts],
  );

  const quickActions = useMemo(() => {
    const actions = [];
    if (can(PERMISSIONS.ENQUIRIES_CREATE)) {
      actions.push({ label: 'Add Enquiry', to: ROUTES.ENQUIRY_CREATE, icon: FiPlus });
    }
    if (can(PERMISSIONS.STUDENTS_CREATE)) {
      actions.push({ label: 'Add Student', to: ROUTES.STUDENTS, icon: FiUsers });
    }
    if (can(PERMISSIONS.ENQUIRIES_VIEW)) {
      actions.push({ label: 'View Enquiries', to: ROUTES.ENQUIRIES, icon: FiInbox });
    }
    if (can(PERMISSIONS.APPLICATIONS_VIEW)) {
      actions.push({ label: 'Applications', to: ROUTES.APPLICATIONS, icon: FiFileText });
    }
    if (can(PERMISSIONS.INVOICES_VIEW)) {
      actions.push({ label: 'Fees', to: ROUTES.FEES, icon: FiDollarSign });
    }
    if (can(PERMISSIONS.ENQUIRIES_VIEW)) {
      actions.push({ label: 'Calendar', to: ROUTES.CALENDAR, icon: FiCalendar });
    }
    if (visible.classes || can(PERMISSIONS.STUDENTS_VIEW)) {
      actions.push({ label: 'Batches', to: ROUTES.BATCHES, icon: FiBookOpen });
    }
    return actions;
  }, [can, visible.classes]);

  const counsellorRows = useMemo(
    () => (data?.counsellors || []).map((c) => ({
      counsellor: c.name || '—',
      leads: c.assigned ?? 0,
      counseling: c.followups ?? c.demos ?? '—',
      admissions: c.converted ?? 0,
      conversion: c.rate != null ? `${c.rate}%` : '—',
    })),
    [data?.counsellors],
  );

  if (loading && !data) return <DashboardSkeleton />;

  return (
    <div className="crm-dash">
      <header className="crm-dash__hero">
        <div className="crm-dash__hero-copy">
          <h1>{greeting()}, {name} 👋</h1>
          <p>Here&apos;s what&apos;s happening across your organization today.</p>
        </div>
        <div className="crm-dash__hero-meta">
          <span className="crm-dash__date-pill">
            <FiCalendar />
            {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </span>
          <Button
            size="sm"
            variant="outline"
            icon={FiDownload}
            onClick={() => { window.location.href = ROUTES.REPORTS_EXPORT; }}
          >
            Export
          </Button>
        </div>
      </header>

      <div className="crm-dash__filters">
        <ReportFiltersBar
          preset={filters.preset}
          onPresetChange={filters.setPreset}
          customFrom={filters.customFrom}
          customTo={filters.customTo}
          onCustomFrom={filters.setCustomFrom}
          onCustomTo={filters.setCustomTo}
          branchId={filters.branchId}
          onBranchChange={filters.setBranchId}
          branchLocked={filters.branchLocked}
          canViewAllBranches={filters.canViewAllBranches}
          onRefresh={() => { filters.refresh(); reload(); }}
          refreshLoading={loading}
        />
      </div>

      {error && (
        <div className="crm-dash__error">
          <span>{error}</span>
          <Button size="sm" variant="outline" icon={FiRefreshCw} onClick={reload}>Retry</Button>
        </div>
      )}

      {!error && data && (
        <>
          <section className="crm-dash__kpi-grid" aria-label="Key metrics">
            {(visible.students !== false) && (
              <KpiCard
                className="crm-dash__kpi--students"
                icon={FiUsers}
                label="Total Students"
                value={fmt(kpis.students)}
                hint={`${fmt(kpis.converted)} converted · ${kpis.conversionRate != null ? `${kpis.conversionRate}%` : '—'} rate`}
              />
            )}
            {(visible.enquiries !== false) && (
              <KpiCard
                className="crm-dash__kpi--enquiries"
                icon={FiInbox}
                label="Total Enquiries"
                value={fmt(kpis.enquiries)}
                hint="New enquiries in selected period"
              />
            )}
            {(visible.applications !== false) && (
              <KpiCard
                className="crm-dash__kpi--applications"
                icon={FiFileText}
                label="Applications"
                value={fmt(kpis.applications)}
                hint={`${fmt(kpis.applicationsInReview)} in review`}
              />
            )}
            {(visible.finance !== false) && (
              <KpiCard
                className="crm-dash__kpi--revenue"
                icon={FiDollarSign}
                label="Fees / Revenue"
                value={fmt(kpis.revenueCollected, true)}
                hint={`${fmt(kpis.feesOutstanding, true)} pending`}
              />
            )}
            {(visible.visas !== false) && (
              <KpiCard
                className="crm-dash__kpi--visa"
                icon={FiGlobe}
                label="Visa Cases"
                value={fmt(kpis.visasPending)}
                hint="Active pending cases"
              />
            )}
            {(visible.attendance || visible.classes) && (
              <KpiCard
                className="crm-dash__kpi--attendance"
                icon={FiUserCheck}
                label="Attendance"
                value={kpis.attendancePercent != null ? `${kpis.attendancePercent}%` : '—'}
                hint={`${fmt(kpis.attendancePresent)} present · ${fmt(kpis.attendanceAbsent)} absent`}
              />
            )}
            {(visible.classes !== false) && (
              <KpiCard
                className="crm-dash__kpi--batches"
                icon={FiBookOpen}
                label="Active Batches"
                value={fmt(kpis.activeBatches)}
                hint={`${fmt(data?.academic?.todayClasses)} classes today`}
              />
            )}
            <KpiCard
              className="crm-dash__kpi--staff"
              icon={FiUsers}
              label="Staff"
              value={fmt((kpis.counsellors || 0) + (kpis.teachers || 0))}
              hint={`${fmt(kpis.counsellors)} counselors · ${fmt(kpis.teachers)} teachers`}
            />
          </section>

          <div className="crm-dash__layout-main">
            <div className="crm-dash__layout">
              <div className="crm-report-grid-2">
                <ReportSectionCard
                  title="Enquiry & Admission Performance"
                  subtitle="Monthly enquiries vs conversions"
                >
                  {monthlyTrend.length
                    ? (
                      <ReportMultiBarChart
                        data={monthlyTrend}
                        xKey="label"
                        height={300}
                        series={[
                          { key: 'enquiries', label: 'Enquiries' },
                          { key: 'converted', label: 'Converted' },
                        ]}
                      />
                    )
                    : <ReportEmpty message="No data available for the selected period." />}
                </ReportSectionCard>

                <ReportSectionCard
                  title="Revenue & Fee Collection"
                  subtitle={collectionPct != null ? `${collectionPct}% collected · ${fmt(kpis.feesOutstanding, true)} pending` : 'Fee collection overview'}
                >
                  {revenueChart.length
                    ? (
                      <ReportBarChart
                        data={revenueChart}
                        xKey="label"
                        yKey="amount"
                        height={300}
                        seriesLabel="Amount (₹)"
                        colorful
                      />
                    )
                    : <ReportEmpty message="No revenue data for the selected period." />}
                </ReportSectionCard>
              </div>

              <div className="crm-report-grid-3">
                <ReportSectionCard title="Students by Course" subtitle="Distribution across programs">
                  {(charts.studentsByCourse || []).length
                    ? (
                      <ReportDonutChart
                        data={charts.studentsByCourse}
                        nameKey="course"
                        valueKey="count"
                        height={260}
                        centerLabel="Students"
                        centerValue={fmt(kpis.students)}
                      />
                    )
                    : <ReportEmpty message="No student distribution data." />}
                </ReportSectionCard>

                <ReportSectionCard title="Application Status" subtitle="Pipeline breakdown">
                  {(charts.applicationStatus || []).length
                    ? <ReportDonutChart data={charts.applicationStatus} nameKey="label" valueKey="count" height={260} />
                    : <ReportEmpty message="No application data." />}
                </ReportSectionCard>

                <ReportSectionCard title="Visa Status" subtitle="Case overview">
                  {(charts.visaStatus || []).length
                    ? <ReportPieChart data={charts.visaStatus} nameKey="label" valueKey="count" height={260} />
                    : <ReportEmpty message="No visa data." />}
                </ReportSectionCard>
              </div>

              <div className="crm-report-grid-2">
                <ReportSectionCard
                  title="Lead / Enquiry Funnel"
                  subtitle="Stage-wise conversion"
                  action={<Link to={ROUTES.REPORTS_LEADS} className="crm-rlink">View reports</Link>}
                >
                  {funnel.length
                    ? <ReportFunnelChart data={funnel} nameKey="label" valueKey="count" height={300} />
                    : <ReportEmpty message="No funnel data for the selected period." />}
                </ReportSectionCard>

                <ReportSectionCard title="Attendance Trend" subtitle="Today's batch performance">
                  {(data?.attendance?.batchRows || []).length
                    ? (
                      <div className="crm-dash__table-wrap">
                        <table className="crm-dash__table">
                          <thead>
                            <tr>
                              <th>Batch</th>
                              <th className="num">Students</th>
                              <th className="num">Present</th>
                              <th className="num">Absent</th>
                              <th className="num">Attendance</th>
                            </tr>
                          </thead>
                          <tbody>
                            {(data.attendance.batchRows || []).map((row, i) => (
                              <tr key={row.sessionId || i}>
                                <td>{row.batch || row.course || '—'}</td>
                                <td className="num">{fmt(row.students)}</td>
                                <td className="num">{fmt(row.present)}</td>
                                <td className="num">{fmt(row.absent)}</td>
                                <td className="num">
                                  {row.percent != null ? `${row.percent}%` : '—'}
                                  <div className="crm-dash__att-bar">
                                    <span style={{ width: `${Math.min(100, row.percent || 0)}%` }} />
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )
                    : <ReportEmpty message="No attendance marked today." />}
                </ReportSectionCard>
              </div>

              {(data?.branches || []).length > 0 && (
                <ReportSectionCard
                  title="Branch Performance"
                  subtitle="Compare branches by key metrics"
                  action={<Link to={ROUTES.REPORTS} className="crm-rlink">All reports</Link>}
                >
                  <ReportSimpleTable
                    columns={[
                      { key: 'branch', label: 'Branch' },
                      { key: 'students', label: 'Students', align: 'right' },
                      { key: 'enquiries', label: 'Enquiries', align: 'right' },
                      { key: 'admissions', label: 'Admissions', align: 'right' },
                      { key: 'conversion', label: 'Conversion', align: 'right', render: (r) => `${r.conversion}%` },
                    ]}
                    rows={data.branches}
                    emptyMessage="No branch data for your scope."
                  />
                </ReportSectionCard>
              )}

              {counsellorRows.length > 0 && (
                <ReportSectionCard title="Counselor Performance" subtitle="Top counselors by pipeline">
                  <ReportSimpleTable
                    columns={[
                      { key: 'counsellor', label: 'Counselor' },
                      { key: 'leads', label: 'Leads', align: 'right' },
                      { key: 'counseling', label: 'Counseling', align: 'right' },
                      { key: 'admissions', label: 'Admissions', align: 'right' },
                      { key: 'conversion', label: 'Conversion', align: 'right' },
                    ]}
                    rows={counsellorRows}
                    emptyMessage="No counselor data."
                  />
                </ReportSectionCard>
              )}

              <div className="crm-report-grid-2">
                <ReportSectionCard
                  title="Recent Enquiries"
                  action={<Link to={ROUTES.ENQUIRIES} className="crm-rlink">View all</Link>}
                >
                  {(data.recentEnquiries || []).length
                    ? (
                      <div className="crm-dash__table-wrap">
                        <table className="crm-dash__table">
                          <thead>
                            <tr>
                              <th>Student</th>
                              <th>Course</th>
                              <th>Counselor</th>
                              <th>Source</th>
                              <th>Status</th>
                              <th>Date</th>
                            </tr>
                          </thead>
                          <tbody>
                            {data.recentEnquiries.map((row) => (
                              <tr key={row.id}>
                                <td>
                                  <Link to={ROUTES.ENQUIRY_DETAIL(row.id)} className="crm-rlink">{row.name}</Link>
                                </td>
                                <td>{row.course || '—'}</td>
                                <td>{row.counsellor}</td>
                                <td>{row.source || '—'}</td>
                                <td>
                                  <span className={`crm-dash__badge ${statusBadgeClass(row.status)}`}>
                                    {getEnquiryStatusLabel(row.status) || row.status}
                                  </span>
                                </td>
                                <td>{fmtDate(row.date)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )
                    : <ReportEmpty message="No recent enquiries." />}
                </ReportSectionCard>

                <ReportSectionCard
                  title="Recent Admissions"
                  action={<Link to={ROUTES.STUDENTS} className="crm-rlink">View all</Link>}
                >
                  {(data.recentAdmissions || []).length
                    ? (
                      <div className="crm-dash__table-wrap">
                        <table className="crm-dash__table">
                          <thead>
                            <tr>
                              <th>Student</th>
                              <th>Course</th>
                              <th>Branch</th>
                              <th>Counselor</th>
                              <th>Date</th>
                            </tr>
                          </thead>
                          <tbody>
                            {data.recentAdmissions.map((row) => (
                              <tr key={row.id}>
                                <td>
                                  <Link to={ROUTES.STUDENT_DETAIL(row.id)} className="crm-rlink">{row.name}</Link>
                                </td>
                                <td>{row.course || '—'}</td>
                                <td>{row.branch || '—'}</td>
                                <td>{row.counsellor}</td>
                                <td>{fmtDate(row.date)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )
                    : <ReportEmpty message="No recent admissions." />}
                </ReportSectionCard>
              </div>

              <ReportSectionCard title="Fee Management" subtitle="Recent payments & collections">
                <div className="crm-report-grid-2" style={{ marginBottom: '1rem' }}>
                  <div>
                    <p className="crm-dash__kpi-label">Collected</p>
                    <p className="crm-dash__kpi-value">{fmt(kpis.revenueCollected, true)}</p>
                  </div>
                  <div>
                    <p className="crm-dash__kpi-label">Pending</p>
                    <p className="crm-dash__kpi-value">{fmt(kpis.feesOutstanding, true)}</p>
                  </div>
                  <div>
                    <p className="crm-dash__kpi-label">Overdue</p>
                    <p className="crm-dash__kpi-value">{fmt(kpis.feesOverdue, true)}</p>
                  </div>
                  <div>
                    <p className="crm-dash__kpi-label">Collection %</p>
                    <p className="crm-dash__kpi-value">{collectionPct != null ? `${collectionPct}%` : '—'}</p>
                  </div>
                </div>
                {(data.recentPayments || []).length
                  ? (
                    <div className="crm-dash__table-wrap">
                      <table className="crm-dash__table">
                        <thead>
                          <tr>
                            <th>Student</th>
                            <th className="num">Amount</th>
                            <th>Date</th>
                            <th>Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {data.recentPayments.map((row) => (
                            <tr key={row.id}>
                              <td>{row.student}</td>
                              <td className="num">{fmt(row.amount, true)}</td>
                              <td>{fmtDate(row.date)}</td>
                              <td>
                                <span className={`crm-dash__badge ${statusBadgeClass(row.status)}`}>{row.status}</span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )
                  : <ReportEmpty message="No recent payments." />}
              </ReportSectionCard>
            </div>

            <aside className="crm-dash__layout-aside" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {attention.length > 0 && (
                <div className="crm-dash__panel">
                  <div className="crm-dash__panel-head">
                    <div>
                      <h3 className="crm-dash__panel-title">Action Required</h3>
                      <p className="crm-dash__panel-sub">Items needing your attention</p>
                    </div>
                  </div>
                  <ReportAttentionGrid items={attention} />
                </div>
              )}

              {quickActions.length > 0 && (
                <div className="crm-dash__panel">
                  <div className="crm-dash__panel-head">
                    <div>
                      <h3 className="crm-dash__panel-title">Quick Actions</h3>
                      <p className="crm-dash__panel-sub">Common tasks</p>
                    </div>
                  </div>
                  <div className="crm-dash__quick-actions">
                    {quickActions.map((action) => (
                      <Link key={action.to} to={action.to} className="crm-dash__quick-btn">
                        <action.icon size={14} />
                        {action.label}
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              <div className="crm-dash__panel">
                <div className="crm-dash__panel-head">
                  <div>
                    <h3 className="crm-dash__panel-title">Academic Overview</h3>
                    <p className="crm-dash__panel-sub">Today&apos;s academic ops</p>
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div>
                    <p className="crm-dash__kpi-label">Active batches</p>
                    <p className="crm-dash__kpi-value" style={{ fontSize: '1.25rem' }}>{fmt(data?.academic?.activeBatches)}</p>
                  </div>
                  <div>
                    <p className="crm-dash__kpi-label">Today&apos;s classes</p>
                    <p className="crm-dash__kpi-value" style={{ fontSize: '1.25rem' }}>{fmt(data?.academic?.todayClasses)}</p>
                  </div>
                  <div>
                    <p className="crm-dash__kpi-label">Teachers</p>
                    <p className="crm-dash__kpi-value" style={{ fontSize: '1.25rem' }}>{fmt(data?.academic?.teachers)}</p>
                  </div>
                  <div>
                    <p className="crm-dash__kpi-label">Attendance pending</p>
                    <p className="crm-dash__kpi-value" style={{ fontSize: '1.25rem' }}>{fmt(data?.academic?.attendancePending)}</p>
                  </div>
                </div>
              </div>

              <div className="crm-dash__panel">
                <div className="crm-dash__panel-head">
                  <div>
                    <h3 className="crm-dash__panel-title">Upcoming Classes</h3>
                    <p className="crm-dash__panel-sub">Next 7 days</p>
                  </div>
                  <Link to={ROUTES.BATCHES} className="crm-rlink">View</Link>
                </div>
                {(data.upcomingClasses || []).length
                  ? data.upcomingClasses.map((cls) => (
                    <div key={cls.id} className="crm-dash__class-card">
                      <p className="crm-dash__class-title">{cls.batch || cls.course || 'Class'}</p>
                      <p className="crm-dash__class-meta">
                        {fmtTime(cls.startAt)} – {fmtTime(cls.endAt)}
                        {cls.room ? ` · ${cls.room}` : ''}
                      </p>
                      <p className="crm-dash__class-meta">
                        {cls.teacher} · {fmt(cls.students)} students
                      </p>
                    </div>
                  ))
                  : <p className="crm-dash__empty">No upcoming classes.</p>}
              </div>

              <div className="crm-dash__panel">
                <div className="crm-dash__panel-head">
                  <div>
                    <h3 className="crm-dash__panel-title">Today&apos;s Activity</h3>
                    <p className="crm-dash__panel-sub">Latest updates</p>
                  </div>
                </div>
                <div className="crm-dash__activity">
                  {(data.activity || []).length === 0 && (
                    <p className="crm-dash__empty">No recent activity.</p>
                  )}
                  {(data.activity || []).slice(0, 12).map((item) => (
                    <div key={item.id} className="crm-dash__activity-item">
                      <Avatar
                        name={item.user ? `${item.user.firstName} ${item.user.lastName}` : 'System'}
                        size="sm"
                      />
                      <div>
                        <p className="crm-dash__activity-text">{item.description || item.action}</p>
                        <p className="crm-dash__activity-time">
                          {item.user ? `${item.user.firstName} ${item.user.lastName}` : 'System'}
                          {' · '}
                          {new Date(item.createdAt).toLocaleString('en-IN')}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </aside>
          </div>
        </>
      )}
    </div>
  );
}
