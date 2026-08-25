import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { selectUser } from '../../redux/slices/authSlice';
import { apiGet } from '../../api/apiClient';
import { API } from '../../config/api';
import GlobalLoader from '../../components/ui/GlobalLoader';
import { ROUTES } from '../../config/routes';
import { usePermissions } from '../../hooks/usePermissions';
import { PERMISSIONS } from '../../config/permissions';

function rangeIso(daysAhead) {
  const from = new Date();
  const to = new Date();
  to.setDate(to.getDate() + daysAhead);
  return { from: from.toISOString(), to: to.toISOString() };
}

export default function StudentDashboardPage() {
  const user = useSelector(selectUser);
  const { can } = usePermissions();
  const [student, setStudent] = useState(null);
  const [attendance, setAttendance] = useState(null);
  const [applications, setApplications] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const { from, to } = rangeIso(14);
    Promise.all([
      apiGet(API.STUDENTS, { limit: 1 }),
      can(PERMISSIONS.ATTENDANCE_VIEW) || can(PERMISSIONS.STUDENTS_VIEW)
        ? apiGet(API.ACADEMIC_ME).catch(() => ({ data: null }))
        : Promise.resolve({ data: null }),
      can(PERMISSIONS.APPLICATIONS_VIEW)
        ? apiGet(API.APPLICATIONS, { limit: 5 }).catch(() => ({ data: [] }))
        : Promise.resolve({ data: [] }),
      can(PERMISSIONS.ATTENDANCE_VIEW) || can(PERMISSIONS.CALENDAR_VIEW)
        ? apiGet(API.ACADEMIC_SESSIONS, { from, to }).catch(() => ({ data: [] }))
        : Promise.resolve({ data: [] }),
      apiGet(API.NOTIFICATIONS, { limit: 5 }).catch(() => ({ data: [] })),
    ])
      .then(([studentRes, attendanceRes, appRes, sessionRes, notifRes]) => {
        if (cancelled) return;
        setStudent(studentRes.data?.[0] || null);
        setAttendance(attendanceRes.data || null);
        setApplications(appRes.data || []);
        setSessions(Array.isArray(sessionRes.data) ? sessionRes.data : []);
        const notifPayload = notifRes.data;
        setNotifications(Array.isArray(notifPayload) ? notifPayload : (notifPayload?.data || []));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [can]);

  if (loading) return <GlobalLoader />;

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-text mb-2">Welcome, {user?.firstName}</h2>
        <p className="text-text-secondary">
          Branch: {user?.branch?.name || '—'} · {user?.company?.name}
        </p>
      </div>
      {student ? (
        <div className="bg-card-bg border border-card-border rounded-lg p-6 shadow-card">
          <p className="text-sm text-text-secondary mb-1">Student ID</p>
          <p className="text-lg font-semibold text-text mb-4">{student.studentCode}</p>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-text-secondary">Status</p>
              <p className="font-medium text-text">{student.status}</p>
            </div>
            <div>
              <p className="text-text-secondary">Course</p>
              <p className="font-medium text-text">{student.course || '—'}</p>
            </div>
            <div>
              <p className="text-text-secondary">Country</p>
              <p className="font-medium text-text">{student.country || '—'}</p>
            </div>
            <div>
              <p className="text-text-secondary">University</p>
              <p className="font-medium text-text">{student.university || '—'}</p>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-card-bg border border-card-border rounded-lg p-6 text-text-secondary">
          Your student profile is being set up. Contact your branch counsellor if this persists.
        </div>
      )}
      {sessions.length > 0 && (
        <div className="bg-card-bg border border-card-border rounded-lg p-6 shadow-card">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-text">Upcoming classes</h3>
            <Link to={ROUTES.STUDENT_ATTENDANCE} className="text-sm text-primary">Schedule & history</Link>
          </div>
          <ul className="space-y-2 text-sm">
            {sessions.slice(0, 5).map((row) => (
              <li key={row.id} className="flex justify-between gap-3">
                <span className="text-text">{row.batch?.name || row.batch?.courseName || 'Class'}</span>
                <span className="text-text-secondary">
                  {row.startAt ? new Date(row.startAt).toLocaleString('en-IN') : '—'}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
      {attendance?.totals && (
        <div className="bg-card-bg border border-card-border rounded-lg p-6 shadow-card">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-text">My Attendance</h3>
            <Link to={ROUTES.STUDENT_ATTENDANCE} className="text-sm text-primary">View history</Link>
          </div>
          <p className="text-3xl font-semibold text-text">{attendance.totals.percent}%</p>
          <p className="text-sm text-text-secondary mt-1">
            Present {attendance.totals.present} · Absent {attendance.totals.absent} · Late {attendance.totals.late}
          </p>
        </div>
      )}
      {can(PERMISSIONS.APPLICATIONS_VIEW) && (
        <div className="bg-card-bg border border-card-border rounded-lg p-6 shadow-card">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-text">Applications</h3>
            <Link to={ROUTES.STUDENT_APPLICATIONS} className="text-sm text-primary">View all</Link>
          </div>
          {applications.length === 0 ? (
            <p className="text-sm text-text-secondary">No applications yet.</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {applications.slice(0, 5).map((row) => (
                <li key={row.id} className="flex justify-between gap-3">
                  <span className="text-text">{row.university || row.course || row.applicationCode || 'Application'}</span>
                  <span className="text-text-secondary">{row.status}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
      {notifications.length > 0 && (
        <div className="bg-card-bg border border-card-border rounded-lg p-6 shadow-card">
          <h3 className="font-semibold text-text mb-3">Notifications</h3>
          <ul className="space-y-2 text-sm">
            {notifications.slice(0, 5).map((row) => (
              <li key={row.id} className="flex justify-between gap-3">
                <span className="text-text">{row.title || row.message || 'Notification'}</span>
                <span className="text-text-secondary shrink-0">
                  {row.createdAt ? new Date(row.createdAt).toLocaleDateString('en-IN') : ''}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
