import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  attendanceWindowState,
  suggestLateStatus,
  attendancePercent,
  isLowAttendance,
  resolveAttendanceSettings,
} from '../attendance.rules.js';
import { isPresentStatus, normalizeDemoAttendance } from '../attendance.constants.js';

describe('attendance rules', () => {
  const settings = resolveAttendanceSettings({
    attendance: {
      openMinutesBefore: 15,
      closeMinutesAfter: 30,
      lateThresholdMinutes: 15,
      lowAttendancePercent: 75,
    },
  });

  it('opens 15 minutes before and locks 30 minutes after', () => {
    const start = new Date('2026-08-14T19:00:00');
    const end = new Date('2026-08-14T20:00:00');
    assert.equal(attendanceWindowState(start, end, settings, new Date('2026-08-14T18:40:00')).state, 'NOT_OPEN');
    assert.equal(attendanceWindowState(start, end, settings, new Date('2026-08-14T18:50:00')).state, 'OPEN');
    assert.equal(attendanceWindowState(start, end, settings, new Date('2026-08-14T20:20:00')).state, 'OPEN');
    assert.equal(attendanceWindowState(start, end, settings, new Date('2026-08-14T20:31:00')).locked, true);
  });

  it('suggests LATE after threshold but does not treat EXCUSED as late', () => {
    const start = new Date('2026-08-14T19:00:00');
    assert.equal(suggestLateStatus(start, settings, new Date('2026-08-14T19:05:00'), 'PRESENT'), 'PRESENT');
    assert.equal(suggestLateStatus(start, settings, new Date('2026-08-14T19:18:00'), 'PRESENT'), 'LATE');
    assert.equal(suggestLateStatus(start, settings, new Date('2026-08-14T19:18:00'), 'EXCUSED'), 'EXCUSED');
  });

  it('calculates attendance percent and low-attendance flag', () => {
    const percent = attendancePercent({ present: 6, late: 1, excused: 1, total: 10 });
    assert.equal(percent, 80);
    assert.equal(isLowAttendance(68, settings), true);
    assert.equal(isLowAttendance(75, settings), false);
  });

  it('keeps demo attendance distinct from scheduling and maps PRESENT to ATTENDED', () => {
    assert.equal(normalizeDemoAttendance('PRESENT'), 'ATTENDED');
    assert.equal(isPresentStatus('ATTENDED'), true);
    assert.equal(isPresentStatus('NO_SHOW'), false);
  });
});
