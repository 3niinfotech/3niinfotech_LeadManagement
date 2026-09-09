import { useEffect, useMemo, useState } from 'react';
import { useParams, Navigate, Link } from 'react-router-dom';
import { FiAlertTriangle, FiPhone, FiMonitor, FiCheckCircle, FiUsers } from 'react-icons/fi';
import ContentLoader from '../../../components/ui/ContentLoader';
import { apiGet } from '../../../api/apiClient';
import { API } from '../../../config/api';
import { ROUTES } from '../../../config/routes';
import { REPORT_ROUTES, OPERATIONS_REPORT_VIEWS } from '../config/reports.config';
import ReportPageShell, { ReportSectionChips, ReportError, ReportEmpty } from '../components/ReportPageShell';
import {
  ReportSectionCard,
  ReportMiniMetrics,
  ReportAttentionGrid,
  ReportSimpleTable,
  ReportViewAll,
  ReportMetricCard,
  ReportMetricGrid,
} from '../components/ReportCleanUi';
import {
  ReportBarChart,
  ReportMultiBarChart,
  ReportDonutChart,
  ReportGaugeChart,
} from '../components/MuiReportCharts';
import { useReportFilters } from '../hooks/useReportFilters';
import '../styles/reports.css';

const VALID = new Set(OPERATIONS_REPORT_VIEWS.map((v) => v.id));

function fmt(n) {
  if (n == null) return '—';
  const v = Number(n);
  return Number.isNaN(v) ? '—' : v.toLocaleString('en-IN');
}

