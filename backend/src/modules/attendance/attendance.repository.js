import prisma from '../../config/database.js';
import { softDeleteWhere } from '../../utils/response.util.js';

const userSelect = { id: true, firstName: true, lastName: true, email: true };
const studentSelect = {
  id: true,
  studentCode: true,
  firstName: true,
  lastName: true,
  email: true,
  phone: true,
  assignedToId: true,
  branchId: true,
};

export const attendanceRepository = {
  nextBatchCode: async (companyId) => {
    const count = await prisma.academicBatch.count({ where: { companyId } });
    return `BAT-${String(count + 1).padStart(4, '0')}`;
  },

  findBatches: (where, { skip = 0, take = 50 } = {}) => prisma.academicBatch.findMany({
    where: { ...softDeleteWhere, ...where },
    include: {
      branch: { select: { id: true, name: true, code: true } },
      instructor: { select: userSelect },
      _count: { select: { enrollments: { where: { isActive: true } }, sessions: true } },
    },
    orderBy: { createdAt: 'desc' },
    skip,
    take,
  }),

  countBatches: (where) => prisma.academicBatch.count({ where: { ...softDeleteWhere, ...where } }),

  findBatchById: (id) => prisma.academicBatch.findFirst({
    where: { id, ...softDeleteWhere },
    include: {
      branch: { select: { id: true, name: true, code: true, companyId: true } },
      instructor: { select: userSelect },
      enrollments: {
        where: { isActive: true },
        include: { student: { select: studentSelect } },
        orderBy: { enrolledAt: 'asc' },
      },
      timetableSlots: {
        where: { deletedAt: null, isActive: true },
        orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
      },
    },
  }),

  createBatch: (data) => prisma.academicBatch.create({ data }),
  updateBatch: (id, data) => prisma.academicBatch.update({ where: { id }, data }),

  findEnrollment: (batchId, studentId) => prisma.batchEnrollment.findUnique({
    where: { batchId_studentId: { batchId, studentId } },
  }),

  upsertEnrollment: (data) => prisma.batchEnrollment.upsert({
    where: { batchId_studentId: { batchId: data.batchId, studentId: data.studentId } },
    create: data,
    update: { isActive: true, updatedAt: new Date() },
  }),

  deactivateEnrollment: (batchId, studentId) => prisma.batchEnrollment.updateMany({
    where: { batchId, studentId },
    data: { isActive: false },
  }),

  createTimetableSlot: (data) => prisma.classTimetableSlot.create({ data }),
  updateTimetableSlot: (id, data) => prisma.classTimetableSlot.update({ where: { id }, data }),

  findSessions: (where) => prisma.classSession.findMany({
    where: { ...softDeleteWhere, ...where },
    include: {
      batch: { select: { id: true, name: true, code: true, courseName: true } },
      instructor: { select: userSelect },
      branch: { select: { id: true, name: true, code: true } },
      _count: { select: { attendances: true } },
    },
    orderBy: { startAt: 'asc' },
    take: 500,
  }),

  findSessionById: (id) => prisma.classSession.findFirst({
    where: { id, ...softDeleteWhere },
    include: {
      batch: {
        include: {
          enrollments: {
            where: { isActive: true },
            include: { student: { select: studentSelect } },
          },
        },
      },
      instructor: { select: userSelect },
      branch: { select: { id: true, name: true, code: true, companyId: true } },
      attendances: {
        include: {
          student: { select: studentSelect },
          markedBy: { select: userSelect },
        },
      },
    },
  }),

  findSessionByBatchStart: (batchId, startAt) => prisma.classSession.findUnique({
    where: { batchId_startAt: { batchId, startAt } },
  }),

  createSession: (data) => prisma.classSession.create({ data }),
  updateSession: (id, data) => prisma.classSession.update({ where: { id }, data }),

  upsertAttendance: (data) => prisma.classAttendance.upsert({
    where: { sessionId_studentId: { sessionId: data.sessionId, studentId: data.studentId } },
    create: data,
    update: {
      status: data.status,
      markedAt: data.markedAt,
      markedById: data.markedById,
      remarks: data.remarks,
      checkInAt: data.checkInAt,
      checkOutAt: data.checkOutAt,
      source: data.source,
      locked: data.locked,
      correctionReason: data.correctionReason,
    },
  }),

  findStudentAttendances: (studentId, where = {}) => prisma.classAttendance.findMany({
    where: { studentId, ...where },
    include: {
      session: {
        include: {
          batch: { select: { id: true, name: true, code: true, courseName: true } },
        },
      },
      markedBy: { select: userSelect },
    },
    orderBy: { markedAt: 'desc' },
    take: 500,
  }),
};
