import { useEffect, useMemo, useState } from 'react';
import { useParams, Navigate, Link } from 'react-router-dom';
import { FiUsers, FiCheckCircle, FiBookOpen, FiTrendingUp, FiActivity } from 'react-icons/fi';
import ContentLoader from '../../../components/ui/ContentLoader';
import { apiGet } from '../../../api/apiClient';
import { API } from '../../../config/api';
import { ROUTES } from '../../../config/routes';
import { REPORT_ROUTES } from '../config/reports.config';
import ReportPageShell, { ReportSectionChips, ReportError, ReportEmpty } from '../components/ReportPageShell';
import {
  ReportMetricCard,
  ReportMetricGrid,
  ReportSectionCard,
  ReportSimpleTable,
  ReportViewAll,
} from '../components/ReportCleanUi';
import {
  ReportBarChart,
  ReportDonutChart,
  ReportGaugeChart,
  ReportLineChart,
} from '../components/MuiReportCharts';
import { useReportFilters } from '../hooks/useReportFilters';
import '../styles/reports.css';

const VIEWS = [
  { id: 'students', label: 'Students', icon: FiUsers },
  { id: 'performance', label: 'Performance', icon: FiTrendingUp },
];
const VALID = new Set(VIEWS.map((v) => v.id));

function fmt(n) {
  if (n == null) return '—';
  const v = Number(n);
  return Number.isNaN(v) ? '—' : v.toLocaleString('en-IN');
}

