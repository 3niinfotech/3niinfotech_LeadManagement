import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  FiUsers,
  FiBookOpen,
  FiCalendar,
  FiClock,
  FiMapPin,
  FiCheckCircle,
  FiCheck,
  FiArrowRight,
  FiExternalLink,
  FiSearch,
  FiFilter,
  FiList,
  FiGrid,
  FiFileText,
  FiUploadCloud,
  FiAward,
  FiTrendingUp,
  FiActivity,
  FiRefreshCw,
  FiChevronRight,
  FiChevronDown,
  FiUserCheck,
  FiLayers,
  FiBook,
} from 'react-icons/fi';
import ModulePageCard from '../../../components/layout/ModulePageLayout';
import Button from '../../../components/ui/Button';
import Avatar from '../../../components/ui/Avatar';
import SummaryStatBar from '../../../components/ui/SummaryStatBar';
import ContentLoader from '../../../components/ui/ContentLoader';
import EmptyState from '../../../components/ui/EmptyState';
import { useGetBatchesQuery } from '../redux/attendanceApiSlice';
import { apiGet } from '../../../api/apiClient';
import { API } from '../../../config/api';
import { ROUTES } from '../../../config/routes';
import { selectUser } from '../../../redux/slices/authSlice';
import { usePermissions } from '../../../hooks/usePermissions';
import { PERMISSIONS } from '../../../config/permissions';
import toastService from '../../../services/toast/toast.service';
import '../styles/teacher-classes.css';

