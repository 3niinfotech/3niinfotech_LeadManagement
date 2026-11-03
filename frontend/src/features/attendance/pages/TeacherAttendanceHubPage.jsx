import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  FiCheckCircle,
  FiCalendar,
  FiClock,
  FiUsers,
  FiBookOpen,
  FiMapPin,
  FiAlertCircle,
  FiRefreshCw,
  FiArrowRight,
  FiLayers,
  FiAward,
  FiTrendingUp,
  FiCheck,
  FiX,
  FiPhone,
  FiActivity,
  FiChevronRight,
} from 'react-icons/fi';
import Button from '../../../components/ui/Button';
import Avatar from '../../../components/ui/Avatar';
import Modal from '../../../components/ui/Modal';
import SummaryStatBar from '../../../components/ui/SummaryStatBar';
import ContentLoader from '../../../components/ui/ContentLoader';
import EmptyState from '../../../components/ui/EmptyState';
import { apiGet, apiPut } from '../../../api/apiClient';
import { API } from '../../../config/api';
import { ROUTES } from '../../../config/routes';
import { selectUser } from '../../../redux/slices/authSlice';
import toastService from '../../../services/toast/toast.service';
import '../styles/teacher-attendance-hub.css';

export default function TeacherAttendanceHubPage() {
  const navigate = useNavigate();
  const user = useSelector(selectUser);

  const [today, setToday] = useState([]);
  const [upcoming, setUpcoming] = useState([]);
  const [students, setStudents] = useState([]);
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Quick In-Page Attendance Sheet Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [modalSession, setModalSession] = useState(null);
  const [modalRoster, setModalRoster] = useState([]);
  const [modalDraft, setModalDraft] = useState({});
  const [modalLoading, setModalLoading] = useState(false);
  const [modalSaving, setModalSaving] = useState(false);

  const formatTimeRange = (startAt, endAt) => {
    if (!startAt) return 'Time TBA';
    const s = new Date(startAt);
    const e = endAt ? new Date(endAt) : null;
    const format = (d) =>
      isNaN(d.getTime())
        ? ''
        : d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
    return e && !isNaN(e.getTime()) ? `${format(s)} – ${format(e)}` : format(s);
  };

  const loadAttendanceHub = useCallback(async () => {
    try {
      const [dashRes, studentsRes] = await Promise.allSettled([
        apiGet(API.ACADEMIC_TEACHER_DASHBOARD),
        apiGet(API.ACADEMIC_TEACHER_STUDENTS, { limit: 20 }),
      ]);

      const dash = dashRes.status === 'fulfilled' ? (dashRes.value?.data || dashRes.value) : null;
      setDashboardData(dash);

      // Real today's schedule from backend response
      const rawSchedule = dash?.todaySchedule || dash?.schedule || [];
      const mappedToday = rawSchedule.map((s) => ({
        id: s.id,
        batchId: s.batchId,
        batchName: s.batch || s.batchName || 'Class Batch',
        courseName: s.course || s.courseName || '',
        startAt: s.time || s.startAt,
        endAt: s.endAt,
        time: formatTimeRange(s.time || s.startAt, s.endAt),
        room: s.room || 'Room TBA',
        studentCount: s.studentCount ?? 0,
        markedCount: s.marked ?? 0,
        pending: Boolean(s.pending),
        status: s.status || 'SCHEDULED',
      }));
      setToday(mappedToday);

      // Real student list from backend
      const rawStudents = studentsRes.status === 'fulfilled' ? (studentsRes.value?.data || studentsRes.value || []) : [];
      const mappedStudents = (Array.isArray(rawStudents) ? rawStudents : []).map((s) => ({
        id: s.id,
        name: `${s.firstName || ''} ${s.lastName || ''}`.trim() || s.name || s.studentCode || 'Student',
        code: s.studentCode || '',
        phone: s.phone || '',
        attendanceRate: s.attendance?.percent ?? 100,
        batchName: s.batchName || '',
      }));
      setStudents(mappedStudents);

      // Real 7-day upcoming sessions from backend
      const start = new Date();
      start.setHours(23, 59, 59, 999);
      const weekEnd = new Date();
      weekEnd.setDate(weekEnd.getDate() + 7);
      weekEnd.setHours(23, 59, 59, 999);

      try {
        const sessionsRes = await apiGet(API.ACADEMIC_SESSIONS, {
          from: start.toISOString(),
          to: weekEnd.toISOString(),
        });
        const sessData = sessionsRes?.data || sessionsRes || [];
        const todayIds = new Set(mappedToday.map((s) => s.id));
        const mappedUpcoming = (Array.isArray(sessData) ? sessData : [])
          .filter((s) => !todayIds.has(s.id))
          .sort((a, b) => new Date(a.startAt) - new Date(b.startAt))
          .map((s) => ({
            id: s.id,
            batchId: s.batchId,
            batchName: s.batch?.name || s.batchName || 'Class Batch',
            startAt: s.startAt,
            endAt: s.endAt,
            room: s.room || s.batch?.room || 'Room TBA',
            time: formatTimeRange(s.startAt, s.endAt),
          }));
        setUpcoming(mappedUpcoming);
      } catch {
        setUpcoming([]);
      }
    } catch (err) {
      toastService.error(err?.response?.data?.message || 'Error loading attendance workspace');
      setToday([]);
      setStudents([]);
      setUpcoming([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAttendanceHub();
  }, [loadAttendanceHub]);

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    await loadAttendanceHub();
    setIsRefreshing(false);
    toastService.success('Attendance records refreshed');
  };

  const primarySession = today[0] || null;

  // Open Quick Attendance Sheet Modal using purely dynamic session data
  const openQuickAttendance = async (session) => {
    if (!session?.id) return;
    setModalSession(session);
    setModalLoading(true);
    setModalOpen(true);

    try {
      const res = await apiGet(API.ACADEMIC_SESSION_ATTENDANCE(session.id));
      const data = res?.data || res;
      const roster = data?.roster || [];

      setModalRoster(roster);
      const draft = {};
      roster.forEach((r) => {
        draft[r.studentId] = r.status || 'PRESENT';
      });
      setModalDraft(draft);
    } catch (err) {
      toastService.error(err?.response?.data?.message || 'Unable to load session student roster');
      setModalRoster([]);
      setModalDraft({});
    } finally {
      setModalLoading(false);
    }
  };

  const handleMarkAllPresent = () => {
    setModalDraft((prev) => {
      const next = { ...prev };
      modalRoster.forEach((r) => {
        next[r.studentId] = 'PRESENT';
      });
      return next;
    });
  };

  const handleSetStatus = (studentId, status) => {
    setModalDraft((prev) => ({
      ...prev,
      [studentId]: status,
    }));
  };

  const handleSaveModalAttendance = async () => {
    if (!modalSession?.id) return;
    setModalSaving(true);
    try {
      const entries = Object.entries(modalDraft).map(([studentId, status]) => ({
        studentId,
        status,
      }));

      await apiPut(API.ACADEMIC_SESSION_ATTENDANCE(modalSession.id), {
        entries,
        force: true,
      });

      toastService.success('Attendance recorded & synced with student portal in real time');
      setModalOpen(false);
      loadAttendanceHub();
    } catch (err) {
      toastService.error(err?.response?.data?.message || 'Failed to record attendance');
    } finally {
      setModalSaving(false);
    }
  };

  const modalCounts = useMemo(() => {
    const values = Object.values(modalDraft);
    const present = values.filter((v) => v === 'PRESENT').length;
    const late = values.filter((v) => v === 'LATE').length;
    const absent = values.filter((v) => v === 'ABSENT').length;
    return { total: values.length, present, late, absent };
  }, [modalDraft]);

  // Purely dynamic summary KPIs
  const summaryItems = useMemo(() => {
    const m = dashboardData?.metrics || {};
    const overview = dashboardData?.attendanceOverview || {};
    const totalToday = m.todayClasses ?? today.length;
    const pendingCount = m.attendancePending ?? today.filter((s) => s.pending).length;
    const upcomingCount = m.upcomingSessions ?? upcoming.length;
    const rate = m.attendancePercent ?? overview.percent ?? 100;

    return [
      {
        key: 'today',
        label: "Today's Lectures",
        value: totalToday,
        icon: FiClock,
        tone: 'info',
        filterValue: 'TODAY',
        badge: totalToday > 0 ? `${totalToday} Active` : 'None Today',
        badgeTone: totalToday > 0
          ? 'bg-cyan-50 text-cyan-700 dark:bg-cyan-950/40 dark:text-cyan-300'
          : 'bg-slate-100 text-slate-600',
      },
      {
        key: 'pending',
        label: 'Pending Attendance',
        value: pendingCount,
        icon: FiAlertCircle,
        tone: pendingCount > 0 ? 'warning' : 'neutral',
        filterValue: 'PENDING',
        badge: pendingCount > 0 ? 'Action Required' : 'All Marked',
        badgeTone: pendingCount > 0
          ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300'
          : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300',
      },
      {
        key: 'upcoming',
        label: 'Upcoming (7 Days)',
        value: upcomingCount,
        icon: FiCalendar,
        tone: 'primary',
        filterValue: 'UPCOMING',
        badge: upcomingCount > 0 ? 'Scheduled' : 'None',
        badgeTone: 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300',
      },
      {
        key: 'benchmark',
        label: 'Overall Batch Rate',
        value: `${rate}%`,
        icon: FiAward,
        tone: 'success',
        filterValue: 'BENCHMARK',
        badge: rate >= 75 ? 'Optimal' : 'Needs Attention',
        badgeTone: rate >= 75
          ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'
          : 'bg-rose-50 text-rose-700',
      },
    ];
  }, [dashboardData, today, upcoming]);

  const overview = dashboardData?.attendanceOverview || { present: 0, absent: 0, late: 0, percent: 100 };

  if (loading && !today.length && !upcoming.length) return <ContentLoader variant="dashboard" />;

  return (
    <div className="crm-tattendance">
      {/* ── 1. Top Compact Header & Quick Action Bar ── */}
      <div className="crm-tattendance-topbar">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold shadow-xs">
            <FiClock className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold text-slate-900 leading-tight">
                Attendance Workspace
              </h1>
              {primarySession?.pending ? (
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                  Attendance Pending
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  Active Session
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Live classroom attendance &amp; real-time student portal synchronization
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            className="flex items-center gap-1.5 font-semibold text-xs py-1.5 px-3"
            onClick={handleManualRefresh}
            disabled={isRefreshing}
            title="Refresh session data"
          >
            <FiRefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>

          {primarySession && (
            <Button
              size="sm"
              variant="primary"
              className="flex items-center gap-1.5 font-bold shadow-xs py-1.5 px-3.5"
              onClick={() => openQuickAttendance(primarySession)}
            >
              <FiCheckCircle className="w-4 h-4" />
              Mark Attendance
            </Button>
          )}
        </div>
      </div>

      {/* ── 2. Summary KPI Metrics Strip ── */}
      <div className="rounded-xl border border-border bg-card-bg shadow-xs overflow-hidden">
        <SummaryStatBar
          items={summaryItems}
          layout="grid"
          ariaLabel="Attendance Hub Statistics"
        />
      </div>

      {/* ── 3. Main Two-Column Faculty Layout ── */}
      <div className="crm-tattendance-main-grid">
        {/* Left Column: Live Active Session Hero Card + Student Roster */}
        <div className="flex flex-col gap-3.5">
          {/* Live Today's Session Highlight */}
          {primarySession ? (
            <div className="crm-tsession-hero-card">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1.5">
                    {primarySession.pending ? (
                      <span className="px-2.5 py-0.5 rounded-md text-[10.5px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                        ● Action Required
                      </span>
                    ) : (
                      <span className="px-2.5 py-0.5 rounded-md text-[10.5px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        ✓ Attendance Marked
                      </span>
                    )}
                    <span className="text-[11px] font-semibold text-slate-400">
                      Today's Lecture Session
                    </span>
                  </div>
                  <h2 className="text-base font-bold text-slate-900 truncate flex items-center gap-2">
                    {primarySession.batchName}
                    {primarySession.courseName && (
                      <span className="text-xs font-semibold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200">
                        {primarySession.courseName}
                      </span>
                    )}
                  </h2>
                </div>

                <Button
                  size="sm"
                  variant="primary"
                  className="flex items-center gap-1.5 font-bold shadow-xs shrink-0"
                  onClick={() => openQuickAttendance(primarySession)}
                >
                  Mark Attendance Now
                  <FiArrowRight className="w-4 h-4" />
                </Button>
              </div>

              {/* Clean Meta Details Pill Grid */}
              <div className="crm-tsession-hero-card__meta-grid">
                <div className="crm-tsession-meta-pill">
                  <span className="crm-tsession-meta-pill__label">Class Timing</span>
                  <span className="crm-tsession-meta-pill__value">
                    {primarySession.time}
                  </span>
                </div>

                <div className="crm-tsession-meta-pill">
                  <span className="crm-tsession-meta-pill__label">Classroom</span>
                  <span className="crm-tsession-meta-pill__value" title={primarySession.room}>
                    {primarySession.room}
                  </span>
                </div>

                <div className="crm-tsession-meta-pill">
                  <span className="crm-tsession-meta-pill__label">Enrolled</span>
                  <span className="crm-tsession-meta-pill__value">
                    {primarySession.studentCount} Students
                  </span>
                </div>

                <div className="crm-tsession-meta-pill">
                  <span className="crm-tsession-meta-pill__label">Marked</span>
                  <span className="crm-tsession-meta-pill__value">
                    {primarySession.markedCount} / {primarySession.studentCount}
                  </span>
                </div>
              </div>

              {/* Clean Footer Link */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs text-slate-500">
                <span>Real-time push notifications dispatch automatically to enrolled students</span>
                <button
                  type="button"
                  className="font-bold text-blue-600 hover:text-blue-700 hover:underline cursor-pointer flex items-center gap-1"
                  onClick={() => navigate(ROUTES.SESSION_ATTENDANCE(primarySession.id))}
                >
                  Full Attendance Ledger
                  <FiChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ) : (
            <EmptyState
              title="No lecture sessions scheduled for today"
              description="Today's timetable sessions will appear here automatically."
            />
          )}

          {/* Today's Enrolled Students Quick Attendance Roster */}
          <div className="crm-tatt-panel">
            <div className="crm-tatt-panel__head">
              <h3 className="crm-tatt-panel__title">
                <FiUsers className="text-blue-600" />
                Assigned Students Roster ({students.length})
              </h3>
              <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                Active Learners
              </span>
            </div>

            <div className="crm-tatt-panel__body">
              {!students.length ? (
                <EmptyState
                  title="No students assigned"
                  description="Enrolled batch learners will appear here."
                />
              ) : (
                <div className="crm-troster-grid">
                  {students.map((st) => (
                    <div key={st.id} className="crm-troster-card">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <Avatar name={st.name} size="sm" />
                        <div className="min-w-0">
                          <span
                            className="text-xs font-bold text-slate-900 block truncate leading-tight hover:text-blue-600 cursor-pointer transition-colors"
                            onClick={() => navigate(ROUTES.TEACHER_STUDENT(st.id))}
                            title={`View ${st.name}'s Academic Profile`}
                          >
                            {st.name}
                          </span>
                          <span className="font-mono text-[10px] text-slate-400 block truncate leading-none mt-1">
                            {st.code}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                          ✓ {st.attendanceRate}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <span>Click student name to view academic profile &amp; communications</span>
                <button
                  type="button"
                  className="font-bold text-blue-600 hover:text-blue-700 hover:underline cursor-pointer flex items-center gap-1"
                  onClick={() => navigate(ROUTES.TEACHER_STUDENTS)}
                >
                  View All Students
                  <FiChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Upcoming 7-Day Lecture Schedule & Batch Health */}
        <div className="flex flex-col gap-3.5">
          {/* Upcoming 7-Day Lecture Schedule */}
          <div className="crm-tatt-panel">
            <div className="crm-tatt-panel__head">
              <h3 className="crm-tatt-panel__title">
                <FiCalendar className="text-blue-600" />
                Upcoming Sessions (7 Days)
              </h3>
              <span className="text-xs font-semibold text-slate-500">
                {upcoming.length} Scheduled
              </span>
            </div>

            <div className="crm-tatt-panel__body">
              {!upcoming.length ? (
                <EmptyState
                  title="No upcoming sessions"
                  description="Scheduled classes for the next 7 days will be displayed here."
                />
              ) : (
                <div className="crm-tupcoming-list">
                  {upcoming.map((ses) => {
                    const d = new Date(ses.startAt);
                    const dayNum = isNaN(d.getTime()) ? '—' : d.getDate().toString().padStart(2, '0');
                    const monthStr = isNaN(d.getTime()) ? '—' : d.toLocaleDateString('en-US', { month: 'short' });

                    return (
                      <div key={ses.id} className="crm-tupcoming-row">
                        <div className="crm-tupcoming-date-badge">
                          <span className="crm-tupcoming-date-badge__day">{dayNum}</span>
                          <span className="crm-tupcoming-date-badge__month">{monthStr}</span>
                        </div>

                        <div className="min-w-0 flex-1">
                          <span className="text-xs font-bold text-slate-900 block truncate">
                            {ses.batchName}
                          </span>
                          <span className="text-[11px] text-slate-500 block truncate mt-0.5">
                            {ses.room} · {ses.time}
                          </span>
                        </div>

                        <Button
                          size="xs"
                          variant="outline"
                          className="py-1 px-3 font-semibold text-xs shrink-0"
                          onClick={() => openQuickAttendance(ses)}
                        >
                          Open
                        </Button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Quick Attendance Navigation & Batch Health */}
          <div className="crm-tatt-panel">
            <div className="crm-tatt-panel__head">
              <h3 className="crm-tatt-panel__title">
                <FiActivity className="text-emerald-600" />
                Batch Attendance Health &amp; Tools
              </h3>
              <span className="text-[10.5px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                {overview.percent >= 75 ? 'Punctual' : 'Attention'}
              </span>
            </div>

            <div className="crm-tatt-panel__body">
              {/* Dynamic Health stats row from backend */}
              <div className="grid grid-cols-3 gap-2">
                <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-center">
                  <span className="text-[10px] uppercase font-bold text-emerald-800 block">
                    Present Rate
                  </span>
                  <span className="text-base font-black text-emerald-700 block mt-0.5">
                    {overview.percent ?? 100}%
                  </span>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-center">
                  <span className="text-[10px] uppercase font-bold text-slate-500 block">
                    Absentees
                  </span>
                  <span className="text-base font-black text-slate-800 block mt-0.5">
                    {overview.absent ?? 0}
                  </span>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-center">
                  <span className="text-[10px] uppercase font-bold text-slate-500 block">
                    Late Arrivals
                  </span>
                  <span className="text-base font-black text-slate-800 block mt-0.5">
                    {overview.late ?? 0}
                  </span>
                </div>
              </div>

              {/* Action shortcuts */}
              <div className="flex flex-col gap-1.5 pt-2 border-t border-slate-100 mt-1">
                <button
                  type="button"
                  onClick={() => navigate(ROUTES.TEACHER_CLASSES)}
                  className="flex items-center justify-between p-2 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  <span className="flex items-center gap-2">
                    <FiLayers className="text-blue-600" />
                    Manage All Assigned Classes &amp; Batches
                  </span>
                  <FiChevronRight className="text-slate-400" />
                </button>

                <button
                  type="button"
                  onClick={() => navigate(ROUTES.TEACHER_PERFORMANCE)}
                  className="flex items-center justify-between p-2 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  <span className="flex items-center gap-2">
                    <FiTrendingUp className="text-indigo-600" />
                    View Student Academic Performance Analytics
                  </span>
                  <FiChevronRight className="text-slate-400" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── 4. Quick In-Page Attendance Sheet Modal ── */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={modalSession ? `Mark Attendance: ${modalSession.batchName}` : 'Record Attendance'}
        size="lg"
        footer={(
          <div className="flex items-center justify-between w-full">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setModalOpen(false);
                if (modalSession?.id) navigate(ROUTES.SESSION_ATTENDANCE(modalSession.id));
              }}
            >
              Full Ledger View →
            </Button>

            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => setModalOpen(false)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                className="font-bold shadow-xs"
                onClick={handleSaveModalAttendance}
                loading={modalSaving}
                disabled={!modalRoster.length}
              >
                <FiCheckCircle className="w-4 h-4" />
                Save &amp; Sync Attendance
              </Button>
            </div>
          </div>
        )}
      >
        {modalLoading ? (
          <ContentLoader variant="table" />
        ) : !modalRoster.length ? (
          <EmptyState
            title="No students found in this session"
            description="Enroll students into the batch to record and track attendance."
          />
        ) : (
          <div className="space-y-3.5">
            {/* Top Session Summary & Bulk Actions */}
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3 text-xs">
                <span className="font-semibold text-slate-700">
                  <FiClock className="inline mr-1 text-blue-600" />
                  {modalSession?.time}
                </span>
                <span>•</span>
                <span className="font-semibold text-slate-700">
                  <FiMapPin className="inline mr-1 text-blue-600" />
                  {modalSession?.room}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-600">
                  Present: <strong className="text-emerald-700">{modalCounts.present}</strong> / {modalCounts.total}
                </span>
                <Button
                  size="xs"
                  variant="outline"
                  className="font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border-emerald-300"
                  onClick={handleMarkAllPresent}
                >
                  ✓ Mark All Present
                </Button>
              </div>
            </div>

            {/* Students List with One-Click Status Toggles */}
            <div className="divide-y divide-slate-100 max-h-[55vh] overflow-y-auto pr-1">
              {modalRoster.map((item) => {
                const s = item.student || {};
                const sId = item.studentId || s.id;
                const sName = `${s.firstName || ''} ${s.lastName || ''}`.trim() || s.name || s.studentCode || 'Student';
                const currentStatus = modalDraft[sId] || 'PRESENT';

                return (
                  <div key={sId} className="py-2.5 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Avatar name={sName} size="sm" />
                      <div className="min-w-0">
                        <span className="text-xs font-bold text-slate-900 block truncate">
                          {sName}
                        </span>
                        <span className="font-mono text-[10px] text-slate-400 block truncate">
                          {s.studentCode || s.code}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleSetStatus(sId, 'PRESENT')}
                        className={`px-3 py-1 text-xs font-bold rounded-lg border transition-all cursor-pointer ${
                          currentStatus === 'PRESENT'
                            ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                            : 'bg-white text-slate-600 border-slate-200 hover:bg-emerald-50 hover:text-emerald-700'
                        }`}
                      >
                        ✓ Present
                      </button>

                      <button
                        type="button"
                        onClick={() => handleSetStatus(sId, 'LATE')}
                        className={`px-3 py-1 text-xs font-bold rounded-lg border transition-all cursor-pointer ${
                          currentStatus === 'LATE'
                            ? 'bg-amber-500 text-white border-amber-500 shadow-xs'
                            : 'bg-white text-slate-600 border-slate-200 hover:bg-amber-50 hover:text-amber-700'
                        }`}
                      >
                        ⏱ Late
                      </button>

                      <button
                        type="button"
                        onClick={() => handleSetStatus(sId, 'ABSENT')}
                        className={`px-3 py-1 text-xs font-bold rounded-lg border transition-all cursor-pointer ${
                          currentStatus === 'ABSENT'
                            ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                            : 'bg-white text-slate-600 border-slate-200 hover:bg-rose-50 hover:text-rose-700'
                        }`}
                      >
                        ✕ Absent
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
