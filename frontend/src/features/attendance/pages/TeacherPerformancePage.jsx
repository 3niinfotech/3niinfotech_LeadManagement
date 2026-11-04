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
          <div className="space-y-1">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Class Average</span>
            <div className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white tabular-nums">
              {avgPerf != null ? `${avgPerf}%` : '—'}
            </div>
            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              Optimal Standing
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-xl shrink-0">
            <FiAward />
          </div>
        </div>

        <div className="crm-tperf-kpi-card">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Enrolled Learners</span>
            <div className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white tabular-nums">
              {metrics.students ?? 0}
            </div>
            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-600 dark:text-blue-400">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
              Active Cohort
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center text-xl shrink-0">
            <FiUsers />
          </div>
        </div>

        <div className="crm-tperf-kpi-card">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Low Attendance (&lt;75%)</span>
            <div className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white tabular-nums">
              {metrics.lowAttendance ?? 0}
            </div>
            <span className={`inline-flex items-center gap-1 text-[11px] font-bold ${
              metrics.lowAttendance > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-slate-500 dark:text-slate-400'
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${metrics.lowAttendance > 0 ? 'bg-amber-500' : 'bg-slate-400'}`} />
              {metrics.lowAttendance > 0 ? 'Needs Attention' : 'Healthy Attendance'}
            </span>
          </div>
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl shrink-0 ${
            metrics.lowAttendance > 0
              ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
          }`}>
            <FiAlertTriangle />
          </div>
        </div>

        <div className="crm-tperf-kpi-card">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Pending Assignments</span>
            <div className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white tabular-nums">
              {metrics.pendingAssignments ?? 0}
            </div>
            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-600 dark:text-indigo-400">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
              Tasks for Evaluation
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center text-xl shrink-0">
            <FiFileText />
          </div>
        </div>
      </div>

      {/* ── Filter & Search Toolbar ── */}
      <div className="crm-tperf-toolbar">
        <div className="flex flex-wrap items-center gap-3 flex-1 min-w-0">
          {/* Search Box */}
          <div className="crm-tperf-search">
            <FiSearch className="text-slate-400 shrink-0" size={15} />
            <input
              type="text"
              placeholder="Search by student name, ID or batch..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {/* Batch Selector Pills */}
          <div className="crm-tperf-filters">
            <button
              type="button"
              className={`crm-tperf-pill ${selectedBatch === 'ALL' ? 'is-active' : ''}`}
              onClick={() => setSelectedBatch('ALL')}
            >
              All Batches
            </button>
            {batchList.map((batchName) => (
              <button
                key={batchName}
                type="button"
                className={`crm-tperf-pill ${selectedBatch === batchName ? 'is-active' : ''}`}
                onClick={() => setSelectedBatch(batchName)}
              >
                {batchName}
              </button>
            ))}

            <div className="h-4 w-px bg-slate-200 dark:bg-slate-700 mx-1 hidden sm:block" />

            {/* Performance Tier Pills */}
            <button
              type="button"
              className={`crm-tperf-pill ${scoreTier === 'ALL' ? 'is-active' : ''}`}
              onClick={() => setScoreTier('ALL')}
            >
              All Tiers
            </button>
            <button
              type="button"
              className={`crm-tperf-pill ${scoreTier === 'TOP' ? 'is-active' : ''}`}
              onClick={() => setScoreTier('TOP')}
            >
              Top (≥90%)
            </button>
            <button
              type="button"
              className={`crm-tperf-pill ${scoreTier === 'GOOD' ? 'is-active' : ''}`}
              onClick={() => setScoreTier('GOOD')}
            >
              Good (75-89%)
            </button>
            <button
              type="button"
              className={`crm-tperf-pill ${scoreTier === 'RISK' ? 'is-active' : ''}`}
              onClick={() => setScoreTier('RISK')}
            >
              At Risk (&lt;75%)
            </button>

            {/* Sort Selector */}
            <div className="w-44 ml-1">
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
          </div>
        </div>

        {/* Toolbar Secondary Action Buttons */}
        <div className="flex items-center gap-2 shrink-0 ml-auto">
          <Button
            size="sm"
            variant="outline"
            onClick={() => navigate(ROUTES.TEACHER_STUDENTS)}
            className="flex items-center gap-1.5 shadow-xs font-semibold rounded-xl"
            title="Navigate to enrolled students roster"
          >
            <FiUsers size={13} />
            View Students
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 shadow-xs font-semibold rounded-xl"
          >
            <FiDownload size={13} />
            Export CSV
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={() => load(true)}
            disabled={isRefreshing}
            className="flex items-center justify-center p-2 shadow-xs rounded-xl"
            title="Refresh performance analytics"
          >
            <FiRefreshCw size={13} className={isRefreshing ? 'animate-spin' : ''} />
          </Button>
        </div>
      </div>

      {/* ── Split Layout: Left Batch Analysis, Right Academic Leaderboard ── */}
      <div className="crm-tperf-layout">
        {/* ── Left Column: By Batch Performance ── */}
        <div className="crm-tperf-panel">
          <div className="crm-tperf-panel__header">
            <h3 className="crm-tperf-panel__title">
              <FiLayers className="text-blue-600 dark:text-blue-400" />
              Batch Performance Breakdown
            </h3>
            <span className="text-xs font-bold text-slate-400 dark:text-slate-500">
              {courseTrend.length} {courseTrend.length === 1 ? 'Batch' : 'Batches'}
            </span>
          </div>

          <div className="crm-tperf-panel__body">
            {!courseTrend.length ? (
              <EmptyState
                title="No batch analytics"
                description="Performance appears once batches and students are active."
              />
            ) : (
              courseTrend.map((row) => {
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
                    <div className="crm-tperf-batch-card__head">
                      <div>
                        <h4 className="crm-tperf-batch-card__name">{row.batch}</h4>
                        <p className="crm-tperf-batch-card__sub">
                          {row.course || 'Academic Course'} · {row.students} students enrolled
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="crm-tperf-batch-card__score">
                          {row.averagePerformance != null ? `${row.averagePerformance}%` : '—'}
                        </span>
                      </div>
                    </div>

                    <div className="crm-tperf-progress-wrap">
                      <div className="crm-tperf-progress-bar">
                        <div
                          className={`crm-tperf-progress-fill ${fillClass}`}
                          style={{ width: `${Math.min(100, pct)}%` }}
                        />
                      </div>
                    </div>

                    <div className="crm-tperf-batch-card__meta">
                      <span className="font-semibold text-slate-600 dark:text-slate-400">
                        {pct >= 90 ? '🌟 Exceptional standing' : pct >= 75 ? '✓ On Track' : '⚠ Action required'}
                      </span>
                      <button
                        type="button"
                        className="text-blue-600 dark:text-blue-400 hover:underline font-bold flex items-center gap-1"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(ROUTES.TEACHER_BATCH_DETAIL(row.batchId));
                        }}
                      >
                        Open Class <FiArrowUpRight size={12} />
                      </button>
                    </div>
                  </div>
                );
              })
            )}

            {/* Quick Helper Tip */}
            <div className="mt-3 p-3.5 bg-blue-50/70 dark:bg-blue-950/30 rounded-2xl border border-blue-100 dark:border-blue-900/40 flex items-start gap-2.5">
              <FiTrendingUp className="text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" size={16} />
              <div className="text-[12px] text-blue-900 dark:text-blue-200 leading-relaxed">
                <strong>Faculty Insight:</strong> Overall score aggregates live attendance records,
                test results, and evaluated assignments across all registered learners.
              </div>
            </div>
          </div>
        </div>

        {/* ── Right Column: Academic Student Leaderboard ── */}
        <div className="crm-tperf-panel">
          <div className="crm-tperf-panel__header">
            <div className="flex items-center gap-2">
              <h3 className="crm-tperf-panel__title">
                <FiAward className="text-amber-500" />
                Student Academic Leaderboard
              </h3>
              {selectedBatch !== 'ALL' && (
                <span className="text-[11px] font-bold text-blue-700 dark:text-blue-300 bg-blue-100/70 dark:bg-blue-950/60 px-2.5 py-0.5 rounded-full border border-blue-200/50">
                  Batch: {selectedBatch}
                </span>
              )}
            </div>
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
              Showing {filteredStudents.length} of {rawStudents.length} Students
            </span>
          </div>

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
                    <th style={{ width: '72px' }}>Rank</th>
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
                    let scoreClass = 'crm-tperf-score-pill--high';
                    if (score == null) scoreClass = 'crm-tperf-score-pill--mid';
                    else if (score < 70) scoreClass = 'crm-tperf-score-pill--low';
                    else if (score < 85) scoreClass = 'crm-tperf-score-pill--mid';

                    let rankBadge;
                    if (idx === 0) {
                      rankBadge = (
                        <span className="crm-tperf-rank-pill crm-tperf-rank-pill--1">
                          <span>🥇</span>
                          <span>#1</span>
                        </span>
                      );
                    } else if (idx === 1) {
                      rankBadge = (
                        <span className="crm-tperf-rank-pill crm-tperf-rank-pill--2">
                          <span>🥈</span>
                          <span>#2</span>
                        </span>
                      );
                    } else if (idx === 2) {
                      rankBadge = (
                        <span className="crm-tperf-rank-pill crm-tperf-rank-pill--3">
                          <span>🥉</span>
                          <span>#3</span>
                        </span>
                      );
                    } else {
                      rankBadge = (
                        <span className="crm-tperf-rank-pill crm-tperf-rank-pill--other font-mono">
                          #{idx + 1}
                        </span>
                      );
                    }

                    return (
                      <tr key={row.studentId}>
                        {/* Rank */}
                        <td>
                          {rankBadge}
                        </td>

                        {/* Student Name + Code + Batch */}
                        <td>
                          <div className="crm-tperf-student-cell">
                            <Avatar name={row.name} size="sm" className="!w-9 !h-9 !rounded-xl" />
                            <div className="min-w-0">
                              <button
                                type="button"
                                className="crm-tperf-student-name text-left hover:text-blue-600 dark:hover:text-blue-400 transition-colors block truncate"
                                onClick={() => setInspectStudent(row)}
                              >
                                {row.name}
                              </button>
                              <div className="crm-tperf-student-meta">
                                <span className="font-mono text-[11px] text-slate-500 dark:text-slate-400 font-semibold">
                                  {row.studentCode || 'N/A'}
                                </span>
                                <span>•</span>
                                <span className="truncate max-w-[160px] text-slate-600 dark:text-slate-400">{row.batch}</span>
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Attendance % */}
                        <td>
                          <div className="flex items-center gap-1.5">
                            <span
                              className={`w-2 h-2 rounded-full shrink-0 ${
                                (row.attendancePercent ?? 0) >= 75 ? 'bg-emerald-500' : 'bg-amber-500'
                              }`}
                            />
                            <span className="font-bold text-slate-700 dark:text-slate-200 tabular-nums">
                              {row.attendancePercent != null ? `${row.attendancePercent}%` : '—'}
                            </span>
                          </div>
                        </td>

                        {/* Tests */}
                        <td>
                          <div className="tabular-nums">
                            <span className="font-semibold text-slate-800 dark:text-slate-200">
                              {row.averageTestPercent != null ? `${row.averageTestPercent}%` : '—'}
                            </span>
                            <span className="text-[11px] text-slate-400 ml-1">
                              ({row.testCount ?? 0} {row.testCount === 1 ? 'test' : 'tests'})
                            </span>
                          </div>
                        </td>

                        {/* Assignments */}
                        <td>
                          <div className="tabular-nums flex items-center gap-1.5 flex-wrap">
                            <span className="font-semibold text-slate-800 dark:text-slate-200">
                              {row.assignmentCompletion != null ? `${row.assignmentCompletion}%` : '—'}
                            </span>
                            {row.pendingAssignments > 0 && (
                              <span className="text-[10px] text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-1.5 py-0.5 rounded-full font-bold border border-amber-200/60 dark:border-amber-900/40">
                                {row.pendingAssignments} pending
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Overall Score */}
                        <td>
                          <div className={`crm-tperf-score-pill ${scoreClass}`}>
                            {score != null ? `${score}%` : '—'}
                          </div>
                        </td>

                        {/* Actions */}
                        <td style={{ textAlign: 'right' }}>
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => setInspectStudent(row)}
                              className="px-2.5 py-1.5 rounded-lg text-xs font-semibold border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors inline-flex items-center gap-1 shadow-2xs"
                            >
                              <FiEye size={12} className="text-slate-400" /> Scorecard
                            </button>
                            <button
                              type="button"
                              onClick={() => navigate(ROUTES.TEACHER_STUDENT(row.studentId))}
                              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-primary text-white hover:bg-primary-dark transition-colors inline-flex items-center gap-1 shadow-xs"
                            >
                              <FiExternalLink size={12} /> Profile
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
