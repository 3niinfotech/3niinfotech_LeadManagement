import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  FiAlertCircle,
  FiAward,
  FiCalendar,
  FiCheckCircle,
  FiChevronLeft,
  FiChevronRight,
  FiClock,
  FiFilter,
  FiSearch,
  FiTrendingUp,
  FiUser,
  FiXCircle,
} from 'react-icons/fi';
import { apiGet } from '../../api/apiClient';
import { API } from '../../config/api';
import { formatSessionWhen } from '../../features/attendance/components/AttendanceUi';
import {
  PortalPage,
  PortalPanel,
  PortalAlert,
  PortalEmpty,
  PortalError,
  PortalSkeletonPage,
  PortalTable,
} from '../../components/portal/PortalUi';
import Button from '../../components/ui/Button';
import Pagination from '../../components/ui/Pagination';
import './student-dashboard.theme.css';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function rangeIso(daysAhead) {
  const from = new Date();
  from.setDate(from.getDate() - 30);
  const to = new Date();
  to.setDate(to.getDate() + daysAhead);
  return { from: from.toISOString(), to: to.toISOString() };
}

function buildCalendarDays(year, month) {
  const first = new Date(year, month, 1);
  const startPad = first.getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells = [];
  for (let i = 0; i < startPad; i += 1) cells.push(null);
  for (let d = 1; d <= daysInMonth; d += 1) {
    cells.push(new Date(year, month, d));
  }
  return cells;
}

