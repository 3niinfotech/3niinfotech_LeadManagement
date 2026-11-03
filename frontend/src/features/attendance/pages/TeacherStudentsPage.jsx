import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  FiUsers,
  FiSearch,
  FiFilter,
  FiGrid,
  FiList,
  FiCheckCircle,
  FiCheck,
  FiMail,
  FiPhone,
  FiBookOpen,
  FiTrendingUp,
  FiAward,
  FiClock,
  FiExternalLink,
  FiRefreshCw,
  FiDownload,
  FiX,
  FiEye,
  FiAlertCircle,
  FiLayers,
  FiMapPin,
} from 'react-icons/fi';
import ModulePageCard from '../../../components/layout/ModulePageLayout';
import Button from '../../../components/ui/Button';
import Avatar from '../../../components/ui/Avatar';
import Modal from '../../../components/ui/Modal';
import SummaryStatBar from '../../../components/ui/SummaryStatBar';
import EmptyState from '../../../components/ui/EmptyState';
import ContentLoader from '../../../components/ui/ContentLoader';
import { apiGet } from '../../../api/apiClient';
import { API } from '../../../config/api';
import { ROUTES } from '../../../config/routes';
import { selectUser } from '../../../redux/slices/authSlice';
import toastService from '../../../services/toast/toast.service';
import '../styles/teacher-students.css';

