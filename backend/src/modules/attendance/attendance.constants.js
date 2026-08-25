export const CLASS_ATTENDANCE_STATUSES = ['PRESENT', 'ABSENT', 'LATE', 'EXCUSED', 'LEAVE', 'HALF_DAY'];

export const DEMO_ATTENDANCE_MARK_VALUES = ['NOT_MARKED', 'ATTENDED', 'PRESENT', 'ABSENT', 'LATE', 'NO_SHOW', 'PARTIAL'];

export const DEMO_SESSION_STATUSES = ['SCHEDULED', 'RESCHEDULED', 'CANCELLED', 'COMPLETED'];

export const DEFAULT_ATTENDANCE_SETTINGS = {
  openMinutesBefore: 15,
  closeMinutesAfter: 30,
  lateThresholdMinutes: 15,
  lowAttendancePercent: 75,
  consecutiveAbsenceAlert: 3,
};

export const PRESENT_EQUIVALENTS = new Set(['PRESENT', 'ATTENDED']);

export function isPresentStatus(status) {
  return PRESENT_EQUIVALENTS.has(status);
}

export function normalizeDemoAttendance(status) {
  if (status === 'PRESENT') return 'ATTENDED';
  return status || 'NOT_MARKED';
}
