import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiBarChart2 } from 'react-icons/fi';
import PageShell from '../../../components/layout/PageShell';
import PageHeader from '../../../components/layout/PageHeader';
import Button from '../../../components/ui/Button';
import ContentLoader from '../../../components/ui/ContentLoader';
import EmptyState from '../../../components/ui/EmptyState';
import { apiGet } from '../../../api/apiClient';
import { API } from '../../../config/api';
import { ROUTES } from '../../../config/routes';
import toastService from '../../../services/toast/toast.service';
import { Metric, Panel } from '../components/teacherWorkspaceUi';

export default function TeacherPerformancePage() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiGet(API.ACADEMIC_PERFORMANCE);
      setData(res?.data || res);
    } catch (err) {
      toastService.error(err?.response?.data?.message || 'Unable to load performance');
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  if (loading && !data) return <ContentLoader variant="dashboard" />;

  const metrics = data?.metrics || {};
  const students = data?.students || [];
  const courseTrend = data?.courseTrend || [];

  return (
    <PageShell className="!space-y-3">
      <PageHeader
        title="Performance"
        subtitle="Attendance, assignments, and test outcomes across your classes"
        icon={FiBarChart2}
        iconColor="primary"
        actions={(
          <Button size="sm" variant="outline" onClick={() => navigate(ROUTES.TEACHER_STUDENTS)}>
            View students
          </Button>
        )}
      />

      <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
        <Metric label="Students" value={metrics.students} />
        <Metric label="Avg performance" value={metrics.averagePerformance != null ? `${metrics.averagePerformance}%` : '—'} tone="success" />
        <Metric label="Low attendance" value={metrics.lowAttendance} tone="warning" />
        <Metric label="Pending assignments" value={metrics.pendingAssignments} tone="info" />
      </div>

      <div className="grid min-w-0 grid-cols-1 gap-3 xl:grid-cols-2">
        <Panel title="By batch">
          {!courseTrend.length ? (
            <EmptyState title="No batch data" description="Performance appears once students are enrolled." />
          ) : (
            <div className="divide-y divide-border">
              {courseTrend.map((row) => (
                <div key={row.batchId} className="flex items-center justify-between gap-3 px-3.5 py-2.5">
                  <div className="min-w-0">
                    <p className="truncate text-[13px] font-semibold text-text">{row.batch}</p>
                    <p className="truncate text-[11px] text-text-muted">{row.course} · {row.students} students</p>
                  </div>
                  <span className="text-sm font-bold tabular-nums text-brand">
                    {row.averagePerformance != null ? `${row.averagePerformance}%` : '—'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </Panel>

        <Panel title="Student leaderboard">
          {!students.length ? (
            <EmptyState title="No student records" description="Enroll students to track performance." />
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-page/60 text-[11px] uppercase tracking-wide text-text-muted">
                  <tr>
                    <th className="px-3 py-2 font-semibold">Student</th>
                    <th className="px-3 py-2 font-semibold">Att %</th>
                    <th className="px-3 py-2 font-semibold">Tests</th>
                    <th className="px-3 py-2 font-semibold">Overall</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {students.slice(0, 20).map((row) => (
                    <tr key={row.studentId} className="hover:bg-row-hover">
                      <td className="px-3 py-2">
                        <button
                          type="button"
                          className="text-left"
                          onClick={() => navigate(ROUTES.TEACHER_STUDENT(row.studentId))}
                        >
                          <span className="block text-[13px] font-semibold text-text">{row.name}</span>
                          <span className="block text-[11px] text-text-muted">{row.batch}</span>
                        </button>
                      </td>
                      <td className="px-3 py-2 tabular-nums">{row.attendancePercent ?? '—'}%</td>
                      <td className="px-3 py-2 tabular-nums">{row.testCount ?? 0}</td>
                      <td className="px-3 py-2 font-semibold tabular-nums text-brand">{row.overall ?? '—'}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Panel>
      </div>
    </PageShell>
  );
}
