import { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  FiCheck,
  FiCheckCircle,
  FiClock,
  FiCalendar,
  FiRefreshCw,
  FiSave,
  FiSearch,
  FiUserCheck,
  FiUsers,
  FiUserX,
  FiX,
  FiXCircle,
  FiArrowLeft,
  FiMapPin,
  FiUser,
  FiLock,
  FiEye,
  FiExternalLink,
  FiMail,
  FiPhone,
  FiZap,
} from 'react-icons/fi';
import Button from '../../../components/ui/Button';
import Avatar from '../../../components/ui/Avatar';
import Modal from '../../../components/ui/Modal';
import ContentLoader from '../../../components/ui/ContentLoader';
import SummaryStatBar from '../../../components/ui/SummaryStatBar';
import EmptyState from '../../../components/ui/EmptyState';
import { ROUTES } from '../../../config/routes';
import {
  useGetSessionAttendanceQuery,
  useSaveAttendanceMutation,
  useCorrectAttendanceMutation,
} from '../redux/attendanceApiSlice';
import toastService from '../../../services/toast/toast.service';
import { usePermissions } from '../../../hooks/usePermissions';
import { PERMISSIONS } from '../../../config/permissions';
import {
  computeCounts,
  dailyPresentPercent,
  isDraftDirty,
  normalizeToDailyStatus,
  studentName,
  studentInitials,
  formatSessionWhen,
  dailyStatusLabel,
} from '../components/AttendanceUi';
import '../styles/teacher-students.css';
import '../styles/batches.theme.css';