export default function TeacherClassesPage() {
  const navigate = useNavigate();
  const user = useSelector(selectUser);
  const { can } = usePermissions();

  const { data: batchesData, isLoading, refetch: refetchBatches } = useGetBatchesQuery();
  const batches = batchesData?.data || [];

  const [dashboardData, setDashboardData] = useState(null);
  const [loadingDashboard, setLoadingDashboard] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCourse, setSelectedCourse] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'table'
  const [selectedBatchForRoster, setSelectedBatchForRoster] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Fetch teacher dashboard metrics for real-time lecture schedule & enrollments
  const loadTeacherDashboard = useCallback(async () => {
    try {
      const res = await apiGet(API.ACADEMIC_TEACHER_DASHBOARD);
      if (res?.data) {
        setDashboardData(res.data);
      }
    } catch (err) {
      // Fallback gracefully to batch data
      setDashboardData(null);
    } finally {
      setLoadingDashboard(false);
    }
  }, []);

  useEffect(() => {
    loadTeacherDashboard();
  }, [loadTeacherDashboard]);

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    await Promise.allSettled([refetchBatches(), loadTeacherDashboard()]);
    setIsRefreshing(false);
    toastService.success('Classes and lecture schedules refreshed');
  };

  // Distinct courses for filter pills
  const courseOptions = useMemo(() => {
    const set = new Set();
    batches.forEach((b) => {
      if (b.courseName) set.add(b.courseName);
    });
    return Array.from(set);
  }, [batches]);

  // Filtered batches
  const filteredBatches = useMemo(() => {
    return batches.filter((b) => {
      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        (b.name && b.name.toLowerCase().includes(q)) ||
        (b.code && b.code.toLowerCase().includes(q)) ||
        (b.courseName && b.courseName.toLowerCase().includes(q)) ||
        (b.room && b.room.toLowerCase().includes(q));

      const matchCourse = selectedCourse === 'ALL' || b.courseName === selectedCourse;
      const matchStatus =
        selectedStatus === 'ALL' ||
        (selectedStatus === 'ACTIVE' && b.isActive) ||
        (selectedStatus === 'INACTIVE' && !b.isActive);

      return matchSearch && matchCourse && matchStatus;
    });
  }, [batches, searchQuery, selectedCourse, selectedStatus]);

  // Aggregate metrics
  const totalStudents = useMemo(() => {
    return batches.reduce((sum, b) => sum + (b._count?.enrollments ?? b.enrollments?.length ?? 0), 0);
  }, [batches]);

  const activeBatchesCount = useMemo(() => {
    return batches.filter((b) => b.isActive).length;
  }, [batches]);

  // Real students roster from batches or dashboard
  const enrolledStudents = useMemo(() => {
    const fromBatches = batches.flatMap((b) =>
      (b.enrollments || []).map((e) => ({
        id: e.student?.id || e.id,
        name: `${e.student?.firstName || ''} ${e.student?.lastName || ''}`.trim() || 'Enrolled Student',
        code: e.student?.studentCode || '—',
        batchName: b.name,
        status: e.student?.status || 'Active',
      }))
    );
    if (fromBatches.length > 0) return fromBatches;
    if (dashboardData?.enrollments && dashboardData.enrollments.length > 0) {
      return dashboardData.enrollments.map((e) => ({
        id: e.student?.id || e.id,
        name: `${e.student?.firstName || ''} ${e.student?.lastName || ''}`.trim() || 'Enrolled Student',
        code: e.student?.studentCode || '—',
        batchName: e.batch?.name || 'Assigned Batch',
        status: e.student?.status || 'Active',
      }));
    }
    return [];
  }, [batches, dashboardData]);

  const todaySchedule = useMemo(() => {
    const s = dashboardData?.todaySchedule?.[0] || dashboardData?.schedule?.[0];
    if (s) {
      const timeStr = s.timeStr || (s.startAt ? `${new Date(s.startAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} – ${new Date(s.endAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : '');
      return {
        id: s.id,
        batchId: s.batchId || s.batch?.id,
        batch: s.batch?.name || s.batch || 'Class Session',
        course: s.batch?.courseName || s.course || '',
        room: s.room || s.batch?.room || '',
        timeStr,
        studentCount: s.studentCount ?? s.enrolledCount ?? s.batch?._count?.enrollments ?? 0,
        status: s.status || 'SCHEDULED',
      };
    }
    return null;
  }, [dashboardData]);

  const attendanceHealth = useMemo(() => {
    const rate = dashboardData?.metrics?.avgAttendanceRate ?? dashboardData?.attendanceOverview?.averageRate;
    if (rate != null) return `${rate}%`;
    return batches.length ? 'Active' : '—';
  }, [dashboardData, batches]);

  const summaryItems = useMemo(() => [
    {
      key: 'total',
      label: 'Assigned Batches',
      value: batches.length,
      icon: FiBookOpen,
      tone: 'neutral',
      filterValue: 'ALL',
      badge: 'All Batches',
      badgeTone: 'bg-slate-100 text-slate-700',
    },
    {
      key: 'students',
      label: 'Enrolled Learners',
      value: totalStudents,
      icon: FiUsers,
      tone: 'primary',
      filterValue: 'ALL',
      badge: 'Active Roster',
      badgeTone: 'bg-blue-50 text-blue-700',
    },
    {
      key: 'today',
      label: "Today's Lecture",
      value: todaySchedule?.timeStr || (todaySchedule ? 'Scheduled' : 'None Today'),
      icon: FiClock,
      tone: 'info',
      filterValue: 'ACTIVE',
      badge: todaySchedule ? 'Scheduled' : 'No Lectures',
      badgeTone: todaySchedule ? 'bg-cyan-50 text-cyan-700' : 'bg-slate-100 text-slate-600',
    },
    {
      key: 'health',
      label: 'Attendance Health',
      value: attendanceHealth,
      icon: FiAward,
      tone: 'success',
      filterValue: 'ACTIVE',
      badge: 'Real-Time',
      badgeTone: 'bg-emerald-50 text-emerald-700',
    },
  ], [batches, totalStudents, todaySchedule, attendanceHealth]);

  if (isLoading && !batches.length) return <ContentLoader />;

  return (
    <div className="crm-tclasses">
      {/* ── Summary KPI Strip (Standard CRM UI) ── */}
      <div className="rounded-xl border border-border bg-card-bg shadow-xs overflow-hidden">
        <SummaryStatBar
          items={summaryItems}
          activeFilter={selectedStatus}
          onSelect={(val) => setSelectedStatus(val || 'ALL')}
          layout="grid"
          ariaLabel="Classes Statistics"
        />
      </div>

      {/* ── Main Two-Column Faculty Layout ── */}
      <div className="crm-tclasses-main-grid">
        {/* Left Column: Batch Cards Grid & Filtering Toolbar */}
        <section className="crm-tclasses-batch-section">
          {/* Search, Filter & View Mode Controls Bar */}
          <div className="crm-tclasses-controls-bar flex flex-wrap items-center justify-between gap-2.5">
            <div className="flex flex-wrap items-center gap-2 flex-1 min-w-0">
              <div className="crm-tclasses-search-wrap">
                <FiSearch />
                <input
                  type="text"
                  className="crm-tclasses-search-input"
                  placeholder="Search batches by name, code or room..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <div className="crm-tclasses-filter-group">
                <button
                  type="button"
                  className={`crm-tclasses-pill-btn ${selectedStatus === 'ALL' ? 'is-active' : ''}`}
                  onClick={() => setSelectedStatus('ALL')}
                >
                  All ({batches.length})
                </button>
                <button
                  type="button"
                  className={`crm-tclasses-pill-btn ${selectedStatus === 'ACTIVE' ? 'is-active' : ''}`}
                  onClick={() => setSelectedStatus('ACTIVE')}
                >
                  Active ({activeBatchesCount})
                </button>

                {courseOptions.map((course) => (
                  <button
                    key={course}
                    type="button"
                    className={`crm-tclasses-pill-btn ${selectedCourse === course ? 'is-active' : ''}`}
                    onClick={() => setSelectedCourse((prev) => (prev === course ? 'ALL' : course))}
                  >
                    {course}
                  </button>
                ))}
              </div>

              <div className="crm-tclasses-view-switch">
                <button
                  type="button"
                  className={`crm-tclasses-view-btn ${viewMode === 'grid' ? 'is-active' : ''}`}
                  onClick={() => setViewMode('grid')}
                  title="Card Grid View"
                >
                  <FiGrid />
                </button>
                <button
                  type="button"
                  className={`crm-tclasses-view-btn ${viewMode === 'table' ? 'is-active' : ''}`}
                  onClick={() => setViewMode('table')}
                  title="Detailed Table View"
                >
                  <FiList />
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0 ml-auto">
              <Button
                size="sm"
                variant="outline"
                className="flex items-center justify-center p-2 shadow-xs"
                onClick={handleManualRefresh}
                title="Refresh batches and schedule"
              >
                <FiRefreshCw className={isRefreshing ? 'animate-spin' : ''} />
              </Button>
              <Button
                size="sm"
                variant="primary"
                className="flex items-center gap-1.5 shadow-xs font-bold"
                onClick={() => {
                  if (batches[0]) {
                    navigate(ROUTES.BATCH_DETAIL(batches[0].id));
                  } else {
                    toastService.info('No active batch assigned');
                  }
                }}
              >
                <FiCalendar /> View Timetable
              </Button>
            </div>
          </div>

            {/* If no classes match */}
            {!filteredBatches.length ? (
              <EmptyState
                title="No batches match your filter"
                description="Try clearing search query or filter pills to view assigned academic batches."
                action={
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setSearchQuery('');
                      setSelectedCourse('ALL');
                      setSelectedStatus('ALL');
                    }}
                  >
                    Reset Filters
                  </Button>
                }
              />
            ) : viewMode === 'grid' ? (
              /* ── Grid View: Modern, Rich Class Cards ── */
              <div className="crm-tclasses-card-grid">
                {filteredBatches.map((batch) => {
                  const studentCount = batch._count?.enrollments ?? batch.enrollments?.length ?? 0;
                  const capacityMax = batch.capacity || 20;
                  const capacityPct = capacityMax > 0 ? Math.min(100, Math.round((studentCount / capacityMax) * 100)) : 0;
                  const activeEnrolled = (batch.enrollments || []).slice(0, 4);
                  const timetableText = batch.timetableSlots?.length
                    ? batch.timetableSlots.map((s) => `${s.startTime || ''} – ${s.endTime || ''}`).join(', ')
                    : null;

                  return (
                    <article key={batch.id} className="crm-tbatch-card">
                      <div>
                        {/* Header */}
                        <div className="crm-tbatch-card__head">
                          <div className="crm-tbatch-card__code-wrap">
                            <span className="crm-tbatch-card__code">{batch.code || 'BATCH'}</span>
                            {batch.courseName && (
                              <span className="crm-tbatch-card__course-tag">{batch.courseName}</span>
                            )}
                          </div>
                          <span className="crm-tbatch-card__status-dot">
                            {batch.isActive ? 'Active Batch' : 'Inactive'}
                          </span>
                        </div>

                        {/* Body */}
                        <div className="crm-tbatch-card__body">
                          <h3 className="crm-tbatch-card__title">{batch.name}</h3>

                          <div className="crm-tbatch-card__meta-list">
                            {batch.room && (
                              <div className="crm-tbatch-card__meta-item">
                                <FiMapPin />
                                <span>{batch.room}</span>
                              </div>
                            )}
                            {timetableText && (
                              <div className="crm-tbatch-card__meta-item">
                                <FiClock />
                                <span>{timetableText}</span>
                              </div>
                            )}
                            {batch.courseName && (
                              <div className="crm-tbatch-card__meta-item">
                                <FiLayers />
                                <span>{batch.courseName}</span>
                              </div>
                            )}
                          </div>

                          {/* Enrolled Students Avatar Stack */}
                          <div className="crm-tbatch-card__roster-summary">
                            <div className="flex items-center gap-2">
                              {activeEnrolled.length > 0 && (
                                <div className="crm-tbatch-card__avatars">
                                  {activeEnrolled.map((en) => {
                                    const stName = `${en.student?.firstName || ''} ${en.student?.lastName || ''}`.trim() || 'Student';
                                    const initials = `${en.student?.firstName?.[0] || 'S'}${en.student?.lastName?.[0] || ''}`.toUpperCase();
                                    return (
                                      <span key={en.id || en.student?.id} className="crm-tbatch-card__avatar-pill" title={stName}>
                                        {initials}
                                      </span>
                                    );
                                  })}
                                </div>
                              )}
                              <span className="crm-tbatch-card__student-count">
                                {studentCount} Enrolled {studentCount === 1 ? 'Student' : 'Students'}
                              </span>
                            </div>
                            <span className="crm-tbatch-card__capacity">
                              {studentCount}/{capacityMax} ({capacityPct}%)
                            </span>
                          </div>

                          {/* Capacity Progress Bar */}
                          <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                            <div
                              className="bg-blue-600 h-full rounded-full transition-all"
                              style={{ width: `${capacityPct}%` }}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Footer Actions */}
                      <div className="crm-tbatch-card__foot">
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            className="flex items-center gap-1.5 shadow-sm"
                            onClick={() => navigate(ROUTES.BATCH_DETAIL(batch.id))}
                          >
                            <FiBookOpen /> Open Batch
                          </Button>

                          {can(PERMISSIONS.ATTENDANCE_MARK) && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="flex items-center gap-1.5"
                              onClick={() => navigate(ROUTES.BATCH_DETAIL(batch.id))}
                            >
                              <FiCheckCircle /> Attendance
                            </Button>
                          )}
                        </div>

                        <button
                          type="button"
                          className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 cursor-pointer transition-colors"
                          onClick={() => {
                            setSelectedBatchForRoster((prev) => (prev === batch.id ? null : batch.id));
                          }}
                        >
                          Roster <FiChevronDown />
                        </button>
                      </div>

                      {/* Expandable Quick Student Roster Drawer */}
                      {selectedBatchForRoster === batch.id && (
                        <div className="p-3 bg-slate-50 border-t border-slate-200">
                          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2 flex items-center justify-between">
                            <span>Batch Student Roster ({enrolledStudents.length})</span>
                            <span className="text-emerald-600">All Cleared</span>
                          </div>
                          <div className="crm-tclasses-roster-list">
                            {enrolledStudents.map((st) => (
                              <div
                      key={st.id}
                      className="crm-tclasses-roster-item"
                      onClick={() => navigate(ROUTES.TEACHER_STUDENT(st.id))}
                      title={`View ${st.name}'s Academic Profile`}
                    >
                                <div className="crm-tclasses-roster-item__left">
                                  <Avatar name={st.name} size="xs" />
                                  <div>
                                    <span className="font-bold text-slate-800 block leading-tight">{st.name}</span>
                                    <span className="crm-tclasses-roster-item__code">{st.code}</span>
                                  </div>
                                </div>
                                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                                  Present
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </article>
                  );
                })}
              </div>
            ) : (
              /* ── Table View: Structured Academic Roster ── */
              <div className="overflow-x-auto">
                <table className="crm-tclasses-table">
                  <thead>
                    <tr>
                      <th>Batch Code</th>
                      <th>Class Title</th>
                      <th>Course</th>
                      <th>Room &amp; Timings</th>
                      <th>Enrollments</th>
                      <th>Status</th>
                      <th style={{ textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredBatches.map((batch) => {
                      const studentCount = batch._count?.enrollments ?? batch.enrollments?.length ?? 0;
                      const capacityMax = batch.capacity || 20;
                      const timetableText = batch.timetableSlots?.length
                        ? batch.timetableSlots.map((s) => `${s.startTime || ''}–${s.endTime || ''}`).join(', ')
                        : '—';

                      return (
                        <tr key={batch.id}>
                          <td>
                            <span className="font-mono text-xs font-bold text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded">
                              {batch.code || '—'}
                            </span>
                          </td>
                          <td>
                            <strong className="text-slate-900 block font-bold">{batch.name}</strong>
                            {batch.courseName && (
                              <span className="text-xs text-slate-500">{batch.courseName}</span>
                            )}
                          </td>
                          <td>
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-blue-100 text-blue-800">
                              {batch.courseName || 'General'}
                            </span>
                          </td>
                          <td>
                            <span className="text-xs text-slate-800 font-semibold block">{batch.room || '—'}</span>
                            <span className="text-xs text-slate-500">{timetableText}</span>
                          </td>
                          <td>
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-slate-900">{studentCount}</span>
                              <span className="text-xs text-slate-500">/ {capacityMax}</span>
                            </div>
                          </td>
                          <td>
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold ${
                              batch.isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
                            }`}>
                              ● {batch.isActive ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            <div className="inline-flex items-center gap-1.5">
                              <Button
                                size="xs"
                                onClick={() => navigate(ROUTES.BATCH_DETAIL(batch.id))}
                              >
                                Open
                              </Button>
                              {can(PERMISSIONS.ATTENDANCE_MARK) && (
                                <Button
                                  size="xs"
                                  variant="outline"
                                  onClick={() => navigate(ROUTES.BATCH_DETAIL(batch.id))}
                                >
                                  Attendance
                                </Button>
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

            {/* Weekly Lecture Timetable Schedule */}
            {batches[0] && (
              <div className="crm-tside-card">
                <div className="crm-tside-card__head">
                  <h3 className="crm-tside-card__title">
                    <FiCalendar className="text-primary-600" />
                    Weekly Lecture Timetable &amp; Venue
                  </h3>
                  <span className="text-[11px] font-bold text-slate-500 font-mono">
                    {batches[0].name}
                  </span>
                </div>
                <div className="crm-tside-card__body">
                  <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2">
                    {['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'].map((day, idx) => {
                      const dayNumber = (idx + 1) % 7;
                      const activeSlot = (batches[0].timetableSlots || []).find((s) => s.dayOfWeek === dayNumber);
                      const isToday = new Date().getDay() === dayNumber;

                      return (
                        <div
                          key={day}
                          className={`p-2.5 rounded-lg border flex flex-col items-center justify-center text-center transition-all ${
                            isToday
                              ? 'bg-primary-50/80 dark:bg-primary-950/40 border-primary-300 dark:border-primary-800 ring-1 ring-primary-500/30'
                              : activeSlot
                              ? 'bg-slate-50 dark:bg-slate-800/40 border-border'
                              : 'bg-slate-50/40 dark:bg-slate-900/20 border-border/50 opacity-60'
                          }`}
                        >
                          <div className="flex items-center gap-1 mb-1">
                            <span
                              className={`text-[10px] font-extrabold tracking-wider ${
                                isToday ? 'text-primary-700 dark:text-primary-300' : 'text-slate-500'
                              }`}
                            >
                              {day.slice(0, 3)}
                            </span>
                            {isToday && (
                              <span className="w-1.5 h-1.5 rounded-full bg-primary-600 animate-pulse" />
                            )}
                          </div>
                          {activeSlot ? (
                            <>
                              <span className="text-[11px] font-bold text-slate-800 dark:text-slate-200 leading-tight">
                                {activeSlot.startTime} – {activeSlot.endTime}
                              </span>
                              {activeSlot.room && (
                                <span className="text-[9.5px] text-slate-400 mt-0.5">
                                  {activeSlot.room}
                                </span>
                              )}
                            </>
                          ) : (
                            <span className="text-[10px] text-slate-400 italic">No slots</span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </section>

          {/* Right Column: Today's Classroom Schedule & Quick Faculty Tools */}
          <aside className="crm-tclasses-side-col">
            {/* Card 1: Today's Teaching Schedule */}
            <div className="crm-tside-card">
              <div className="crm-tside-card__head">
                <h3 className="crm-tside-card__title">
                  <FiClock className="text-blue-600" /> Today's Teaching Schedule
                </h3>
                {todaySchedule ? (
                  <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    ● {todaySchedule.status || 'Scheduled'}
                  </span>
                ) : (
                  <span className="text-xs font-medium text-slate-400">
                    No Sessions
                  </span>
                )}
              </div>
              <div className="crm-tside-card__body">
                {todaySchedule ? (
                  <>
                    <div className="crm-tside-session-item">
                      <div className="crm-tside-session-item__top">
                        <span>TODAY'S SESSION</span>
                        <span>{todaySchedule.timeStr}</span>
                      </div>
                      <div className="crm-tside-session-item__name">
                        {todaySchedule.batch}
                      </div>
                      <div className="crm-tside-session-item__meta">
                        {todaySchedule.room && <span>📍 {todaySchedule.room}</span>}
                        {todaySchedule.room && <span>•</span>}
                        <span>👥 {todaySchedule.studentCount} Students</span>
                        {todaySchedule.course && <span>• {todaySchedule.course}</span>}
                      </div>
                    </div>

                    <Button
                      size="sm"
                      className="w-full flex items-center justify-center gap-1.5 font-bold"
                      onClick={() => {
                        if (todaySchedule.batchId) {
                          navigate(ROUTES.BATCH_DETAIL(todaySchedule.batchId));
                        } else if (batches[0]) {
                          navigate(ROUTES.BATCH_DETAIL(batches[0].id));
                        }
                      }}
                    >
                      <FiCheckCircle /> Mark Today's Attendance
                    </Button>
                  </>
                ) : (
                  <EmptyState
                    title="No lectures scheduled today"
                    description="When classes are scheduled for today, they will appear here."
                  />
                )}
              </div>
            </div>

            {/* Card 2: Enrolled Student Quick Directory */}
            <div className="crm-tside-card">
              <div className="crm-tside-card__head">
                <h3 className="crm-tside-card__title">
                  <FiUserCheck className="text-indigo-600" /> Active Student Roster
                </h3>
                <span className="text-xs font-semibold text-slate-500">
                  {enrolledStudents.length} Students
                </span>
              </div>
              <div className="crm-tside-card__body">
                {!enrolledStudents.length ? (
                  <EmptyState
                    title="No active students"
                    description="Students enrolled in your batches will appear here."
                  />
                ) : (
                  <div className="crm-tclasses-roster-list">
                    {enrolledStudents.map((st) => (
                      <div
                        key={st.id}
                        className="crm-tclasses-roster-item"
                        onClick={() => navigate(ROUTES.TEACHER_STUDENT(st.id))}
                        title={`View ${st.name}'s Academic Profile`}
                      >
                        <div className="crm-tclasses-roster-item__left">
                          <Avatar name={st.name} size="xs" />
                          <div>
                            <strong className="text-xs text-slate-900 block leading-tight">{st.name}</strong>
                            <span className="crm-tclasses-roster-item__code">{st.code}</span>
                          </div>
                        </div>
                        <span className="text-[10.5px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded">
                          Active
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Card 3: Quick Faculty Action Shortcuts */}
            <div className="crm-tside-card">
              <div className="crm-tside-card__head">
                <h3 className="crm-tside-card__title">
                  <FiLayers className="text-violet-600" /> Faculty Quick Actions
                </h3>
              </div>
              <div className="crm-tside-card__body">
                <div className="crm-tside-tool-grid">
                  <button
                    type="button"
                    className="crm-tside-tool-btn"
                    onClick={() => navigate(ROUTES.TEACHER_MATERIALS)}
                  >
                    <FiUploadCloud className="text-blue-600" />
                    <span>Upload Notes</span>
                  </button>

                  <button
                    type="button"
                    className="crm-tside-tool-btn"
                    onClick={() => navigate(ROUTES.TEACHER_ASSIGNMENTS)}
                  >
                    <FiFileText className="text-emerald-600" />
                    <span>Assignments</span>
                  </button>

                  <button
                    type="button"
                    className="crm-tside-tool-btn"
                    onClick={() => navigate(ROUTES.TEACHER_ATTENDANCE)}
                  >
                    <FiCalendar className="text-amber-600" />
                    <span>Attendance Log</span>
                  </button>

                  <button
                    type="button"
                    className="crm-tside-tool-btn"
                    onClick={() => navigate(ROUTES.TEACHER_DASHBOARD)}
                  >
                    <FiTrendingUp className="text-purple-600" />
                    <span>Full Analytics</span>
                  </button>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>
  );
}