import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { FiCalendar, FiClipboard, FiAward, FiUsers } from 'react-icons/fi';
import { apiGet } from '../../api/apiClient';
import { API } from '../../config/api';
import { ROUTES } from '../../config/routes';
import { formatDate } from './components/portalFormat';
import {
  PortalPage,
  PortalPanel,
  PortalEmpty,
  PortalError,
  PortalSkeletonPage,
  PortalTabs,
  PortalMetrics,
  PortalMetric,
} from '../../components/portal/PortalUi';

const TYPE_LABEL = {
  CLASS: 'Class',
  ASSIGNMENT: 'Assignment',
  TEST: 'Test',
  COUNSELING: 'Counselling',
};

const TYPE_FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'CLASS', label: 'Classes' },
  { id: 'ASSIGNMENT', label: 'Assignments' },
  { id: 'TEST', label: 'Tests' },
  { id: 'COUNSELING', label: 'Counselling' },
];

export default function StudentCalendarPage() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [view, setView] = useState('upcoming');
  const [typeFilter, setTypeFilter] = useState('all');

  useEffect(() => {
    let cancelled = false;
    const from = new Date();
    from.setDate(from.getDate() - 14);
    const to = new Date();
    to.setDate(to.getDate() + 60);

    Promise.all([
      apiGet(API.ACADEMIC_SESSIONS, { from: from.toISOString(), to: to.toISOString() }).catch(() => ({ data: [] })),
      apiGet(API.ACADEMIC_ASSIGNMENTS, { limit: 100 }).catch(() => ({ data: [] })),
      apiGet(API.ACADEMIC_TESTS, { limit: 100 }).catch(() => ({ data: [] })),
      apiGet(API.PORTAL_STUDENT_COUNSELING).catch(() => ({ data: { all: [] } })),
    ])
      .then(([sessionsRes, assignRes, testsRes, counselRes]) => {
        if (cancelled) return;
        const rows = [];
        for (const s of sessionsRes.data || []) {
          rows.push({
            id: `class-${s.id}`,
            type: 'CLASS',
            title: s.topic || s.batch?.courseName || 'Class',
            startAt: s.startAt,
            endAt: s.endAt,
            meta: s.batch?.name,
            link: ROUTES.STUDENT_COURSES,
          });
        }
        for (const a of assignRes.data || []) {
          if (!a.dueDate) continue;
          rows.push({
            id: `assign-${a.id}`,
            type: 'ASSIGNMENT',
            title: a.title,
            startAt: a.dueDate,
            meta: 'Due date',
            link: ROUTES.STUDENT_ASSIGNMENTS,
          });
        }
        for (const t of testsRes.data || []) {
          const when = t.startAt || t.testDate;
          if (!when) continue;
          rows.push({
            id: `test-${t.id}`,
            type: 'TEST',
            title: t.name || t.title,
            startAt: when,
            meta: 'Test',
            link: ROUTES.STUDENT_TESTS,
          });
        }
        for (const c of counselRes.data?.all || []) {
          rows.push({
            id: `counsel-${c.id}`,
            type: 'COUNSELING',
            title: c.title,
            startAt: c.startAt,
            endAt: c.endAt,
            meta: c.status,
            link: ROUTES.STUDENT_COUNSELING,
          });
        }
        rows.sort((a, b) => new Date(a.startAt) - new Date(b.startAt));
        setEvents(rows);
      })
      .catch(() => {
        if (!cancelled) setError('Unable to load calendar events.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, []);

  const nowMs = Date.now();

  const filtered = useMemo(() => {
    const now = new Date(nowMs);
    let rows = view === 'past'
      ? events.filter((e) => new Date(e.startAt) < now)
      : events.filter((e) => new Date(e.startAt) >= now);
    if (typeFilter !== 'all') rows = rows.filter((e) => e.type === typeFilter);
    if (view === 'past') rows = [...rows].reverse();
    return rows;
  }, [events, view, typeFilter, nowMs]);

  const grouped = useMemo(() => {
    const map = {};
    for (const ev of filtered) {
      const key = new Date(ev.startAt).toLocaleDateString('en-IN', {
        weekday: 'short', day: 'numeric', month: 'short', year: 'numeric',
      });
      if (!map[key]) map[key] = [];
      map[key].push(ev);
    }
    return Object.entries(map);
  }, [filtered]);

  const counts = useMemo(() => {
    const now = new Date(nowMs);
    return {
      classes: events.filter((e) => e.type === 'CLASS' && new Date(e.startAt) >= now).length,
      assignments: events.filter((e) => e.type === 'ASSIGNMENT' && new Date(e.startAt) >= now).length,
      tests: events.filter((e) => e.type === 'TEST' && new Date(e.startAt) >= now).length,
      counseling: events.filter((e) => e.type === 'COUNSELING' && new Date(e.startAt) >= now).length,
    };
  }, [events, nowMs]);

  if (loading) return <PortalSkeletonPage />;
  if (error) return <PortalError title="Calendar unavailable" description={error} />;

  return (
    <PortalPage className="crm-stu-cal">
      <PortalMetrics columns={4} className="crm-stu-cal__metrics">
        <PortalMetric label="Classes" value={counts.classes} tone="brand" icon={FiCalendar} />
        <PortalMetric label="Assignments" value={counts.assignments} tone="warning" icon={FiClipboard} />
        <PortalMetric label="Tests" value={counts.tests} tone="info" icon={FiAward} />
        <PortalMetric label="Counselling" value={counts.counseling} tone="success" icon={FiUsers} />
      </PortalMetrics>

      <div className="crm-stu-cal__toolbar">
        <PortalTabs
          tabs={[
            { id: 'upcoming', label: 'Upcoming' },
            { id: 'past', label: 'Past' },
          ]}
          active={view}
          onChange={setView}
        />
        <PortalTabs
          tabs={TYPE_FILTERS}
          active={typeFilter}
          onChange={setTypeFilter}
        />
      </div>

      {!grouped.length ? (
        <PortalEmpty
          title={view === 'upcoming' ? 'No upcoming events' : 'No past events'}
          description="Your schedule will appear here when classes or sessions are scheduled."
          icon={FiCalendar}
          className="crm-portal-empty--inline"
        />
      ) : (
        <div className="crm-student-calendar">
          {grouped.map(([day, dayEvents]) => (
            <section key={day} className="crm-student-calendar__day">
              <h3 className="crm-student-calendar__day-label">{day}</h3>
              <ul className="crm-student-calendar__list">
                {dayEvents.map((ev) => (
                  <li key={ev.id} className="crm-student-calendar__item">
                    <span className={`crm-student-calendar__type crm-student-calendar__type--${ev.type.toLowerCase()}`}>
                      {TYPE_LABEL[ev.type]}
                    </span>
                    <div className="crm-student-calendar__body">
                      <p className="crm-student-calendar__title">{ev.title}</p>
                      <p className="crm-student-calendar__meta">
                        {formatDate(ev.startAt, true)}
                        {ev.meta ? ` · ${ev.meta}` : ''}
                      </p>
                    </div>
                    <Link to={ev.link} className="crm-student-calendar__link">Open</Link>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </PortalPage>
  );
}