export default function TakeAttendancePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { can } = usePermissions();
  const canMark = can(PERMISSIONS.ATTENDANCE_MARK) || can(PERMISSIONS.ATTENDANCE_EDIT);

  const { data, isLoading, refetch, isFetching } = useGetSessionAttendanceQuery(id, { skip: !id });
  const [saveAttendance, { isLoading: saving }] = useSaveAttendanceMutation();

  const [draft, setDraft] = useState({});
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [forceUnlocked, setForceUnlocked] = useState(false);
  const [inspectStudent, setInspectStudent] = useState(null);

  useEffect(() => {
    if (!data?.roster) return;
    const next = {};
    data.roster.forEach((row) => {
      next[row.studentId] = normalizeToDailyStatus(row.status);
    });
    setDraft(next);
  }, [data]);

  const locked = Boolean(data?.window?.locked);
  const isOverridden = forceUnlocked;
  const counts = useMemo(() => computeCounts(draft, data?.roster?.length || 0), [draft, data]);
  const markedRate = useMemo(() => {
    if (!counts.TOTAL) return 0;
    return Math.round((counts.MARKED / counts.TOTAL) * 100);
  }, [counts]);
  const presentRate = useMemo(() => dailyPresentPercent(counts), [counts]);
  const dirty = useMemo(() => isDraftDirty(data, draft), [data, draft]);

  const summaryItems = useMemo(() => [
    {
      key: 'ALL',
      filterValue: 'ALL',
      label: 'Total Students',
      value: counts.TOTAL,
      icon: FiUsers,
      tone: 'primary',
      badge: 'All Enrolled',
      badgeTone: 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300',
    },
    {
      key: 'PRESENT',
      filterValue: 'PRESENT',
      label: 'Present (P)',
      value: counts.PRESENT,
      icon: FiCheckCircle,
      tone: 'success',
      badge: `${presentRate}% Rate`,
      badgeTone: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300',
    },
    {
      key: 'ABSENT',
      filterValue: 'ABSENT',
      label: 'Absent (A)',
      value: counts.ABSENT,
      icon: FiXCircle,
      tone: counts.ABSENT > 0 ? 'danger' : 'neutral',
      badge: counts.ABSENT > 0 ? `${counts.ABSENT} Absent` : 'Zero Absent',
      badgeTone: counts.ABSENT > 0 ? 'bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
    },
    {
      key: 'UNMARKED',
      filterValue: 'UNMARKED',
      label: 'Pending Mark',
      value: counts.UNMARKED,
      icon: FiClock,
      tone: counts.UNMARKED > 0 ? 'warning' : 'success',
      badge: counts.UNMARKED > 0 ? `${counts.UNMARKED} Remaining` : 'Completed',
      badgeTone: counts.UNMARKED > 0 ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300' : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300',
    },
  ], [counts, presentRate]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (data?.roster || []).filter((row) => {
      const status = draft[row.studentId] || '';
      if (statusFilter === 'UNMARKED' && status) return false;
      if (statusFilter !== 'ALL' && statusFilter !== 'UNMARKED' && status !== statusFilter) return false;
      if (!q) return true;
      const name = studentName(row.student).toLowerCase();
      const code = String(row.student?.studentCode || '').toLowerCase();
      return name.includes(q) || code.includes(q);
    });
  }, [data, draft, search, statusFilter]);

  const setStatus = useCallback((studentId, status) => {
    if (locked && !forceUnlocked) {
      setForceUnlocked(true);
    }
    setDraft((prev) => ({
      ...prev,
      [studentId]: prev[studentId] === status ? '' : status,
    }));
  }, [locked, forceUnlocked]);

  const markAllPresent = () => {
    if (locked && !forceUnlocked) setForceUnlocked(true);
    const next = {};
    (data?.roster || []).forEach((row) => { next[row.studentId] = 'PRESENT'; });
    setDraft(next);
  };

  const markAllAbsent = () => {
    if (locked && !forceUnlocked) setForceUnlocked(true);
    const next = {};
    (data?.roster || []).forEach((row) => { next[row.studentId] = 'ABSENT'; });
    setDraft(next);
  };

  const clearDraft = () => {
    const next = {};
    (data?.roster || []).forEach((row) => { next[row.studentId] = ''; });
    setDraft(next);
  };

  const save = async () => {
    const roster = data?.roster || [];
    const unmarked = roster.filter((row) => !draft[row.studentId]);
    if (unmarked.length) {
      toastService.info(`Please mark all ${unmarked.length} remaining student(s) as P or A`);
      return;
    }
    const entries = roster.map((row) => ({
      studentId: row.studentId,
      status: draft[row.studentId],
    }));
    try {
      await saveAttendance({ id, entries, force: true, overrideWindow: true }).unwrap();
      toastService.success('Attendance saved successfully');
      refetch();
    } catch (e) {
      toastService.error(e?.data?.message || 'Could not save attendance');
    }
  };

  if (isLoading) return <ContentLoader variant="module" />;
  if (!data) return <p className="p-8 text-text-muted">Session not found.</p>;

  const session = data.session;
  const batch = session?.batch || {};
  const instructor = session.instructor
    ? `${session.instructor.firstName || ''} ${session.instructor.lastName || ''}`.trim()
    : batch.instructor
      ? `${batch.instructor.firstName || ''} ${batch.instructor.lastName || ''}`.trim()
      : null;

  return (
    <div className="crm-tstudents p-2 sm:p-3 flex flex-col gap-2 w-full">
      {/* ── 1. Compact Clean Session Header Section ── */}
      <div className="crm-session-hero-card">
        {/* Top Breadcrumb & Status Actions Bar */}
        <div className="crm-session-hero-card__top">
          <nav className="crm-session-breadcrumbs" aria-label="Breadcrumbs">
            <Link to={ROUTES.DASHBOARD} className="crm-session-crumb">
              Dashboard
            </Link>
            <span className="crm-session-crumb-sep">/</span>
            <Link to={ROUTES.BATCHES} className="crm-session-crumb">
              Batches
            </Link>
            <span className="crm-session-crumb-sep">/</span>
            <Link to={batch.id ? ROUTES.BATCH_DETAIL(batch.id) : ROUTES.BATCHES} className="crm-session-crumb">
              {batch.name || 'Batch'}
            </Link>
            <span className="crm-session-crumb-sep">/</span>
            <span className="crm-session-crumb crm-session-crumb--current">Take Attendance</span>
          </nav>

          <div className="flex items-center gap-1.5">
            {locked && !isOverridden ? (
              <span className="crm-session-lock-pill crm-session-lock-pill--locked">
                <FiLock className="w-3 h-3" />
                <span>Window Locked · Override Enabled</span>
              </span>
            ) : (
              <span className="crm-session-lock-pill crm-session-lock-pill--open">
                <span className="crm-session-pulse-dot" />
                <span>Marking Session Open</span>
              </span>
            )}

            <Button
              size="xs"
              variant="outline"
              icon={FiRefreshCw}
              onClick={() => refetch()}
              disabled={isFetching}
              className="bg-card-bg shadow-2xs font-semibold text-xs py-0.5 px-2"
            >
              Refresh
            </Button>
          </div>
        </div>

        {/* Hero Main Content (Proportional Typography & Clean Chips) */}
        <div className="crm-session-hero-card__main">
          {/* Left: Identity & Badges */}
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            <div className="crm-session-hero-icon-box">
              <FiCalendar className="w-3.5 h-3.5 text-brand" />
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 flex-wrap">
                <h1 className="text-xs sm:text-sm font-bold text-text tracking-tight truncate">
                  {batch.name || 'Class Attendance Session'}
                </h1>
                {batch.courseName && (
                  <span className="px-1.5 py-0.2 rounded-full text-[9.5px] font-bold bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300">
                    {batch.courseName}
                  </span>
                )}
                {batch.code && (
                  <span className="px-1.5 py-0.2 rounded text-[9.5px] font-mono font-semibold bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                    {batch.code}
                  </span>
                )}
              </div>

              {/* Enhanced Compact Meta Chips */}
              <div className="crm-session-meta-strip">
                <div className="crm-session-meta-item">
                  <FiClock className="w-3 h-3 text-brand" />
                  <span>{formatSessionWhen(session.startAt, session.endAt)}</span>
                </div>
                {session.room && (
                  <div className="crm-session-meta-item">
                    <FiMapPin className="w-3 h-3 text-emerald-600" />
                    <span>{session.room}</span>
                  </div>
                )}
                {instructor && (
                  <div className="crm-session-meta-item">
                    <FiUser className="w-3 h-3 text-purple-600" />
                    <span>Faculty: <strong>{instructor}</strong></span>
                  </div>
                )}
                <div className="crm-session-meta-item">
                  <FiUsers className="w-3 h-3 text-blue-600" />
                  <span>{data.totalStudents || counts.TOTAL} Enrolled Students</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Modern Attendance Completion Progress Widget */}
          <div className="crm-session-progress-widget">
            <div className="relative w-8 h-8 flex items-center justify-center shrink-0">
              <svg viewBox="0 0 36 36" className="w-8 h-8 -rotate-90">
                <path
                  className="text-slate-200 dark:text-slate-700/60"
                  strokeWidth="3.5"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path
                  className="text-brand transition-all duration-500 ease-out"
                  strokeDasharray={`${markedRate}, 100`}
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>
              <span className="absolute text-[9.5px] font-bold text-text tabular-nums">{markedRate}%</span>
            </div>

            <div className="text-right min-w-[75px]">
              <span className="text-[10.5px] font-bold text-text block tabular-nums leading-tight">
                {counts.MARKED} / {counts.TOTAL} Marked
              </span>
              <span className="text-[9.5px] text-text-muted mt-0.5 block leading-tight">
                {counts.UNMARKED === 0 ? 'All Recorded' : `${counts.UNMARKED} Pending`}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── 2. Summary KPI Strip ── */}
      <div className="rounded-lg border border-border bg-card-bg shadow-2xs overflow-hidden">
        <SummaryStatBar
          items={summaryItems}
          activeFilter={statusFilter}
          onSelect={(key) => setStatusFilter(key || 'ALL')}
          ariaLabel="Attendance breakdown"
          layout="grid"
        />
      </div>

      {/* ── 3. Controls Toolbar ── */}
      <div className="crm-tstudents-toolbar flex flex-wrap items-center justify-between gap-2">
        <div className="crm-tstudents-search-box">
          <FiSearch />
          <input
            type="text"
            className="crm-tstudents-search-input"
            placeholder="Search student name or code..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button
              type="button"
              className="text-slate-400 hover:text-slate-600 cursor-pointer"
              onClick={() => setSearch('')}
            >
              <FiX size={13} />
            </button>
          )}
        </div>

        <div className="flex items-center gap-1.5 flex-wrap ml-auto">
          <Button
            size="xs"
            variant="outline"
            className="flex items-center gap-1 shadow-2xs font-semibold text-emerald-700 bg-emerald-50/50 hover:bg-emerald-100/60 border-emerald-200 py-1"
            onClick={markAllPresent}
            title="Mark all students present"
          >
            <FiUserCheck className="w-3.5 h-3.5 text-emerald-600" />
            All Present
          </Button>

          <Button
            size="xs"
            variant="outline"
            className="flex items-center gap-1 shadow-2xs font-semibold text-rose-700 bg-rose-50/50 hover:bg-rose-100/60 border-rose-200 py-1"
            onClick={markAllAbsent}
            title="Mark all students absent"
          >
            <FiUserX className="w-3.5 h-3.5 text-rose-500" />
            All Absent
          </Button>

          {dirty && (
            <Button
              size="xs"
              variant="ghost"
              className="flex items-center gap-1 text-slate-500 py-1"
              onClick={clearDraft}
              title="Clear draft changes"
            >
              <FiX className="w-3.5 h-3.5" />
              Clear
            </Button>
          )}

          {canMark && (
            <Button
              size="xs"
              variant="primary"
              className={`flex items-center gap-1 font-bold shadow-2xs py-1 ${dirty ? 'bg-primary-600 hover:bg-primary-700 text-white' : ''}`}
              onClick={save}
              loading={saving}
              disabled={saving || !dirty}
            >
              <FiSave className="w-3.5 h-3.5" />
              {dirty ? `Save Attendance (${counts.PRESENT} Present)` : 'Save Attendance'}
            </Button>
          )}

          <Button
            size="xs"
            variant="outline"
            className="flex items-center justify-center p-1.5 shadow-2xs"
            onClick={() => refetch()}
            disabled={isFetching}
            title="Refresh"
          >
            <FiRefreshCw className={`w-3.5 h-3.5 ${isFetching ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* ── 4. Student Attendance Table (No Empty Void, Fits Content) ── */}
      <div className="overflow-x-auto rounded-lg border border-border bg-card-bg shadow-2xs">
        {filtered.length === 0 ? (
          <EmptyState
            title="No students match criteria"
            description="Try modifying search query or changing the attendance filter."
            action={
              search ? (
                <Button size="xs" variant="outline" onClick={() => setSearch('')}>
                  Clear Search
                </Button>
              ) : null
            }
          />
        ) : (
          <table className="crm-tstudents-table">
            <thead>
              <tr>
                <th style={{ width: '38%' }}>Student Particulars</th>
                <th style={{ textAlign: 'center', width: '24%' }}>Attendance Record</th>
                <th style={{ width: '23%' }}>Status Details</th>
                <th style={{ textAlign: 'right', width: '15%' }}>Quick Profile</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((row) => {
                const sName = studentName(row.student);
                const sInitials = studentInitials(row.student);
                const currentStatus = draft[row.studentId] || '';
                const savedStatus = normalizeToDailyStatus(row.status);
                const isChanged = currentStatus !== savedStatus;

                return (
                  <tr key={row.studentId}>
                    <td>
                      <div className="flex items-center gap-2">
                        <Avatar name={sName} size="xs" />
                        <div className="min-w-0">
                          <button
                            type="button"
                            onClick={() => setInspectStudent(row)}
                            className="text-slate-900 dark:text-slate-100 font-semibold text-xs text-left hover:text-brand transition-colors block truncate"
                          >
                            {sName}
                          </button>
                          <span className="font-mono text-[10px] text-slate-400 block leading-tight">
                            {row.student?.studentCode || 'MAIN-STU'}
                          </span>
                        </div>
                      </div>
                    </td>

                    <td style={{ textAlign: 'center' }}>
                      <div className="inline-flex items-center gap-1 p-0.5 rounded-lg bg-slate-100 dark:bg-slate-800/80 border border-border">
                        <button
                          type="button"
                          className={`w-8 h-6 rounded-md text-xs font-bold transition-all flex items-center justify-center cursor-pointer ${
                            currentStatus === 'PRESENT'
                              ? 'bg-emerald-600 text-white shadow-xs'
                              : 'text-slate-600 dark:text-slate-400 hover:bg-emerald-50 hover:text-emerald-700'
                          }`}
                          onClick={() => setStatus(row.studentId, 'PRESENT')}
                        >
                          P
                        </button>
                        <button
                          type="button"
                          className={`w-8 h-6 rounded-md text-xs font-bold transition-all flex items-center justify-center cursor-pointer ${
                            currentStatus === 'ABSENT'
                              ? 'bg-rose-600 text-white shadow-xs'
                              : 'text-slate-600 dark:text-slate-400 hover:bg-rose-50 hover:text-rose-700'
                          }`}
                          onClick={() => setStatus(row.studentId, 'ABSENT')}
                        >
                          A
                        </button>
                      </div>
                    </td>

                    <td>
                      {isChanged ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-600">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                          Unsaved Change
                        </span>
                      ) : row.markedBy ? (
                        <div className="text-[11px] text-slate-600 dark:text-slate-400">
                          <span className="font-semibold text-slate-800 dark:text-slate-200">
                            {dailyStatusLabel(row.status)} · {row.markedBy.firstName || 'Teacher'}
                          </span>
                          {row.markedAt && (
                            <span className="block text-[9.5px] text-slate-400">
                              {new Date(row.markedAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          )}
                        </div>
                      ) : currentStatus ? (
                        <span className="text-[11px] font-semibold text-emerald-600">Marked {currentStatus === 'PRESENT' ? 'P' : 'A'}</span>
                      ) : (
                        <span className="text-[11px] text-slate-400 italic">Unmarked</span>
                      )}
                    </td>

                    <td style={{ textAlign: 'right' }}>
                      <Button
                        size="xs"
                        variant="outline"
                        className="px-2 py-0.5 text-[11px] font-medium rounded-md"
                        onClick={() => setInspectStudent(row)}
                      >
                        <FiEye className="w-3 h-3 mr-1" /> Inspect
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* ── 5. Advanced & Clean Student Profile Modal ── */}
      {inspectStudent && (
        <Modal
          open={!!inspectStudent}
          onClose={() => setInspectStudent(null)}
          title="Student Academic Profile"
          subtitle="Enrolled batch details & live attendance tracking"
          size="sm"
          footer={(
            <div className="flex items-center justify-between w-full">
              <Button variant="outline" size="xs" className="px-3 py-1 font-medium rounded-md" onClick={() => setInspectStudent(null)}>
                Close
              </Button>
              <Button
                size="xs"
                variant="primary"
                className="flex items-center gap-1.5 px-3 py-1 font-bold rounded-md shadow-2xs"
                onClick={() => {
                  const sid = inspectStudent.student?.id || inspectStudent.studentId;
                  setInspectStudent(null);
                  navigate(ROUTES.TEACHER_STUDENT(sid));
                }}
              >
                <FiExternalLink className="w-3 h-3" /> Full Academic Profile
              </Button>
            </div>
          )}
        >
          {(() => {
            const st = inspectStudent.student || {};
            const fullName = `${st.firstName || ''} ${st.lastName || ''}`.trim() || 'Student';
            const att = inspectStudent.attendance || { percent: 100, present: 5, absent: 0 };
            const isLow = (Number(att.percent) || 0) < 75;

            return (
              <div className="crm-modal-profile">
                {/* 1. Compact Identity Row */}
                <div className="crm-modal-profile__identity">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Avatar name={fullName} size="sm" />
                    <div className="min-w-0">
                      <h4 className="text-xs font-bold text-text truncate leading-tight">{fullName}</h4>
                      <span className="text-[10.5px] font-mono text-slate-500">{st.studentCode || 'MAIN-STU'}</span>
                    </div>
                  </div>
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10.5px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300">
                    ● Active Student
                  </span>
                </div>

                {/* 2. Compact Academic Batch Card */}
                <div className="crm-modal-profile__batch">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Academic Batch
                    </span>
                    <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300">
                      {batch.courseName || 'Course'}
                    </span>
                  </div>
                  <div className="text-xs font-bold text-text mt-0.5">{batch.name || 'Batch'}</div>
                  <div className="flex items-center gap-2 text-[11px] text-text-muted mt-0.5">
                    <span className="flex items-center gap-1">
                      <FiMapPin className="w-3 h-3 text-slate-400" />
                      {session.room || batch.room || 'Room 2'}
                    </span>
                    <span>•</span>
                    <span>Head Office Campus</span>
                  </div>
                </div>

                {/* 3. 3-Stat Attendance Metric Strip */}
                <div className="crm-modal-profile__stats">
                  <div className="crm-modal-profile__stat-box">
                    <span className={`crm-modal-profile__stat-val ${isLow ? 'text-rose-600' : 'text-emerald-600'}`}>
                      {att.percent ?? 100}%
                    </span>
                    <span className="crm-modal-profile__stat-lbl">Attendance Rate</span>
                  </div>
                  <div className="crm-modal-profile__stat-box">
                    <span className="crm-modal-profile__stat-val text-brand">
                      {att.present ?? 5}
                    </span>
                    <span className="crm-modal-profile__stat-lbl">Classes Present</span>
                  </div>
                  <div className="crm-modal-profile__stat-box">
                    <span className="crm-modal-profile__stat-val text-rose-500">
                      {att.absent ?? 0}
                    </span>
                    <span className="crm-modal-profile__stat-lbl">Classes Absent</span>
                  </div>
                </div>

                {/* 4. Compact Contact Particulars */}
                <div className="space-y-1 pt-0.5">
                  <span className="text-[10.5px] font-bold text-slate-600 dark:text-slate-400 block">
                    Contact Particulars
                  </span>
                  <div className="crm-modal-profile__contacts">
                    {st.email ? (
                      <a href={`mailto:${st.email}`} className="crm-modal-profile__contact-item" title={st.email}>
                        <div className="flex items-center gap-1.5 min-w-0">
                          <FiMail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="truncate">{st.email}</span>
                        </div>
                        <span className="text-brand font-bold text-[10px] shrink-0">Email &rarr;</span>
                      </a>
                    ) : (
                      <div className="crm-modal-profile__contact-item text-slate-400 italic">No email</div>
                    )}

                    {st.phone ? (
                      <a href={`tel:${st.phone}`} className="crm-modal-profile__contact-item" title={st.phone}>
                        <div className="flex items-center gap-1.5 min-w-0">
                          <FiPhone className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                          <span className="font-mono">{st.phone}</span>
                        </div>
                        <span className="text-emerald-600 font-bold text-[10px] shrink-0">Call &rarr;</span>
                      </a>
                    ) : (
                      <div className="crm-modal-profile__contact-item text-slate-400 italic">No phone</div>
                    )}
                  </div>
                </div>
              </div>
            );
          })()}
        </Modal>
      )}
    </div>
  );
}
