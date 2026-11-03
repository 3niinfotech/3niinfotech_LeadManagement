import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  FiUsers,
  FiPlus,
  FiCalendar,
  FiUserCheck,
  FiRefreshCw,
  FiArrowLeft,
  FiSearch,
  FiClock,
  FiSettings,
  FiDownload,
  FiMapPin,
  FiMail,
  FiPhone,
  FiExternalLink,
  FiCheckCircle,
  FiGrid,
  FiList,
  FiLayers,
  FiEye,
  FiX,
  FiTrash2,
} from 'react-icons/fi';
import ModulePageCard from '../../../components/layout/ModulePageLayout';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import Select from '../../../components/ui/Select';
import Modal from '../../../components/ui/Modal';
import Avatar from '../../../components/ui/Avatar';
import ContentLoader from '../../../components/ui/ContentLoader';
import EmptyState from '../../../components/ui/EmptyState';
import { ROUTES } from '../../../config/routes';
import { PERMISSIONS } from '../../../config/permissions';
import { usePermissions } from '../../../hooks/usePermissions';
import {
  useGetBatchQuery,
  useUpdateBatchMutation,
  useEnrollStudentsMutation,
  useUnenrollStudentMutation,
  useAddTimetableSlotMutation,
  useGenerateSessionsMutation,
  useGetSessionsQuery,
} from '../redux/attendanceApiSlice';
import { apiGet } from '../../../api/apiClient';
import { API } from '../../../config/api';
import { userService } from '../../../services/user/user.service';
import toastService from '../../../services/toast/toast.service';
import {
  BATCH_WEEKDAYS,
  buildBatchDetailSummaryItems,
} from '../config/batchSummary.config';
import '../styles/teacher-students.css';
import '../styles/batches.theme.css';

function isoDate(offset = 0) {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return d.toISOString().slice(0, 10);
}

