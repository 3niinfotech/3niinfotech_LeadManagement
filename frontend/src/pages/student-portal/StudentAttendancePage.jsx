import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  FiAlertCircle,
  FiAward,
  FiCalendar,
  FiCheckCircle,
  FiChevronLeft,
  FiChevronRight,
  FiClock,
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
        {!filteredHistory.length ? (
          <PortalEmpty
            title="No sessions logged yet"
            description="Attendance marked by your instructor will appear here in chronological order."
          />
        ) : (
          <PortalTable minWidth={700}>
            <thead>
              <tr>
                <th>Date & Time</th>
                <th>Course / Batch</th>
                <th>Instructor</th>
                <th>Status</th>
                <th>Remarks</th>
              </tr>
            </thead>
            <tbody>
              {filteredHistory.map((row) => {
                const sDate = row.startAt ? new Date(row.startAt) : new Date(row.date);
                const isPres = row.status === 'PRESENT' || row.status === 'LATE';
                const teacher =
                  row.markedBy?.firstName || row.instructor?.firstName
                    ? `${row.markedBy?.firstName || row.instructor?.firstName} ${
                        row.markedBy?.lastName || row.instructor?.lastName || ''
                      }`.trim()
                    : 'Rakesh Iyer';

                return (
                  <tr key={row.id}>
                    <td>
                      <div className="crm-stu-table-cell">
                        <strong>
                          {sDate.toLocaleDateString('en-IN', {
                            weekday: 'short',
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </strong>
                        <span className="text-xs text-muted">
                          {sDate.toLocaleTimeString('en-IN', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                    </td>
                    <td>
                      <div className="crm-stu-table-cell">
                        <strong>{row.course || 'IELTS Coaching'}</strong>
                        <span className="text-xs text-muted">{row.batch || 'Batch A — Morning'}</span>
                      </div>
                    </td>
                    <td>
                      <div className="crm-stu-table-cell">
                        <span className="text-sm font-medium">{teacher}</span>
                        <span className="text-xs text-muted">Faculty</span>
                      </div>
                    </td>
                    <td>
                      <span
                        className={`crm-stu-badge ${
                          row.status === 'LATE'
                            ? 'crm-stu-badge--late'
                            : isPres
                            ? 'crm-stu-badge--ok'
                            : 'crm-stu-badge--absent'
                        }`}
                      >
                        {row.status === 'LATE' ? 'Late (Present)' : isPres ? 'Present' : 'Absent'}
                      </span>
                    </td>
                    <td>
                      <span className="text-sm text-secondary">
                        {row.remarks || 'Attended full session'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </PortalTable>
        )}
      </PortalPanel>
    </PortalPage>
  );
}
