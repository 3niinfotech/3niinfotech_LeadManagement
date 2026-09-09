import { useEffect, useMemo, useState } from 'react';
import { FiAward, FiCheckSquare, FiClipboard, FiTrendingUp } from 'react-icons/fi';
import { apiGet } from '../../api/apiClient';
import { API } from '../../config/api';
import {
  PortalPage,
  PortalMetrics,
  PortalMetric,
  PortalPanel,
  PortalEmpty,
  PortalSkeletonPage,
} from '../../components/portal/PortalUi';
import {
  ReportBarChart,
  ReportDonutChart,
  ReportGaugeChart,
} from '../../features/reports/components/MuiReportCharts';

function ProgressBar({ value, label }) {
  const pct = Math.min(100, Math.max(0, Number(value) || 0));
  return (
    <div className="crm-portal-progress-row">
      <div className="crm-portal-progress-row__head">
        <span className="crm-portal-progress-row__label">{label}</span>
        <span className="crm-portal-progress-row__value">{pct}%</span>
      </div>
      <div className="crm-student-progress-bar">
        <span style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export default function StudentReportsPage() {
  const [reports, setReports] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    apiGet(API.PORTAL_STUDENT_REPORTS)
      .then((res) => {
        if (!cancelled) setReports(res.data || null);
      })
      .catch(() => {
        if (!cancelled) setReports(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  const attendance = reports?.attendance || {};
  const assignments = reports?.assignments || {};
  const tests = reports?.tests || {};
  const performance = reports?.performance || {};

  const courseBars = useMemo(
    () => (attendance.courseWise || []).map((row) => ({
      label: row.course || row.name || 'Course',
      percent: Number(row.percent ?? row.attendance) || 0,
    })),
    [attendance.courseWise],
  );

  const workload = useMemo(() => ([
    { label: 'Submitted', count: Number(assignments.submitted) || 0 },
    { label: 'Pending', count: Math.max(0, (Number(assignments.total) || 0) - (Number(assignments.submitted) || 0)) },
    { label: 'Tests', count: Number(tests.taken) || 0 },
  ].filter((r) => r.count > 0)), [assignments, tests]);

  if (loading) return <PortalSkeletonPage />;

  return (
    <PortalPage className="crm-stu-reports">
      <PortalMetrics columns={4}>
        <PortalMetric label="Attendance" value={`${attendance.overall ?? '—'}%`} tone="success" icon={FiCheckSquare} />
        <PortalMetric
          label="Assignments"
          value={`${assignments.submitted ?? 0}/${assignments.total ?? 0}`}
          hint="Submitted"
          tone="brand"
          icon={FiClipboard}
        />
        <PortalMetric label="Tests taken" value={tests.taken ?? 0} tone="info" icon={FiAward} />
        <PortalMetric
          label="Avg score"
          value={`${tests.averageScore ?? performance.overall ?? '—'}%`}
          tone="warning"
          icon={FiTrendingUp}
        />
      </PortalMetrics>

      <div className="crm-stu-reports__charts">
        <PortalPanel title="Attendance" description="Overall rate" padded>
          <ReportGaugeChart
            value={Number(attendance.overall) || 0}
            max={100}
            height={168}
            label="Present"
            color="#059669"
          />
        </PortalPanel>
        <PortalPanel title="Avg score" description="Published tests" padded>
          <ReportGaugeChart
            value={Number(tests.averageScore ?? performance.overall) || 0}
            max={100}
            height={168}
            label="Score"
            color="#2563eb"
          />
        </PortalPanel>
        {workload.length > 0 && (
          <PortalPanel title="Workload" description="Assignments & tests" padded>
            <ReportDonutChart data={workload} nameKey="label" valueKey="count" height={200} />
          </PortalPanel>
        )}
      </div>

      <PortalPanel title="Attendance by course" padded>
        {!courseBars.length ? (
          <PortalEmpty title="No attendance data" description="Course-wise attendance will show after classes start." className="crm-portal-empty--panel" />
        ) : (
          <>
            <ReportBarChart
              data={courseBars}
              xKey="label"
              yKey="percent"
              height={220}
              seriesLabel="Attendance %"
              colorful
            />
            <div className="crm-portal-progress-stack crm-stu-reports__bars">
              {courseBars.map((row) => (
                <ProgressBar key={row.label} label={row.label} value={row.percent} />
              ))}
            </div>
          </>
        )}
      </PortalPanel>
    </PortalPage>
  );
}