export default function TeacherStudentsPage() {
  const navigate = useNavigate();
  const user = useSelector(selectUser);

  const [rows, setRows] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [attendanceFilter, setAttendanceFilter] = useState('ALL'); // 'ALL' | 'HIGH' | 'LOW'
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'table'
  const [inspectStudent, setInspectStudent] = useState(null);

  const loadStudents = useCallback(async () => {
    try {
      const res = await apiGet(API.ACADEMIC_TEACHER_STUDENTS, {
        limit: 100,
        search: search.trim() || undefined,
      });
      const data = Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : [];
      setRows(data);
    } catch {
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    const timer = window.setTimeout(loadStudents, 200);
    return () => window.clearTimeout(timer);
  }, [loadStudents]);

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    await loadStudents();
    setIsRefreshing(false);
    toastService.success('Student roster refreshed');
  };

  // Filtered students by search & attendance filter
  const filteredStudents = useMemo(() => {
    return rows.filter((st) => {
      const q = search.toLowerCase().trim();
      const fullName = `${st.firstName || ''} ${st.lastName || ''}`.toLowerCase();
      const code = (st.studentCode || '').toLowerCase();
      const email = (st.email || '').toLowerCase();
      const phone = (st.phone || '').toLowerCase();

      const matchSearch = !q || fullName.includes(q) || code.includes(q) || email.includes(q) || phone.includes(q);

      const pct = st.attendance?.percent ?? 100;
      let matchAtt = true;
      if (attendanceFilter === 'HIGH') matchAtt = pct >= 90;
      if (attendanceFilter === 'LOW') matchAtt = pct < 75;

      return matchSearch && matchAtt;
    });
  }, [rows, search, attendanceFilter]);

  // Aggregate Metrics
  const avgAttendance = useMemo(() => {
    if (!rows.length) return 100;
    const sum = rows.reduce((acc, st) => acc + (st.attendance?.percent ?? 100), 0);
    return Math.round(sum / rows.length);
  }, [rows]);

  const atRiskCount = useMemo(() => {
    return rows.filter((st) => (st.attendance?.percent ?? 100) < 75).length;
  }, [rows]);

  const summaryItems = useMemo(() => [
    {
      key: 'total',
      label: 'Enrolled Learners',
      value: rows.length,
      icon: FiUsers,
      tone: 'neutral',
      filterValue: 'ALL',
      badge: 'All Students',
      badgeTone: 'bg-slate-100 text-slate-700',
    },
    {
      key: 'avg',
      label: 'Avg Class Attendance',
      value: `${avgAttendance}%`,
      icon: FiAward,
      tone: 'success',
      filterValue: 'HIGH',
      badge: 'Cohort Avg',
      badgeTone: 'bg-emerald-50 text-emerald-700',
    },
    {
      key: 'consistent',
      label: 'Consistent Attendees',
      value: rows.filter((st) => (st.attendance?.percent ?? 100) >= 85).length,
      icon: FiCheckCircle,
      tone: 'primary',
      filterValue: 'HIGH',
      badge: '≥ 85% Rate',
      badgeTone: 'bg-blue-50 text-blue-700',
    },
    {
      key: 'atRisk',
      label: 'At-Risk (<75%)',
      value: atRiskCount,
      icon: FiAlertCircle,
      tone: atRiskCount > 0 ? 'warning' : 'neutral',
      filterValue: 'LOW',
      badge: atRiskCount > 0 ? 'Action Req' : 'Zero Risk',
      badgeTone: atRiskCount > 0 ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-600',
    },
  ], [rows, avgAttendance, atRiskCount]);

  const exportRosterCSV = () => {
    const headers = ['Student ID,Name,Email,Phone,Course,Batch,Attendance %,Present,Absent,Status\n'];
    const lines = filteredStudents.map((s) =>
      `"${s.studentCode}","${s.firstName} ${s.lastName}","${s.email || ''}","${s.phone || ''}","${s.courseName || 'IELTS'}","${s.batchName || ''}",${s.attendance?.percent ?? 100}%,${s.attendance?.present || 0},${s.attendance?.absent || 0},"${s.status || 'ACTIVE'}"`
    );
    const blob = new Blob([headers.concat(lines.join('\n'))], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Faculty_Student_Roster_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    toastService.success('Student roster CSV exported');
  };

  if (loading && !rows.length) return <ContentLoader />;

  return (
    <div className="crm-tstudents">
      {/* ── Summary KPI Strip (Standard CRM UI) ── */}
      <div className="rounded-xl border border-border bg-card-bg shadow-xs overflow-hidden">
        <SummaryStatBar
          items={summaryItems}
          activeFilter={attendanceFilter}
          onSelect={(val) => setAttendanceFilter(val || 'ALL')}
          layout="grid"
          ariaLabel="Student Statistics"
        />
      </div>

      {/* ── Search, Filter & View Controls Toolbar ── */}
      <div className="crm-tstudents-toolbar flex flex-wrap items-center justify-between gap-2.5">
        <div className="flex flex-wrap items-center gap-2 flex-1 min-w-0">
          <div className="crm-tstudents-search-box">
            <FiSearch />
            <input
              type="text"
              className="crm-tstudents-search-input"
              placeholder="Search students by name, ID, phone, or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search && (
              <button
                type="button"
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
                onClick={() => setSearch('')}
              >
                <FiX size={14} />
              </button>
            )}
          </div>

          <div className="crm-tstudents-filter-group">
            <button
              type="button"
              className={`crm-tstudents-filter-btn ${attendanceFilter === 'ALL' ? 'is-active' : ''}`}
              onClick={() => setAttendanceFilter('ALL')}
            >
              All Students ({rows.length})
            </button>
            <button
              type="button"
              className={`crm-tstudents-filter-btn ${attendanceFilter === 'HIGH' ? 'is-active' : ''}`}
              onClick={() => setAttendanceFilter('HIGH')}
            >
              High Attendance ≥90% ({rows.filter((r) => (r.attendance?.percent ?? 100) >= 90).length})
            </button>
            <button
              type="button"
              className={`crm-tstudents-filter-btn ${attendanceFilter === 'LOW' ? 'is-active' : ''}`}
              onClick={() => setAttendanceFilter('LOW')}
            >
              At-Risk &lt;75% ({atRiskCount})
            </button>
          </div>

          <div className="crm-tstudents-view-toggle">
            <button
              type="button"
              className={`crm-tstudents-toggle-btn ${viewMode === 'grid' ? 'is-active' : ''}`}
              onClick={() => setViewMode('grid')}
              title="Card Grid View"
            >
              <FiGrid />
            </button>
            <button
              type="button"
              className={`crm-tstudents-toggle-btn ${viewMode === 'table' ? 'is-active' : ''}`}
              onClick={() => setViewMode('table')}
              title="Table Roster View"
            >
              <FiList />
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 ml-auto">
          <Button
            size="sm"
            variant="outline"
            className="flex items-center gap-1.5 shadow-xs font-semibold"
            onClick={exportRosterCSV}
            title="Download CSV Roster"
          >
            <FiDownload /> Export CSV
          </Button>

          <Button
            size="sm"
            variant="outline"
            className="flex items-center justify-center p-2 shadow-xs"
            onClick={handleManualRefresh}
            title="Refresh student records"
          >
            <FiRefreshCw className={isRefreshing ? 'animate-spin' : ''} />
          </Button>

          <Button
            size="sm"
            variant="primary"
            className="flex items-center gap-1.5 shadow-xs font-bold"
            onClick={() => navigate(ROUTES.TEACHER_CLASSES)}
          >
            <FiCheckCircle /> Mark Class Attendance
          </Button>
        </div>
      </div>

      {/* ── Empty State if No Students Match ── */}
        {!filteredStudents.length ? (
          <EmptyState
            title="No students match your criteria"
            description="Try modifying your search query or reset attendance filter pills."
            action={
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setSearch('');
                  setAttendanceFilter('ALL');
                }}
              >
                Reset Filters
              </Button>
            }
          />
        ) : viewMode === 'grid' ? (
          /* ── Grid View: Modern Visual Student Cards ── */
          <div className="crm-tstudents-grid">
            {filteredStudents.map((st) => {
              const fullName = `${st.firstName || ''} ${st.lastName || ''}`.trim() || 'Student';
              const att = st.attendance || { percent: 100, present: 5, absent: 0 };
              const isLow = att.percent < 75;

              return (
                <article key={`${st.id}-${st.batchName}`} className="crm-tstudent-card">
                  <div>
                    {/* Head */}
                    <div className="crm-tstudent-card__head">
                      <div className="crm-tstudent-card__identity">
                        <Avatar
                          name={fullName}
                          src={st.avatar || st.avatarUrl || st.profileImage || st.photo || st.profilePic || ''}
                          size="md"
                        />
                        <div className="crm-tstudent-card__name-block">
                          <h3 className="crm-tstudent-card__name" title={fullName}>{fullName}</h3>
                          <span className="crm-tstudent-card__code">{st.studentCode || '—'}</span>
                        </div>
                      </div>

                      <span className="crm-tstudent-card__status-badge">
                        ● {st.status === 'ACTIVE' ? 'Active' : st.status || 'Active'}
                      </span>
                    </div>

                    {/* Body */}
                    <div className="crm-tstudent-card__body">
                      {/* Course & Batch info */}
                      <div className="crm-tstudent-card__batch-box">
                        <span className="crm-tstudent-card__batch-name">
                          <FiLayers className="text-blue-600" />
                          {st.batchName || 'Unassigned'}
                        </span>
                        {st.courseName && (
                          <span className="crm-tstudent-card__course-pill">
                            {st.courseName}
                          </span>
                        )}
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
                          <span className="text-slate-600 font-semibold">Attendance Log</span>
                          <span className={`crm-tstudent-card__att-val ${isLow ? 'is-low' : ''}`}>
                            {att.percent}% ({att.present}P / {att.absent}A)
                          </span>
                        </div>
                        <div className="crm-tstudent-card__att-bar">
                          <div
                            className={`crm-tstudent-card__att-fill ${isLow ? 'is-low' : ''}`}
                            style={{ width: `${Math.min(100, Math.max(0, att.percent))}%` }}
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
                        onClick={() => setInspectStudent(st)}
                      >
                        <FiEye size={13} /> Inspect
                      </Button>
                      <Button
                        size="xs"
                        variant="primary"
                        className="flex items-center gap-1.5 px-3.5 py-1.5 font-semibold text-xs whitespace-nowrap shadow-xs rounded-lg"
                        onClick={() => navigate(ROUTES.TEACHER_STUDENT(st.id))}
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
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          /* ── Table View: Structured Academic Data Table ── */
          <div className="overflow-x-auto">
            <table className="crm-tstudents-table">
              <thead>
                <tr>
                  <th>Student Particulars</th>
                  <th>Batch &amp; Course</th>
                  <th>Contact Details</th>
                  <th>Attendance Health</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredStudents.map((st) => {
                  const fullName = `${st.firstName || ''} ${st.lastName || ''}`.trim() || 'Student';
                  const att = st.attendance || { percent: 100, present: 5, absent: 0 };
                  const isLow = att.percent < 75;

                  return (
                    <tr key={`${st.id}-${st.batchName}`}>
                      <td>
                        <div className="flex items-center gap-2.5">
                          <Avatar
                            name={fullName}
                            src={st.avatar || st.avatarUrl || st.profileImage || st.photo || st.profilePic || ''}
                            size="sm"
                          />
                          <div>
                            <strong className="text-slate-900 block font-bold">{fullName}</strong>
                            <span className="font-mono text-xs text-slate-500">{st.studentCode}</span>
                          </div>
                        </div>
                      </td>
                      <td>
                        <strong className="text-slate-800 block text-xs font-semibold">{st.batchName}</strong>
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10.5px] font-bold bg-blue-100 text-blue-800 mt-0.5">
                          {st.courseName || 'IELTS'}
                        </span>
                      </td>
                      <td>
                        <div className="flex flex-col text-xs text-slate-600">
                          <span>{st.email || '—'}</span>
                          <span className="font-mono text-[11px] text-slate-500">{st.phone || '—'}</span>
                        </div>
                      </td>
                      <td>
                        <div className="flex items-center gap-2">
                          <span className={`font-bold text-xs ${isLow ? 'text-red-600' : 'text-emerald-700'}`}>
                            {att.percent}%
                          </span>
                          <span className="text-[11px] text-slate-500">
                            ({att.present}P / {att.absent}A)
                          </span>
                        </div>
                        <div className="w-24 bg-slate-100 h-1.5 rounded-full overflow-hidden mt-1">
                          <div
                            className={`h-full rounded-full ${isLow ? 'bg-red-500' : 'bg-emerald-500'}`}
                            style={{ width: `${Math.min(100, Math.max(0, att.percent))}%` }}
                          />
                        </div>
                      </td>
                      <td>
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                          ● Active
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div className="inline-flex items-center gap-2">
                          <Button
                            size="xs"
                            variant="outline"
                            className="px-3 py-1.5 whitespace-nowrap rounded-lg text-xs font-semibold"
                            onClick={() => setInspectStudent(st)}
                          >
                            Inspect
                          </Button>
                          <Button
                            size="xs"
                            variant="primary"
                            className="px-3 py-1.5 whitespace-nowrap rounded-lg text-xs font-semibold"
                            onClick={() => navigate(ROUTES.TEACHER_STUDENT(st.id))}
                          >
                            Profile
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* ── Quick Inspect Modal ── */}
        <Modal
          open={!!inspectStudent}
          onClose={() => setInspectStudent(null)}
          title="Student Academic Profile"
          subtitle="Enrolled batch details and attendance track record"
          size="md"
          footer={
            inspectStudent ? (
              <div className="flex items-center justify-between w-full">
                <Button variant="outline" size="sm" onClick={() => setInspectStudent(null)}>
                  Close
                </Button>
                <Button
                  size="sm"
                  className="flex items-center gap-1.5 font-bold"
                  onClick={() => {
                    const sid = inspectStudent.id;
                    setInspectStudent(null);
                    navigate(ROUTES.TEACHER_STUDENT(sid));
                  }}
                >
                  <FiExternalLink /> Open Full Student Profile
                </Button>
              </div>
            ) : null
          }
        >
          {inspectStudent && (
            <div className="space-y-4">
              {/* Student Header */}
              <div className="flex items-center justify-between pb-3.5 border-b border-border/80">
                <div className="flex items-center gap-3 min-w-0">
                  <Avatar
                    name={`${inspectStudent.firstName} ${inspectStudent.lastName}`}
                    src={inspectStudent.avatar || inspectStudent.avatarUrl || inspectStudent.profileImage || inspectStudent.photo || inspectStudent.profilePic || ''}
                    size="lg"
                    className="ring-2 ring-brand/10 shrink-0"
                  />
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-base font-bold text-text m-0 leading-tight truncate">
                        {inspectStudent.firstName} {inspectStudent.lastName}
                      </h3>
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10.5px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                        Active Student
                      </span>
                    </div>
                    <span className="font-mono text-xs text-text-muted font-medium mt-0.5 block">
                      {inspectStudent.studentCode || 'No Code'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Batch Information Box */}
              <div className="p-3.5 bg-surface/50 border border-border/80 rounded-xl flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-text-muted">
                    Academic Batch
                  </span>
                  {inspectStudent.courseName && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-brand-soft text-brand uppercase tracking-wider">
                      {inspectStudent.courseName}
                    </span>
                  )}
                </div>
                <strong className="text-sm font-bold text-text">
                  {inspectStudent.batchName || 'Assigned Batch'}
                </strong>
                <div className="flex items-center gap-2 flex-wrap text-xs text-text-muted pt-0.5">
                  {inspectStudent.room && (
                    <span className="inline-flex items-center gap-1">
                      <FiMapPin className="w-3 h-3 text-text-muted" /> {inspectStudent.room}
                    </span>
                  )}
                  {inspectStudent.branchName && (
                    <>
                      <span>•</span>
                      <span className="inline-flex items-center gap-1">
                        <FiBookOpen className="w-3 h-3 text-text-muted" /> {inspectStudent.branchName}
                      </span>
                    </>
                  )}
                </div>
              </div>

              {/* Attendance Summary */}
              <div className="grid grid-cols-3 gap-2.5 text-center">
                <div className="p-3 rounded-xl border border-emerald-200/80 bg-emerald-50/60 flex flex-col items-center justify-center">
                  <span className="block text-xl font-extrabold text-emerald-700 tabular-nums">
                    {inspectStudent.attendance?.percent ?? 100}%
                  </span>
                  <span className="text-[10.5px] font-bold uppercase tracking-wider text-emerald-800/80 mt-0.5">
                    Attendance
                  </span>
                </div>

                <div className="p-3 rounded-xl border border-blue-200/80 bg-blue-50/60 flex flex-col items-center justify-center">
                  <span className="block text-xl font-extrabold text-blue-700 tabular-nums">
                    {inspectStudent.attendance?.present ?? 0}
                  </span>
                  <span className="text-[10.5px] font-bold uppercase tracking-wider text-blue-800/80 mt-0.5">
                    Classes Present
                  </span>
                </div>

                <div className="p-3 rounded-xl border border-border/80 bg-surface/60 flex flex-col items-center justify-center">
                  <span className="block text-xl font-extrabold text-text tabular-nums">
                    {inspectStudent.attendance?.absent ?? 0}
                  </span>
                  <span className="text-[10.5px] font-bold uppercase tracking-wider text-text-muted mt-0.5">
                    Days Absent
                  </span>
                </div>
              </div>

              {/* Direct Contact Actions */}
              <div className="space-y-2 pt-2 border-t border-border/80">
                <span className="text-xs font-bold text-text block">Contact Details</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {inspectStudent.email ? (
                    <a
                      href={`mailto:${inspectStudent.email}`}
                      className="p-2.5 rounded-xl border border-border hover:border-brand/50 bg-card hover:bg-surface text-text text-xs flex items-center justify-between transition-all group"
                    >
                      <span className="flex items-center gap-2 truncate">
                        <FiMail className="text-brand shrink-0 w-3.5 h-3.5" />
                        <span className="truncate">{inspectStudent.email}</span>
                      </span>
                      <span className="text-brand font-semibold text-[11px] shrink-0 group-hover:translate-x-0.5 transition-transform ml-1">
                        Email →
                      </span>
                    </a>
                  ) : (
                    <div className="p-2.5 rounded-xl border border-border/60 bg-surface/30 text-text-muted text-xs flex items-center gap-2">
                      <FiMail className="w-3.5 h-3.5" /> No email recorded
                    </div>
                  )}

                  {inspectStudent.phone ? (
                    <a
                      href={`tel:${inspectStudent.phone}`}
                      className="p-2.5 rounded-xl border border-border hover:border-emerald-400 bg-card hover:bg-surface text-text text-xs flex items-center justify-between transition-all group"
                    >
                      <span className="flex items-center gap-2 truncate">
                        <FiPhone className="text-emerald-600 shrink-0 w-3.5 h-3.5" />
                        <span className="truncate font-mono">{inspectStudent.phone}</span>
                      </span>
                      <span className="text-emerald-600 font-semibold text-[11px] shrink-0 group-hover:translate-x-0.5 transition-transform ml-1">
                        Call →
                      </span>
                    </a>
                  ) : (
                    <div className="p-2.5 rounded-xl border border-border/60 bg-surface/30 text-text-muted text-xs flex items-center gap-2">
                      <FiPhone className="w-3.5 h-3.5" /> No phone recorded
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </Modal>
      </div>
  );
}