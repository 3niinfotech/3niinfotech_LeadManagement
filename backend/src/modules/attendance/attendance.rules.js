import { DEFAULT_ATTENDANCE_SETTINGS, isPresentStatus } from './attendance.constants.js';

export function resolveAttendanceSettings(companySettings = {}) {
  const raw = companySettings?.attendance && typeof companySettings.attendance === 'object'
    ? companySettings.attendance
    : {};
  return {
    openMinutesBefore: Number(raw.openMinutesBefore ?? DEFAULT_ATTENDANCE_SETTINGS.openMinutesBefore),
    closeMinutesAfter: Number(raw.closeMinutesAfter ?? DEFAULT_ATTENDANCE_SETTINGS.closeMinutesAfter),
    lateThresholdMinutes: Number(raw.lateThresholdMinutes ?? DEFAULT_ATTENDANCE_SETTINGS.lateThresholdMinutes),
    lowAttendancePercent: Number(raw.lowAttendancePercent ?? DEFAULT_ATTENDANCE_SETTINGS.lowAttendancePercent),
    consecutiveAbsenceAlert: Number(raw.consecutiveAbsenceAlert ?? DEFAULT_ATTENDANCE_SETTINGS.consecutiveAbsenceAlert),
  };
}

export function sessionWindow(startAt, endAt, settings) {
  const start = new Date(startAt);
  const end = new Date(endAt || startAt);
  const openAt = new Date(start.getTime() - settings.openMinutesBefore * 60 * 1000);
  const closeAt = new Date(end.getTime() + settings.closeMinutesAfter * 60 * 1000);
  return { openAt, closeAt, start, end };
}

export function attendanceWindowState(startAt, endAt, settings, now = new Date()) {
  const { openAt, closeAt } = sessionWindow(startAt, endAt, settings);
  const t = now.getTime();
  if (t < openAt.getTime()) return { state: 'NOT_OPEN', openAt, closeAt, locked: true };
  if (t > closeAt.getTime()) return { state: 'LOCKED', openAt, closeAt, locked: true };
  return { state: 'OPEN', openAt, closeAt, locked: false };
}

export function suggestLateStatus(startAt, settings, markedAt = new Date(), requestedStatus) {
  if (!requestedStatus || !isPresentStatus(requestedStatus)) return requestedStatus;
  const start = new Date(startAt).getTime();
  const marked = new Date(markedAt).getTime();
  const thresholdMs = settings.lateThresholdMinutes * 60 * 1000;
  if (marked > start + thresholdMs) return 'LATE';
  return requestedStatus;
}

export function attendancePercent({ present = 0, late = 0, excused = 0, total = 0 }) {
  if (!total) return 0;
  const credited = present + late + excused;
  return Math.round((credited / total) * 1000) / 10;
}

/** Daily teacher/student view: PRESENT vs ABSENT only (legacy statuses map to present). */
export function dailyAttendanceBucket(status) {
  if (!status) return null;
  if (status === 'ABSENT' || status === 'LEAVE') return 'ABSENT';
  return 'PRESENT';
}

export function dailyAttendancePercent(present, total) {
  if (!total) return 0;
  return Math.round((present / total) * 1000) / 10;
}

export function isLowAttendance(percent, settings) {
  return percent < settings.lowAttendancePercent;
}
