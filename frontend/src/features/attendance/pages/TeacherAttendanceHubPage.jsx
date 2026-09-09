import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiCheckCircle, FiCalendar } from 'react-icons/fi';
import PageShell from '../../../components/layout/PageShell';
import PageHeader from '../../../components/layout/PageHeader';
import Button from '../../../components/ui/Button';
import Badge from '../../../components/ui/Badge';
import ContentLoader from '../../../components/ui/ContentLoader';
import EmptyState from '../../../components/ui/EmptyState';
import { apiGet } from '../../../api/apiClient';
import { API } from '../../../config/api';
import { ROUTES } from '../../../config/routes';
import toastService from '../../../services/toast/toast.service';
import { formatDate, formatTime, Metric, Panel } from '../components/teacherWorkspaceUi';

function sessionLabel(session) {
  const batch = session.batch?.name || session.batchName || 'Class';
  const course = session.batch?.courseName || session.courseName;
  return course ? `${batch} · ${course}` : batch;
}

export default function TeacherAttendanceHubPage() {
  const navigate = useNavigate();
  const [today, setToday] = useState([]);
  const [upcoming, setUpcoming] = useState([]);
  const [metrics, setMetrics] = useState({ today: 0, pending: 0, upcoming: 0 });
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const dashRes = await apiGet(API.ACADEMIC_TEACHER_DASHBOARD);
      const dash = dashRes?.data || dashRes;
      const schedule = dash?.todaySchedule || [];
      setToday(schedule);
      setMetrics({
        today: schedule.length,
        pending: schedule.filter((s) => s.pending).length,
        upcoming: dash?.metrics?.upcomingSessions ?? 0,
      });

      const start = new Date();
      start.setHours(23, 59, 59, 999);
      const weekEnd = new Date();
      weekEnd.setDate(weekEnd.getDate() + 7);
      weekEnd.setHours(23, 59, 59, 999);

      const sessionsRes = await apiGet(API.ACADEMIC_SESSIONS, {
        from: start.toISOString(),
        to: weekEnd.toISOString(),
      });
      const sessions = sessionsRes?.data || sessionsRes || [];
      const todayIds = new Set(schedule.map((s) => s.id));
      setUpcoming(
        sessions
          .filter((s) => !todayIds.has(s.id))
          .sort((a, b) => new Date(a.startAt) - new Date(b.startAt))
          .slice(0, 20),
      );
    } catch (err) {
      toastService.error(err?.response?.data?.message || 'Unable to load sessions');
      setToday([]);
      setUpcoming([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  if (loading && !today.length && !upcoming.length) return <ContentLoader variant="dashboard" />;

  const SessionRow = ({ session, showDate = false }) => (
    <button
      type="button"
      onClick={() => navigate(ROUTES.SESSION_ATTENDANCE(session.id))}
      className="flex w-full items-center gap-3 px-3.5 py-2.5 text-left hover:bg-row-hover"
    >
      <span className="w-20 shrink-0 text-xs font-semibold tabular-nums text-text-secondary">
        {showDate ? formatDate(session.startAt || session.time) : formatTime(session.startAt || session.time)}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[13px] font-semibold text-text">{sessionLabel(session)}</span>
        <span className="block truncate text-[11px] text-text-muted">
          {session.room || session.batch?.room || 'Room TBA'}
          {session.studentCount != null && ` · ${session.studentCount} students`}
        </span>
      </span>
      <Badge color={session.pending ? 'warning' : 'success'}>
        {session.pending ? 'Mark attendance' : 'Open'}
      </Badge>
    </button>
  );

  return (
    <PageShell className="!space-y-3">
      <PageHeader
        title="Attendance"
        subtitle="Today's sessions and upcoming classes"
        icon={FiCheckCircle}
        iconColor="primary"
        actions={(
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="outline" icon={FiCalendar} onClick={() => navigate(ROUTES.CALENDAR)}>
              Calendar
            </Button>
            <Button size="sm" variant="outline" onClick={() => navigate(ROUTES.TEACHER_CLASSES)}>
              My classes
            </Button>
          </div>
        )}
      />

      <div className="grid grid-cols-3 gap-2">
        <Metric label="Today" value={metrics.today} tone="warning" />
        <Metric label="Pending" value={metrics.pending} tone="info" />
        <Metric label="Upcoming (7d)" value={metrics.upcoming} tone="success" />
      </div>

      <div className="grid min-w-0 grid-cols-1 gap-3 xl:grid-cols-2">
        <Panel title="Today's sessions">
          {!today.length ? (
            <EmptyState title="No classes today" description="Sessions scheduled for today appear here." />
          ) : (
            <div className="divide-y divide-border">
              {today.map((session) => <SessionRow key={session.id} session={session} />)}
            </div>
          )}
        </Panel>

        <Panel title="Upcoming sessions">
          {!upcoming.length ? (
            <EmptyState title="Nothing upcoming" description="Future sessions for the next 7 days." />
          ) : (
            <div className="divide-y divide-border">
              {upcoming.map((session) => <SessionRow key={session.id} session={session} showDate />)}
            </div>
          )}
        </Panel>
      </div>
    </PageShell>
  );
}
