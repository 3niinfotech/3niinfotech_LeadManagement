import { Link } from 'react-router-dom';
import {
  FiAlertCircle,
  FiArrowLeft,
  FiCheck,
  FiClock,
  FiLock,
  FiMapPin,
  FiUser,
} from 'react-icons/fi';
import { ROUTES } from '../../../config/routes';

export const ATTENDANCE_STATUS_META = {
  PRESENT: { label: 'Present', short: 'P', tone: 'success' },
  ABSENT: { label: 'Absent', short: 'A', tone: 'danger' },
  LATE: { label: 'Late', short: 'L', tone: 'warning' },
  EXCUSED: { label: 'Excused', short: 'E', tone: 'info' },
  LEAVE: { label: 'Leave', short: 'Lv', tone: 'neutral' },
  HALF_DAY: { label: 'Half day', short: '½', tone: 'brand' },
};

export const ATTENDANCE_STATUS_ORDER = ['PRESENT', 'ABSENT', 'LATE', 'EXCUSED', 'LEAVE', 'HALF_DAY'];

export function formatSessionWhen(startAt, endAt) {
  if (!startAt) return '—';
  const start = new Date(startAt);
  const end = endAt ? new Date(endAt) : null;
  const date = start.toLocaleDateString('en-IN', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' });
  const timeStart = start.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' });
  const timeEnd = end && !Number.isNaN(end.getTime())
    ? end.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' })
    : null;
  return timeEnd ? `${date} · ${timeStart} – ${timeEnd}` : `${date} · ${timeStart}`;
}

export function formatWindowRange(window) {
  if (!window?.openAt || !window?.closeAt) return null;
  const fmt = (d) => new Date(d).toLocaleString('en-IN', {
    day: '2-digit', month: 'short', hour: 'numeric', minute: '2-digit',
  });
  return `${fmt(window.openAt)} → ${fmt(window.closeAt)}`;
}

export function studentInitials(student) {
  const first = student?.firstName?.[0] || '';
  const last = student?.lastName?.[0] || '';
  return (first + last).toUpperCase() || '?';
}

export function studentName(student) {
  return `${student?.firstName || ''} ${student?.lastName || ''}`.trim() || 'Student';
}

export const DAILY_ATTENDANCE_STATUSES = ['PRESENT', 'ABSENT'];

/** Map stored status to teacher daily P/A (legacy statuses count as Present). */
export function normalizeToDailyStatus(status) {
  if (!status) return '';
  if (status === 'ABSENT' || status === 'LEAVE') return 'ABSENT';
  return 'PRESENT';
}

export function dailyStatusLabel(status) {
  return normalizeToDailyStatus(status) === 'ABSENT' ? 'A' : 'P';
}

export function computeDailyCounts(draft, rosterLength) {
  const values = Object.values(draft).filter(Boolean);
  const present = values.filter((v) => v === 'PRESENT').length;
  const absent = values.filter((v) => v === 'ABSENT').length;
  const marked = present + absent;
  return {
    PRESENT: present,
    ABSENT: absent,
    UNMARKED: Math.max(0, rosterLength - marked),
    MARKED: marked,
    TOTAL: rosterLength,
  };
}

export function dailyPresentPercent(counts) {
  if (!counts.TOTAL) return 0;
  return Math.round((counts.PRESENT / counts.TOTAL) * 100);
}

export function isDraftDirtyDaily(data, draft) {
  if (!data?.roster) return false;
  return data.roster.some((row) => {
    const saved = normalizeToDailyStatus(row.status);
    const current = draft[row.studentId] || '';
    return current !== saved;
  });
}

export function rosterFromDraft(data, draft) {
  return (data?.roster || []).map((row) => ({
    ...row,
    draftStatus: draft[row.studentId] || '',
  }));
}

export function isDraftDirty(data, draft) {
  return isDraftDirtyDaily(data, draft);
}

export function computeCounts(draft, rosterLength) {
  return computeDailyCounts(draft, rosterLength);
}

export function attendanceRate(counts) {
  return dailyPresentPercent(counts);
}

/** Clean P/A table row for teacher daily marking */
export function SimplePAStudentRow({
  row,
  status,
  onStatusChange,
  disabled,
  canCorrect,
  correcting,
  reason,
  onReasonChange,
  onStartCorrect,
  onSubmitCorrect,
  onCancelCorrect,
  correctingBusy,
  locked = false,
}) {
  const name = studentName(row.student);
  const initials = studentInitials(row.student);
  const saved = normalizeToDailyStatus(row.status);
  const changed = (status || '') !== saved;
  const showCorrection = canCorrect && locked && row.status && (correcting || changed);

  return (
    <tr className={`crm-att-pa-row ${!status ? 'crm-att-pa-row--unmarked' : ''} ${changed ? 'crm-att-pa-row--changed' : ''}`}>
      <td className="crm-att-pa-row__student">
        <div className="crm-att-pa-row__identity">
          <span className="crm-att-pa-row__avatar" aria-hidden>{initials}</span>
          <span className="crm-att-pa-row__copy">
            <span className="crm-att-pa-row__name">{name}</span>
            <span className="crm-att-pa-row__code">{row.student?.studentCode || '—'}</span>
          </span>
        </div>
      </td>
      <td className="crm-att-pa-row__toggle">
        <div className="crm-att-pa-toggle" role="group" aria-label={`Attendance for ${name}`}>
          <button
            type="button"
            className={`crm-att-pa-btn crm-att-pa-btn--p ${status === 'PRESENT' ? 'crm-att-pa-btn--active' : ''}`}
            disabled={disabled}
            onClick={() => onStatusChange('PRESENT')}
            aria-pressed={status === 'PRESENT'}
          >
            P
          </button>
          <button
            type="button"
            className={`crm-att-pa-btn crm-att-pa-btn--a ${status === 'ABSENT' ? 'crm-att-pa-btn--active' : ''}`}
            disabled={disabled}
            onClick={() => onStatusChange('ABSENT')}
            aria-pressed={status === 'ABSENT'}
          >
            A
          </button>
        </div>
      </td>
      <td className="crm-att-pa-row__meta">
        {row.markedBy && !changed ? (
          <span className="crm-att-pa-row__marked">
            {dailyStatusLabel(row.status)}
            {' · '}
            {row.markedBy.firstName}
          </span>
        ) : changed ? (
          <span className="crm-att-pa-row__unsaved">Unsaved</span>
        ) : (
          '—'
        )}
      </td>
      {canCorrect && locked && (
        <td className="crm-att-pa-row__correct">
          {showCorrection ? (
            <div className="crm-att-correct-form">
              <input
                type="text"
                className="crm-att-correct-input"
                placeholder="Correction reason"
                value={reason}
                onChange={(e) => onReasonChange(e.target.value)}
              />
              <button
                type="button"
                className="crm-att-correct-btn crm-att-correct-btn--primary"
                disabled={correctingBusy || !reason.trim() || !status || !changed}
                onClick={onSubmitCorrect}
              >
                Save
              </button>
              <button type="button" className="crm-att-correct-btn" onClick={onCancelCorrect}>
                Cancel
              </button>
            </div>
          ) : row.status ? (
            <button type="button" className="crm-att-correct-link" onClick={onStartCorrect}>
              Correct
            </button>
          ) : null}
        </td>
      )}
    </tr>
  );
}

export function AttendanceHero({ session, window, totalStudents, rate, batchId, compact = false }) {
  const locked = window?.locked;
  const state = String(window?.state || '').replace(/_/g, ' ').toLowerCase();
  const instructor = session?.instructor
    ? `${session.instructor.firstName || ''} ${session.instructor.lastName || ''}`.trim()
    : null;
  const windowRange = formatWindowRange(window);

  return (
    <div className={`crm-att-hero ${compact ? 'crm-att-hero--compact' : ''} ${locked ? 'crm-att-hero--locked' : 'crm-att-hero--open'}`}>
      <div className="crm-att-hero__top">
        <Link to={batchId ? ROUTES.BATCH_DETAIL(batchId) : ROUTES.BATCHES} className="crm-att-hero__back">
          <FiArrowLeft className="w-4 h-4" />
          Back to batch
        </Link>
        <span className={`crm-att-hero__badge ${locked ? 'crm-att-hero__badge--locked' : 'crm-att-hero__badge--open'}`}>
          {locked ? <FiLock className="w-3.5 h-3.5" /> : <FiCheck className="w-3.5 h-3.5" />}
          {locked ? `Window ${state}` : 'Marking open'}
        </span>
      </div>

      <div className="crm-att-hero__body">
        <div className="crm-att-hero__info">
          <h2 className="crm-att-hero__title">{session?.batch?.name || 'Class session'}</h2>
          <p className="crm-att-hero__subtitle">
            {session?.batch?.courseName || 'Course'}
            {' · '}
            {formatSessionWhen(session?.startAt, session?.endAt)}
          </p>
          <div className="crm-att-hero__meta">
            <span><FiUser className="w-3.5 h-3.5" /> {totalStudents} enrolled</span>
            {instructor && <span><FiUser className="w-3.5 h-3.5" /> {instructor}</span>}
            {session?.room && <span><FiMapPin className="w-3.5 h-3.5" /> {session.room}</span>}
            {windowRange && !compact && (
              <span><FiClock className="w-3.5 h-3.5" /> Window: {windowRange}</span>
            )}
          </div>
        </div>

        <div className="crm-att-hero__ring" aria-hidden>
          <svg viewBox="0 0 64 64" className="crm-att-hero__svg">
            <circle cx="32" cy="32" r="28" className="crm-att-hero__track" />
            <circle
              cx="32"
              cy="32"
              r="28"
              className="crm-att-hero__progress"
              strokeDasharray={`${Math.max(0, Math.min(100, rate)) * 1.76} 176`}
            />
          </svg>
          <div className="crm-att-hero__ring-label">
            <strong>{rate}%</strong>
            <span>marked</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export function AttendanceMetricBar({ counts, activeFilter, onFilter, simple = false }) {
  const items = simple
    ? [
      { key: 'ALL', label: 'All', value: counts.TOTAL, tone: 'neutral' },
      { key: 'PRESENT', label: 'Present (P)', value: counts.PRESENT, tone: 'success' },
      { key: 'ABSENT', label: 'Absent (A)', value: counts.ABSENT, tone: 'danger' },
      { key: 'UNMARKED', label: 'Unmarked', value: counts.UNMARKED, tone: 'muted' },
    ]
    : [
      { key: 'ALL', label: 'All', value: counts.TOTAL, tone: 'neutral' },
      { key: 'PRESENT', label: 'Present', value: counts.PRESENT, tone: 'success' },
      { key: 'ABSENT', label: 'Absent', value: counts.ABSENT, tone: 'danger' },
      { key: 'LATE', label: 'Late', value: counts.LATE, tone: 'warning' },
      { key: 'EXCUSED', label: 'Excused', value: counts.EXCUSED, tone: 'info' },
      { key: 'UNMARKED', label: 'Unmarked', value: counts.UNMARKED, tone: 'muted' },
    ];

  return (
    <div className={`crm-att-metrics ${simple ? 'crm-att-metrics--simple' : ''}`}>
      {items.map(({ key, label, value, tone }) => (
        <button
          key={key}
          type="button"
          className={`crm-att-metric crm-att-metric--${tone} ${activeFilter === key ? 'crm-att-metric--active' : ''}`}
          onClick={() => onFilter(key)}
        >
          <span className="crm-att-metric__value">{value}</span>
          <span className="crm-att-metric__label">{label}</span>
        </button>
      ))}
    </div>
  );
}

export function AttendanceLockedBanner({ window, canCorrect, compact = false }) {
  const state = String(window?.state || 'LOCKED').replace(/_/g, ' ').toLowerCase();
  return (
    <div className={`crm-att-banner ${compact ? 'crm-att-banner--compact' : ''}`}>
      <FiAlertCircle className="w-4 h-4 shrink-0" />
      <div>
        <p className="crm-att-banner__title">Window {state}</p>
        {!compact && (
          <p className="crm-att-banner__text">
            {window?.state === 'NOT_OPEN'
              ? 'Marking opens shortly before class starts.'
              : 'The marking window has closed for this session.'}
            {canCorrect ? ' Authorized staff can submit corrections with a reason.' : ''}
          </p>
        )}
        {compact && (
          <p className="crm-att-banner__text">
            {window?.state === 'NOT_OPEN'
              ? 'Marking opens before class starts.'
              : canCorrect
                ? 'Marking closed — corrections need a reason.'
                : 'Marking closed for this session.'}
          </p>
        )}
      </div>
    </div>
  );
}

export function AttendanceStatusChips({ value, onChange, disabled, compact = false, dailyOnly = false }) {
  const options = dailyOnly
    ? DAILY_ATTENDANCE_STATUSES
    : compact
      ? ['PRESENT', 'ABSENT', 'LATE', 'EXCUSED']
      : ATTENDANCE_STATUS_ORDER;

  return (
    <div className={`crm-att-chips ${compact ? 'crm-att-chips--compact' : ''}`}>
      {options.map((status) => {
        const meta = ATTENDANCE_STATUS_META[status];
        const active = value === status;
        return (
          <button
            key={status}
            type="button"
            disabled={disabled}
            className={`crm-att-chip crm-att-chip--${meta.tone} ${active ? 'crm-att-chip--active' : ''}`}
            onClick={() => onChange(active ? '' : status)}
            title={meta.label}
          >
            {compact ? meta.short : meta.label}
          </button>
        );
      })}
    </div>
  );
}

export function StudentAttendanceRow({
  row,
  status,
  onStatusChange,
  disabled,
  canCorrect,
  correcting,
  reason,
  onReasonChange,
  onStartCorrect,
  onSubmitCorrect,
  onCancelCorrect,
  correctingBusy,
  locked = false,
}) {
  const initials = studentInitials(row.student);
  const name = studentName(row.student);
  const savedStatus = row.status;
  const changed = (status || '') !== (savedStatus || '');
  const meta = savedStatus ? ATTENDANCE_STATUS_META[savedStatus] : null;
  const showCorrection = canCorrect && locked && savedStatus && (correcting || changed);

  return (
    <article className={`crm-att-student ${changed ? 'crm-att-student--changed' : ''} ${!status ? 'crm-att-student--unmarked' : ''}`}>
      <div className="crm-att-student__main">
        <div className="crm-att-student__avatar" aria-hidden>{initials}</div>
        <div className="crm-att-student__info">
          <div className="crm-att-student__head">
            <p className="crm-att-student__name">{name}</p>
            {meta && !changed && (
              <span className={`crm-att-student__saved crm-att-student__saved--${meta.tone}`}>
                Saved · {meta.label}
              </span>
            )}
            {changed && (
              <span className="crm-att-student__dirty">Unsaved change</span>
            )}
          </div>
          <p className="crm-att-student__code">{row.student?.studentCode || '—'}</p>
          {row.markedBy && (
            <p className="crm-att-student__marked">
              Marked by {row.markedBy.firstName} {row.markedBy.lastName || ''}
              {row.markedAt ? ` · ${new Date(row.markedAt).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: 'numeric', minute: '2-digit' })}` : ''}
            </p>
          )}
        </div>
      </div>

      <div className="crm-att-student__actions">
        <AttendanceStatusChips
          value={status}
          onChange={onStatusChange}
          disabled={disabled}
        />
      </div>

      {canCorrect && locked && savedStatus && (
        <div className="crm-att-student__correct">
          {showCorrection ? (
            <div className="crm-att-correct-form">
              <input
                type="text"
                className="crm-att-correct-input"
                placeholder="Reason for correction (required)"
                value={reason}
                onChange={(e) => onReasonChange(e.target.value)}
              />
              <button
                type="button"
                className="crm-att-correct-btn crm-att-correct-btn--primary"
                disabled={correctingBusy || !reason.trim() || !status || !changed}
                onClick={onSubmitCorrect}
              >
                Submit correction
              </button>
              <button
                type="button"
                className="crm-att-correct-btn"
                onClick={onCancelCorrect}
              >
                Cancel
              </button>
            </div>
          ) : (
            <button type="button" className="crm-att-correct-link" onClick={onStartCorrect}>
              Correct saved attendance
            </button>
          )}
        </div>
      )}
    </article>
  );
}