function instructorName(user) {
  if (!user) return '';
  return `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email || '';
}

export default function BatchDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { can } = usePermissions();
  const canManage = can(PERMISSIONS.ATTENDANCE_EDIT);
  const canMark = can(PERMISSIONS.ATTENDANCE_MARK) || can(PERMISSIONS.ATTENDANCE_EDIT);

  const { data: batch, isLoading, refetch } = useGetBatchQuery(id, { skip: !id });
  const { data: sessions = [], refetch: refetchSessions } = useGetSessionsQuery(
    { batchId: id },
    { skip: !id },
  );

  const [enroll] = useEnrollStudentsMutation();
  const [unenroll] = useUnenrollStudentMutation();
  const [updateBatch, { isLoading: assigning }] = useUpdateBatchMutation();
  const [addSlot, { isLoading: addingSlot }] = useAddTimetableSlotMutation();
  const [generate, { isLoading: generating }] = useGenerateSessionsMutation();

  // Active Workspace Tab: 'students' | 'sessions' | 'timetable' | 'settings'
  const [activeTab, setActiveTab] = useState('students');

  // Enrolled Students view mode: 'grid' (visual cards) | 'table' (compact roster)
  const [viewMode, setViewMode] = useState('grid');
  const [studentSearch, setStudentSearch] = useState('');
  const [studentFilter, setStudentFilter] = useState('ALL'); // 'ALL' | 'HIGH' | 'LOW'
  const [inspectStudent, setInspectStudent] = useState(null);
  const [enrollModalOpen, setEnrollModalOpen] = useState(false);

  // Global student search for enrolling
  const [enrollSearch, setEnrollSearch] = useState('');
  const [enrollResults, setEnrollResults] = useState([]);
  const [enrollingId, setEnrollingId] = useState(null);

  // Sessions filters
  const [sessionFilter, setSessionFilter] = useState('ALL'); // 'ALL' | 'OPEN' | 'COMPLETED' | 'UPCOMING'

  // Timetable Slot form state
  const [dayOfWeek, setDayOfWeek] = useState('1');
  const [startTime, setStartTime] = useState('10:00');
  const [endTime, setEndTime] = useState('11:30');

  // Faculty assignment
  const [instructorId, setInstructorId] = useState('');
  const [teacherOptions, setTeacherOptions] = useState([]);

  const summary = batch?.summary;
  const enrollmentsAll = batch?.enrollments || [];
  const slots = batch?.timetableSlots || [];

  useEffect(() => {
    if (batch?.instructorId) setInstructorId(batch.instructorId);
    else if (batch) setInstructorId('');
  }, [batch?.instructorId, batch]);

  useEffect(() => {
    let cancelled = false;
    userService.getAll({ role: 'teacher', status: 'ACTIVE', limit: 100 })
      .then((res) => {
        if (!cancelled) {
          const rows = res.data || [];
          setTeacherOptions([
            { value: '', label: 'No instructor assigned' },
            ...rows.map((u) => ({
              value: u.id,
              label: instructorName(u),
            })),
          ]);
        }
      })
      .catch(() => {
        if (!cancelled) setTeacherOptions([{ value: '', label: 'No instructor assigned' }]);
      });
    return () => { cancelled = true; };
  }, []);

  const searchGlobalStudents = async (q) => {
    setEnrollSearch(q);
    if (q.trim().length < 2) {
      setEnrollResults([]);
      return;
    }
    try {
      const res = await apiGet(API.STUDENTS, { search: q.trim(), limit: 10 });
      setEnrollResults(res.data || []);
    } catch {
      setEnrollResults([]);
    }
  };

  const handleEnrollStudent = async (sid) => {
    setEnrollingId(sid);
    try {
      await enroll({ id, studentIds: [sid] }).unwrap();
      toastService.success('Student enrolled into batch successfully');
      setEnrollSearch('');
      setEnrollResults([]);
      setEnrollModalOpen(false);
      refetch();
    } catch (e) {
      toastService.error(e?.data?.message || 'Could not enroll student');
    } finally {
      setEnrollingId(null);
    }
  };

  const removeStudent = async (studentId) => {
    try {
      await unenroll({ id, studentId }).unwrap();
      toastService.success('Student removed from batch');
      refetch();
    } catch (e) {
      toastService.error(e?.data?.message || 'Could not unenroll student');
    }
  };

  const saveInstructor = async () => {
    try {
      await updateBatch({ id, instructorId: instructorId || null }).unwrap();
      toastService.success('Instructor updated successfully');
      refetch();
    } catch (e) {
      toastService.error(e?.data?.message || 'Could not assign instructor');
    }
  };

  const saveSlot = async () => {
    try {
      await addSlot({ id, dayOfWeek: Number(dayOfWeek), startTime, endTime }).unwrap();
      toastService.success('Timetable slot added successfully');
      refetch();
    } catch (e) {
      toastService.error(e?.data?.message || 'Could not add slot');
    }
  };

  const generateWeek = async () => {
    try {
      const result = await generate({ id, from: isoDate(0), to: isoDate(14) }).unwrap();
      toastService.success(`${result?.data?.created ?? result?.created ?? 0} class sessions generated`);
      refetchSessions();
    } catch (e) {
      toastService.error(e?.data?.message || 'Could not generate sessions');
    }
  };

  const dayOptions = useMemo(
    () => BATCH_WEEKDAYS.map((label, value) => ({ value: String(value), label })),
    [],
  );

  const sortedSessions = useMemo(
    () => [...(sessions || [])].sort((a, b) => new Date(a.startAt) - new Date(b.startAt)),
    [sessions],
  );

  const upcomingSession = useMemo(() => {
    const now = Date.now();
    return sortedSessions
      .filter((s) => new Date(s.startAt).getTime() >= now - 2 * 3600000)
      .sort((a, b) => new Date(a.startAt) - new Date(b.startAt))[0];
  }, [sortedSessions]);

  // Enrolled students filtered by search & attendance rating
  const filteredEnrollments = useMemo(() => {
    let list = enrollmentsAll;
    const q = studentSearch.trim().toLowerCase();
    if (q) {
      list = list.filter((en) => {
        const name = `${en.student?.firstName || ''} ${en.student?.lastName || ''}`.toLowerCase();
        const code = (en.student?.studentCode || '').toLowerCase();
        const email = (en.student?.email || '').toLowerCase();
        const phone = (en.student?.phone || '').toLowerCase();
        return name.includes(q) || code.includes(q) || email.includes(q) || phone.includes(q);
      });
    }
    if (studentFilter === 'HIGH') {
      list = list.filter((en) => (Number(en.attendance?.percent) || 0) >= 90);
    } else if (studentFilter === 'LOW') {
      list = list.filter((en) => Boolean(en.attendance?.low) || (Number(en.attendance?.percent) || 0) < 75);
    }
    return list;
  }, [enrollmentsAll, studentSearch, studentFilter]);

  // Sessions filtered by window status
  const filteredSessions = useMemo(() => {
    if (sessionFilter === 'OPEN') {
      return sortedSessions.filter((s) => {
        const st = String(s.window?.state || s.status || '').toUpperCase();
        return st.includes('OPEN') || st === 'LIVE';
      });
    }
    if (sessionFilter === 'COMPLETED') {
      return sortedSessions.filter((s) => {
        const st = String(s.window?.state || s.status || '').toUpperCase();
        return st.includes('LOCKED') || st.includes('COMPLETE') || new Date(s.startAt).getTime() < Date.now();
      });
    }
    if (sessionFilter === 'UPCOMING') {
      return sortedSessions.filter((s) => new Date(s.startAt).getTime() >= Date.now());
    }
    return sortedSessions;
  }, [sortedSessions, sessionFilter]);

  const highAttendanceCount = useMemo(
    () => enrollmentsAll.filter((en) => (Number(en.attendance?.percent) || 0) >= 90).length,
    [enrollmentsAll],
  );

  const atRiskCount = useMemo(
    () => enrollmentsAll.filter((en) => Boolean(en.attendance?.low) || (Number(en.attendance?.percent) || 0) < 75).length,
    [enrollmentsAll],
  );

  const statItems = useMemo(
    () => buildBatchDetailSummaryItems(summary || {}, {
      slotCount: slots.length,
      sessionCount: sessions?.length || 0,
    }),
    [summary, slots.length, sessions],
  );

  const faculty = instructorName(batch?.instructor);

  const exportRosterCSV = () => {
    const headers = ['Student ID,Student Name,Code,Email,Phone,Course,Batch,Attendance %,Present,Absent,Status\n'];
    const lines = filteredEnrollments.map((en) => {
      const s = en.student || {};
      const att = en.attendance || {};
      return `"${s.id || ''}","${s.firstName || ''} ${s.lastName || ''}","${s.studentCode || ''}","${s.email || ''}","${s.phone || ''}","${batch?.courseName || ''}","${batch?.name || ''}",${att.percent ?? 100}%,${att.present || 0},${att.absent || 0},"Enrolled"`;
    });
    const blob = new Blob([headers.concat(lines.join('\n'))], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${batch?.name?.replace(/\s+/g, '_')}_Roster_${isoDate(0)}.csv`;
    a.click();
    toastService.success('Student roster CSV exported');
  };

  if (isLoading) return <ContentLoader variant="module" />;
  if (!batch) {
    return (
      <div className="p-8 text-center text-text-muted">
        Batch not found.
        <Button variant="outline" className="mt-4" onClick={() => navigate(ROUTES.BATCHES)}>
          Back to batches
        </Button>
      </div>
    );
  }

  return (
    <ModulePageCard
      title={batch.name}
      subtitle={`${batch.courseName} · ${batch.branch?.name || 'Head Office'} · ${batch.code || ''}${faculty ? ` · Faculty: ${faculty}` : ''}${batch.room ? ` · ${batch.room}` : ''}`}
      icon={FiUsers}
      iconColor="primary"
      breadcrumbs={[
        { label: 'Dashboard', path: ROUTES.DASHBOARD },
        { label: 'Batches', path: ROUTES.BATCHES },
        { label: batch.name },
      ]}
      actions={(
        <div className="flex items-center gap-2 flex-wrap">
          {upcomingSession && canMark && (
            <Button
              size="sm"
              icon={FiCalendar}
              onClick={() => navigate(ROUTES.SESSION_ATTENDANCE(upcomingSession.id))}
              className="bg-primary-600 hover:bg-primary-700 text-white font-semibold shadow-xs"
            >
              Take attendance
            </Button>
          )}
          {canManage && (
            <Button
              size="sm"
              variant="outline"
              icon={FiPlus}
              onClick={() => setEnrollModalOpen(true)}
            >
              Enroll student
            </Button>
          )}
          <Button size="sm" variant="outline" icon={FiRefreshCw} onClick={() => { refetch(); refetchSessions(); }}>
            Refresh
          </Button>
          <Button size="sm" variant="outline" icon={FiArrowLeft} onClick={() => navigate(ROUTES.BATCHES)}>
            Back
          </Button>
        </div>
      )}
    >
      {/* ── Batch KPI Summary Strip ── */}
      <ModulePageCard.Stats
        items={statItems}
        activeFilter={studentFilter === 'LOW' ? 'atRisk' : null}
        onSelect={(v) => {
          if (v === 'atRisk') {
            setActiveTab('students');
            setStudentFilter('LOW');
          } else if (v === 'students') {
            setActiveTab('students');
            setStudentFilter('ALL');
          } else if (v === 'sessions') {
            setActiveTab('sessions');
          } else if (v === 'slots') {
            setActiveTab('timetable');
          }
        }}
        ariaLabel="Batch KPIs"
        layout="grid"
      />

      <ModulePageCard.Table scroll="page">
        <div className="p-2.5 sm:p-3.5 flex flex-col gap-2.5">
          {/* ── Segmented Navigation Tabs Bar ── */}
          <div className="crm-tstudents-toolbar flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                className={`crm-tstudents-filter-btn flex items-center gap-1.5 text-xs font-semibold ${activeTab === 'students' ? 'is-active' : ''}`}
                onClick={() => setActiveTab('students')}
              >
                <FiUsers size={14} />
                <span>Enrolled Students</span>
                <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-slate-200/80 text-slate-700 dark:bg-slate-700 dark:text-slate-200 ml-0.5">
                  {enrollmentsAll.length}
                </span>
              </button>

              <button
                type="button"
                className={`crm-tstudents-filter-btn flex items-center gap-1.5 text-xs font-semibold ${activeTab === 'sessions' ? 'is-active' : ''}`}
                onClick={() => setActiveTab('sessions')}
              >
                <FiCalendar size={14} />
                <span>Class Sessions</span>
                <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-slate-200/80 text-slate-700 dark:bg-slate-700 dark:text-slate-200 ml-0.5">
                  {sortedSessions.length}
                </span>
              </button>

              <button
                type="button"
                className={`crm-tstudents-filter-btn flex items-center gap-1.5 text-xs font-semibold ${activeTab === 'timetable' ? 'is-active' : ''}`}
                onClick={() => setActiveTab('timetable')}
              >
                <FiClock size={14} />
                <span>Weekly Timetable</span>
                <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-slate-200/80 text-slate-700 dark:bg-slate-700 dark:text-slate-200 ml-0.5">
                  {slots.length}
                </span>
              </button>

              {canManage && (
                <button
                  type="button"
                  className={`crm-tstudents-filter-btn flex items-center gap-1.5 text-xs font-semibold ${activeTab === 'settings' ? 'is-active' : ''}`}
                  onClick={() => setActiveTab('settings')}
                >
                  <FiSettings size={14} />
                  <span>Faculty &amp; Settings</span>
                </button>
              )}
            </div>

            {/* Quick Actions in Header */}
            <div className="flex items-center gap-2 ml-auto">
              {activeTab === 'students' && (
                <div className="crm-tstudents-view-toggle">
                  <button
                    type="button"
                    className={`crm-tstudents-toggle-btn ${viewMode === 'grid' ? 'is-active' : ''}`}
                    onClick={() => setViewMode('grid')}
                    title="Cards Grid View"
                  >
                    <FiGrid />
                  </button>
                  <button
                    type="button"
                    className={`crm-tstudents-toggle-btn ${viewMode === 'table' ? 'is-active' : ''}`}
                    onClick={() => setViewMode('table')}
                    title="Table View"
                  >
                    <FiList />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* ══════════════════════════════════════════════════════════════════
              TAB 1: ENROLLED STUDENTS (Clean Cards & Compact Table View)
             ══════════════════════════════════════════════════════════════════ */}
          {activeTab === 'students' && (
            <div className="flex flex-col gap-3">
              {/* Toolbar */}
              <div className="crm-tstudents-toolbar flex flex-wrap items-center justify-between gap-2.5">
                <div className="flex flex-wrap items-center gap-2 flex-1 min-w-0">
                  <div className="crm-tstudents-search-box">
                    <FiSearch />
                    <input
                      type="text"
                      className="crm-tstudents-search-input"
                      placeholder="Search students by name, ID, phone..."
                      value={studentSearch}
                      onChange={(e) => setStudentSearch(e.target.value)}
                    />
                    {studentSearch && (
                      <button
                        type="button"
                        className="text-slate-400 hover:text-slate-600 cursor-pointer"
                        onClick={() => setStudentSearch('')}
                      >
                        <FiX size={14} />
                      </button>
                    )}
                  </div>

                  <div className="crm-tstudents-filter-group">
                    <button
                      type="button"
                      className={`crm-tstudents-filter-btn ${studentFilter === 'ALL' ? 'is-active' : ''}`}
                      onClick={() => setStudentFilter('ALL')}
                    >
                      All Students ({enrollmentsAll.length})
                    </button>
                    <button
                      type="button"
                      className={`crm-tstudents-filter-btn ${studentFilter === 'HIGH' ? 'is-active' : ''}`}
                      onClick={() => setStudentFilter('HIGH')}
                    >
                      High Attendance ≥90% ({highAttendanceCount})
                    </button>
                    <button
                      type="button"
                      className={`crm-tstudents-filter-btn ${studentFilter === 'LOW' ? 'is-active' : ''}`}
                      onClick={() => setStudentFilter('LOW')}
                    >
                      At-Risk &lt;75% ({atRiskCount})
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-2 ml-auto">
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex items-center gap-1.5 shadow-xs font-semibold"
                    icon={FiDownload}
                    onClick={exportRosterCSV}
                    title="Export CSV"
                  >
                    Export CSV
                  </Button>
                  {canManage && (
                    <Button
                      size="sm"
                      variant="primary"
                      className="flex items-center gap-1.5 shadow-xs font-bold"
                      icon={FiPlus}
                      onClick={() => setEnrollModalOpen(true)}
                    >
                      Enroll Student
                    </Button>
                  )}
                </div>
              </div>

              {/* Students Content */}
              {!filteredEnrollments.length ? (
                <EmptyState
                  title={studentSearch ? 'No matching students found' : 'No students enrolled yet'}
                  description={studentSearch
                    ? 'Try clearing the search query or changing filters.'
                    : 'Click "+ Enroll Student" above to add learners to this batch.'}
                  action={
                    studentSearch || studentFilter !== 'ALL' ? (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setStudentSearch('');
                          setStudentFilter('ALL');
                        }}
                      >
                        Reset Filters
                      </Button>
                    ) : null
                  }
                />
              ) : viewMode === 'grid' ? (
                /* ── Card Grid View: 4-Column Layout (Matching User Preference) ── */
                <div className="crm-tstudents-grid">
                  {filteredEnrollments.map((en) => {
                    const st = en.student || {};
                    const fullName = `${st.firstName || ''} ${st.lastName || ''}`.trim() || 'Student';
                    const att = en.attendance || { percent: 100, present: 5, absent: 0 };
                    const isLow = Boolean(att.low) || (Number(att.percent) || 0) < 75;

                    return (
                      <article key={en.id || en.studentId || st.id} className="crm-tstudent-card">
                        <div>
                          {/* Head */}
                          <div className="crm-tstudent-card__head">
                            <div className="crm-tstudent-card__identity">
                              <Avatar
                                name={fullName}
                                src={st.avatar || st.avatarUrl || ''}
                                size="md"
                              />
                              <div className="crm-tstudent-card__name-block">
                                <h3 className="crm-tstudent-card__name" title={fullName}>{fullName}</h3>
                                <span className="crm-tstudent-card__code">{st.studentCode || 'MAIN-STU'}</span>
                              </div>
                            </div>

                            <span className="crm-tstudent-card__status-badge">
                              ● Enrolled
                            </span>
                          </div>

                          {/* Body */}
                          <div className="crm-tstudent-card__body">
                            {/* Course & Batch info */}
                            <div className="crm-tstudent-card__batch-box">
                              <span className="crm-tstudent-card__batch-name">
                                <FiLayers className="text-blue-600" />
                                {batch.name}
                              </span>
                              <span className="crm-tstudent-card__course-pill">
                                {batch.courseName || 'Course'}
                              </span>
                            </div>

                            {/* Contacts */}
                            <div className="crm-tstudent-card__contacts">
                              {st.email && (
                                <a href={`mailto:${st.email}`} className="crm-tstudent-card__contact-link" title={st.email}>
                                  <FiMail /> {st.email}
                                </a>
                              )}
                              {st.phone && (
                                <a href={`tel:${st.phone}`} className="crm-tstudent-card__contact-link" title={st.phone}>
                                  <FiPhone /> {st.phone}
                                </a>
                              )}
                            </div>

                            {/* Attendance Progress Meter */}
                            <div className="crm-tstudent-card__att-wrap">
                              <div className="crm-tstudent-card__att-top">
                                <span className="text-slate-600 font-semibold text-xs">Attendance Log</span>
                                <span className={`crm-tstudent-card__att-val ${isLow ? 'is-low' : ''}`}>
                                  {att.percent ?? 100}% ({att.present ?? 0}P / {att.absent ?? 0}A)
                                </span>
                              </div>
                              <div className="crm-tstudent-card__att-bar">
                                <div
                                  className={`crm-tstudent-card__att-fill ${isLow ? 'is-low' : ''}`}
                                  style={{ width: `${Math.min(100, Math.max(0, Number(att.percent) || 0))}%` }}
                                />
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Foot Actions */}
                        <div className="crm-tstudent-card__foot">
                          <div className="flex items-center gap-2">
                            <Button
                              size="xs"
                              variant="outline"
                              className="flex items-center gap-1.5 px-3 py-1.5 font-semibold text-xs whitespace-nowrap shadow-xs rounded-lg"
                              onClick={() => setInspectStudent(en)}
                            >
                              <FiEye size={13} /> Inspect
                            </Button>
                            <Button
                              size="xs"
                              variant="primary"
                              className="flex items-center gap-1.5 px-3.5 py-1.5 font-semibold text-xs whitespace-nowrap shadow-xs rounded-lg"
                              onClick={() => navigate(canManage ? ROUTES.STUDENT_DETAIL(st.id || en.studentId) : ROUTES.TEACHER_STUDENT(st.id || en.studentId))}
                            >
                              <FiExternalLink size={13} /> Profile
                            </Button>
                          </div>

                          <div className="flex items-center gap-2">
                            {st.email && (
                              <a
                                href={`mailto:${st.email}`}
                                className="w-7 h-7 rounded-full bg-slate-100 hover:bg-blue-100 hover:text-blue-600 flex items-center justify-center text-slate-600 transition-colors"
                                title="Send Email"
                              >
                                <FiMail size={13} />
                              </a>
                            )}
                            {st.phone && (
                              <a
                                href={`tel:${st.phone}`}
                                className="w-7 h-7 rounded-full bg-slate-100 hover:bg-emerald-100 hover:text-emerald-600 flex items-center justify-center text-slate-600 transition-colors"
                                title="Call Phone"
                              >
                                <FiPhone size={13} />
                              </a>
                            )}
                            {canManage && (
                              <button
                                type="button"
                                className="w-7 h-7 rounded-full bg-slate-100 hover:bg-rose-100 hover:text-rose-600 flex items-center justify-center text-slate-400 transition-colors cursor-pointer"
                                title="Unenroll student"
                                onClick={() => removeStudent(en.studentId)}
                              >
                                <FiTrash2 size={13} />
                              </button>
                            )}
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>
              ) : (
                /* ── Table View: Crisp Structured Table (Zero Voids) ── */
                <div className="overflow-x-auto rounded-xl border border-border bg-bg-card">
                  <table className="crm-tstudents-table">
                    <thead>
                      <tr>
                        <th>Student Particulars</th>
                        <th>Course &amp; Batch</th>
                        <th>Contact Details</th>
                        <th>Attendance Track Record</th>
                        <th>Status</th>
                        <th style={{ textAlign: 'right' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredEnrollments.map((en) => {
                        const st = en.student || {};
                        const fullName = `${st.firstName || ''} ${st.lastName || ''}`.trim() || 'Student';
                        const att = en.attendance || { percent: 100, present: 5, absent: 0 };
                        const isLow = Boolean(att.low) || (Number(att.percent) || 0) < 75;

                        return (
                          <tr key={en.id || en.studentId || st.id}>
                            <td>
                              <div className="flex items-center gap-2.5">
                                <Avatar name={fullName} size="sm" />
                                <div>
                                  <button
                                    type="button"
                                    onClick={() => setInspectStudent(en)}
                                    className="text-slate-900 dark:text-slate-100 block font-bold text-xs text-left hover:text-brand transition-colors"
                                  >
                                    {fullName}
                                  </button>
                                  <span className="font-mono text-[11px] text-slate-500">{st.studentCode || 'MAIN-STU'}</span>
                                </div>
                              </div>
                            </td>
                            <td>
                              <strong className="text-slate-800 dark:text-slate-200 block text-xs font-semibold">{batch.name}</strong>
                              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10.5px] font-bold bg-blue-100 text-blue-800 dark:bg-blue-950/40 dark:text-blue-300 mt-0.5">
                                {batch.courseName || 'Course'}
                              </span>
                            </td>
                            <td>
                              <div className="flex flex-col text-xs text-slate-600 dark:text-slate-400">
                                <span>{st.email || '—'}</span>
                                <span className="font-mono text-[11px] text-slate-500">{st.phone || '—'}</span>
                              </div>
                            </td>
                            <td>
                              <div className="flex items-center gap-2">
                                <span className={`font-bold text-xs ${isLow ? 'text-red-600' : 'text-emerald-700 dark:text-emerald-400'}`}>
                                  {att.percent ?? 100}%
                                </span>
                                <span className="text-[11px] text-slate-500">
                                  ({att.present ?? 0}P / {att.absent ?? 0}A)
                                </span>
                              </div>
                              <div className="w-24 bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden mt-1">
                                <div
                                  className={`h-full rounded-full ${isLow ? 'bg-red-500' : 'bg-emerald-500'}`}
                                  style={{ width: `${Math.min(100, Math.max(0, Number(att.percent) || 0))}%` }}
                                />
                              </div>
                            </td>
                            <td>
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300">
                                ● Enrolled
                              </span>
                            </td>
                            <td style={{ textAlign: 'right' }}>
                              <div className="inline-flex items-center gap-1.5">
                                <Button
                                  size="xs"
                                  variant="outline"
                                  className="px-2.5 py-1 text-xs font-semibold rounded-lg"
                                  onClick={() => setInspectStudent(en)}
                                >
                                  Inspect
                                </Button>
                                <Button
                                  size="xs"
                                  variant="primary"
                                  className="px-2.5 py-1 text-xs font-semibold rounded-lg"
                                  onClick={() => navigate(canManage ? ROUTES.STUDENT_DETAIL(st.id || en.studentId) : ROUTES.TEACHER_STUDENT(st.id || en.studentId))}
                                >
                                  Profile
                                </Button>
                                {canManage && (
                                  <button
                                    type="button"
                                    className="p-1.5 text-slate-400 hover:text-rose-600 rounded-md transition-colors"
                                    onClick={() => removeStudent(en.studentId)}
                                    title="Unenroll"
                                  >
                                    <FiTrash2 size={13} />
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════════
              TAB 2: CLASS SESSIONS & ATTENDANCE
             ══════════════════════════════════════════════════════════════════ */}
          {activeTab === 'sessions' && (
            <div className="flex flex-col gap-2.5">
              {/* Upcoming Session Banner */}
              {upcomingSession && (
                <div className="crm-batch-next-banner">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-brand/10 text-brand flex items-center justify-center shrink-0">
                      <FiCalendar className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[11px] font-bold text-brand uppercase tracking-wider">Next Class Scheduled</span>
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      </div>
                      <p className="text-xs font-semibold text-text truncate">
                        {new Date(upcomingSession.startAt).toLocaleDateString('en-IN', {
                          weekday: 'long',
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })} at {new Date(upcomingSession.startAt).toLocaleTimeString('en-IN', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                        {batch.room ? ` · ${batch.room}` : ''}
                      </p>
                    </div>
                  </div>

                  {canMark && (
                    <Button
                      size="xs"
                      variant="primary"
                      icon={FiCheckCircle}
                      onClick={() => navigate(ROUTES.SESSION_ATTENDANCE(upcomingSession.id))}
                      className="whitespace-nowrap font-bold shadow-2xs py-1"
                    >
                      Take Attendance Now
                    </Button>
                  )}
                </div>
              )}

              {/* Sessions Toolbar */}
              <div className="crm-tstudents-toolbar flex flex-wrap items-center justify-between gap-2">
                <div className="crm-tstudents-filter-group">
                  <button
                    type="button"
                    className={`crm-tstudents-filter-btn flex items-center gap-1 ${sessionFilter === 'ALL' ? 'is-active' : ''}`}
                    onClick={() => setSessionFilter('ALL')}
                  >
                    <span>All Sessions</span>
                    <span className="px-1.5 py-0.2 rounded-full text-[9.5px] font-bold bg-slate-200/80 text-slate-700 dark:bg-slate-700 dark:text-slate-200">
                      {sortedSessions.length}
                    </span>
                  </button>
                  <button
                    type="button"
                    className={`crm-tstudents-filter-btn flex items-center gap-1 ${sessionFilter === 'OPEN' ? 'is-active' : ''}`}
                    onClick={() => setSessionFilter('OPEN')}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    <span>Marking Open</span>
                  </button>
                  <button
                    type="button"
                    className={`crm-tstudents-filter-btn ${sessionFilter === 'COMPLETED' ? 'is-active' : ''}`}
                    onClick={() => setSessionFilter('COMPLETED')}
                  >
                    Past &amp; Completed
                  </button>
                  <button
                    type="button"
                    className={`crm-tstudents-filter-btn ${sessionFilter === 'UPCOMING' ? 'is-active' : ''}`}
                    onClick={() => setSessionFilter('UPCOMING')}
                  >
                    Upcoming
                  </button>
                </div>

                {canManage && (
                  <Button
                    size="xs"
                    variant="outline"
                    icon={FiCalendar}
                    loading={generating}
                    onClick={generateWeek}
                    className="ml-auto font-semibold py-1"
                  >
                    Generate Next 14 Days
                  </Button>
                )}
              </div>

              {/* Sessions Table (Crisp SaaS Table) */}
              <div className="overflow-x-auto rounded-lg border border-border bg-card-bg shadow-2xs">
                <table className="crm-tstudents-table">
                  <thead>
                    <tr>
                      <th style={{ width: '32%' }}>Session Date</th>
                      <th style={{ width: '18%' }}>Class Time</th>
                      <th style={{ width: '22%' }}>Window Status</th>
                      <th style={{ width: '16%' }}>Room / Venue</th>
                      <th style={{ textAlign: 'right', width: '12%' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredSessions.map((s) => {
                      const d = new Date(s.startAt);
                      const isToday = new Date().toDateString() === d.toDateString();
                      const state = String(s.window?.state || s.status || 'Scheduled').toUpperCase();
                      const isOpen = state.includes('OPEN') || state === 'LIVE';

                      return (
                        <tr key={s.id}>
                          <td>
                            <div className="flex items-center gap-2">
                              <div className="flex flex-col items-center justify-center w-8 h-8 rounded-md bg-slate-100 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 shrink-0">
                                <span className="text-[8.5px] font-bold uppercase text-slate-500 leading-none">
                                  {d.toLocaleDateString('en-IN', { month: 'short' })}
                                </span>
                                <span className="text-[11px] font-extrabold text-slate-800 dark:text-slate-100 leading-none mt-0.5">
                                  {d.toLocaleDateString('en-IN', { day: '2-digit' })}
                                </span>
                              </div>
                              <div className="min-w-0">
                                <div className="flex items-center gap-1.5">
                                  <span className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate">
                                    {d.toLocaleDateString('en-IN', { weekday: 'short' })}, {d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                  </span>
                                  {isToday && (
                                    <span className="px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300">
                                      Today
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td>
                            <div className="flex items-center gap-1 text-xs font-medium text-slate-700 dark:text-slate-300 tabular-nums">
                              <FiClock className="w-3 h-3 text-slate-400" />
                              <span>{d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                          </td>
                          <td>
                            {isOpen ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                Marking Open
                              </span>
                            ) : state.includes('LOCKED') ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border border-slate-200/80">
                                Locked
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-200">
                                Upcoming
                              </span>
                            )}
                          </td>
                          <td>
                            <div className="flex items-center gap-1 text-xs font-medium text-slate-600 dark:text-slate-400 truncate">
                              <FiMapPin className="w-3 h-3 text-slate-400 shrink-0" />
                              <span className="truncate">{s.room || batch.room || 'Batch Room'}</span>
                            </div>
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            <Button
                              size="xs"
                              variant={isOpen ? 'primary' : 'outline'}
                              className={`px-2.5 py-0.5 font-semibold text-xs whitespace-nowrap rounded-md ${isOpen ? 'shadow-2xs font-bold' : 'text-slate-700 hover:text-brand'}`}
                              onClick={() => navigate(ROUTES.SESSION_ATTENDANCE(s.id))}
                            >
                              {isOpen ? (
                                <>
                                  <FiCheckCircle className="w-3 h-3 mr-1" /> Take Attendance
                                </>
                              ) : (
                                <>
                                  <FiEye className="w-3 h-3 mr-1" /> View Attendance
                                </>
                              )}
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════════
              TAB 3: WEEKLY TIMETABLE & RECURRING SLOTS
             ══════════════════════════════════════════════════════════════════ */}
          {activeTab === 'timetable' && (
            <div className="flex flex-col gap-2.5">
              {/* 7-Day Visual Timetable Cards */}
              <div className="crm-batch-timetable-cards">
                {[1, 2, 3, 4, 5, 6, 0].map((dayNum) => {
                  const daySlots = slots.filter((s) => s.dayOfWeek === dayNum);
                  const isScheduled = daySlots.length > 0;
                  const dayLabel = BATCH_WEEKDAYS[dayNum];

                  return (
                    <div
                      key={dayNum}
                      className={`crm-batch-day-card ${isScheduled ? 'crm-batch-day-card--active' : 'crm-batch-day-card--empty'}`}
                    >
                      <div className="crm-batch-day-card__header">
                        <span className="crm-batch-day-card__name">{dayLabel}</span>
                        {isScheduled && (
                          <span className="inline-flex items-center px-1.5 py-0.2 rounded-full text-[9.5px] font-bold bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300">
                            Active
                          </span>
                        )}
                      </div>

                      <div className="flex-1 flex flex-col justify-center">
                        {isScheduled ? (
                          <div className="space-y-1">
                            {daySlots.map((sl) => (
                              <div
                                key={sl.id}
                                className="p-1.5 rounded-md bg-card-bg border border-border/80 shadow-2xs"
                              >
                                <div className="flex items-center gap-1 text-[11.5px] font-bold text-brand tabular-nums">
                                  <FiClock className="w-3 h-3 text-brand shrink-0" />
                                  <span>{sl.startTime} – {sl.endTime}</span>
                                </div>
                                <div className="text-[10px] text-text-muted mt-0.5 truncate flex items-center gap-1">
                                  <FiMapPin className="w-2.5 h-2.5 text-slate-400 shrink-0" />
                                  <span>{batch.room || 'Batch Room'}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-2.5 text-[11px] text-text-muted/60 font-medium">
                            No slots
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Slot Management & Session Generation (if canManage) */}
              {canManage && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                  <div className="crm-batch-panel">
                    <div className="crm-batch-panel__head">
                      <h3 className="crm-batch-panel__title">Add Recurring Timetable Slot</h3>
                      <p className="crm-batch-panel__desc">Create a regular class schedule for this batch.</p>
                    </div>
                    <div className="crm-batch-panel__body">
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <Select
                          label="Day of Week"
                          value={dayOfWeek}
                          onChange={(e) => setDayOfWeek(e.target.value)}
                          options={dayOptions}
                          allowClear={false}
                        />
                        <Input
                          label="Start Time"
                          type="time"
                          value={startTime}
                          onChange={(e) => setStartTime(e.target.value)}
                        />
                        <Input
                          label="End Time"
                          type="time"
                          value={endTime}
                          onChange={(e) => setEndTime(e.target.value)}
                        />
                      </div>
                      <div className="mt-4 flex justify-end">
                        <Button
                          size="sm"
                          variant="primary"
                          icon={FiPlus}
                          loading={addingSlot}
                          onClick={saveSlot}
                        >
                          Add Slot to Timetable
                        </Button>
                      </div>
                    </div>
                  </div>

                  <div className="crm-batch-panel">
                    <div className="crm-batch-panel__head">
                      <h3 className="crm-batch-panel__title">Project Class Sessions</h3>
                      <p className="crm-batch-panel__desc">Generate future classes based on weekly timetable.</p>
                    </div>
                    <div className="crm-batch-panel__body flex flex-col justify-between">
                      <p className="text-xs text-text-muted leading-relaxed">
                        Automatic session generation evaluates active timetable slots and creates calendar classes for the upcoming 14 days. Teachers can then take attendance for each generated session.
                      </p>
                      <div className="mt-4 flex items-center justify-between">
                        <span className="text-xs text-slate-500 font-medium">14-Day Calendar Projection</span>
                        <Button
                          size="sm"
                          variant="outline"
                          icon={FiCalendar}
                          loading={generating}
                          onClick={generateWeek}
                        >
                          Generate Next 14 Days
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════════
              TAB 4: FACULTY & BATCH SETTINGS
             ══════════════════════════════════════════════════════════════════ */}
          {activeTab === 'settings' && canManage && (
            <div className="crm-batch-tab-pane">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Faculty Assignment Card */}
                <div className="crm-batch-panel">
                  <div className="crm-batch-panel__head">
                    <h3 className="crm-batch-panel__title">Assigned Faculty / Instructor</h3>
                    <p className="crm-batch-panel__desc">
                      Assigning a teacher grants them access to view this batch and conduct class attendance.
                    </p>
                  </div>
                  <div className="crm-batch-panel__body space-y-4">
                    <Select
                      label="Select Instructor"
                      value={instructorId}
                      onChange={(e) => setInstructorId(e.target.value)}
                      options={teacherOptions}
                      placeholder="Select teacher"
                      allowClear={false}
                    />
                    <div className="flex items-center justify-between pt-2">
                      <span className="text-xs text-text-muted">
                        Current: <strong className="text-text">{faculty || 'None'}</strong>
                      </span>
                      <Button
                        size="sm"
                        variant="primary"
                        icon={FiUserCheck}
                        onClick={saveInstructor}
                        loading={assigning}
                      >
                        Save Assignment
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Batch Specifications Card */}
                <div className="crm-batch-panel">
                  <div className="crm-batch-panel__head">
                    <h3 className="crm-batch-panel__title">Batch Particulars</h3>
                    <p className="crm-batch-panel__desc">Basic configuration and administrative metadata.</p>
                  </div>
                  <div className="crm-batch-panel__body">
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div className="p-2.5 rounded-lg border border-border bg-bg-page/50">
                        <span className="text-text-muted block text-[11px]">Batch Code</span>
                        <span className="font-bold text-text mt-0.5 block">{batch.code || '—'}</span>
                      </div>
                      <div className="p-2.5 rounded-lg border border-border bg-bg-page/50">
                        <span className="text-text-muted block text-[11px]">Course Name</span>
                        <span className="font-bold text-text mt-0.5 block">{batch.courseName || '—'}</span>
                      </div>
                      <div className="p-2.5 rounded-lg border border-border bg-bg-page/50">
                        <span className="text-text-muted block text-[11px]">Assigned Room</span>
                        <span className="font-bold text-text mt-0.5 block">{batch.room || '—'}</span>
                      </div>
                      <div className="p-2.5 rounded-lg border border-border bg-bg-page/50">
                        <span className="text-text-muted block text-[11px]">Campus Branch</span>
                        <span className="font-bold text-text mt-0.5 block">{batch.branch?.name || 'Head Office'}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </ModulePageCard.Table>

      {/* ══════════════════════════════════════════════════════════════════
          MODAL 1: STUDENT ACADEMIC PROFILE (Quick Inspect Modal)
         ══════════════════════════════════════════════════════════════════ */}
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
                  navigate(canManage ? ROUTES.STUDENT_DETAIL(sid) : ROUTES.TEACHER_STUDENT(sid));
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
                      {batch.room || 'Room 2'}
                    </span>
                    <span>•</span>
                    <span>{batch.branch?.name || 'Head Office Campus'}</span>
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

      {/* ══════════════════════════════════════════════════════════════════
          MODAL 2: ENROLL STUDENT MODAL
         ══════════════════════════════════════════════════════════════════ */}
      {enrollModalOpen && (
        <Modal
          open={enrollModalOpen}
          onClose={() => setEnrollModalOpen(false)}
          title="Enroll Student"
          subtitle={`Add a registered learner to ${batch.name}`}
          size="md"
        >
          <div className="space-y-4">
            <div className="relative">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted w-4 h-4 pointer-events-none" />
              <input
                type="text"
                className="w-full pl-9 pr-4 py-2 text-sm bg-bg-card border border-border rounded-lg text-text focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand"
                placeholder="Search registered students by name, email or code..."
                value={enrollSearch}
                onChange={(e) => searchGlobalStudents(e.target.value)}
                autoFocus
              />
            </div>

            <div className="max-h-72 overflow-y-auto space-y-2">
              {enrollResults.length > 0 ? (
                enrollResults.map((s) => {
                  const isEnrolled = enrollmentsAll.some((e) => (e.studentId || e.student?.id) === s.id);
                  const sName = `${s.firstName || ''} ${s.lastName || ''}`.trim() || 'Student';
                  return (
                    <div
                      key={s.id}
                      className="p-3 rounded-lg border border-border bg-bg-card flex items-center justify-between hover:bg-bg-page transition-colors"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <Avatar name={sName} size="sm" />
                        <div className="min-w-0">
                          <span className="text-xs font-bold text-text block truncate">{sName}</span>
                          <span className="text-[10px] text-text-muted font-mono block">
                            {s.studentCode} {s.email ? `· ${s.email}` : ''}
                          </span>
                        </div>
                      </div>

                      {isEnrolled ? (
                        <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md">
                          Enrolled
                        </span>
                      ) : (
                        <Button
                          size="xs"
                          variant="primary"
                          icon={FiPlus}
                          loading={enrollingId === s.id}
                          onClick={() => handleEnrollStudent(s.id)}
                        >
                          Enroll
                        </Button>
                      )}
                    </div>
                  );
                })
              ) : enrollSearch.length >= 2 ? (
                <div className="py-8 text-center text-xs text-text-muted">
                  No matching students found for "{enrollSearch}".
                </div>
              ) : (
                <div className="py-8 text-center text-xs text-text-muted">
                  Type at least 2 characters to search students across the CRM.
                </div>
              )}
            </div>
          </div>
        </Modal>
      )}
    </ModulePageCard>
  );
}
