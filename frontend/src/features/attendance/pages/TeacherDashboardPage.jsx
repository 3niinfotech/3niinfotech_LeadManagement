import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  FiAward,
  FiBookOpen,
  FiCalendar,
  FiCheckCircle,
  FiClipboard,
  FiFolder,
  FiTrendingUp,
  FiUsers,
} from 'react-icons/fi';
import Button from '../../../components/ui/Button';
import { apiGet } from '../../../api/apiClient';
import { API } from '../../../config/api';
import { ROUTES } from '../../../config/routes';
import { selectUser } from '../../../redux/slices/authSlice';
import toastService from '../../../services/toast/toast.service';
import { formatTime } from '../components/teacherWorkspaceUi';
import {
  PortalPage,
  PortalPageHeader,
  PortalMetrics,
  PortalMetric,
  PortalPanel,
  PortalBadge,
  PortalEmpty,
  PortalError,
  PortalSkeletonPage,
  PortalClassCard,
  PortalQuickActions,
  greetingForUser,
} from '../../../components/portal/PortalUi';

export default function TeacherDashboardPage() {
  const navigate = useNavigate();
  const user = useSelector(selectUser);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await apiGet(API.ACADEMIC_TEACHER_DASHBOARD);
      setData(res?.data || res);
    } catch (err) {
      const message = err?.response?.data?.message || 'Unable to load teacher dashboard';
      setError(message);
      toastService.error(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const quickActions = useMemo(() => [
    { id: 'attendance', label: 'Take attendance', icon: FiCheckCircle, onClick: () => navigate(ROUTES.TEACHER_ATTENDANCE) },
    { id: 'assignment', label: 'Create assignment', icon: FiClipboard, onClick: () => navigate(ROUTES.TEACHER_ASSIGNMENTS) },
    { id: 'tests', label: 'Manage tests', icon: FiAward, onClick: () => navigate(ROUTES.TEACHER_TESTS) },
    { id: 'materials', label: 'Upload material', icon: FiFolder, onClick: () => navigate(ROUTES.TEACHER_MATERIALS) },
    { id: 'classes', label: "Open today's class", icon: FiBookOpen, onClick: () => navigate(ROUTES.TEACHER_CLASSES) },
    { id: 'performance', label: 'Performance', icon: FiTrendingUp, onClick: () => navigate(ROUTES.TEACHER_PERFORMANCE) },
  ], [navigate]);

  if (loading && !data) return <PortalSkeletonPage />;

  const metrics = data?.metrics || {};
  const overview = data?.attendanceOverview || {};
  const schedule = data?.todaySchedule || [];
  const attention = data?.needingAttention || [];

  return (
    <PortalPage>
      <PortalPageHeader
        title={greetingForUser(user, 'teacher')}
        subtitle={data?.workspace?.subtitle || 'Your classes, students, and academics'}
        actions={(
          <>
            <Button size="sm" variant="outline" icon={FiCalendar} onClick={() => navigate(ROUTES.CALENDAR)}>
              Calendar
            </Button>
            <Button size="sm" icon={FiCheckCircle} onClick={() => navigate(ROUTES.TEACHER_ATTENDANCE)}>
              Take attendance
            </Button>
          </>
        )}
      />

      {error && <PortalError title="Refresh failed" description={error} onRetry={load} />}

      <PortalMetrics columns={6}>
        <PortalMetric label="My classes" value={metrics.myClasses ?? 0} icon={FiBookOpen} tone="brand" onClick={() => navigate(ROUTES.TEACHER_CLASSES)} />
        <PortalMetric label="Students" value={metrics.totalStudents ?? 0} icon={FiUsers} tone="info" onClick={() => navigate(ROUTES.TEACHER_STUDENTS)} />
        <PortalMetric label="Today's classes" value={metrics.todayClasses ?? 0} icon={FiCalendar} tone="neutral" />
        <PortalMetric label="Attendance" value={`${metrics.attendancePercent ?? 0}%`} hint={`${metrics.attendancePending || 0} pending`} icon={FiCheckCircle} tone="success" onClick={() => navigate(ROUTES.TEACHER_ATTENDANCE)} />
        <PortalMetric label="Assignments" value={metrics.pendingAssignments ?? 0} hint="open / upcoming" icon={FiClipboard} tone="warning" onClick={() => navigate(ROUTES.TEACHER_ASSIGNMENTS)} />
        <PortalMetric label="Upcoming tests" value={metrics.upcomingTests ?? 0} icon={FiAward} tone="info" onClick={() => navigate(ROUTES.TEACHER_TESTS)} />
      </PortalMetrics>

      <div className="crm-portal-dashboard">
        <div className="crm-portal-dashboard__stack">
          <PortalPanel
            title="Today's classes"
            action={<Button size="sm" variant="ghost" onClick={() => navigate(ROUTES.CALENDAR)}>Full schedule</Button>}
          >
            {!schedule.length ? (
              <PortalEmpty title="No classes today" description="Scheduled sessions will show here." />
            ) : (
              schedule.map((row) => (
                <PortalClassCard
                  key={row.id}
                  time={formatTime(row.time)}
                  name={row.course || row.batch}
                  sub={`${row.batch} · ${row.studentCount} students${row.room ? ` · ${row.room}` : ''}`}
                  badge={(
                    <PortalBadge tone={row.pending ? 'warning' : 'success'}>
                      {row.pending ? 'Pending' : 'Done'}
                    </PortalBadge>
                  )}
                  action={(
                    <Button size="sm" variant={row.pending ? 'primary' : 'outline'} onClick={() => navigate(ROUTES.SESSION_ATTENDANCE(row.id))}>
                      {row.pending ? 'Mark' : 'Open'}
                    </Button>
                  )}
                />
              ))
            )}
          </PortalPanel>

          <PortalPanel title="Quick actions" padded>
            <PortalQuickActions items={quickActions} />
          </PortalPanel>
        </div>

        <div className="crm-portal-dashboard__stack">
          <PortalPanel title="Attendance overview" description="Today's marked records">
            <div className="crm-portal-stat-strip">
              <div className="crm-portal-stat">
                <span className="crm-portal-stat__label">Present</span>
                <span className="crm-portal-stat__value">{overview.present ?? 0}</span>
              </div>
              <div className="crm-portal-stat">
                <span className="crm-portal-stat__label">Absent</span>
                <span className="crm-portal-stat__value">{overview.absent ?? 0}</span>
              </div>
              <div className="crm-portal-stat">
                <span className="crm-portal-stat__label">Late</span>
                <span className="crm-portal-stat__value">{overview.late ?? 0}</span>
              </div>
              <div className="crm-portal-stat">
                <span className="crm-portal-stat__label">Rate</span>
                <span className="crm-portal-stat__value">{overview.percent ?? 0}%</span>
              </div>
            </div>
          </PortalPanel>

          <PortalPanel
            title="Students needing attention"
            action={<Button size="sm" variant="ghost" onClick={() => navigate(ROUTES.TEACHER_STUDENTS)}>All students</Button>}
          >
            {!attention.length ? (
              <PortalEmpty title="No alerts" description="All students are within acceptable attendance." />
            ) : (
              <ul className="crm-portal-list">
                {attention.slice(0, 6).map((row) => (
                  <li key={row.id}>
                    <button type="button" className="crm-portal-list__item" onClick={() => navigate(ROUTES.TEACHER_STUDENT(row.id))}>
                      <div className="crm-portal-list__primary">
                        <div className="crm-portal-list__title">{row.name}</div>
                        <div className="crm-portal-list__meta">{row.course}{row.reasons?.length ? ` · ${row.reasons.join(', ')}` : ''}</div>
                      </div>
                      <span className="text-xs font-semibold tabular-nums text-danger">{row.percent}%</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </PortalPanel>
        </div>
      </div>
    </PortalPage>
  );
}
