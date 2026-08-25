import prisma from '../../config/database.js';
import { AppError, parsePagination } from '../../utils/response.util.js';
import { auditLog } from '../../middleware/audit.middleware.js';
import {
  assertBranchInTenant,
  assertUserInTenant,
  assertStudentInTenant,
  resolveWriteBranchId,
  requireTenantCompany,
  mergeScope,
} from '../../utils/tenant.util.js';
import { notifyUser } from '../notification/notification.dispatcher.js';
import { hasAnyPermission, hasPermission } from '../rbac/rbac.util.js';
import { attendanceRepository } from './attendance.repository.js';
import {
  academicBranchScope,
  assertAcademicRecordAccess,
  canCorrectAttendance,
  canMarkAttendance,
} from './attendance.scope.js';
import {
  resolveAttendanceSettings,
  attendanceWindowState,
  suggestLateStatus,
  attendancePercent,
  isLowAttendance,
} from './attendance.rules.js';
import { STUDENT_ROLE_SLUGS } from '../../config/portal.config.js';
import { CLASS_ATTENDANCE_STATUSES } from './attendance.constants.js';

const DAY_MS = 24 * 60 * 60 * 1000;

function parseTimeOnDate(date, hhmm) {
  const [h, m] = String(hhmm || '00:00').split(':').map(Number);
  const d = new Date(date);
  d.setHours(h || 0, m || 0, 0, 0);
  return d;
}

function dateOnly(d) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

async function companySettings(user) {
  const companyId = user.companyId || (user.branchId
    ? (await prisma.branch.findUnique({ where: { id: user.branchId }, select: { companyId: true } }))?.companyId
    : null);
  if (!companyId) return resolveAttendanceSettings({});
  const company = await prisma.company.findUnique({ where: { id: companyId }, select: { settings: true } });
  return resolveAttendanceSettings(company?.settings || {});
}

async function requireBatch(id, user) {
  const batch = await attendanceRepository.findBatchById(id);
  if (!batch) throw new AppError('Batch not found', 404);
  await assertAcademicRecordAccess(batch, user, 'batch');
  return batch;
}

async function requireSession(id, user) {
  const session = await attendanceRepository.findSessionById(id);
  if (!session) throw new AppError('Class session not found', 404);
  await assertAcademicRecordAccess(session, user, 'session');
  return session;
}

function summarizeEntries(rows = []) {
  const counts = {
    PRESENT: 0, ABSENT: 0, LATE: 0, EXCUSED: 0, LEAVE: 0, HALF_DAY: 0, UNMARKED: 0,
  };
  rows.forEach((row) => {
    if (counts[row.status] != null) counts[row.status] += 1;
  });
  return counts;
}

function rosterFromSession(session) {
  const byStudent = new Map((session.attendances || []).map((a) => [a.studentId, a]));
  return (session.batch?.enrollments || []).map((en) => {
    const mark = byStudent.get(en.studentId);
    return {
      studentId: en.studentId,
      student: en.student,
      status: mark?.status || null,
      markedAt: mark?.markedAt || null,
      markedBy: mark?.markedBy || null,
      remarks: mark?.remarks || null,
      checkInAt: mark?.checkInAt || null,
      checkOutAt: mark?.checkOutAt || null,
      source: mark?.source || null,
      correctionReason: mark?.correctionReason || null,
    };
  });
}

async function maybeAlertLowOrConsecutive({ student, session, settings, user }) {
  const history = await prisma.classAttendance.findMany({
    where: { studentId: student.id, session: { deletedAt: null, status: { not: 'CANCELLED' } } },
    include: { session: { select: { startAt: true } } },
    orderBy: { session: { startAt: 'desc' } },
    take: 40,
  });
  const total = history.length;
  const present = history.filter((h) => h.status === 'PRESENT' || h.status === 'LATE' || h.status === 'HALF_DAY').length;
  const excused = history.filter((h) => h.status === 'EXCUSED').length;
  const percent = attendancePercent({ present, late: 0, excused, total });

  const counsellorId = student.assignedToId || session.instructorId;
  if (isLowAttendance(percent, settings) && counsellorId) {
    await notifyUser(counsellorId, {
      type: 'WARNING',
      title: `Low attendance: ${student.firstName} ${student.lastName || ''}`.trim(),
      message: `${student.firstName} is at ${percent}% (threshold ${settings.lowAttendancePercent}%).`,
      link: `/admin/students/${student.id}/attendance`,
      metadata: { kind: 'LOW_ATTENDANCE', studentId: student.id, percent },
    });
  }

  let consecutive = 0;
  for (const row of history) {
    if (row.status === 'ABSENT' || row.status === 'LEAVE') consecutive += 1;
    else break;
  }
  if (consecutive >= settings.consecutiveAbsenceAlert && counsellorId) {
    await notifyUser(counsellorId, {
      type: 'WARNING',
      title: `Consecutive absences: ${student.firstName} ${student.lastName || ''}`.trim(),
      message: `${student.firstName} has ${consecutive} consecutive absences.`,
      link: `/admin/students/${student.id}/attendance`,
      metadata: { kind: 'CONSECUTIVE_ABSENCE', studentId: student.id, consecutive },
    });
  }
}