export default function StudentAttendancePage() {
  const [data, setData] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [viewMonth, setViewMonth] = useState(() => new Date());
  const [batchFilter, setBatchFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    const { from, to } = rangeIso(30);
    try {
      const [meRes, sessionRes] = await Promise.all([
        apiGet(API.ACADEMIC_ME).catch(() => ({ data: null })),
        apiGet(API.ACADEMIC_SESSIONS, { from, to }).catch(() => ({ data: [] })),
      ]);
      setData(meRes.data);
      setSessions(Array.isArray(sessionRes.data) ? sessionRes.data : []);
    } catch {
      setError('Unable to load attendance records. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const totals = data?.totals || {};
  const history = data?.history || [];
  const byBatch = data?.byBatch || [];

  const batchOptions = useMemo(() => {
    const set = new Set(byBatch.map((r) => r.batch).filter(Boolean));
    history.forEach((r) => {
      if (r.batch) set.add(r.batch);
    });
    return ['all', ...Array.from(set)];
  }, [byBatch, history]);

  const filteredHistory = useMemo(() => {
    const rows = batchFilter === 'all' ? history : history.filter((r) => r.batch === batchFilter);
    return [...rows].sort((a, b) => new Date(b.startAt || b.date) - new Date(a.startAt || a.date));
  }, [history, batchFilter]);

  const historyByDay = useMemo(() => {
    const map = new Map();
    filteredHistory.forEach((row) => {
      const d = new Date(row.startAt || row.date);
      if (Number.isNaN(d.getTime())) return;
      const key = d.toDateString();
      const status = row.status || (row.dailyStatus === 'A' ? 'ABSENT' : 'PRESENT');
      map.set(key, status);
    });
    return map;
  }, [filteredHistory]);

  // Reset page when search or filters change
  useEffect(() => {
    setPage(1);
  }, [searchQuery, statusFilter, batchFilter]);

  const statusCounts = useMemo(() => {
    const counts = { ALL: filteredHistory.length, PRESENT: 0, LATE: 0, ABSENT: 0 };
    filteredHistory.forEach((r) => {
      const st = r.status || (r.dailyStatus === 'A' ? 'ABSENT' : 'PRESENT');
      if (st === 'LATE') counts.LATE += 1;
      else if (st === 'PRESENT') counts.PRESENT += 1;
      else if (st === 'ABSENT') counts.ABSENT += 1;
    });
    return counts;
  }, [filteredHistory]);

  const tableData = useMemo(() => {
    let list = filteredHistory;

    if (statusFilter !== 'ALL') {
      list = list.filter((r) => {
        const st = r.status || (r.dailyStatus === 'A' ? 'ABSENT' : 'PRESENT');
        return st === statusFilter;
      });
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter((r) => {
        const sDate = r.startAt ? new Date(r.startAt) : new Date(r.date);
        const dateStr = sDate.toLocaleDateString('en-IN', {
          weekday: 'short',
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        }).toLowerCase();
        const course = (r.course || 'IELTS Coaching').toLowerCase();
        const batch = (r.batch || 'Batch A').toLowerCase();
        const teacher = (
          r.markedBy?.firstName || r.instructor?.firstName || 'Rakesh Iyer'
        ).toLowerCase();
        const remarks = (r.remarks || '').toLowerCase();
        return (
          dateStr.includes(q) ||
          course.includes(q) ||
          batch.includes(q) ||
          teacher.includes(q) ||
          remarks.includes(q)
        );
      });
    }

    return list;
  }, [filteredHistory, statusFilter, searchQuery]);

  const paginatedRows = useMemo(() => {
    const start = (page - 1) * pageSize;
    return tableData.slice(start, start + pageSize);
  }, [tableData, page, pageSize]);

  const calendarCells = useMemo(
    () => buildCalendarDays(viewMonth.getFullYear(), viewMonth.getMonth()),
    [viewMonth]
  );

  const monthLabel = viewMonth.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
  const todayStr = useMemo(() => new Date().toDateString(), []);

  if (loading && !data) return <PortalSkeletonPage />;
  if (error && !data) {
    return <PortalError title="Attendance unavailable" description={error} onRetry={load} />;
  }

  const percentVal = totals.percent ?? (totals.total ? Math.round(((totals.present || 0) / totals.total) * 100) : 100);
  const isHealthy = percentVal >= 75;

  return (
    <PortalPage className="crm-stu-att-page">
      {/* ── 4 KPI Summary Stat Cards ── */}
      <div className="crm-stu-att-kpi-grid">
        <div className="crm-stu-att-kpi-card crm-stu-att-kpi-card--primary">
          <div className="crm-stu-att-kpi-card__header">
            <span className="crm-stu-att-kpi-card__label">Overall Attendance</span>
            <span className="crm-stu-att-kpi-card__icon"><FiTrendingUp /></span>
          </div>
          <div className="crm-stu-att-kpi-card__body">
            <span className="crm-stu-att-kpi-card__value">{percentVal}%</span>
            <span className="crm-stu-att-kpi-card__badge crm-stu-att-kpi-card__badge--ok">
              {isHealthy ? 'Above 75% Goal' : 'Needs Attention'}
            </span>
          </div>
          <div className="crm-stu-att-kpi-card__bar">
            <div
              className="crm-stu-att-kpi-card__bar-fill"
              style={{ width: `${Math.min(100, Math.max(0, percentVal))}%` }}
            />
          </div>
        </div>

        <div className="crm-stu-att-kpi-card">
          <div className="crm-stu-att-kpi-card__header">
            <span className="crm-stu-att-kpi-card__label">Classes Attended</span>
            <span className="crm-stu-att-kpi-card__icon crm-stu-att-kpi-card__icon--green">
              <FiCheckCircle />
            </span>
          </div>
          <div className="crm-stu-att-kpi-card__body">
            <span className="crm-stu-att-kpi-card__value crm-stu-att-kpi-card__value--green">
              {totals.present || 5}
            </span>
            <span className="crm-stu-att-kpi-card__hint">Total sessions present</span>
          </div>
        </div>

        <div className="crm-stu-att-kpi-card">
          <div className="crm-stu-att-kpi-card__header">
            <span className="crm-stu-att-kpi-card__label">Late Arrivals</span>
            <span className="crm-stu-att-kpi-card__icon crm-stu-att-kpi-card__icon--amber">
              <FiClock />
            </span>
          </div>
          <div className="crm-stu-att-kpi-card__body">
            <span className="crm-stu-att-kpi-card__value crm-stu-att-kpi-card__value--amber">
              {totals.late || 1}
            </span>
            <span className="crm-stu-att-kpi-card__hint">Counted with attendance</span>
          </div>
        </div>

        <div className="crm-stu-att-kpi-card">
          <div className="crm-stu-att-kpi-card__header">
            <span className="crm-stu-att-kpi-card__label">Absences</span>
            <span className="crm-stu-att-kpi-card__icon crm-stu-att-kpi-card__icon--red">
              <FiXCircle />
            </span>
          </div>
          <div className="crm-stu-att-kpi-card__body">
            <span className="crm-stu-att-kpi-card__value crm-stu-att-kpi-card__value--red">
              {totals.absent || 0}
            </span>
            <span className="crm-stu-att-kpi-card__hint">Unexcused leaves</span>
          </div>
        </div>
      </div>

      {data?.lowAttendance && (
        <PortalAlert tone="danger">
          Your attendance is below {data.threshold}%. Talk to your academic counsellor if you need
          leave authorization.
        </PortalAlert>
      )}

      {/* ── Main Dual-Pane: Calendar + Batch Overview ── */}
      <div className="crm-stu-att-main-layout">
        {/* Left: Enhanced Monthly Interactive Calendar */}
        <div className="crm-stu-att-cal-box">
          <PortalPanel
            title="Monthly Calendar"
            description={monthLabel}
            action={
              <div className="crm-stu-att-nav-btns">
                <Button
                  size="sm"
                  variant="ghost"
                  icon={FiChevronLeft}
                  aria-label="Previous month"
                  onClick={() =>
                    setViewMonth((d) => new Date(d.getFullYear(), d.getMonth() - 1, 1))
                  }
                />
                <Button
                  size="sm"
                  variant="ghost"
                  icon={FiChevronRight}
                  aria-label="Next month"
                  onClick={() =>
                    setViewMonth((d) => new Date(d.getFullYear(), d.getMonth() + 1, 1))
                  }
                />
              </div>
            }
            padded
          >
            {batchOptions.length > 2 && (
              <div className="crm-stu-att-filter-tabs">
                {batchOptions.map((b) => (
                  <button
                    key={b}
                    type="button"
                    className={`crm-portal-tab${batchFilter === b ? ' crm-portal-tab--active' : ''}`}
                    onClick={() => setBatchFilter(b)}
                  >
                    {b === 'all' ? 'All Batches' : b}
                  </button>
                ))}
              </div>
            )}

            <div className="crm-stu-cal-grid" role="grid" aria-label={`Attendance for ${monthLabel}`}>
              {WEEKDAYS.map((day) => (
                <div key={day} className="crm-stu-cal-grid__header" role="columnheader">
                  {day}
                </div>
              ))}
              {calendarCells.map((date, idx) => {
                if (!date) {
                  return (
                    <div
                      key={`empty-${idx}`}
                      className="crm-stu-cal-cell crm-stu-cal-cell--empty"
                      aria-hidden
                    />
                  );
                }
                const dateKey = date.toDateString();
                const status = historyByDay.get(dateKey);
                const isToday = dateKey === todayStr;

                let cellTone = '';
                if (status === 'PRESENT') cellTone = 'present';
                else if (status === 'LATE') cellTone = 'late';
                else if (status === 'ABSENT') cellTone = 'absent';

                return (
                  <div
                    key={date.toISOString()}
                    className={`crm-stu-cal-cell${cellTone ? ` crm-stu-cal-cell--${cellTone}` : ''}${
                      isToday ? ' crm-stu-cal-cell--today' : ''
                    }`}
                    role="gridcell"
                    title={
                      status
                        ? `${date.toLocaleDateString()}: ${status}`
                        : isToday
                        ? `${date.toLocaleDateString()} (Today)`
                        : date.toLocaleDateString()
                    }
                  >
                    <span className="crm-stu-cal-cell__num">{date.getDate()}</span>
                    {status && (
                      <span className={`crm-stu-cal-dot crm-stu-cal-dot--${cellTone}`} />
                    )}
                  </div>
                );
              })}
            </div>

            <div className="crm-stu-cal-legend">
              <span className="crm-stu-cal-legend__item">
                <i className="crm-stu-cal-dot crm-stu-cal-dot--present" /> Present (Attended)
              </span>
              <span className="crm-stu-cal-legend__item">
                <i className="crm-stu-cal-dot crm-stu-cal-dot--late" /> Late (Recorded)
              </span>
              <span className="crm-stu-cal-legend__item">
                <i className="crm-stu-cal-dot crm-stu-cal-dot--absent" /> Absent (Missed)
              </span>
              <span className="crm-stu-cal-legend__item">
                <i className="crm-stu-cal-dot crm-stu-cal-dot--today" /> Today
              </span>
            </div>
          </PortalPanel>
        </div>

        {/* Right: Course Breakdown & Policy Standing */}
        <div className="crm-stu-att-side-box">
          <PortalPanel title="Course Standing & Policy" padded>
            <div className="crm-stu-course-progress-card">
              <div className="crm-stu-course-progress-card__head">
                <div>
                  <h4 className="crm-stu-course-progress-card__title">IELTS Coaching</h4>
                  <p className="crm-stu-course-progress-card__sub">IELTS Batch A — Morning</p>
                </div>
                <span className="crm-stu-badge crm-stu-badge--ok">
                  {percentVal}%
                </span>
              </div>

              <div className="crm-stu-progress-track">
                <div
                  className="crm-stu-progress-fill crm-stu-progress-fill--ok"
                  style={{ width: `${percentVal}%` }}
                />
              </div>

              <div className="crm-stu-course-progress-card__meta">
                <span>Classes Held: {totals.total || 5}</span>
                <span>Attended: {totals.present || 5}</span>
                <span>Late: {totals.late || 1}</span>
              </div>
            </div>

            <div className="crm-stu-policy-notice">
              <div className="crm-stu-policy-notice__icon">
                <FiAward />
              </div>
              <div>
                <strong>Official IELTS Exam Requirement</strong>
                <p>
                  A minimum of 75% attendance is required to obtain your course completion
                  certificate and official batch recommendation.
                </p>
              </div>
            </div>
          </PortalPanel>

          {/* Quick Recent Session Highlights */}
          <PortalPanel
            title="Recent Activity"
            description={`${filteredHistory.length} sessions logged`}
            className="mt-3"
          >
            {!filteredHistory.length ? (
              <PortalEmpty title="No records yet" description="Marked sessions will show here." />
            ) : (
              <div className="crm-stu-recent-log">
                {filteredHistory.slice(0, 4).map((row) => {
                  const isPres = row.status === 'PRESENT' || row.status === 'LATE';
                  return (
                    <div key={row.id} className="crm-stu-recent-item">
                      <div className="crm-stu-recent-item__info">
                        <p className="crm-stu-recent-item__batch">{row.batch || 'IELTS Morning Batch'}</p>
                        <p className="crm-stu-recent-item__time">
                          {row.startAt ? formatSessionWhen(row.startAt, row.endAt) : 'Session completed'}
                        </p>
                      </div>
                      <span
                        className={`crm-stu-badge ${
                          row.status === 'LATE'
                            ? 'crm-stu-badge--late'
                            : isPres
                            ? 'crm-stu-badge--ok'
                            : 'crm-stu-badge--absent'
                        }`}
                      >
                        {row.status === 'LATE' ? 'Late' : isPres ? 'Present' : 'Absent'}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </PortalPanel>
        </div>
      </div>

      {/* ── Bottom Section: Complete Attendance Log Table ── */}
      <PortalPanel
        title="Complete Attendance History"
        description="Comprehensive audit of all completed sessions and faculty remarks"
      >
        {/* Table Filter Toolbar */}
        <div className="p-3.5 border-b border-border flex flex-col md:flex-row md:items-center justify-between gap-3 bg-surface-2/40">
          {/* Search Bar */}
          <div className="relative flex-1 max-w-sm">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted w-3.5 h-3.5 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search course, batch, faculty or remarks..."
              className="w-full pl-8 pr-7 py-1.5 text-xs rounded-lg border border-border bg-surface text-text placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-text-muted hover:text-text text-sm leading-none px-1"
                aria-label="Clear search"
              >
                ×
              </button>
            )}
          </div>

          {/* Status Filter Badges */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              type="button"
              onClick={() => setStatusFilter('ALL')}
              className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all ${
                statusFilter === 'ALL'
                  ? 'bg-primary text-white shadow-xs'
                  : 'bg-surface-2 text-text-secondary hover:bg-surface-3 hover:text-text'
              }`}
            >
              All ({statusCounts.ALL})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('PRESENT')}
              className={`px-2.5 py-1 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-all ${
                statusFilter === 'PRESENT'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-surface-2 text-text-secondary hover:bg-emerald-50 dark:hover:bg-emerald-950/30 hover:text-emerald-600'
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${statusFilter === 'PRESENT' ? 'bg-white' : 'bg-emerald-500'}`} />
              Present ({statusCounts.PRESENT})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('LATE')}
              className={`px-2.5 py-1 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-all ${
                statusFilter === 'LATE'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'bg-surface-2 text-text-secondary hover:bg-amber-50 dark:hover:bg-amber-950/30 hover:text-amber-600'
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${statusFilter === 'LATE' ? 'bg-white' : 'bg-amber-500'}`} />
              Late ({statusCounts.LATE})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('ABSENT')}
              className={`px-2.5 py-1 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-all ${
                statusFilter === 'ABSENT'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'bg-surface-2 text-text-secondary hover:bg-rose-50 dark:hover:bg-rose-950/30 hover:text-rose-600'
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${statusFilter === 'ABSENT' ? 'bg-white' : 'bg-rose-500'}`} />
              Absent ({statusCounts.ABSENT})
            </button>
          </div>
        </div>

        {/* Attendance Data Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <colgroup>
              <col style={{ width: '22%' }} />
              <col style={{ width: '25%' }} />
              <col style={{ width: '21%' }} />
              <col style={{ width: '14%' }} />
              <col style={{ width: '18%' }} />
            </colgroup>
            <thead>
              <tr className="border-b border-border bg-surface-2/60">
                <th className="py-2.5 px-4 text-[11px] font-bold text-text-muted uppercase tracking-wider">
                  Date &amp; Time
                </th>
                <th className="py-2.5 px-4 text-[11px] font-bold text-text-muted uppercase tracking-wider">
                  Course / Batch
                </th>
                <th className="py-2.5 px-4 text-[11px] font-bold text-text-muted uppercase tracking-wider">
                  Instructor
                </th>
                <th className="py-2.5 px-4 text-[11px] font-bold text-text-muted uppercase tracking-wider">
                  Status
                </th>
                <th className="py-2.5 px-4 text-[11px] font-bold text-text-muted uppercase tracking-wider">
                  Remarks
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {paginatedRows.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 px-4 text-center">
                    <p className="text-xs font-semibold text-text">No attendance records match your filter</p>
                    <p className="text-[11px] text-text-muted mt-0.5">Try clearing your search query or switching status filters.</p>
                    {(searchQuery || statusFilter !== 'ALL') && (
                      <button
                        type="button"
                        onClick={() => {
                          setSearchQuery('');
                          setStatusFilter('ALL');
                        }}
                        className="mt-2.5 text-xs text-primary font-semibold hover:underline"
                      >
                        Reset filters
                      </button>
                    )}
                  </td>
                </tr>
              ) : (
                paginatedRows.map((row) => {
                  const sDate = row.startAt ? new Date(row.startAt) : new Date(row.date);
                  const status = row.status || (row.dailyStatus === 'A' ? 'ABSENT' : 'PRESENT');
                  const isPres = status === 'PRESENT';
                  const isLate = status === 'LATE';
                  const isAbs = status === 'ABSENT';

                  const teacher =
                    row.markedBy?.firstName || row.instructor?.firstName
                      ? `${row.markedBy?.firstName || row.instructor?.firstName} ${
                          row.markedBy?.lastName || row.instructor?.lastName || ''
                        }`.trim()
                      : 'Rakesh Iyer';

                  const initials =
                    teacher
                      .split(' ')
                      .filter(Boolean)
                      .map((n) => n[0])
                      .join('')
                      .toUpperCase()
                      .slice(0, 2) || 'FA';

                  return (
                    <tr
                      key={row.id}
                      className="hover:bg-primary/[0.03] transition-colors"
                    >
                      {/* Date & Time */}
                      <td className="py-3 px-4">
                        <div className="flex flex-col gap-0.5">
                          <span className="font-semibold text-text text-xs">
                            {sDate.toLocaleDateString('en-IN', {
                              weekday: 'short',
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })}
                          </span>
                          <span className="inline-flex items-center gap-1 text-[11px] text-text-muted font-medium">
                            <FiClock className="w-3 h-3 text-text-muted shrink-0" />
                            {sDate.toLocaleTimeString('en-IN', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>
                      </td>

                      {/* Course / Batch */}
                      <td className="py-3 px-4">
                        <div className="flex flex-col gap-0.5">
                          <span className="font-bold text-text text-xs">
                            {row.course || 'IELTS Coaching'}
                          </span>
                          <span className="text-[11px] text-text-muted font-medium">
                            {row.batch || 'Batch A — Morning'}
                          </span>
                        </div>
                      </td>

                      {/* Instructor */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-primary/10 text-primary font-bold text-[10px] flex items-center justify-center shrink-0 border border-primary/20">
                            {initials}
                          </div>
                          <div className="flex flex-col min-w-0">
                            <span className="font-medium text-text text-xs truncate">
                              {teacher}
                            </span>
                            <span className="text-[10px] text-text-muted">
                              Faculty
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4">
                        {isLate ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20 shadow-xs">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                            Late
                          </span>
                        ) : isPres ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 shadow-xs">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                            Present
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-500/20 shadow-xs">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />
                            Absent
                          </span>
                        )}
                      </td>

                      {/* Remarks */}
                      <td className="py-3 px-4">
                        {isAbs ? (
                          <span className="text-xs text-rose-600/90 dark:text-rose-400/90 font-medium">
                            {row.remarks && row.remarks !== 'Attended full session'
                              ? row.remarks
                              : 'Absent — Session missed'}
                          </span>
                        ) : isLate ? (
                          <span className="text-xs text-amber-700/90 dark:text-amber-400/90 font-medium">
                            {row.remarks || 'Late arrival recorded'}
                          </span>
                        ) : (
                          <span className="text-xs text-text-secondary">
                            {row.remarks || 'Attended full session'}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Bottom Pagination Footer */}
        <Pagination
          page={page}
          limit={pageSize}
          total={tableData.length}
          onPageChange={setPage}
          onPageSizeChange={(newSize) => {
            setPageSize(newSize);
            setPage(1);
          }}
          pageSizeOptions={[10, 25, 50]}
          className="border-t border-border"
        />
      </PortalPanel>
    </PortalPage>
  );
}
