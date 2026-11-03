import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  FiCalendar,
  FiClipboard,
  FiAward,
  FiUsers,
  FiClock,
  FiMapPin,
  FiCheckCircle,
  FiBookOpen,
  FiArrowRight,
  FiVideo,
} from 'react-icons/fi';
import { apiGet } from '../../api/apiClient';
import { API } from '../../config/api';
import { ROUTES } from '../../config/routes';
import { formatDate } from './components/portalFormat';
import './student-dashboard.theme.css';
import {
  PortalSkeletonPage,
  PortalEmpty,
  PortalError,
  PortalTabs,
} from '../../components/portal/PortalUi';

const TYPE_LABEL = {
  CLASS: 'Class',
  ASSIGNMENT: 'Assignment',
  TEST: 'Test',
  COUNSELING: 'Counselling',
};

const TYPE_FILTERS = [
  { id: 'all', label: 'All Events' },
  { id: 'CLASS', label: 'Classes' },
  { id: 'ASSIGNMENT', label: 'Assignments' },
  { id: 'TEST', label: 'Tests' },
  { id: 'COUNSELING', label: 'Counselling' },
];

export default function StudentCalendarPage() {
  const [events, setEvents] = useState([]);
  const [routine, setRoutine] = useState([]);
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
      apiGet(API.ACADEMIC_BATCHES).catch(() => ({ data: [] })),
    ])
      .then(([sessionsRes, assignRes, testsRes, counselRes, batchesRes]) => {
        if (cancelled) return;
        const rows = [];
        (sessionsRes.data || []).forEach((s) => {
          const rawTopic = s.metadata?.topic || s.topic;
          const sessionTitle = rawTopic || s.batch?.courseName || s.batch?.name || 'Academic Class Lecture';
          const roomStr = s.room || s.batch?.room;
          const meta = [s.batch?.name, roomStr].filter(Boolean).join(' · ') || 'Class Session';

          rows.push({
            id: `class-${s.id}`,
            type: 'CLASS',
            title: sessionTitle,
            startAt: s.startAt,
            endAt: s.endAt,
            meta,
            link: ROUTES.STUDENT_COURSES,
          });
        });

        // Set routine from batches
        const batches = Array.isArray(batchesRes?.data) ? batchesRes.data : [];
        const slots = batches[0]?.timetableSlots || [];
        const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const routineItems = slots.map((slot) => ({
          day: dayNames[slot.dayOfWeek] || `Day ${slot.dayOfWeek}`,
          time: `${slot.startTime || ''} – ${slot.endTime || ''}`,
          subject: batches[0]?.courseName || batches[0]?.name || 'Lecture Class',
          room: slot.room || batches[0]?.room || 'Assigned Room',
        }));
        setRoutine(routineItems);
        for (const a of assignRes.data || []) {
          if (!a.dueDate) continue;
          rows.push({
            id: `assign-${a.id}`,
            type: 'ASSIGNMENT',
            title: a.title,
            startAt: a.dueDate,
            meta: 'Academic Assignment Due',
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
            meta: 'Evaluated Mock Test',
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
            meta: c.status || 'One-on-One Session',
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
    <div className="crm-stu-page-container">
      {/* ── 4 Top KPI Stat Cards ── */}
      <div className="crm-stu-att-kpi-grid">
        <div className="crm-stu-att-kpi-card crm-stu-att-kpi-card--primary">
          <div className="crm-stu-att-kpi-card__header">
            <span className="crm-stu-att-kpi-card__label">Scheduled Classes</span>
            <FiCalendar className="crm-stu-att-kpi-card__icon" />
          </div>
          <div className="crm-stu-att-kpi-card__body">
            <span className="crm-stu-att-kpi-card__value">{counts.classes}</span>
            <span className="crm-stu-chip crm-stu-chip--brand">Active Batch</span>
          </div>
          <div className="crm-stu-course-progress-card__sub" style={{ marginTop: '0.45rem', fontSize: '0.8125rem' }}>
            Morning hybrid lecture sessions
          </div>
        </div>

        <div className="crm-stu-att-kpi-card">
          <div className="crm-stu-att-kpi-card__header">
            <span className="crm-stu-att-kpi-card__label">Assignments Due</span>
            <FiClipboard className="crm-stu-att-kpi-card__icon--amber" />
          </div>
          <div className="crm-stu-att-kpi-card__body">
            <span className="crm-stu-att-kpi-card__value">{counts.assignments}</span>
            <span className="crm-stu-chip crm-stu-chip--amber">Upcoming</span>
          </div>
          <div className="crm-stu-course-progress-card__sub" style={{ marginTop: '0.45rem', fontSize: '0.8125rem' }}>
            Writing Task analysis submission
          </div>
        </div>

        <div className="crm-stu-att-kpi-card">
          <div className="crm-stu-att-kpi-card__header">
            <span className="crm-stu-att-kpi-card__label">Mock Tests</span>
            <FiAward className="crm-stu-att-kpi-card__icon--green" />
          </div>
          <div className="crm-stu-att-kpi-card__body">
            <span className="crm-stu-att-kpi-card__value">{counts.tests}</span>
            <span className="crm-stu-chip crm-stu-chip--success">Evaluation</span>
          </div>
          <div className="crm-stu-course-progress-card__sub" style={{ marginTop: '0.45rem', fontSize: '0.8125rem' }}>
            Full module timed evaluation
          </div>
        </div>

        <div className="crm-stu-att-kpi-card">
          <div className="crm-stu-att-kpi-card__header">
            <span className="crm-stu-att-kpi-card__label">Counselling</span>
            <FiUsers className="crm-stu-att-kpi-card__icon" />
          </div>
          <div className="crm-stu-att-kpi-card__body">
            <span className="crm-stu-att-kpi-card__value">{counts.counseling}</span>
            <span className="crm-stu-chip crm-stu-chip--neutral">Priya Shah</span>
          </div>
          <div className="crm-stu-course-progress-card__sub" style={{ marginTop: '0.45rem', fontSize: '0.8125rem' }}>
            Visa lodgment desk support
          </div>
        </div>
      </div>

      {/* ── Toolbar: View Tabs + Type Filters ── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '0.65rem',
          marginBottom: '0.85rem',
          background: '#ffffff',
          padding: '0.65rem 0.85rem',
          borderRadius: '10px',
          border: '1px solid #e2e8f0',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
          <button
            type="button"
            className={`crm-stu-btn ${view === 'upcoming' ? 'crm-stu-btn--primary' : 'crm-stu-btn--secondary'}`}
            style={{ fontSize: '0.8125rem', padding: '0.35rem 0.85rem' }}
            onClick={() => setView('upcoming')}
          >
            Upcoming Events
          </button>
          <button
            type="button"
            className={`crm-stu-btn ${view === 'past' ? 'crm-stu-btn--primary' : 'crm-stu-btn--secondary'}`}
            style={{ fontSize: '0.8125rem', padding: '0.35rem 0.85rem' }}
            onClick={() => setView('past')}
          >
            Past History
          </button>
        </div>

        {/* Category Pill Filters */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', overflowX: 'auto' }}>
          {TYPE_FILTERS.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setTypeFilter(f.id)}
              style={{
                padding: '0.3rem 0.75rem',
                borderRadius: '20px',
                fontSize: '0.75rem',
                fontWeight: 700,
                border: typeFilter === f.id ? '1px solid #2563eb' : '1px solid #e2e8f0',
                background: typeFilter === f.id ? '#2563eb' : '#ffffff',
                color: typeFilter === f.id ? '#ffffff' : '#475569',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 0.15s ease',
              }}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── 2-Column Responsive Layout: Event Feed (Left) + Weekly Timetable & Guidelines (Right) ── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
          gap: '1rem',
          alignItems: 'start',
        }}
      >
        {/* Left Column: Grouped Calendar Events */}
        <div>
          {!grouped.length ? (
            <div
              style={{
                background: '#ffffff',
                borderRadius: '12px',
                border: '1px solid #e2e8f0',
                padding: '2.5rem 1rem',
                textAlign: 'center',
              }}
            >
              <FiCalendar style={{ fontSize: '2.5rem', color: '#cbd5e1', marginBottom: '0.5rem' }} />
              <h4 style={{ fontSize: '0.9375rem', fontWeight: 700, color: '#1e293b', margin: '0 0 0.25rem' }}>
                {view === 'upcoming' ? 'No upcoming events scheduled' : 'No past events logged'}
              </h4>
              <p style={{ fontSize: '0.8125rem', color: '#64748b', margin: 0 }}>
                Your schedule updates automatically when instructor or counsellor posts new sessions.
              </p>
            </div>
          ) : (
            grouped.map(([day, dayEvents]) => (
              <div
                key={day}
                style={{
                  background: '#ffffff',
                  borderRadius: '12px',
                  border: '1px solid #e2e8f0',
                  padding: '1rem',
                  marginBottom: '0.85rem',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.65rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                    <span style={{ fontSize: '0.8125rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.03em', color: '#1e293b' }}>
                      {day}
                    </span>
                    <span className="crm-stu-chip crm-stu-chip--brand" style={{ fontSize: '0.75rem' }}>
                      {dayEvents.length} {dayEvents.length === 1 ? 'Event' : 'Events'}
                    </span>
                  </div>
                  <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>
                    Scheduled Routine
                  </span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {dayEvents.map((ev) => (
                    <div
                      key={ev.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '0.65rem 0.85rem',
                        background: '#f8fafc',
                        borderRadius: '8px',
                        border: '1px solid #f1f5f9',
                        gap: '0.65rem',
                        flexWrap: 'wrap',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', minWidth: 200, flex: 1 }}>
                        <span
                          className={`crm-stu-chip crm-stu-chip--${ev.type === 'CLASS' ? 'brand' : ev.type === 'ASSIGNMENT' ? 'amber' : ev.type === 'TEST' ? 'info' : 'success'}`}
                          style={{ fontSize: '0.75rem', padding: '0.2rem 0.55rem', fontWeight: 750 }}
                        >
                          {TYPE_LABEL[ev.type]}
                        </span>
                        <div>
                          <strong style={{ fontSize: '0.875rem', fontWeight: 800, color: '#0f172a', display: 'block' }}>
                            {ev.title}
                          </strong>
                          <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'block', marginTop: '1px' }}>
                            {new Date(ev.startAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                            {ev.endAt ? ` – ${new Date(ev.endAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}` : ''} · {ev.meta}
                          </span>
                        </div>
                      </div>

                      <Link
                        to={ev.link}
                        className={`crm-stu-btn ${ev.type === 'CLASS' ? 'crm-stu-btn--primary' : 'crm-stu-btn--secondary'}`}
                        style={{ fontSize: '0.75rem', padding: '0.35rem 0.85rem', whiteSpace: 'nowrap', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
                      >
                        {ev.type === 'CLASS' ? <><FiVideo /> Join Class</> : ev.type === 'ASSIGNMENT' ? <><FiClipboard /> Submit Task</> : ev.type === 'TEST' ? <><FiAward /> Take Test</> : <><FiUsers /> Advisory</>}
                      </Link>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Right Column: Weekly Routine Timetable & Guidelines Card */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
          {/* Weekly Class Matrix */}
          <div
            style={{
              background: '#ffffff',
              borderRadius: '12px',
              border: '1px solid #e2e8f0',
              padding: '1rem 1.15rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
              <div>
                <h3 style={{ fontSize: '0.9375rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                  Weekly Class Timetable
                </h3>
                <p style={{ fontSize: '0.75rem', color: '#64748b', margin: '0.1rem 0 0' }}>
                  Standard batch schedule matrix (Mon – Sat)
                </p>
              </div>
              <span className="crm-stu-chip crm-stu-chip--brand" style={{ fontSize: '0.75rem' }}>
                Routine
              </span>
            </div>

            {!routine.length ? (
              <p style={{ fontSize: '0.8125rem', color: '#94a3b8', margin: '0.5rem 0', fontStyle: 'italic' }}>
                No weekly timetable routine slots assigned yet.
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
                {routine.map((slot) => (
                  <div
                    key={slot.day}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.55rem 0.75rem',
                      background: '#f8fafc',
                      borderRadius: '8px',
                      border: '1px solid #f1f5f9',
                      gap: '0.5rem',
                    }}
                  >
                    <div style={{ minWidth: 90 }}>
                      <strong style={{ fontSize: '0.8125rem', color: '#0f172a', display: 'block' }}>
                        {slot.day}
                      </strong>
                      <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'block' }}>
                        {slot.time}
                      </span>
                    </div>

                    <div style={{ textAlign: 'right', minWidth: 0, flex: 1 }}>
                      <strong style={{ fontSize: '0.8125rem', color: '#1e293b', display: 'block' }}>
                        {slot.subject}
                      </strong>
                      <span style={{ fontSize: '0.75rem', color: '#2563eb', fontWeight: 600, display: 'block' }}>
                        {slot.room}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Guidelines Card */}
          <div
            style={{
              background: '#f8fafc',
              borderRadius: '10px',
              border: '1px solid #e2e8f0',
              padding: '0.85rem 1rem',
            }}
          >
            <strong style={{ fontSize: '0.8125rem', color: '#0f172a', display: 'block', marginBottom: '0.25rem' }}>
              Laboratory & Attendance Guidelines
            </strong>
            <p style={{ fontSize: '0.75rem', color: '#64748b', margin: 0, lineHeight: 1.45 }}>
              Please bring personal 3.5mm or USB earphones for Listening Lab sessions on Monday and Thursday. Maintain 75%+ attendance to stay eligible for final institutional mock certifications.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
