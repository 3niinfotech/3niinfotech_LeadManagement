/**
 * Demo (3-day trial) attendance — CRM EnquiryDemo track.
 * Final statuses for UI/API writes: PRESENT | ABSENT.
 * NOT_MARKED is temporary until marked or auto-absent after window.
 */

export const DEMO_ATTENDANCE_FINAL = ['PRESENT', 'ABSENT'];
export const DEMO_ATTENDANCE_MARKABLE = ['PRESENT', 'ABSENT', 'NOT_MARKED'];

/** Minutes after class end before NOT_MARKED → ABSENT (server-side). */
export const DEMO_ATTENDANCE_CLOSE_MINUTES_AFTER = 30;

/** Default demo session length when endAt is missing. */
export const DEMO_DEFAULT_DURATION_MINUTES = 60;

export const DEMO_RESULT_VALUES = ['PENDING', 'POSITIVE', 'NEUTRAL', 'NEGATIVE', 'CONVERTED'];
export const DEMO_SESSION_STATUS_VALUES = ['SCHEDULED', 'RESCHEDULED', 'CANCELLED', 'COMPLETED'];

/** Legacy enum values still in DB — accepted on read, normalized on write/display. */
export const DEMO_ATTENDANCE_VALUES = [
  'PRESENT',
  'ABSENT',
  'LATE',
  'PARTIAL',
  'NOT_MARKED',
  'ATTENDED',
  'NO_SHOW',
];

export const DEMO_CLASSES = [
  'IELTS Foundation',
  'IELTS Advanced',
  'PTE Intensive',
  'Spoken English',
  'GRE Prep',
  'SAT Prep',
  'DuoLingo',
];

export const DEMO_BATCHES = [
  'Morning A',
  'Morning B',
  'Afternoon A',
  'Evening A',
  'Weekend Batch',
];

/** Canonical write value: PRESENT | ABSENT | NOT_MARKED */
export function normalizeDemoAttendanceWrite(value) {
  const raw = String(value || 'NOT_MARKED').toUpperCase();
  if (raw === 'PRESENT' || raw === 'ATTENDED') return 'PRESENT';
  if (raw === 'ABSENT' || raw === 'NO_SHOW') return 'ABSENT';
  if (raw === 'NOT_MARKED') return 'NOT_MARKED';
  // LATE / PARTIAL no longer accepted for new marks
  return null;
}

/** Display: only PRESENT | ABSENT | NOT_MARKED */
export function normalizeDemoAttendanceDisplay(value) {
  const raw = String(value || 'NOT_MARKED').toUpperCase();
  if (raw === 'PRESENT' || raw === 'ATTENDED') return 'PRESENT';
  if (raw === 'ABSENT' || raw === 'NO_SHOW') return 'ABSENT';
  return 'NOT_MARKED';
}

export function getDemoAttendanceWindowEnd(demo, now = new Date()) {
  if (!demo?.demoDate && !demo?.endAt) return null;
  const end = demo.endAt
    ? new Date(demo.endAt)
    : new Date(new Date(demo.demoDate).getTime() + DEMO_DEFAULT_DURATION_MINUTES * 60 * 1000);
  return new Date(end.getTime() + DEMO_ATTENDANCE_CLOSE_MINUTES_AFTER * 60 * 1000);
}

export function isDemoAttendanceWindowOpen(demo, now = new Date()) {
  const windowEnd = getDemoAttendanceWindowEnd(demo, now);
  if (!windowEnd) return false;
  const start = demo.demoDate ? new Date(demo.demoDate) : null;
  // Allow marking from session start (or slightly before) until window end
  if (start && now.getTime() < start.getTime() - 15 * 60 * 1000) return false;
  return now.getTime() <= windowEnd.getTime();
}

export function isDemoAttendanceWindowExpired(demo, now = new Date()) {
  const windowEnd = getDemoAttendanceWindowEnd(demo, now);
  if (!windowEnd) return false;
  return now.getTime() > windowEnd.getTime();
}
