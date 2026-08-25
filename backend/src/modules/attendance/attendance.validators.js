import { z } from 'zod';
import { CLASS_ATTENDANCE_STATUSES } from './attendance.constants.js';

export const createBatchSchema = z.object({
  branchId: z.string().uuid().optional().nullable(),
  name: z.string().min(1).max(200),
  courseName: z.string().min(1).max(200),
  instructorId: z.string().uuid().optional().nullable(),
  room: z.string().max(120).optional().nullable(),
  startDate: z.string().optional().nullable(),
  endDate: z.string().optional().nullable(),
  isActive: z.boolean().optional(),
});

export const updateBatchSchema = createBatchSchema.partial();

export const enrollSchema = z.object({
  studentIds: z.array(z.string().uuid()).min(1).max(200),
});

export const timetableSlotSchema = z.object({
  dayOfWeek: z.number().int().min(0).max(6),
  startTime: z.string().regex(/^\d{2}:\d{2}$/),
  endTime: z.string().regex(/^\d{2}:\d{2}$/),
  room: z.string().max(120).optional().nullable(),
  instructorId: z.string().uuid().optional().nullable(),
  isActive: z.boolean().optional(),
});

export const generateSessionsSchema = z.object({
  from: z.string(),
  to: z.string(),
});

export const attendanceEntrySchema = z.object({
  studentId: z.string().uuid(),
  status: z.enum(CLASS_ATTENDANCE_STATUSES),
  remarks: z.string().max(2000).optional().nullable(),
  checkInAt: z.string().optional().nullable(),
  checkOutAt: z.string().optional().nullable(),
});

export const bulkAttendanceSchema = z.object({
  entries: z.array(attendanceEntrySchema).min(1).max(200),
  markAllPresent: z.boolean().optional(),
});

export const correctAttendanceSchema = z.object({
  studentId: z.string().uuid(),
  status: z.enum(CLASS_ATTENDANCE_STATUSES),
  reason: z.string().min(3).max(2000),
  remarks: z.string().max(2000).optional().nullable(),
});
