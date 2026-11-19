import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  FiAward,
  FiUsers,
  FiCheckCircle,
  FiAlertTriangle,
  FiFileText,
  FiSearch,
  FiRefreshCw,
  FiDownload,
  FiExternalLink,
  FiEye,
  FiLayers,
  FiTrendingUp,
  FiArrowUpRight,
  FiBookOpen,
} from 'react-icons/fi';
import Button from '../../../components/ui/Button';
import Avatar from '../../../components/ui/Avatar';
import Modal from '../../../components/ui/Modal';
import Select from '../../../components/ui/Select';
import ContentLoader from '../../../components/ui/ContentLoader';
import EmptyState from '../../../components/ui/EmptyState';
import { apiGet } from '../../../api/apiClient';
import { API } from '../../../config/api';
import { ROUTES } from '../../../config/routes';
import { selectUser } from '../../../redux/slices/authSlice';
import toastService from '../../../services/toast/toast.service';
import '../styles/teacher-performance.css';

export default function TeacherPerformancePage() {
  const navigate = useNavigate();
  const user = useSelector(selectUser);

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Filters & Search
  const [search, setSearch] = useState('');
  const [selectedBatch, setSelectedBatch] = useState('ALL');
  const [scoreTier, setScoreTier] = useState('ALL'); // 'ALL' | 'TOP' (>=90) | 'GOOD' (75-89) | 'RISK' (<75)
  const [sortBy, setSortBy] = useState('OVERALL_DESC'); // 'OVERALL_DESC' | 'OVERALL_ASC' | 'ATT_DESC' | 'NAME_ASC'

  // Inspect Modal
  const [inspectStudent, setInspectStudent] = useState(null);

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setIsRefreshing(true);
    else setLoading(true);

    try {
      const res = await apiGet(API.ACADEMIC_PERFORMANCE);
      setData(res?.data || res);
      if (isRefresh) {
        toastService.success('Performance analytics refreshed');
      }
    } catch (err) {
      toastService.error(err?.response?.data?.message || 'Unable to load performance data');
      setData(null);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const metrics = data?.metrics || {};
  const rawStudents = useMemo(() => data?.students || [], [data?.students]);
  const courseTrend = useMemo(() => data?.courseTrend || [], [data?.courseTrend]);

  // Unique batches for filter dropdown/pills
  const batchList = useMemo(() => {
    const list = [];
    courseTrend.forEach((b) => {
      if (b.batch && !list.includes(b.batch)) list.push(b.batch);
    });
    return list;
  }, [courseTrend]);

  // Filtered & Sorted Student List
  const filteredStudents = useMemo(() => {
    let list = [...rawStudents];

    // Search query (name, code, or batch)
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(
        (s) =>
          (s.name && s.name.toLowerCase().includes(q)) ||
          (s.studentCode && s.studentCode.toLowerCase().includes(q)) ||
          (s.batch && s.batch.toLowerCase().includes(q))
      );
    }

    // Batch filter
    if (selectedBatch !== 'ALL') {
      list = list.filter((s) => s.batch === selectedBatch);
    }

    // Score tier filter
    if (scoreTier === 'TOP') {
      list = list.filter((s) => s.overall != null && s.overall >= 90);
    } else if (scoreTier === 'GOOD') {
      list = list.filter((s) => s.overall != null && s.overall >= 75 && s.overall < 90);
    } else if (scoreTier === 'RISK') {
      list = list.filter((s) => s.overall != null && s.overall < 75);
    }

    // Sorting
    list.sort((a, b) => {
      if (sortBy === 'OVERALL_DESC') {
        return (b.overall ?? 0) - (a.overall ?? 0);
      }
      if (sortBy === 'OVERALL_ASC') {
        return (a.overall ?? 0) - (b.overall ?? 0);
      }
      if (sortBy === 'ATT_DESC') {
        return (b.attendancePercent ?? 0) - (a.attendancePercent ?? 0);
      }
      if (sortBy === 'NAME_ASC') {
        return (a.name || '').localeCompare(b.name || '');
      }
      return 0;
    });

    return list;
  }, [rawStudents, search, selectedBatch, scoreTier, sortBy]);

  // Export Performance Report to CSV
  const handleExportCSV = () => {
    if (!filteredStudents.length) {
      toastService.warning('No student records to export');
      return;
    }

    const headers = [
      'Student ID',
      'Student Name',
      'Academic Batch',
      'Course',
      'Attendance Rate (%)',
      'Tests Taken',
      'Avg Test Score (%)',
      'Assignment Completion (%)',
      'Overall Academic Score (%)',
    ];

    const rows = filteredStudents.map((s) => [
      `"${s.studentCode || s.studentId || ''}"`,
      `"${(s.name || '').replace(/"/g, '""')}"`,
      `"${(s.batch || '').replace(/"/g, '""')}"`,
      `"${(s.course || '').replace(/"/g, '""')}"`,
      s.attendancePercent != null ? s.attendancePercent : 'N/A',
      s.testCount ?? 0,
      s.averageTestPercent != null ? s.averageTestPercent : 'N/A',
      s.assignmentCompletion != null ? s.assignmentCompletion : 'N/A',
      s.overall != null ? s.overall : 'N/A',
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Faculty_Academic_Performance_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toastService.success('Academic performance report downloaded');
  };

  const avgPerf = metrics.averagePerformance;

  if (loading && !data) {
    return <ContentLoader variant="dashboard" />;
  }

  return (
    <div className="crm-tperf">
      {/* ── 4 Executive KPI Metric Cards ── */}
      <div className="crm-tperf-kpi-grid">
        <div className="crm-tperf-kpi-card">
          <div>
            <span className="crm-tperf-kpi-label">Class Average</span>
            <div className="crm-tperf-kpi-value">
              {avgPerf != null ? `${avgPerf}%` : '—'}
            </div>
            <span className="crm-tperf-kpi-hint">Overall academic grade</span>
          </div>
          <div className="crm-tperf-kpi-icon crm-tperf-kpi-icon--emerald">
            <FiAward size={18} />
          </div>
        </div>

        <div className="crm-tperf-kpi-card">
          <div>
            <span className="crm-tperf-kpi-label">Enrolled Learners</span>
            <div className="crm-tperf-kpi-value">
              {metrics.students ?? 0}
            </div>
            <span className="crm-tperf-kpi-hint">Across active classes</span>
          </div>
          <div className="crm-tperf-kpi-icon crm-tperf-kpi-icon--blue">
            <FiUsers size={18} />
          </div>
        </div>

        <div className="crm-tperf-kpi-card">
          <div>
            <span className="crm-tperf-kpi-label">Low Attendance (&lt;75%)</span>
            <div className="crm-tperf-kpi-value">
              {metrics.lowAttendance ?? 0}
            </div>
            <span className="crm-tperf-kpi-hint">
              {metrics.lowAttendance > 0 ? 'Requires attention' : 'All students on track'}
            </span>
          </div>
          <div className={`crm-tperf-kpi-icon ${metrics.lowAttendance > 0 ? 'crm-tperf-kpi-icon--amber' : 'crm-tperf-kpi-icon--neutral'}`}>
            <FiAlertTriangle size={18} />
          </div>
        </div>

        <div className="crm-tperf-kpi-card">
          <div>
            <span className="crm-tperf-kpi-label">Pending Assignments</span>
            <div className="crm-tperf-kpi-value">
              {metrics.pendingAssignments ?? 0}
            </div>
            <span className="crm-tperf-kpi-hint">Submissions awaiting review</span>
          </div>
          <div className="crm-tperf-kpi-icon crm-tperf-kpi-icon--purple">
            <FiFileText size={18} />
          </div>
        </div>
      </div>

      {/* ── Batch Performance Cards (Horizontal Responsive Strip) ── */}
      {courseTrend.length > 0 && (
        <div className="crm-tperf-section">
          <div className="flex items-center justify-between mb-2.5">
            <div className="flex items-center gap-2">
              <FiLayers className="text-brand shrink-0" size={15} />
              <h3 className="text-sm font-semibold text-text">Batch Performance Overview</h3>
              <span className="text-xs text-text-muted">({courseTrend.length} {courseTrend.length === 1 ? 'batch' : 'batches'})</span>
            </div>
            {selectedBatch !== 'ALL' && (
              <button
                type="button"
                className="text-xs text-brand hover:underline font-medium"
                onClick={() => setSelectedBatch('ALL')}
              >
                Clear batch filter
              </button>
            )}
          </div>

          <div className="crm-tperf-batch-grid">
            {courseTrend.map((row) => {
              const pct = row.averagePerformance != null ? row.averagePerformance : 0;
              let fillClass = 'crm-tperf-progress-fill--emerald';
              if (pct < 70) fillClass = 'crm-tperf-progress-fill--rose';
              else if (pct < 85) fillClass = 'crm-tperf-progress-fill--blue';

              const isSelected = selectedBatch === row.batch;

              return (
                <div
                  key={row.batchId}
                  className={`crm-tperf-batch-card cursor-pointer ${isSelected ? 'is-active' : ''}`}
                  onClick={() => setSelectedBatch(isSelected ? 'ALL' : row.batch)}
                  title="Click to filter leaderboard by this batch"
                >
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="min-w-0">
                      <h4 className="font-semibold text-sm text-text truncate">{row.batch}</h4>
                      <p className="text-xs text-text-muted truncate mt-0.5">
                        {row.course || 'Academic Course'} · {row.students} students
                      </p>
                    </div>
                    <span className="font-semibold text-base text-text tabular-nums shrink-0">
                      {row.averagePerformance != null ? `${row.averagePerformance}%` : '—'}
                    </span>
                  </div>

                  <div className="crm-tperf-progress-bar mb-2.5">
                    <div
                      className={`crm-tperf-progress-fill ${fillClass}`}
                      style={{ width: `${Math.min(100, pct)}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-xs pt-1 border-t border-border/50">
                    <span className="text-text-muted font-medium">
                      {pct >= 90 ? 'Optimal (≥90%)' : pct >= 75 ? 'On Track' : 'Needs attention'}
                    </span>
                    <button
                      type="button"
                      className="text-brand hover:underline font-medium inline-flex items-center gap-1"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(ROUTES.TEACHER_BATCH_DETAIL(row.batchId));
                      }}
                    >
                      Open Class <FiArrowUpRight size={11} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Student Academic Leaderboard ── */}
      <div className="crm-tperf-panel">
        {/* Table Toolbar */}
        <div className="crm-tperf-table-toolbar">
          <div className="crm-tperf-search">
            <FiSearch className="text-text-muted shrink-0" size={14} />
            <input
              type="text"
              placeholder="Search by student name, code, or batch..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Batch Filter Dropdown */}
            {batchList.length > 1 && (
              <div className="w-44">
                <Select
                  size="sm"
                  searchable={false}
                  allowClear={false}
                  value={selectedBatch}
                  onChange={(val) => setSelectedBatch(typeof val === 'string' ? val : val?.target?.value || val)}
                  options={[{ value: 'ALL', label: 'All Batches' }, ...batchList.map((b) => ({ value: b, label: b }))]}
                />
              </div>
            )}

            {/* Score Tier Dropdown */}
            <div className="w-36">
              <Select
                size="sm"
                searchable={false}
                allowClear={false}
                value={scoreTier}
                onChange={(val) => setScoreTier(typeof val === 'string' ? val : val?.target?.value || val)}
                options={[
                  { value: 'ALL', label: 'All Tiers' },
                  { value: 'TOP', label: 'Top (≥90%)' },
                  { value: 'GOOD', label: 'Good (75-89%)' },
                  { value: 'RISK', label: 'At Risk (<75%)' },
                ]}
              />
            </div>

            {/* Sort Dropdown */}
            <div className="w-44">
              <Select
                size="sm"
                searchable={false}
                allowClear={false}
                value={sortBy}
                onChange={(val) => setSortBy(typeof val === 'string' ? val : val?.target?.value || val)}
                options={[
                  { value: 'OVERALL_DESC', label: 'Score: High to Low' },
                  { value: 'OVERALL_ASC', label: 'Score: Low to High' },
                  { value: 'ATT_DESC', label: 'Attendance: High' },
                  { value: 'NAME_ASC', label: 'Name: A to Z' },
                ]}
              />
            </div>

            {/* Actions */}
            <Button
              size="sm"
              variant="outline"
              onClick={handleExportCSV}
              className="flex items-center gap-1.5 shadow-xs font-medium"
            >
              <FiDownload size={13} />
              Export CSV
            </Button>

            <Button
              size="sm"
              variant="outline"
              onClick={() => load(true)}
              disabled={isRefreshing}
              className="p-2 shadow-xs"
              title="Refresh performance analytics"
            >
              <FiRefreshCw size={13} className={isRefreshing ? 'animate-spin' : ''} />
            </Button>
          </div>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto">
          {!filteredStudents.length ? (
            <div className="p-8">
              <EmptyState
                title="No matching student records"
                description="Try adjusting your search criteria, batch filter, or performance tier."
              />
            </div>
          ) : (
            <table className="crm-tperf-table">
              <thead>
                <tr>
                  <th style={{ width: '56px' }}>Rank</th>
                  <th>Student Details</th>
                  <th>Attendance</th>
                  <th>Tests</th>
                  <th>Assignments</th>
                  <th>Overall Score</th>
                  <th style={{ width: '160px', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredStudents.map((row, idx) => {
                  const score = row.overall;
                  let scoreColor = 'text-brand';
                  if (score != null) {
                    if (score >= 90) scoreColor = 'text-emerald-600 dark:text-emerald-400';
                    else if (score < 75) scoreColor = 'text-rose-600 dark:text-rose-400';
                  }

                  return (
                    <tr key={row.studentId}>
                      {/* Rank */}
                      <td>
                        <span className="font-mono text-xs font-semibold text-text-muted">
                          #{idx + 1}
                        </span>
                      </td>

                      {/* Student Name + Code + Batch */}
                      <td>
                        <div className="flex items-center gap-2.5">
                          <Avatar name={row.name} size="sm" />
                          <div className="min-w-0">
                            <button
                              type="button"
                              className="font-semibold text-xs text-text hover:text-brand transition-colors block truncate text-left"
                              onClick={() => setInspectStudent(row)}
                            >
                              {row.name}
                            </button>
                            <div className="flex items-center gap-1.5 text-[11px] text-text-muted mt-0.5">
                              <span className="font-mono">{row.studentCode || 'N/A'}</span>
                              <span>•</span>
                              <span className="truncate max-w-[160px]">{row.batch}</span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Attendance % */}
                      <td>
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                              (row.attendancePercent ?? 0) >= 75 ? 'bg-emerald-500' : 'bg-amber-500'
                            }`}
                          />
                          <span className="font-medium text-xs text-text tabular-nums">
                            {row.attendancePercent != null ? `${row.attendancePercent}%` : '—'}
                          </span>
                        </div>
                      </td>

                      {/* Tests */}
                      <td>
                        <div className="text-xs tabular-nums">
                          <span className="font-medium text-text">
                            {row.averageTestPercent != null ? `${row.averageTestPercent}%` : '—'}
                          </span>
                          <span className="text-[11px] text-text-muted ml-1">
                            ({row.testCount ?? 0} {row.testCount === 1 ? 'test' : 'tests'})
                          </span>
                        </div>
                      </td>

                      {/* Assignments */}
                      <td>
                        <div className="text-xs tabular-nums flex items-center gap-1.5 flex-wrap">
                          <span className="font-medium text-text">
                            {row.assignmentCompletion != null ? `${row.assignmentCompletion}%` : '—'}
                          </span>
                          {row.pendingAssignments > 0 && (
                            <span className="text-[11px] text-amber-600 dark:text-amber-400 font-medium">
                              ({row.pendingAssignments} pending)
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Overall Score */}
                      <td>
                        <span className={`font-bold text-sm tabular-nums ${scoreColor}`}>
                          {score != null ? `${score}%` : '—'}
                        </span>
                      </td>

                      {/* Actions */}
                      <td style={{ textAlign: 'right' }}>
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => setInspectStudent(row)}
                            className="px-2.5 py-1 rounded-md text-xs font-medium border border-border text-text hover:bg-bg-page transition-colors inline-flex items-center gap-1 shadow-2xs"
                          >
                            <FiEye size={12} className="text-text-muted" /> Scorecard
                          </button>
                          <button
                            type="button"
                            onClick={() => navigate(ROUTES.TEACHER_STUDENT(row.studentId))}
                            className="px-2.5 py-1 rounded-md text-xs font-medium bg-primary text-white hover:bg-primary-dark transition-colors inline-flex items-center gap-1 shadow-2xs"
                          >
                            Profile
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* ── Quick Student Scorecard Inspection Modal ── */}
      {inspectStudent && (
        <Modal
          open={!!inspectStudent}
          onClose={() => setInspectStudent(null)}
          title="Student Academic Scorecard"
          maxWidth="md"
        >
          <div className="p-1 space-y-4">
            {/* Header info */}
            <div className="flex items-center gap-3.5 pb-3 border-b border-slate-200 dark:border-slate-800">
              <Avatar name={inspectStudent.name} size="lg" className="!w-12 !h-12 !rounded-2xl" />
              <div>
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white leading-tight">
                  {inspectStudent.name}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-0.5">
                  ID: {inspectStudent.studentCode || inspectStudent.studentId}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="px-2 py-0.5 bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 text-xs font-semibold rounded-md border border-blue-100 dark:border-blue-900/50">
                    {inspectStudent.batch}
                  </span>
                  <span className="text-xs text-slate-400">·</span>
                  <span className="text-xs text-slate-600 dark:text-slate-300 font-medium">
                    {inspectStudent.course || 'Academic Course'}
                  </span>
                </div>
              </div>
            </div>

            {/* 4 Metric Boxes */}
            <div className="crm-tperf-inspect-grid">
              <div className="crm-tperf-inspect-box">
                <div className="crm-tperf-inspect-box__val text-blue-600 dark:text-blue-400">
                  {inspectStudent.overall != null ? `${inspectStudent.overall}%` : '—'}
                </div>
                <div className="crm-tperf-inspect-box__lbl">Overall Academic Standing</div>
              </div>
              <div className="crm-tperf-inspect-box">
                <div className="crm-tperf-inspect-box__val text-emerald-600 dark:text-emerald-400">
                  {inspectStudent.attendancePercent != null ? `${inspectStudent.attendancePercent}%` : '—'}
                </div>
                <div className="crm-tperf-inspect-box__lbl">Class Attendance Rate</div>
              </div>
              <div className="crm-tperf-inspect-box">
                <div className="crm-tperf-inspect-box__val text-indigo-600 dark:text-indigo-400">
                  {inspectStudent.averageTestPercent != null ? `${inspectStudent.averageTestPercent}%` : '—'}
                </div>
                <div className="crm-tperf-inspect-box__lbl">
                  Test Outcomes ({inspectStudent.testCount ?? 0} Taken)
                </div>
              </div>
              <div className="crm-tperf-inspect-box">
                <div className="crm-tperf-inspect-box__val text-amber-600 dark:text-amber-400">
                  {inspectStudent.assignmentCompletion != null ? `${inspectStudent.assignmentCompletion}%` : '—'}
                </div>
                <div className="crm-tperf-inspect-box__lbl">
                  Assignments ({inspectStudent.pendingAssignments ?? 0} Pending)
                </div>
              </div>
            </div>

            {/* Performance Analysis Assessment */}
            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-2xl">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1 flex items-center gap-1.5">
                <FiAward className="text-blue-600 dark:text-blue-400" /> Faculty Performance Assessment
              </h4>
              <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                {(inspectStudent.overall ?? 0) >= 90
                  ? 'Exemplary academic achievement! Student consistently demonstrates high attendance, solid examination results, and prompt submission of assignments.'
                  : (inspectStudent.overall ?? 0) >= 75
                  ? 'Consistent and reliable performance. Maintaining good class presence and solid grasp of academic modules.'
                  : 'Requires additional faculty support and academic monitoring to improve assignment submissions and attendance regularity.'}
              </p>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-200 dark:border-slate-800">
              <Button size="sm" variant="outline" onClick={() => setInspectStudent(null)}>
                Close
              </Button>
              <Button
                size="sm"
                variant="primary"
                onClick={() => {
                  const sid = inspectStudent.studentId;
                  setInspectStudent(null);
                  navigate(ROUTES.TEACHER_STUDENT(sid));
                }}
                className="flex items-center gap-1.5 font-bold"
              >
                <FiExternalLink size={13} />
                Open Full Student Profile
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
