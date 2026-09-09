import { useCallback, useEffect, useMemo, useState } from 'react';
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi';
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
  PortalBadge,
  PortalTable,
} from '../../components/portal/PortalUi';
import Button from '../../components/ui/Button';

const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

function rangeIso(daysAhead) {
  const from = new Date();
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

function DailyBadge({ value }) {
  const present = value === 'P';
  return (
    <PortalBadge tone={present ? 'success' : 'danger'}>
      {value || '—'}
    </PortalBadge>
  );
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
    const { from, to } = rangeIso(60);
    try {
      const [meRes, sessionRes] = await Promise.all([
        apiGet(API.ACADEMIC_ME).catch(() => ({ data: null })),
        apiGet(API.ACADEMIC_SESSIONS, { from, to }).catch(() => ({ data: [] })),
      ]);
      setData(meRes.data);
      setSessions(Array.isArray(sessionRes.data) ? sessionRes.data : []);
    } catch {
      setError('Unable to load attendance. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const totals = data?.totals || {};
  const history = data?.history || [];
  const byBatch = data?.byBatch || [];

  const batchOptions = useMemo(() => {
    const set = new Set(byBatch.map((r) => r.batch).filter(Boolean));
    history.forEach((r) => { if (r.batch) set.add(r.batch); });
    return ['all', ...Array.from(set)];
  }, [byBatch, history]);

  const filteredHistory = useMemo(() => {
    const rows = batchFilter === 'all'
      ? history
      : history.filter((r) => r.batch === batchFilter);
    return [...rows].sort((a, b) => new Date(b.startAt || b.date) - new Date(a.startAt || a.date));
  }, [history, batchFilter]);

  const historyByDay = useMemo(() => {
    const map = new Map();
    filteredHistory.forEach((row) => {
      const d = new Date(row.startAt || row.date);
      if (Number.isNaN(d.getTime())) return;
      const key = d.toDateString();
      const status = row.dailyStatus || (row.status === 'ABSENT' ? 'A' : 'P');
      map.set(key, status);
    });
    return map;
  }, [filteredHistory]);

  const calendarCells = useMemo(
    () => buildCalendarDays(viewMonth.getFullYear(), viewMonth.getMonth()),
    [viewMonth],
  );

  const monthLabel = viewMonth.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' });

  if (loading && !data) return <PortalSkeletonPage />;
  if (error && !data) {
    return <PortalError title="Attendance unavailable" description={error} onRetry={load} />;
  }

  return (
    <PortalPage className="crm-stu-att">
      <div className="crm-stu-att-strip" role="group" aria-label="Attendance summary">
        <div className="crm-stu-att-strip__item">
          <span className="crm-stu-att-strip__label">Overall</span>
          <span className="crm-stu-att-strip__value">{totals.percent ?? 0}%</span>
        </div>
        <div className="crm-stu-att-strip__item">
          <span className="crm-stu-att-strip__label">Present</span>
          <span className="crm-stu-att-strip__value crm-stu-att-strip__value--ok">{totals.present || 0}</span>
        </div>
        <div className="crm-stu-att-strip__item">
          <span className="crm-stu-att-strip__label">Absent</span>
          <span className="crm-stu-att-strip__value crm-stu-att-strip__value--bad">{totals.absent || 0}</span>
        </div>
        <div className="crm-stu-att-strip__item">
          <span className="crm-stu-att-strip__label">Marked</span>
          <span className="crm-stu-att-strip__value">{totals.total || 0}</span>
        </div>
      </div>

      {data?.lowAttendance && (
        <PortalAlert tone="danger">
          Attendance is below {data.threshold}%. Talk to your counsellor if you need support.
        </PortalAlert>
      )}

      <div className="crm-stu-att-layout">
        <PortalPanel
          title="Calendar"
          description={monthLabel}
          action={(
            <div className="crm-stu-att-nav">
              <Button
                size="sm"
                variant="ghost"
                icon={FiChevronLeft}
                aria-label="Previous month"
                onClick={() => setViewMonth((d) => new Date(d.getFullYear(), d.getMonth() - 1, 1))}
              />
              <Button
                size="sm"
                variant="ghost"
                icon={FiChevronRight}
                aria-label="Next month"
                onClick={() => setViewMonth((d) => new Date(d.getFullYear(), d.getMonth() + 1, 1))}
              />
            </div>
          )}
          padded
        >
          {batchOptions.length > 2 && (
            <div className="crm-stu-att-filters">
              {batchOptions.map((b) => (
                <button
                  key={b}
                  type="button"
                  className={`crm-portal-tab${batchFilter === b ? ' crm-portal-tab--active' : ''}`}
                  onClick={() => setBatchFilter(b)}
                >
                  {b === 'all' ? 'All' : b}
                </button>
              ))}
            </div>
          )}

          <div className="crm-portal-att-cal" role="grid" aria-label={`Attendance for ${monthLabel}`}>
            {WEEKDAYS.map((day, i) => (
              <div key={`${day}-${i}`} className="crm-portal-att-cal__head" role="columnheader">{day}</div>
            ))}
            {calendarCells.map((date, idx) => {
              if (!date) {
                return <div key={`empty-${idx}`} className="crm-portal-att-cal__day crm-portal-att-cal__day--empty" aria-hidden />;
              }
              const status = historyByDay.get(date.toDateString());
              const tone = status === 'P' ? 'present' : status === 'A' ? 'absent' : '';
              return (
                <div
                  key={date.toISOString()}
                  className={`crm-portal-att-cal__day${tone ? ` crm-portal-att-cal__day--${tone}` : ''}`}
                  role="gridcell"
                  title={status ? `${date.toLocaleDateString()} — ${status === 'P' ? 'Present' : 'Absent'}` : date.toLocaleDateString()}
                >
                  <span className="crm-portal-att-cal__num">{date.getDate()}</span>
                  {status && (
                    <span className={`crm-portal-att-cal__dot crm-portal-att-cal__dot--${status === 'P' ? 'p' : 'a'}`} />
                  )}
                </div>
              );
            })}
          </div>

          <div className="crm-stu-att-legend">
            <span><i className="crm-portal-att-cal__dot crm-portal-att-cal__dot--p" /> Present</span>
            <span><i className="crm-portal-att-cal__dot crm-portal-att-cal__dot--a" /> Absent</span>
          </div>
        </PortalPanel>

        <div className="crm-stu-att-side">
          {byBatch.length > 0 && (
            <PortalPanel title="By batch">
              <PortalTable minWidth={420}>
                <thead>
                  <tr>
                    <th>Batch</th>
                    <th>P</th>
                    <th>A</th>
                    <th>%</th>
                  </tr>
                </thead>
                <tbody>
                  {byBatch.map((row) => (
                    <tr key={row.batchId || row.batch}>
                      <td>
                        <div className="crm-stu-att-batch">
                          <strong>{row.batch}</strong>
                          {row.course && <span>{row.course}</span>}
                        </div>
                      </td>
                      <td>{row.present}</td>
                      <td>{row.absent}</td>
                      <td><strong>{row.percent}%</strong></td>
                    </tr>
                  ))}
                </tbody>
              </PortalTable>
            </PortalPanel>
          )}

          <PortalPanel title="Recent" description={`${filteredHistory.length} marked`}>
            {!filteredHistory.length ? (
              <PortalEmpty title="No records yet" description="Marked sessions will show here." />
            ) : (
              <ul className="crm-stu-att-list">
                {filteredHistory.slice(0, 8).map((row) => {
                  const mark = row.dailyStatus || (row.status === 'ABSENT' ? 'A' : 'P');
                  return (
                    <li key={row.id} className="crm-stu-att-list__item">
                      <div className="min-w-0">
                        <p className="crm-stu-att-list__title">{row.batch || 'Class'}</p>
                        <p className="crm-stu-att-list__meta">
                          {row.startAt ? formatSessionWhen(row.startAt, row.endAt) : '—'}
                          {row.course ? ` · ${row.course}` : ''}
                        </p>
                      </div>
                      <DailyBadge value={mark} />
                    </li>
                  );
                })}
              </ul>
            )}
          </PortalPanel>
        </div>
      </div>

      {sessions.length > 0 && (
        <PortalPanel title="Upcoming classes">
          <PortalTable minWidth={480}>
            <thead>
              <tr>
                <th>When</th>
                <th>Batch</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {sessions.slice(0, 8).map((row) => (
                <tr key={row.id}>
                  <td>{row.startAt ? formatSessionWhen(row.startAt, row.endAt) : '—'}</td>
                  <td>{row.batch?.name || row.batch?.courseName || '—'}</td>
                  <td>{row.window?.state?.replace(/_/g, ' ') || row.status || '—'}</td>
                </tr>
              ))}
            </tbody>
          </PortalTable>
        </PortalPanel>
      )}
    </PortalPage>
  );
}
