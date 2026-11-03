import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  FiBarChart2,
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
  FiMail,
} from 'react-icons/fi';
import Button from '../../../components/ui/Button';
import Avatar from '../../../components/ui/Avatar';
import Modal from '../../../components/ui/Modal';
import Select from '../../../components/ui/Select';
import SummaryStatBar from '../../../components/ui/SummaryStatBar';
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

  const summaryItems = useMemo(() => [
    {
      key: 'avg',
      label: 'Overall Class Average',
      value: avgPerf != null ? `${avgPerf}%` : '—',
      icon: FiAward,
      tone: 'success',
      filterValue: 'ALL',
      badge: 'Optimal',
      badgeTone: 'bg-emerald-50 text-emerald-700',
    },
    {
      key: 'students',
      label: 'Enrolled Learners',
      value: metrics.students ?? 0,
      icon: FiUsers,
      tone: 'primary',
      filterValue: 'ALL',
      badge: 'Active Roster',
      badgeTone: 'bg-blue-50 text-blue-700',
    },
    {
      key: 'risk',
      label: 'Low Attendance (<75%)',
      value: metrics.lowAttendance ?? 0,
      icon: FiAlertTriangle,
      tone: metrics.lowAttendance > 0 ? 'warning' : 'neutral',
      filterValue: 'RISK',
      badge: metrics.lowAttendance > 0 ? 'Attention' : 'Healthy',
      badgeTone: metrics.lowAttendance > 0 ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-600',
    },
    {
      key: 'pending',
      label: 'Pending Assignments',
      value: metrics.pendingAssignments ?? 0,
      icon: FiFileText,
      tone: metrics.pendingAssignments > 0 ? 'info' : 'neutral',
      filterValue: 'ALL',
      badge: 'Submissions',
      badgeTone: 'bg-cyan-50 text-cyan-700',
    },
  ], [avgPerf, metrics]);

  if (loading && !data) {
    return <ContentLoader variant="dashboard" />;
  }

  return (
    <div className="crm-tperf">
      {/* ── Summary KPI Strip (Standard CRM UI) ── */}
      <div className="rounded-xl border border-border bg-card-bg shadow-xs overflow-hidden">
        <SummaryStatBar
          items={summaryItems}
          activeFilter={scoreTier === 'RISK' ? 'RISK' : 'ALL'}
          onSelect={(val) => setScoreTier(val === 'RISK' ? 'RISK' : 'ALL')}
          layout="grid"
          ariaLabel="Performance Statistics"
        />
      </div>

      {/* ── Filter & Search Toolbar ── */}
      <div className="crm-tperf-toolbar flex flex-wrap items-center justify-between gap-2.5">
        <div className="flex flex-wrap items-center gap-2 flex-1 min-w-0">
          {/* Search */}
          <div className="crm-tperf-search">
            <FiSearch className="text-slate-400" size={15} />
            <input
              type="text"
              placeholder="Search by student name, ID or batch..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {/* Batch & Score Filter Pills */}
          <div className="crm-tperf-filters">
            <span className="text-xs font-semibold text-slate-500 mr-1">Batch:</span>
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

            <div className="h-4 w-px bg-slate-200 mx-1 hidden sm:block" />

            {/* Performance Tier */}
            <span className="text-xs font-semibold text-slate-500 mr-1 hidden sm:inline">Tier:</span>
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

        <div className="flex items-center gap-2 shrink-0 ml-auto">
          <Button
            size="sm"
            variant="outline"
            onClick={() => navigate(ROUTES.TEACHER_STUDENTS)}
            className="flex items-center gap-1.5 shadow-xs font-semibold"
            title="Navigate to enrolled students roster"
          >
            <FiUsers size={13} />
            View Students
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 shadow-xs font-semibold"
          >
            <FiDownload size={13} />
            Export CSV
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={() => load(true)}
            disabled={isRefreshing}
            className="flex items-center justify-center p-2 shadow-xs"
            title="Refresh performance analytics"
          >
            <FiRefreshCw size={13} className={isRefreshing ? 'animate-spin' : ''} />
          </Button>
        </div>
      </div>

      {/* ── Split Layout: Left Batch Analysis, Right Comprehensive Leaderboard ── */}
      <div className="crm-tperf-layout">
        {/* ── Left Column: By Batch Performance ── */}
        <div className="crm-tperf-panel">
          <div className="crm-tperf-panel__header">
            <h3 className="crm-tperf-panel__title">
              <FiLayers className="text-blue-600" />
              Batch Performance Breakdown
            </h3>
            <span className="text-xs font-bold text-slate-400">
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
                    className={`crm-tperf-batch-card cursor-pointer transition-all ${
                      isSelected ? 'ring-2 ring-blue-500 bg-blue-50/30' : ''
                    }`}
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
                      <span className="font-semibold text-slate-600">
                        {pct >= 90 ? '🌟 Exceptional standing' : pct >= 75 ? '✓ On Track' : '⚠ Action required'}
                      </span>
                      <button
                        type="button"
                        className="text-blue-600 hover:text-blue-800 font-bold flex items-center gap-1"
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
              })
            )}

            {/* Quick Helper Tip */}
            <div className="mt-3 p-3 bg-blue-50/60 rounded-xl border border-blue-100 flex items-start gap-2.5">
              <FiTrendingUp className="text-blue-600 shrink-0 mt-0.5" size={16} />
              <div className="text-[12px] text-blue-900 leading-relaxed">
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
                <span className="text-[11px] font-bold text-blue-700 bg-blue-100/70 px-2 py-0.5 rounded-full">
                  Batch: {selectedBatch}
                </span>
              )}
            </div>
            <span className="text-xs font-bold text-slate-500">
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
                    <th style={{ width: '68px' }}>Rank</th>
                    <th>Student Details</th>
                    <th>Attendance</th>
                    <th>Tests</th>
                    <th>Assignments</th>
                    <th>Overall Score</th>
                    <th style={{ width: '130px', textAlign: 'right' }}>Actions</th>
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
                        <span className="crm-tperf-rank-badge crm-tperf-rank-badge--1">
                          <span>🥇</span>
                          <span>1</span>
                        </span>
                      );
                    } else if (idx === 1) {
                      rankBadge = (
                        <span className="crm-tperf-rank-badge crm-tperf-rank-badge--2">
                          <span>🥈</span>
                          <span>2</span>
                        </span>
                      );
                    } else if (idx === 2) {
                      rankBadge = (
                        <span className="crm-tperf-rank-badge crm-tperf-rank-badge--3">
                          <span>🥉</span>
                          <span>3</span>
                        </span>
                      );
                    } else {
                      rankBadge = (
                        <span className="crm-tperf-rank-badge crm-tperf-rank-badge--other font-mono">
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
                            <Avatar name={row.name} size="sm" />
                            <div className="min-w-0">
                              <button
                                type="button"
                                className="crm-tperf-student-name text-left hover:text-blue-600 transition-colors"
                                onClick={() => setInspectStudent(row)}
                              >
                                {row.name}
                              </button>
                              <div className="crm-tperf-student-meta">
                                <span className="font-mono text-[11px] text-slate-500 font-semibold">
                                  {row.studentCode || 'N/A'}
                                </span>
                                <span>•</span>
                                <span className="truncate max-w-[150px]">{row.batch}</span>
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
                            <span className="font-bold text-slate-700 tabular-nums">
                              {row.attendancePercent != null ? `${row.attendancePercent}%` : '—'}
                            </span>
                          </div>
                        </td>

                        {/* Tests */}
                        <td>
                          <div className="tabular-nums">
                            <span className="font-semibold text-slate-700">
                              {row.averageTestPercent != null ? `${row.averageTestPercent}%` : '—'}
                            </span>
                            <span className="text-[11px] text-slate-400 ml-1">
                              ({row.testCount ?? 0} {row.testCount === 1 ? 'test' : 'tests'})
                            </span>
                          </div>
                        </td>

                        {/* Assignments */}
                        <td>
                          <div className="tabular-nums">
                            <span className="font-semibold text-slate-700">
                              {row.assignmentCompletion != null ? `${row.assignmentCompletion}%` : '—'}
                            </span>
                            {row.pendingAssignments > 0 && (
                              <span className="text-[10px] text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded font-bold ml-1 border border-amber-200">
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
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'flex-end',
                              gap: '8px',
                            }}
                          >
                            <Button
                              size="xs"
                              variant="outline"
                              onClick={() => setInspectStudent(row)}
                              className="flex items-center gap-1.5 px-3 py-1.5 font-semibold text-xs whitespace-nowrap shadow-xs rounded-lg"
                            >
                              <FiEye size={12} /> Inspect
                            </Button>
                            <Button
                              size="xs"
                              variant="primary"
                              onClick={() => navigate(ROUTES.TEACHER_STUDENT(row.studentId))}
                              className="flex items-center gap-1.5 px-3.5 py-1.5 font-semibold text-xs whitespace-nowrap shadow-xs rounded-lg"
                            >
                              <FiExternalLink size={12} /> Profile
                            </Button>
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
          <div className="p-1">
            {/* Header info */}
            <div className="flex items-center gap-3.5 pb-3 border-b border-slate-200">
              <Avatar name={inspectStudent.name} size="lg" />
              <div>
                <h3 className="text-base font-extrabold text-slate-900 leading-tight">
                  {inspectStudent.name}
                </h3>
                <p className="text-xs text-slate-500 font-mono mt-0.5">
                  ID: {inspectStudent.studentCode || inspectStudent.studentId}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="px-2 py-0.5 bg-blue-50 text-blue-700 text-xs font-semibold rounded border border-blue-100">
                    {inspectStudent.batch}
                  </span>
                  <span className="text-xs text-slate-400">·</span>
                  <span className="text-xs text-slate-600 font-medium">
                    {inspectStudent.course || 'Academic Course'}
                  </span>
                </div>
              </div>
            </div>

            {/* 4 Metric Boxes */}
            <div className="crm-tperf-inspect-grid">
              <div className="crm-tperf-inspect-box">
                <div className="crm-tperf-inspect-box__val text-blue-600">
                  {inspectStudent.overall != null ? `${inspectStudent.overall}%` : '—'}
                </div>
                <div className="crm-tperf-inspect-box__lbl">Overall Academic Standing</div>
              </div>
              <div className="crm-tperf-inspect-box">
                <div className="crm-tperf-inspect-box__val text-emerald-600">
                  {inspectStudent.attendancePercent != null ? `${inspectStudent.attendancePercent}%` : '—'}
                </div>
                <div className="crm-tperf-inspect-box__lbl">Class Attendance Rate</div>
              </div>
              <div className="crm-tperf-inspect-box">
                <div className="crm-tperf-inspect-box__val text-indigo-600">
                  {inspectStudent.averageTestPercent != null ? `${inspectStudent.averageTestPercent}%` : '—'}
                </div>
                <div className="crm-tperf-inspect-box__lbl">
                  Test Outcomes ({inspectStudent.testCount ?? 0} Taken)
                </div>
              </div>
              <div className="crm-tperf-inspect-box">
                <div className="crm-tperf-inspect-box__val text-amber-600">
                  {inspectStudent.assignmentCompletion != null ? `${inspectStudent.assignmentCompletion}%` : '—'}
                </div>
                <div className="crm-tperf-inspect-box__lbl">
                  Assignments ({inspectStudent.pendingAssignments ?? 0} Pending)
                </div>
              </div>
            </div>

            {/* Performance Analysis Assessment */}
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl mb-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1 flex items-center gap-1.5">
                <FiAward className="text-blue-600" /> Faculty Performance Assessment
              </h4>
              <p className="text-xs text-slate-700 leading-relaxed">
                {(inspectStudent.overall ?? 0) >= 90
                  ? 'Exemplary academic achievement! Student consistently demonstrates high attendance, solid examination results, and prompt submission of assignments.'
                  : (inspectStudent.overall ?? 0) >= 75
                  ? 'Consistent and reliable performance. Maintaining good class presence and solid grasp of academic modules.'
                  : 'Requires additional faculty support and academic monitoring to improve assignment submissions and attendance regularity.'}
              </p>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-200">
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