export default function ReportsAcademicPage() {
  const { view } = useParams();
  const active = VALID.has(view) ? view : 'students';
  const filters = useReportFilters('this_month');
  const [students, setStudents] = useState(null);
  const [attendance, setAttendance] = useState(null);
  const [performance, setPerformance] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const [stu, att, perf] = await Promise.all([
        apiGet(API.STUDENTS_SUMMARY, filters.queryParams).catch(() => null),
        apiGet(API.REPORTS_ATTENDANCE, filters.queryParams).catch(() => null),
        apiGet(API.ACADEMIC_PERFORMANCE, filters.queryParams).catch(() => null),
      ]);
      setStudents(stu?.data || stu || null);
      setAttendance(att?.data || null);
      setPerformance(perf?.data || perf || null);
    } catch (e) {
      setError(e?.message || 'Unable to load academic report');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.refreshKey, JSON.stringify(filters.queryParams)]);

  if (view && !VALID.has(view)) {
    return <Navigate to={`${REPORT_ROUTES.ACADEMIC}/students`} replace />;
  }

  const statusRows = useMemo(
    () => (students
      ? Object.entries(students)
        .filter(([key]) => key !== 'total')
        .map(([status, count]) => ({ status, count: Number(count) || 0 }))
        .filter((r) => r.count > 0)
        .sort((a, b) => b.count - a.count)
      : []),
    [students],
  );

  const activeCount = statusRows.find((r) => /active/i.test(r.status))?.count
    ?? statusRows[0]?.count
    ?? 0;

  const courseTrend = performance?.courseTrend || [];
  const perfStudents = performance?.students || [];
  const attStudents = attendance?.class?.students || [];
  const attTotals = attendance?.class?.totals || {};
  const attPct = attTotals.records
    ? Math.round(((Number(attTotals.present) || 0) / Number(attTotals.records)) * 1000) / 10
    : 0;

  const tableRows = (perfStudents.length ? perfStudents : attStudents).slice(0, 12).map((row, i) => ({
    id: row.id || row.studentId || i,
    ...row,
    name: row.name
      || row.studentName
      || `${row.student?.firstName || ''} ${row.student?.lastName || ''}`.trim(),
  }));

  return (
    <ReportPageShell
      title="Student & Academic"
      subtitle="Student growth, attendance and academic performance"
      breadcrumbs={[{ label: 'Student & Academic' }]}
      filters={{
        preset: filters.preset,
        onPresetChange: filters.setPreset,
        customFrom: filters.customFrom,
        customTo: filters.customTo,
        onCustomFrom: filters.setCustomFrom,
        onCustomTo: filters.setCustomTo,
        branchId: filters.branchId,
        onBranchChange: filters.setBranchId,
        branchLocked: filters.branchLocked,
        canViewAllBranches: filters.canViewAllBranches,
        onRefresh: filters.refresh,
        refreshLoading: loading,
      }}
    >
      <ReportSectionChips items={VIEWS} activeId={active} basePath={REPORT_ROUTES.ACADEMIC} />

      {loading && <ContentLoader variant="dashboard" />}
      {!loading && error && <ReportError message={error} onRetry={load} />}

      {!loading && !error && active === 'students' && (
        <div className="crm-report-stack">
          <ReportMetricGrid cols={4}>
            <ReportMetricCard label="Total Students" value={fmt(students?.total)} icon={FiUsers} tone="primary" />
            <ReportMetricCard label="Active" value={fmt(activeCount)} icon={FiCheckCircle} tone="success" />
            <ReportMetricCard label="Status groups" value={fmt(statusRows.length)} icon={FiBookOpen} tone="info" />
            <ReportMetricCard label="Attendance %" value={`${attPct}%`} icon={FiActivity} tone="warning" />
          </ReportMetricGrid>

          <div className="crm-report-grid-3">
            <ReportSectionCard title="Status share" subtitle="Rainbow donut">
              {statusRows.length
                ? (
                  <ReportDonutChart
                    data={statusRows}
                    nameKey="status"
                    valueKey="count"
                    height={260}
                    centerValue={fmt(students?.total)}
                    centerLabel="Total"
                  />
                )
                : <ReportEmpty />}
            </ReportSectionCard>
            <ReportSectionCard title="Students by status" subtitle="Colorful bars">
              {statusRows.length
                ? (
                  <ReportBarChart
                    data={statusRows}
                    xKey="status"
                    yKey="count"
                    height={260}
                    layout={statusRows.length <= 4 ? 'horizontal' : 'vertical'}
                  />
                )
                : <ReportEmpty />}
            </ReportSectionCard>
            <ReportSectionCard title="Active rate" subtitle="Gauge">
              <ReportGaugeChart
                value={students?.total ? Math.round((activeCount / Number(students.total)) * 100) : 0}
                max={100}
                height={240}
                label="Active students"
              />
            </ReportSectionCard>
          </div>

          <ReportSectionCard title="Student status breakdown">
            <ReportSimpleTable
              columns={[
                { key: 'status', label: 'Status', swatchIndex: 0 },
                { key: 'count', label: 'Students', align: 'right' },
                {
                  key: 'share',
                  label: 'Share',
                  align: 'right',
                  render: (r) => {
                    const total = Number(students?.total) || 0;
                    if (!total) return '—';
                    return `${Math.round((Number(r.count) / total) * 1000) / 10}%`;
                  },
                },
              ]}
              rows={statusRows}
              empty="No student status data."
            />
            <ReportViewAll to={ROUTES.STUDENTS} />
          </ReportSectionCard>
        </div>
      )}

      {!loading && !error && active === 'performance' && (
        <div className="crm-report-stack">
          <ReportMetricGrid cols={4}>
            <ReportMetricCard label="Attendance %" value={`${attPct}%`} icon={FiActivity} tone="primary" />
            <ReportMetricCard label="Present" value={fmt(attTotals.present)} icon={FiCheckCircle} tone="success" />
            <ReportMetricCard label="Absent" value={fmt(attTotals.absent)} icon={FiUsers} tone="danger" />
            <ReportMetricCard label="Perf. students" value={fmt(perfStudents.length || attStudents.length)} icon={FiTrendingUp} tone="info" />
          </ReportMetricGrid>

          <div className="crm-report-grid-3">
            <ReportSectionCard title="Attendance sample" subtitle="Student %">
              {attStudents.length
                ? (
                  <ReportBarChart
                    data={attStudents.slice(0, 8).map((s) => ({
                      label: `${s.student?.firstName || ''} ${s.student?.lastName || ''}`.trim() || 'Student',
                      percent: s.percent,
                    }))}
                    xKey="label"
                    yKey="percent"
                    height={260}
                    layout="horizontal"
                  />
                )
                : <ReportEmpty message="No attendance rows." />}
            </ReportSectionCard>
            <ReportSectionCard title="Attendance mix" subtitle="Present / absent / late">
              <ReportDonutChart
                data={[
                  { label: 'Present', count: Number(attTotals.present) || 0 },
                  { label: 'Absent', count: Number(attTotals.absent) || 0 },
                  { label: 'Late', count: Number(attTotals.late) || 0 },
                ].filter((r) => r.count > 0)}
                nameKey="label"
                valueKey="count"
                height={260}
                centerValue={`${attPct}%`}
                centerLabel="Rate"
              />
            </ReportSectionCard>
            <ReportSectionCard title="Course trend" subtitle="Academic scores">
              {courseTrend.length
                ? (
                  <ReportLineChart
                    data={courseTrend.slice(0, 12).map((r, i) => ({
                      label: r.name || r.course || r.label || `C${i + 1}`,
                      count: Number(r.avgScore ?? r.score ?? r.percent ?? r.count) || 0,
                    }))}
                    xKey="label"
                    yKey="count"
                    height={260}
                    color="#0d9488"
                    seriesLabel="Score"
                  />
                )
                : <ReportEmpty message="No course trend rows." />}
            </ReportSectionCard>
          </div>

          <ReportSectionCard title="Course / student performance">
            <ReportSimpleTable
              columns={[
                {
                  key: 'name',
                  label: 'Student / Course',
                  render: (r) => r.name || r.studentName || r.courseName || r.batchName || '—',
                },
                {
                  key: 'attendance',
                  label: 'Attendance %',
                  align: 'right',
                  render: (r) => {
                    const v = r.attendancePercent ?? r.percent;
                    return v == null ? '—' : `${v}%`;
                  },
                  badge: (r) => {
                    const v = Number(r.attendancePercent ?? r.percent);
                    if (!Number.isFinite(v)) return 'info';
                    return v >= 75 ? 'success' : v >= 40 ? 'warning' : 'danger';
                  },
                },
                {
                  key: 'score',
                  label: 'Avg score',
                  align: 'right',
                  render: (r) => r.avgScore ?? r.score ?? r.metrics?.avgScore ?? '—',
                },
                {
                  key: 'batch',
                  label: 'Batch',
                  render: (r) => r.batchName || r.batch || '—',
                },
              ]}
              rows={tableRows}
              empty="No performance rows for this period."
            />
            <div className="crm-rviewall flex gap-3 justify-end">
              <Link to={ROUTES.STUDENTS}>Students</Link>
              <Link to={ROUTES.BATCHES}>Batches</Link>
            </div>
          </ReportSectionCard>
        </div>
      )}
    </ReportPageShell>
  );
}
