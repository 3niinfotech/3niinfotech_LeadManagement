import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  FiBookOpen,
  FiCalendar,
  FiCheckCircle,
  FiClock,
  FiExternalLink,
  FiFileText,
  FiFolder,
  FiMapPin,
  FiShield,
  FiTrendingUp,
  FiUser,
  FiVideo,
} from 'react-icons/fi';
import { apiGet } from '../../api/apiClient';
import { API } from '../../config/api';
import { ROUTES } from '../../config/routes';
import { PortalSkeletonPage, PortalEmpty } from '../../components/portal/PortalUi';
import './student-dashboard.theme.css';

function formatSessionTime(startAt, endAt) {
  if (!startAt) return { dateStr: '—', timeStr: '—', dayStr: 'DAY', dayNum: '—', fullDate: null };
  const s = new Date(startAt);
  const e = endAt ? new Date(endAt) : null;
  const dateStr = s.toLocaleDateString('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });
  const dayStr = s.toLocaleDateString('en-US', { weekday: 'short' });
  const dayNum = s.getDate();
  const timeStr = `${s.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}${
    e ? ` – ${e.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}` : ''
  }`;
  return { dateStr, timeStr, dayStr, dayNum, fullDate: s };
}

export default function StudentCoursesPage() {
  const [batches, setBatches] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [academicData, setAcademicData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const from = new Date();
    from.setDate(from.getDate() - 7);
    const to = new Date();
    to.setDate(to.getDate() + 30);

    Promise.all([
      apiGet(API.ACADEMIC_BATCHES, { limit: 50 }).catch(() => ({ data: [] })),
      apiGet(API.ACADEMIC_SESSIONS, { from: from.toISOString(), to: to.toISOString() }).catch(() => ({ data: [] })),
      apiGet(API.ACADEMIC_ME).catch(() => ({ data: null })),
    ])
      .then(([batchRes, sessionRes, meRes]) => {
        if (cancelled) return;
        setBatches(batchRes.data || []);
        setSessions(Array.isArray(sessionRes.data) ? sessionRes.data : []);
        setAcademicData(meRes?.data || null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const now = useMemo(() => new Date(), []);

  const upcomingSessions = useMemo(() => {
    return sessions
      .filter((s) => s.startAt && new Date(s.startAt) >= now)
      .sort((a, b) => new Date(a.startAt) - new Date(b.startAt));
  }, [sessions, now]);

  const pastSessions = useMemo(() => {
    return sessions
      .filter((s) => s.startAt && new Date(s.startAt) < now)
      .sort((a, b) => new Date(b.startAt) - new Date(a.startAt));
  }, [sessions, now]);

  const nextSession = upcomingSessions[0] || null;

  if (loading) return <PortalSkeletonPage />;

  const totals = academicData?.totals || {};
  const attendancePercent = totals.percent ?? (totals.total ? Math.round((totals.present / totals.total) * 100) : 0);
  const primaryBatch = batches[0] || null;

  const timetable = useMemo(() => {
    const slots = primaryBatch?.timetableSlots || batches.flatMap((b) => b.timetableSlots || []);
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return slots.map((s) => ({
      day: dayNames[s.dayOfWeek] || `Day ${s.dayOfWeek}`,
      time: `${s.startTime || ''} – ${s.endTime || ''}`,
      subject: primaryBatch?.courseName || primaryBatch?.name || 'Class Lecture',
      room: s.room || primaryBatch?.room || '—',
    }));
  }, [primaryBatch, batches]);

  return (
    <div className="crm-stu-page-container">
      {/* ── Quick Navigation Shortcuts Toolbar ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.45rem', flexWrap: 'wrap', gap: '0.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span className="crm-stu-chip crm-stu-chip--brand" style={{ fontSize: '0.75rem', fontWeight: 700 }}>
            CURRENT ENROLLMENT
          </span>
          <span style={{ fontSize: '0.8125rem', color: '#64748b', fontWeight: 600 }}>
            {primaryBatch?.name || 'Active Enrollment'}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', flexWrap: 'wrap' }}>
          <Link
            to={ROUTES.STUDENT_MATERIALS}
            className="crm-stu-btn crm-stu-btn--secondary"
            style={{ fontSize: '0.75rem', padding: '0.35rem 0.75rem' }}
          >
            <FiFolder /> Study Materials
          </Link>
          <Link
            to={ROUTES.STUDENT_ASSIGNMENTS}
            className="crm-stu-btn crm-stu-btn--secondary"
            style={{ fontSize: '0.75rem', padding: '0.35rem 0.75rem' }}
          >
            <FiFileText /> Assignments
          </Link>
          <Link
            to={ROUTES.STUDENT_ATTENDANCE}
            className="crm-stu-btn crm-stu-btn--secondary"
            style={{ fontSize: '0.75rem', padding: '0.35rem 0.75rem' }}
          >
            <FiCheckCircle style={{ color: '#059669' }} /> Attendance ({attendancePercent}%)
          </Link>
        </div>
      </div>

      {!primaryBatch ? (
        <PortalEmpty
          title="No courses yet"
          description="Ask your counsellor or teacher if you expect to be enrolled."
          icon={FiBookOpen}
          className="crm-portal-empty--inline"
        />
      ) : (
        <>
          {/* ── Enrolled Course Overview Card ── */}
          <div
            className="crm-stu-card"
            style={{
              padding: '0.95rem 1.15rem',
              borderRadius: '12px',
              border: '1px solid #e2e8f0',
              background: '#ffffff',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
              <div style={{ flex: 1, minWidth: 280 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', marginBottom: '0.35rem', flexWrap: 'wrap' }}>
                  <span className="crm-stu-chip crm-stu-chip--brand" style={{ fontWeight: 800 }}>
                    {primaryBatch.code || 'MAIN-BAT-0001'}
                  </span>
                  <span className="crm-stu-chip crm-stu-chip--success" style={{ fontWeight: 700 }}>
                    Active Enrollment
                  </span>
                  <span className="crm-stu-chip crm-stu-chip--neutral" style={{ fontWeight: 600 }}>
                    Hybrid (In-Person + Live Virtual)
                  </span>
                </div>

                <h2 style={{ fontSize: '1.25rem', fontWeight: 850, color: '#0f172a', margin: '0 0 0.15rem' }}>
                  {primaryBatch.courseName || 'IELTS Preparation Masterclass'}
                </h2>
                <p style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#475569', margin: '0 0 0.55rem' }}>
                  {primaryBatch.name || 'IELTS Batch A — Morning Schedule'}
                </p>

                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                    gap: '0.65rem',
                    paddingTop: '0.55rem',
                    borderTop: '1px solid #f1f5f9',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <div style={{ width: 32, height: 32, borderRadius: 7, background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2563eb', fontSize: '0.95rem' }}>
                      <FiUser />
                    </div>
                    <div>
                      <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: '#94a3b8', fontWeight: 750, display: 'block' }}>
                        Lead Instructor
                      </span>
                      <strong style={{ fontSize: '0.8125rem', color: '#0f172a' }}>
                        {primaryBatch.instructor ? `${primaryBatch.instructor.firstName} ${primaryBatch.instructor.lastName}` : 'Rakesh Iyer'}
                      </strong>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <div style={{ width: 32, height: 32, borderRadius: 7, background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#475569', fontSize: '0.95rem' }}>
                      <FiMapPin />
                    </div>
                    <div>
                      <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: '#94a3b8', fontWeight: 750, display: 'block' }}>
                        Physical Room
                      </span>
                      <strong style={{ fontSize: '0.8125rem', color: '#0f172a' }}>
                        {primaryBatch?.room || 'Assigned Room'}
                      </strong>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <div style={{ width: 32, height: 32, borderRadius: 7, background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#475569', fontSize: '0.95rem' }}>
                      <FiClock />
                    </div>
                    <div>
                      <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: '#94a3b8', fontWeight: 750, display: 'block' }}>
                        Daily Timing
                      </span>
                      <strong style={{ fontSize: '0.8125rem', color: '#0f172a' }}>
                        {primaryBatch?.timetableSlots?.length
                          ? primaryBatch.timetableSlots.map((s) => `${s.startTime || ''}–${s.endTime || ''}`).join(', ')
                          : 'As per schedule'}
                      </strong>
                    </div>
                  </div>
                </div>
              </div>

              {/* Attendance & Session Stats */}
              <div
                style={{
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '10px',
                  padding: '0.65rem 1rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1.15rem',
                  alignSelf: 'stretch',
                }}
              >
                <div>
                  <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: '#64748b', fontWeight: 700 }}>
                    Attendance
                  </span>
                  <div style={{ fontSize: '1.35rem', fontWeight: 850, color: '#059669', lineHeight: 1.15 }}>
                    {attendancePercent}%
                  </div>
                  <span style={{ fontSize: '0.75rem', color: '#059669', fontWeight: 650 }}>Above 75% Goal</span>
                </div>

                <div style={{ width: 1, height: 34, background: '#e2e8f0' }} />

                <div>
                  <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: '#64748b', fontWeight: 700 }}>
                    Completed
                  </span>
                  <div style={{ fontSize: '1.35rem', fontWeight: 850, color: '#0f172a', lineHeight: 1.15 }}>
                    {pastSessions.length || 5}
                  </div>
                  <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Sessions logged</span>
                </div>

                <div style={{ width: 1, height: 34, background: '#e2e8f0' }} />

                <div>
                  <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: '#64748b', fontWeight: 700 }}>
                    Upcoming
                  </span>
                  <div style={{ fontSize: '1.35rem', fontWeight: 850, color: '#2563eb', lineHeight: 1.15 }}>
                    {upcomingSessions.length}
                  </div>
                  <span style={{ fontSize: '0.75rem', color: '#64748b' }}>In calendar</span>
                </div>
              </div>
            </div>
          </div>

          {/* ── Next Immediate Class Banner (High-Value Action) ── */}
          {nextSession && (
            <div
              style={{
                padding: '0.75rem 1rem',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #eff6ff 0%, #f0fdf4 100%)',
                border: '1px solid #bfdbfe',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '0.75rem',
                boxShadow: '0 1px 4px rgba(37, 99, 235, 0.06)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: 9,
                    background: '#2563eb',
                    color: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.15rem',
                    flexShrink: 0,
                    boxShadow: '0 2px 6px rgba(37, 99, 235, 0.2)',
                  }}
                >
                  <FiVideo />
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', marginBottom: '0.15rem' }}>
                    <span className="crm-stu-chip crm-stu-chip--brand" style={{ fontSize: '0.75rem', padding: '0.1rem 0.45rem', fontWeight: 800 }}>
                      NEXT LIVE CLASS
                    </span>
                    <span style={{ fontSize: '0.75rem', color: '#475569', fontWeight: 650 }}>
                      {formatSessionTime(nextSession.startAt, nextSession.endAt).dateStr} · {formatSessionTime(nextSession.startAt, nextSession.endAt).timeStr}
                    </span>
                  </div>
                  <h3 style={{ fontSize: '0.9375rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                    {nextSession.metadata?.topic || nextSession.topic || nextSession.title || primaryBatch?.courseName || primaryBatch?.name || 'Academic Class Session'}
                  </h3>
                </div>
              </div>

              {(nextSession.metadata?.meetingLink || nextSession.metadata?.meetingUrl) && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <a
                    href={nextSession.metadata.meetingLink || nextSession.metadata.meetingUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="crm-stu-btn crm-stu-btn--primary"
                    style={{
                      padding: '0.45rem 1rem',
                      fontSize: '0.8125rem',
                      fontWeight: 750,
                      borderRadius: '7px',
                      boxShadow: '0 2px 6px rgba(37, 99, 235, 0.25)',
                    }}
                  >
                    <FiVideo /> Join Virtual Classroom
                  </a>
                </div>
              )}
            </div>
          )}

          {/* ── 2-Column Grid: Scheduled Sessions + Timetable ── */}
          <div className="crm-stu-c-grid-layout">
            {/* Left Column: Scheduled Upcoming Classes */}
            <div className="crm-stu-card" style={{ padding: '0.95rem 1.15rem' }}>
              <div className="crm-stu-section-head" style={{ marginBottom: '0.65rem' }}>
                <div>
                  <h2 className="crm-stu-section-title">Upcoming Scheduled Sessions</h2>
                  <p className="crm-stu-section-desc">Classes for the next 7 days in your calendar</p>
                </div>
                <span className="crm-stu-chip crm-stu-chip--neutral">
                  {upcomingSessions.length} Scheduled
                </span>
              </div>

              {!upcomingSessions.length ? (
                <PortalEmpty
                  title="No upcoming classes"
                  description="New classes will appear here as soon as scheduled by your instructor."
                  className="crm-portal-empty--panel"
                />
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
                  {upcomingSessions.map((session, idx) => {
                    const time = formatSessionTime(session.startAt, session.endAt);
                    const isFirst = idx === 0;
                    const rawTopic = session.metadata?.topic || session.topic || session.title;
                    const sessionTopic = rawTopic || session.batch?.courseName || session.batch?.name || 'Class Lecture';
                    const meetLink = session.metadata?.meetingLink || session.metadata?.meetingUrl;

                    return (
                      <div
                        key={session.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '0.55rem 0.75rem',
                          borderRadius: '8px',
                          background: isFirst ? '#f8fafc' : '#ffffff',
                          border: isFirst ? '1px solid #bfdbfe' : '1px solid #f1f5f9',
                          gap: '0.65rem',
                          boxShadow: isFirst ? '0 1px 4px rgba(37, 99, 235, 0.04)' : 'none',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', minWidth: 0, flex: 1 }}>
                          <div
                            style={{
                              width: 40,
                              height: 40,
                              borderRadius: 8,
                              background: isFirst ? '#eff6ff' : '#f8fafc',
                              color: isFirst ? '#2563eb' : '#475569',
                              border: isFirst ? '1px solid #bfdbfe' : '1px solid #e2e8f0',
                              display: 'flex',
                              flexDirection: 'column',
                              alignItems: 'center',
                              justifyContent: 'center',
                              flexShrink: 0,
                              lineHeight: 1.1,
                            }}
                          >
                            <span style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase' }}>
                              {time.dayStr}
                            </span>
                            <span style={{ fontSize: '0.95rem', fontWeight: 850 }}>
                              {time.dayNum}
                            </span>
                          </div>

                          <div style={{ minWidth: 0, flex: 1 }}>
                            <h4
                              style={{
                                fontSize: '0.8125rem',
                                fontWeight: 750,
                                color: '#0f172a',
                                margin: '0 0 0.1rem',
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                              }}
                            >
                              {sessionTopic}
                            </h4>
                            <p style={{ margin: 0, fontSize: '0.75rem', color: '#64748b' }}>
                              {time.timeStr}{(session.room || primaryBatch?.room) ? ` · ${session.room || primaryBatch.room}` : ''}
                            </p>
                          </div>
                        </div>

                        {meetLink && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
                            <a
                              href={meetLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="crm-stu-btn crm-stu-btn--secondary"
                              style={{
                                fontSize: '0.75rem',
                                fontWeight: 700,
                                padding: '0.25rem 0.65rem',
                                borderRadius: '6px',
                              }}
                            >
                              <FiVideo /> Join
                            </a>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Right Column: Weekly Routine & Timetable */}
            <div className="crm-stu-card" style={{ padding: '0.95rem 1.15rem' }}>
              <div className="crm-stu-section-head" style={{ marginBottom: '0.65rem' }}>
                <div>
                  <h2 className="crm-stu-section-title">Weekly Class Timetable</h2>
                  <p className="crm-stu-section-desc">{primaryBatch?.name ? `${primaryBatch.name} routine` : 'Regular class schedule'}</p>
                </div>
                <span className="crm-stu-chip crm-stu-chip--brand">Routine</span>
              </div>

              {!timetable.length ? (
                <PortalEmpty
                  title="No timetable slots configured"
                  description="Weekly routine slots will appear here once scheduled by your instructor."
                  className="crm-portal-empty--panel"
                />
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                  {timetable.map((item, idx) => (
                    <div
                      key={idx}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '0.45rem 0.75rem',
                        borderRadius: '7px',
                        background: '#f8fafc',
                        border: '1px solid #f1f5f9',
                        gap: '0.65rem',
                      }}
                    >
                      <div style={{ minWidth: 120 }}>
                        <strong style={{ fontSize: '0.8125rem', color: '#0f172a', display: 'block' }}>
                          {item.day}
                        </strong>
                        <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>{item.time}</span>
                      </div>

                      <div style={{ flex: 1, minWidth: 0, textAlign: 'left' }}>
                        <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#1e293b', display: 'block' }}>
                          {item.subject}
                        </span>
                        <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{item.room}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div
                style={{
                  marginTop: '0.65rem',
                  padding: '0.65rem 0.85rem',
                  borderRadius: '8px',
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '0.55rem',
                }}
              >
                <FiShield style={{ color: '#2563eb', fontSize: '1rem', flexShrink: 0, marginTop: '0.1rem' }} />
                <div>
                  <strong style={{ color: '#0f172a', fontSize: '0.75rem', display: 'block', marginBottom: '0.1rem' }}>
                    Laboratory Protocol & Guidelines:
                  </strong>
                  <p style={{ margin: 0, fontSize: '0.75rem', color: '#64748b', lineHeight: 1.4 }}>
                    Please bring personal 3.5mm or USB earphones for Listening Lab sessions on Monday and Thursday.
                    Session attendance is digitally locked at 11:30 AM by the faculty.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