export const attendanceService = {
  listBatches: async (query, user) => {
    const { page, limit, skip } = parsePagination(query);
    const where = academicBranchScope(user);
    if (query.branchId) {
      await assertBranchInTenant(query.branchId, user);
      where.AND = [...(where.AND || []), { branchId: query.branchId }];
    }
    if (query.search) {
      const term = String(query.search).trim();
      where.AND = [...(where.AND || []), {
        OR: [
          { name: { contains: term } },
          { code: { contains: term } },
          { courseName: { contains: term } },
        ],
      }];
    }
    const [data, total] = await Promise.all([
      attendanceRepository.findBatches(where, { skip, take: limit }),
      attendanceRepository.countBatches(where),
    ]);
    return { data, pagination: { page, limit, total } };
  },

  getBatch: async (id, user) => {
    const batch = await requireBatch(id, user);
    const settings = await companySettings(user);
    const attendances = await prisma.classAttendance.findMany({
      where: { session: { batchId: id, deletedAt: null, status: { not: 'CANCELLED' } } },
      select: { studentId: true, status: true },
    });
    const byStudent = {};
    attendances.forEach((row) => {
      const bucket = byStudent[row.studentId] || { total: 0, present: 0, absent: 0, late: 0, excused: 0 };
      bucket.total += 1;
      if (row.status === 'PRESENT' || row.status === 'HALF_DAY') bucket.present += 1;
      else if (row.status === 'LATE') bucket.late += 1;
      else if (row.status === 'EXCUSED') bucket.excused += 1;
      else if (row.status === 'ABSENT' || row.status === 'LEAVE') bucket.absent += 1;
      byStudent[row.studentId] = bucket;
    });
    const students = (batch.enrollments || []).map((en) => {
      const stats = byStudent[en.studentId] || { total: 0, present: 0, absent: 0, late: 0, excused: 0 };
      const percent = attendancePercent(stats);
      return {
        ...en,
        attendance: { ...stats, percent, low: isLowAttendance(percent, settings) && stats.total > 0 },
      };
    });
    const percents = students.filter((s) => s.attendance.total > 0).map((s) => s.attendance.percent);
    const averageAttendance = percents.length
      ? Math.round((percents.reduce((a, b) => a + b, 0) / percents.length) * 10) / 10
      : 0;
    return {
      ...batch,
      enrollments: students,
      summary: {
        totalStudents: students.length,
        averageAttendance,
        lowAttendanceStudents: students.filter((s) => s.attendance.low).length,
      },
    };
  },

  createBatch: async (data, user, req) => {
    const branchId = await resolveWriteBranchId(user, data.branchId);
    if (data.instructorId) await assertUserInTenant(data.instructorId, user);
    const companyId = user.companyId
      || (await prisma.branch.findUnique({ where: { id: branchId }, select: { companyId: true } }))?.companyId;
    if (!companyId) throw new AppError('Company context required', 403);
    const code = await attendanceRepository.nextBatchCode(companyId);
    const batch = await attendanceRepository.createBatch({
      companyId,
      branchId,
      code,
      name: data.name.trim(),
      courseName: data.courseName.trim(),
      instructorId: data.instructorId || null,
      room: data.room || null,
      startDate: data.startDate ? new Date(data.startDate) : null,
      endDate: data.endDate ? new Date(data.endDate) : null,
      isActive: data.isActive !== false,
      createdBy: user.id,
    });
    await auditLog({
      userId: user.id, action: 'CREATE', entityType: 'AcademicBatch', entityId: batch.id, newData: batch, req,
    });
    return batch;
  },

  updateBatch: async (id, data, user, req) => {
    const existing = await requireBatch(id, user);
    if (data.branchId && data.branchId !== existing.branchId) {
      await assertBranchInTenant(data.branchId, user);
    }
    if (data.instructorId) await assertUserInTenant(data.instructorId, user);
    const updated = await attendanceRepository.updateBatch(id, {
      ...(data.name != null ? { name: data.name.trim() } : {}),
      ...(data.courseName != null ? { courseName: data.courseName.trim() } : {}),
      ...(data.instructorId !== undefined ? { instructorId: data.instructorId || null } : {}),
      ...(data.room !== undefined ? { room: data.room || null } : {}),
      ...(data.branchId ? { branchId: data.branchId } : {}),
      ...(data.isActive != null ? { isActive: data.isActive } : {}),
      updatedBy: user.id,
    });
    await auditLog({
      userId: user.id, action: 'UPDATE', entityType: 'AcademicBatch', entityId: id, oldData: existing, newData: updated, req,
    });
    return updated;
  },

  enrollStudents: async (batchId, studentIds, user, req) => {
    const batch = await requireBatch(batchId, user);
    const results = [];
    for (const studentId of studentIds) {
      const student = await assertStudentInTenant(studentId, user);
      if (student.branchId !== batch.branchId) {
        throw new AppError('Student belongs to a different branch', 403);
      }
      const row = await attendanceRepository.upsertEnrollment({
        batchId,
        studentId,
        isActive: true,
        createdBy: user.id,
      });
      results.push(row);
    }
    await auditLog({
      userId: user.id, action: 'UPDATE', entityType: 'AcademicBatch', entityId: batchId,
      newData: { enrolled: studentIds }, req,
    });
    return results;
  },

  unenrollStudent: async (batchId, studentId, user, req) => {
    await requireBatch(batchId, user);
    await assertStudentInTenant(studentId, user);
    await attendanceRepository.deactivateEnrollment(batchId, studentId);
    await auditLog({
      userId: user.id, action: 'UPDATE', entityType: 'AcademicBatch', entityId: batchId,
      newData: { unenrolled: studentId }, req,
    });
    return { ok: true };
  },

  addTimetableSlot: async (batchId, data, user, req) => {
    const batch = await requireBatch(batchId, user);
    if (data.instructorId) await assertUserInTenant(data.instructorId, user);
    const slot = await attendanceRepository.createTimetableSlot({
      batchId,
      dayOfWeek: data.dayOfWeek,
      startTime: data.startTime,
      endTime: data.endTime,
      room: data.room || batch.room || null,
      instructorId: data.instructorId || batch.instructorId || null,
      isActive: data.isActive !== false,
    });
    await auditLog({
      userId: user.id, action: 'CREATE', entityType: 'ClassTimetableSlot', entityId: slot.id, newData: slot, req,
    });
    return slot;
  },

  generateSessions: async (batchId, { from, to }, user, req) => {
    const batch = await requireBatch(batchId, user);
    const start = dateOnly(from);
    const end = dateOnly(to);
    if (end < start) throw new AppError('to must be after from', 400);
    if (end - start > 93 * DAY_MS) throw new AppError('Range cannot exceed 93 days', 400);

    const slots = (batch.timetableSlots || []).filter((s) => s.isActive);
    if (!slots.length) throw new AppError('Add a timetable slot before generating sessions', 400);

    const created = [];
    for (let t = start.getTime(); t <= end.getTime(); t += DAY_MS) {
      const day = new Date(t);
      const dow = day.getDay();
      for (const slot of slots) {
        if (slot.dayOfWeek !== dow) continue;
        const startAt = parseTimeOnDate(day, slot.startTime);
        const endAt = parseTimeOnDate(day, slot.endTime);
        const existing = await attendanceRepository.findSessionByBatchStart(batchId, startAt);
        if (existing) continue;
        const session = await attendanceRepository.createSession({
          batchId,
          branchId: batch.branchId,
          timetableSlotId: slot.id,
          instructorId: slot.instructorId || batch.instructorId || null,
          sessionDate: dateOnly(day),
          startAt,
          endAt,
          room: slot.room || batch.room || null,
          status: 'SCHEDULED',
          createdBy: user.id,
        });
        created.push(session);
      }
    }
    await auditLog({
      userId: user.id, action: 'CREATE', entityType: 'ClassSession', entityId: batchId,
      newData: { generated: created.length, from, to }, req,
    });
    return { created: created.length, sessions: created };
  },

  listSessions: async (query, user) => {
    const settings = await companySettings(user);
    const where = { ...academicBranchScope(user, 'session') };
    if (query.branchId) {
      await assertBranchInTenant(query.branchId, user);
      where.AND = [...(where.AND || []), { branchId: query.branchId }];
    }
    if (query.batchId) where.batchId = query.batchId;
    if (query.from || query.to) {
      where.startAt = {};
      if (query.from) where.startAt.gte = new Date(query.from);
      if (query.to) where.startAt.lte = new Date(query.to);
    }
    const sessions = await attendanceRepository.findSessions(where);
    return sessions.map((session) => {
      const window = attendanceWindowState(session.startAt, session.endAt, settings);
      return { ...session, window };
    });
  },

  getSessionAttendance: async (id, user) => {
    const session = await requireSession(id, user);
    const settings = await companySettings(user);
    const window = attendanceWindowState(session.startAt, session.endAt, settings);
    const roster = rosterFromSession(session);
    const marked = roster.filter((r) => r.status);
    const counts = summarizeEntries(marked);
    counts.UNMARKED = roster.length - marked.length;
    return {
      session: {
        id: session.id,
        startAt: session.startAt,
        endAt: session.endAt,
        sessionDate: session.sessionDate,
        room: session.room,
        status: session.status,
        instructor: session.instructor,
        branch: session.branch,
        batch: {
          id: session.batch.id,
          name: session.batch.name,
          code: session.batch.code,
          courseName: session.batch.courseName,
        },
      },
      window,
      canMark: canMarkAttendance(user) && !window.locked,
      canCorrect: canCorrectAttendance(user),
      settings,
      roster,
      counts,
      totalStudents: roster.length,
    };
  },

  saveAttendance: async (id, payload, user, req) => {
    if (!canMarkAttendance(user)) throw new AppError('Insufficient permissions', 403);
    const session = await requireSession(id, user);
    if (session.status === 'CANCELLED') throw new AppError('Cannot mark attendance on a cancelled session', 400);

    const settings = await companySettings(user);
    const window = attendanceWindowState(session.startAt, session.endAt, settings);
    if (window.locked) {
      throw new AppError(
        window.state === 'NOT_OPEN'
          ? 'Attendance is not open yet'
          : 'Attendance is locked. Use correction with a reason.',
        409,
      );
    }

    const enrolledIds = new Set((session.batch?.enrollments || []).map((e) => e.studentId));
    let entries = payload.entries || [];
    if (payload.markAllPresent) {
      const overrides = new Map(entries.map((e) => [e.studentId, e]));
      entries = (session.batch?.enrollments || []).map((en) => overrides.get(en.studentId) || {
        studentId: en.studentId,
        status: 'PRESENT',
      });
    }

    const now = new Date();
    const saved = [];
    await prisma.$transaction(async (tx) => {
      for (const entry of entries) {
        if (!enrolledIds.has(entry.studentId)) {
          throw new AppError('Student is not enrolled in this batch', 400);
        }
        if (!CLASS_ATTENDANCE_STATUSES.includes(entry.status)) {
          throw new AppError('Invalid attendance status', 400);
        }
        const suggested = suggestLateStatus(session.startAt, settings, now, entry.status);
        const status = entry.status === 'PRESENT' && suggested === 'LATE' && !entry.forcePresent
          ? (payload.markAllPresent ? 'PRESENT' : entry.status)
          : entry.status;
        const finalStatus = entry.status;
        const row = await tx.classAttendance.upsert({
          where: { sessionId_studentId: { sessionId: id, studentId: entry.studentId } },
          create: {
            sessionId: id,
            studentId: entry.studentId,
            branchId: session.branchId,
            status: finalStatus,
            markedAt: now,
            markedById: user.id,
            remarks: entry.remarks || null,
            checkInAt: entry.checkInAt ? new Date(entry.checkInAt) : now,
            checkOutAt: entry.checkOutAt ? new Date(entry.checkOutAt) : null,
            source: payload.markAllPresent ? 'BULK' : 'MANUAL',
            locked: false,
          },
          update: {
            status: finalStatus,
            markedAt: now,
            markedById: user.id,
            remarks: entry.remarks || null,
            checkInAt: entry.checkInAt ? new Date(entry.checkInAt) : now,
            source: payload.markAllPresent ? 'BULK' : 'MANUAL',
            locked: false,
          },
        });
        saved.push(row);
      }
    });

    await auditLog({
      userId: user.id, action: 'UPDATE', entityType: 'ClassAttendance', entityId: id,
      newData: { count: saved.length, markAllPresent: Boolean(payload.markAllPresent) }, req,
    });

    const suggestedLate = entries
      .filter((e) => suggestLateStatus(session.startAt, settings, now, e.status) === 'LATE' && e.status === 'PRESENT')
      .map((e) => e.studentId);

    return {
      saved: saved.length,
      suggestedLate,
      data: await attendanceService.getSessionAttendance(id, user),
    };
  },

  correctAttendance: async (id, payload, user, req) => {
    if (!canCorrectAttendance(user)) throw new AppError('Insufficient permissions', 403);
    const session = await requireSession(id, user);
    const enrolledIds = new Set((session.batch?.enrollments || []).map((e) => e.studentId));
    if (!enrolledIds.has(payload.studentId)) throw new AppError('Student is not enrolled in this batch', 400);

    const existing = (session.attendances || []).find((a) => a.studentId === payload.studentId);
    const now = new Date();
    const row = await prisma.classAttendance.upsert({
      where: { sessionId_studentId: { sessionId: id, studentId: payload.studentId } },
      create: {
        sessionId: id,
        studentId: payload.studentId,
        branchId: session.branchId,
        status: payload.status,
        markedAt: now,
        markedById: user.id,
        remarks: payload.remarks || null,
        source: 'CORRECTION',
        correctionReason: payload.reason,
        locked: true,
      },
      update: {
        status: payload.status,
        markedAt: now,
        markedById: user.id,
        remarks: payload.remarks || null,
        source: 'CORRECTION',
        correctionReason: payload.reason,
        locked: true,
      },
    });

    await auditLog({
      userId: user.id,
      action: 'UPDATE',
      entityType: 'ClassAttendance',
      entityId: row.id,
      oldData: existing ? { status: existing.status } : { status: null },
      newData: { status: payload.status, reason: payload.reason, studentId: payload.studentId, sessionId: id },
      req,
    });

    const student = session.batch.enrollments.find((e) => e.studentId === payload.studentId)?.student;
    if (student) {
      const settings = await companySettings(user);
      await maybeAlertLowOrConsecutive({ student, session, settings, user });
    }

    return attendanceService.getSessionAttendance(id, user);
  },

  studentSummary: async (studentId, user) => {
    if (STUDENT_ROLE_SLUGS.includes(user.role?.slug)) {
      const own = await prisma.student.findFirst({
        where: { userId: user.id, deletedAt: null },
        select: { id: true },
      });
      if (!own) throw new AppError('Student profile not found', 404);
      studentId = own.id;
    }
    const student = await assertStudentInTenant(studentId, user);
    const settings = await companySettings(user);
    const rows = await attendanceRepository.findStudentAttendances(studentId);
    const total = rows.length;
    const present = rows.filter((r) => r.status === 'PRESENT' || r.status === 'HALF_DAY').length;
    const late = rows.filter((r) => r.status === 'LATE').length;
    const absent = rows.filter((r) => r.status === 'ABSENT').length;
    const excused = rows.filter((r) => r.status === 'EXCUSED').length;
    const leave = rows.filter((r) => r.status === 'LEAVE').length;
    const percent = attendancePercent({ present, late, excused, total });
    return {
      student: {
        id: student.id,
        studentCode: student.studentCode,
        firstName: student.firstName,
        lastName: student.lastName,
      },
      totals: { total, present, absent, late, excused, leave, percent },
      lowAttendance: isLowAttendance(percent, settings) && total > 0,
      threshold: settings.lowAttendancePercent,
      history: rows.map((row) => ({
        id: row.id,
        date: row.session?.startAt,
        course: row.session?.batch?.courseName,
        batch: row.session?.batch?.name,
        sessionTime: row.session ? `${row.session.startAt} – ${row.session.endAt}` : null,
        startAt: row.session?.startAt,
        endAt: row.session?.endAt,
        status: row.status,
        markedBy: row.markedBy,
        remarks: row.remarks,
      })),
    };
  },

  dashboardWidgets: async (user, options = {}) => {
    const includeClasses = options.classes ?? hasPermission(user?.permissions || [], 'attendance.view');
    const includeDemos = options.demos ?? hasPermission(user?.permissions || [], 'enquiry.view');
    const settings = await companySettings(user);
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(end.getDate() + 1);
    const upcomingEnd = new Date(start);
    upcomingEnd.setDate(upcomingEnd.getDate() + 7);
    const widgets = {};

    if (includeClasses) {
      const scope = academicBranchScope(user, 'session');
      const sessions = await attendanceRepository.findSessions({
        ...scope,
        startAt: { gte: start, lt: upcomingEnd },
        status: { not: 'CANCELLED' },
      });
      const todaySessions = sessions.filter((s) => s.startAt >= start && s.startAt < end);
      const pending = [];
      for (const session of todaySessions) {
        const window = attendanceWindowState(session.startAt, session.endAt, settings);
        const enrolled = await prisma.batchEnrollment.count({ where: { batchId: session.batchId, isActive: true } });
        if (session._count.attendances < enrolled && window.state !== 'NOT_OPEN') pending.push(session.id);
      }
      widgets.todayClasses = todaySessions.length;
      widgets.upcomingSessions = sessions.length;
      widgets.attendancePending = pending.length;
      widgets.attendanceCompleted = todaySessions.length - pending.length;
    }

    if (includeDemos) {
      const demos = await prisma.enquiryDemo.findMany({
        where: {
          demoDate: { gte: start, lt: upcomingEnd },
          enquiry: {
            deletedAt: null,
            ...mergeScope(user, { entity: 'enquiry' }),
          },
        },
        select: { id: true, demoDate: true, attendance: true, sessionStatus: true },
        take: 200,
      });
      const todayDemos = demos.filter((d) => d.demoDate >= start && d.demoDate < end);
      widgets.todayDemos = todayDemos.length;
      widgets.upcomingDemos = demos.length;
      widgets.demoAttendancePending = todayDemos.filter((d) => d.attendance === 'NOT_MARKED' && d.sessionStatus === 'SCHEDULED').length;
      widgets.demoNoShows = todayDemos.filter((d) => d.attendance === 'NO_SHOW' || d.attendance === 'ABSENT').length;
    }

    return widgets;
  },

  classReport: async (query, user) => {
    if (!hasAnyPermission(user.permissions, ['attendance.report', 'reports.view', 'reports:view'])) {
      throw new AppError('Insufficient permissions', 403);
    }
    const settings = await companySettings(user);
    const scope = academicBranchScope(user, 'session');
    const where = { session: { deletedAt: null, ...scope } };
    if (query.branchId) {
      await assertBranchInTenant(query.branchId, user);
      where.branchId = query.branchId;
    }
    if (query.batchId) where.session = { ...where.session, batchId: query.batchId };
    if (query.studentId) {
      await assertStudentInTenant(query.studentId, user);
      where.studentId = query.studentId;
    }
    if (query.status) where.status = query.status;
    if (query.from || query.to) {
      where.session = {
        ...where.session,
        startAt: {
          ...(query.from ? { gte: new Date(query.from) } : {}),
          ...(query.to ? { lte: new Date(query.to) } : {}),
        },
      };
    }

    const rows = await prisma.classAttendance.findMany({
      where,
      include: {
        student: { select: { id: true, studentCode: true, firstName: true, lastName: true } },
        session: { include: { batch: { select: { name: true, courseName: true, code: true } } } },
      },
      take: 5000,
    });

    const byStudent = new Map();
    rows.forEach((row) => {
      const key = row.studentId;
      const bucket = byStudent.get(key) || {
        student: row.student,
        course: row.session?.batch?.courseName,
        batch: row.session?.batch?.name,
        total: 0, present: 0, absent: 0, late: 0, excused: 0, leave: 0,
      };
      bucket.total += 1;
      if (row.status === 'PRESENT' || row.status === 'HALF_DAY') bucket.present += 1;
      else if (row.status === 'LATE') bucket.late += 1;
      else if (row.status === 'ABSENT') bucket.absent += 1;
      else if (row.status === 'EXCUSED') bucket.excused += 1;
      else if (row.status === 'LEAVE') bucket.leave += 1;
      byStudent.set(key, bucket);
    });

    const students = [...byStudent.values()].map((row) => {
      const percent = attendancePercent(row);
      return { ...row, percent, low: isLowAttendance(percent, settings) && row.total > 0 };
    });

    return {
      totals: {
        records: rows.length,
        students: students.length,
        present: students.reduce((s, r) => s + r.present, 0),
        absent: students.reduce((s, r) => s + r.absent, 0),
        late: students.reduce((s, r) => s + r.late, 0),
        excused: students.reduce((s, r) => s + r.excused, 0),
      },
      students,
    };
  },
};