export default function ReportsOperationsPage() {
  const { view } = useParams();
  const active = VALID.has(view) ? view : 'followup';
  const filters = useReportFilters('this_month');
  const [enquiryData, setEnquiryData] = useState(null);
  const [attendanceData, setAttendanceData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const [enq, att] = await Promise.all([
        apiGet(API.REPORTS_ENQUIRIES, filters.queryParams),
        apiGet(API.REPORTS_ATTENDANCE, filters.queryParams).catch(() => null),
      ]);
      setEnquiryData(enq?.data || null);
      setAttendanceData(att?.data || null);
    } catch (e) {
      setEnquiryData(null);
      setError(e?.message || 'Unable to load operations report');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.refreshKey, JSON.stringify(filters.queryParams)]);

  const fu = enquiryData?.followUp || {};
  const demo = enquiryData?.demo || {};
  const cls = attendanceData?.class?.totals || {};
  const present = Number(cls.present) || 0;
  const absent = Number(cls.absent) || 0;
  const late = Number(cls.late) || 0;
  const records = Number(cls.records) || 0;
  const attendancePct = records > 0 ? Math.round((present / records) * 1000) / 10 : 0;

  const demoScheduled = (demo.bySessionStatus || []).reduce((s, r) => s + (Number(r.count) || 0), 0) || demo.total || 0;
  const demoAttended = (demo.byAttendance || []).find((r) => /present|attend/i.test(String(r.attendance || '')))?.count
    ?? (demo.byAttendance || [])[0]?.count
    ?? 0;

  const actionItems = useMemo(() => {
    const items = [];
    if (active === 'followup' && fu.overdue) {
      items.push({
        id: 'overdue-fu',
        label: 'Overdue Follow-ups',
        description: 'Follow-ups not done on time',
        count: fmt(fu.overdue),
        href: ROUTES.CALENDAR,
        icon: FiAlertTriangle,
        tone: 'danger',
      });
    }
    if (active === 'demo' && demo.total) {
      items.push({
        id: 'demos',
        label: 'Logged demos',
        description: 'Demo sessions in selected range',
        count: fmt(demo.total),
        href: ROUTES.DEMO,
        icon: FiMonitor,
        tone: 'warning',
      });
    }
    if (active === 'attendance' && cls.absent) {
      items.push({
        id: 'attendance',
        label: 'Attendance issues',
        description: 'Absent class records',
        count: fmt(cls.absent),
        href: ROUTES.BATCHES,
        icon: FiCheckCircle,
        tone: 'info',
      });
    }
    // Always surface cross-ops alerts lightly when empty for this tab
    if (!items.length && fu.overdue) {
      items.push({
        id: 'overdue-fu',
        label: 'Overdue Follow-ups',
        description: 'Follow-ups not done on time',
        count: fmt(fu.overdue),
        href: ROUTES.CALENDAR,
        icon: FiAlertTriangle,
        tone: 'danger',
      });
    }
    return items;
  }, [active, fu.overdue, fu, demo.total, demo, cls.absent, cls]);

  const demoCompare = useMemo(() => {
    const byResult = demo.byResult || [];
    if (!byResult.length) return [];
    return byResult.map((r) => ({
      label: r.result,
      scheduled: Number(r.count) || 0,
      attended: /attend|present|converted|interested/i.test(String(r.result || '')) ? Number(r.count) || 0 : 0,
    }));
  }, [demo]);

  const fuStages = fu.byStage || [];
  const demoResults = demo.byResult || [];
  const attMix = [
    { label: 'Present', count: present },
    { label: 'Absent', count: absent },
    { label: 'Late', count: late },
  ].filter((r) => r.count > 0);

  if (view && !VALID.has(view)) {
    return <Navigate to={`${REPORT_ROUTES.OPERATIONS}/followup`} replace />;
  }

  return (
    <ReportPageShell
      title="Operations"
      subtitle="Follow-ups, demos and attendance activity"
      breadcrumbs={[{ label: 'Operations' }]}
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
      <ReportSectionChips items={OPERATIONS_REPORT_VIEWS} activeId={active} basePath={REPORT_ROUTES.OPERATIONS} />

      {loading && <ContentLoader variant="dashboard" />}
      {!loading && error && <ReportError message={error} onRetry={load} />}

      {!loading && !error && active === 'followup' && (
        <div className="crm-report-stack">
          <ReportMetricGrid cols={4}>
            <ReportMetricCard label="Due Today" value={fmt(fu.dueToday)} icon={FiPhone} tone="primary" />
            <ReportMetricCard label="Logged (month)" value={fmt(fu.loggedThisMonth)} icon={FiCheckCircle} tone="success" />
            <ReportMetricCard label="Overdue" value={fmt(fu.overdue)} icon={FiAlertTriangle} tone="danger" />
            <ReportMetricCard label="Channels" value={fmt(fuStages.length)} icon={FiMonitor} tone="info" />
          </ReportMetricGrid>

          <div className="crm-report-grid-2">
            <ReportSectionCard title="Follow-up by channel" subtitle="Colorful volume mix">
              {fuStages.length
                ? (
                  <ReportBarChart
                    data={fuStages}
                    xKey="stage"
                    yKey="count"
                    height={280}
                    layout={fuStages.length <= 3 ? 'horizontal' : 'vertical'}
                  />
                )
                : <ReportEmpty />}
            </ReportSectionCard>
            <ReportSectionCard title="Channel share" subtitle="Donut series">
              {fuStages.length
                ? (
                  <ReportDonutChart
                    data={fuStages}
                    nameKey="stage"
                    valueKey="count"
                    height={280}
                    centerValue={fmt(fu.loggedThisMonth)}
                    centerLabel="Logged"
                  />
                )
                : <ReportEmpty />}
            </ReportSectionCard>
          </div>

          <ReportSectionCard title="Action required">
            <ReportAttentionGrid items={actionItems} emptyMessage="No overdue follow-ups." />
          </ReportSectionCard>

          <div className="flex gap-3 flex-wrap">
            <Link to={ROUTES.CALENDAR} className="crm-rlink">Calendar</Link>
            <Link to={ROUTES.ENQUIRIES} className="crm-rlink">Enquiries</Link>
          </div>
        </div>
      )}

      {!loading && !error && active === 'demo' && (
        <div className="crm-report-stack">
          <ReportMetricGrid cols={4}>
            <ReportMetricCard label="Logged demos" value={fmt(demo.total)} icon={FiMonitor} tone="primary" />
            <ReportMetricCard label="Session rows" value={fmt(demoScheduled)} icon={FiCheckCircle} tone="info" />
            <ReportMetricCard label="Attendance rows" value={fmt(demoAttended)} icon={FiUsers} tone="success" />
            <ReportMetricCard label="Result types" value={fmt(demoResults.length)} icon={FiAlertTriangle} tone="warning" />
          </ReportMetricGrid>

          <div className="crm-report-grid-2">
            <ReportSectionCard title="Demo results" subtitle="Outcome breakdown">
              {demoResults.length
                ? (
                  <ReportBarChart
                    data={demoResults}
                    xKey="result"
                    yKey="count"
                    height={280}
                    layout={demoResults.length <= 3 ? 'horizontal' : 'vertical'}
                  />
                )
                : <ReportEmpty />}
            </ReportSectionCard>
            <ReportSectionCard title="Demo outcomes" subtitle="Count vs matched">
              {demoCompare.length
                ? (
                  <ReportMultiBarChart
                    data={demoCompare}
                    xKey="label"
                    series={[
                      { key: 'scheduled', label: 'Count' },
                      { key: 'attended', label: 'Matched' },
                    ]}
                    height={280}
                  />
                )
                : (demo.byAttendance || []).length
                  ? <ReportBarChart data={demo.byAttendance} xKey="attendance" yKey="count" height={280} />
                  : <ReportEmpty />}
            </ReportSectionCard>
          </div>

          <ReportSectionCard title="Action required">
            <ReportAttentionGrid items={actionItems} emptyMessage="No demo actions." />
          </ReportSectionCard>

          <Link to={ROUTES.DEMO} className="crm-rlink">Open Demos →</Link>
        </div>
      )}

      {!loading && !error && active === 'attendance' && (
        <div className="crm-report-stack">
          <ReportMetricGrid cols={4}>
            <ReportMetricCard label="Present" value={fmt(cls.present)} icon={FiCheckCircle} tone="success" />
            <ReportMetricCard label="Absent" value={fmt(cls.absent)} icon={FiAlertTriangle} tone="danger" />
            <ReportMetricCard label="Attendance %" value={`${attendancePct}%`} icon={FiPhone} tone="primary" />
            <ReportMetricCard label="Late" value={fmt(cls.late)} icon={FiMonitor} tone="warning" />
          </ReportMetricGrid>

          <div className="crm-report-grid-3">
            <ReportSectionCard title="Attendance mix" subtitle="Present / absent / late">
              {attMix.length
                ? (
                  <ReportDonutChart
                    data={attMix}
                    nameKey="label"
                    valueKey="count"
                    height={260}
                    centerValue={`${attendancePct}%`}
                    centerLabel="Rate"
                  />
                )
                : <ReportEmpty />}
            </ReportSectionCard>
            <ReportSectionCard title="Attendance rate" subtitle="Gauge">
              <ReportGaugeChart value={attendancePct} max={100} height={240} label="Class attendance" />
            </ReportSectionCard>
            <ReportSectionCard title="Class sample" subtitle="Student %">
              {(attendanceData?.class?.students || []).length
                ? (
                  <ReportBarChart
                    data={(attendanceData.class.students || []).slice(0, 8).map((s) => ({
                      label: `${s.student?.firstName || ''} ${s.student?.lastName || ''}`.trim() || 'Student',
                      percent: s.percent,
                    }))}
                    xKey="label"
                    yKey="percent"
                    height={260}
                    layout="horizontal"
                    seriesLabel="%"
                  />
                )
                : <ReportEmpty message="No class attendance in range." />}
            </ReportSectionCard>
          </div>

          <ReportSectionCard title="Attendance detail">
            <ReportSimpleTable
              columns={[
                {
                  key: 'name',
                  label: 'Student',
                  render: (r) => `${r.student?.firstName || ''} ${r.student?.lastName || ''}`.trim() || '—',
                },
                { key: 'batch', label: 'Batch', render: (r) => r.batch || '—' },
                { key: 'present', label: 'Present', align: 'right' },
                { key: 'absent', label: 'Absent', align: 'right' },
                {
                  key: 'percent',
                  label: '%',
                  align: 'right',
                  render: (r) => `${r.percent}%`,
                  badge: (r) => (Number(r.percent) >= 75 ? 'success' : Number(r.percent) >= 40 ? 'warning' : 'danger'),
                },
              ]}
              rows={(attendanceData?.class?.students || []).slice(0, 12)}
              empty="No class attendance rows for this period."
            />
            <ReportViewAll to={ROUTES.BATCHES} label="View batches" />
          </ReportSectionCard>
        </div>
      )}
    </ReportPageShell>
  );
}
