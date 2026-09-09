import { useEffect, useState } from 'react';
import { FiTrendingUp } from 'react-icons/fi';
import { apiGet } from '../../api/apiClient';
import { API } from '../../config/api';
import toastService from '../../services/toast/toast.service';
import {
  PortalPage,
  PortalMetrics,
  PortalMetric,
  PortalPanel,
  PortalEmpty,
  PortalSkeletonPage,
} from '../../components/portal/PortalUi';

function ProgressBar({ label, value, max = 100 }) {
  const pct = value != null ? Math.min(100, Math.max(0, (value / max) * 100)) : 0;
  return (
    <div className="crm-portal-progress-row">
      {label ? (
        <div className="crm-portal-progress-row__head">
          <span className="crm-portal-progress-row__label">{label}</span>
          <span className="crm-portal-progress-row__value">
            {value != null ? `${Math.round(value)}${max === 100 ? '%' : ''}` : '—'}
          </span>
        </div>
      ) : null}
      <div className="crm-student-progress-bar">
        <span style={{ width: value != null ? `${pct}%` : '0%' }} />
      </div>
    </div>
  );
}

export default function StudentPerformancePage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    apiGet(API.ACADEMIC_PERFORMANCE)
      .then((res) => {
        if (!cancelled) setData(res.data || res);
      })
      .catch((err) => {
        if (!cancelled) {
          toastService.error(err?.response?.data?.message || 'Failed to load performance');
          setData(null);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  if (loading) return <PortalSkeletonPage />;

  const student = data?.students?.[0] || null;
  const courseTrend = data?.courseTrend || [];

  return (
    <PortalPage className="crm-stu-perf">
      {!student ? (
        <PortalEmpty
          title="No performance data yet"
          description="Enroll in a course to see your progress here."
        />
      ) : (
        <>
          <PortalMetrics columns={4}>
            <PortalMetric label="Overall" value={student.overall != null ? `${student.overall}%` : '—'} tone="brand" />
            <PortalMetric label="Attendance" value={student.attendancePercent != null ? `${student.attendancePercent}%` : '—'} tone="success" />
            <PortalMetric
              label="Assignments"
              value={student.assignmentCompletion != null ? `${student.assignmentCompletion}%` : '—'}
              hint={student.pendingAssignments ? `${student.pendingAssignments} pending` : undefined}
              tone="warning"
            />
            <PortalMetric label="Tests taken" value={student.testCount ?? 0} tone="info" />
          </PortalMetrics>

          <div className="crm-stu-perf__grid">
            <PortalPanel
              title="Progress breakdown"
              description={student.course || student.batch || undefined}
              action={<FiTrendingUp className="text-brand" aria-hidden />}
              padded
            >
              <div className="crm-portal-progress-stack">
                <ProgressBar label="Attendance" value={student.attendancePercent} />
                <ProgressBar label="Assignment completion" value={student.assignmentCompletion} />
                <ProgressBar label="Average assignment marks" value={student.averageAssignmentMarks} />
                <ProgressBar label="Average test score" value={student.averageTestPercent} />
                <ProgressBar label="Overall performance" value={student.overall} />
              </div>
            </PortalPanel>

            {courseTrend.length > 0 ? (
              <PortalPanel title="Course overview" padded>
                <ul className="crm-portal-progress-stack">
                  {courseTrend.map((row) => (
                    <li key={row.batchId}>
                      <div className="crm-portal-progress-row__head crm-portal-progress-row__head--course">
                        <div className="min-w-0">
                          <p className="crm-portal-pick-card__title truncate">{row.course || row.batch}</p>
                          <p className="crm-portal-pick-card__eyebrow truncate">{row.batch}</p>
                        </div>
                        <span className="crm-portal-progress-row__value">
                          {row.averagePerformance != null ? `${row.averagePerformance}%` : '—'}
                        </span>
                      </div>
                      <ProgressBar label="" value={row.averagePerformance} />
                    </li>
                  ))}
                </ul>
              </PortalPanel>
            ) : (
              <PortalPanel title="Course overview" padded>
                <PortalEmpty
                  title="No course rows yet"
                  description="Course averages will appear once results are published."
                />
              </PortalPanel>
            )}
          </div>
        </>
      )}
    </PortalPage>
  );
}
