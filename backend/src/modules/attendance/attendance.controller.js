import { asyncHandler, sendSuccess, sendPaginated, parsePagination } from '../../utils/response.util.js';
import { attendanceService } from './attendance.service.js';
import {
  createBatchSchema,
  updateBatchSchema,
  enrollSchema,
  timetableSlotSchema,
  generateSessionsSchema,
  bulkAttendanceSchema,
  correctAttendanceSchema,
} from './attendance.validators.js';

export const listBatches = asyncHandler(async (req, res) => {
  const result = await attendanceService.listBatches(req.query, req.user);
  sendPaginated(res, result.data, result.pagination);
});

export const getBatch = asyncHandler(async (req, res) => {
  const data = await attendanceService.getBatch(req.params.id, req.user);
  sendSuccess(res, data);
});

export const createBatch = asyncHandler(async (req, res) => {
  const data = createBatchSchema.parse(req.body);
  const batch = await attendanceService.createBatch(data, req.user, req);
  sendSuccess(res, batch, 'Batch created', 201);
});

export const updateBatch = asyncHandler(async (req, res) => {
  const data = updateBatchSchema.parse(req.body);
  const batch = await attendanceService.updateBatch(req.params.id, data, req.user, req);
  sendSuccess(res, batch, 'Batch updated');
});

export const enrollStudents = asyncHandler(async (req, res) => {
  const { studentIds } = enrollSchema.parse(req.body);
  const data = await attendanceService.enrollStudents(req.params.id, studentIds, req.user, req);
  sendSuccess(res, data, 'Students enrolled');
});

export const unenrollStudent = asyncHandler(async (req, res) => {
  const data = await attendanceService.unenrollStudent(req.params.id, req.params.studentId, req.user, req);
  sendSuccess(res, data, 'Student removed from batch');
});

export const addTimetableSlot = asyncHandler(async (req, res) => {
  const data = timetableSlotSchema.parse(req.body);
  const slot = await attendanceService.addTimetableSlot(req.params.id, data, req.user, req);
  sendSuccess(res, slot, 'Timetable slot added', 201);
});

export const generateSessions = asyncHandler(async (req, res) => {
  const data = generateSessionsSchema.parse(req.body);
  const result = await attendanceService.generateSessions(req.params.id, data, req.user, req);
  sendSuccess(res, result, 'Sessions generated');
});

export const listSessions = asyncHandler(async (req, res) => {
  const data = await attendanceService.listSessions(req.query, req.user);
  sendSuccess(res, data);
});

export const getSessionAttendance = asyncHandler(async (req, res) => {
  const data = await attendanceService.getSessionAttendance(req.params.id, req.user);
  sendSuccess(res, data);
});

export const saveAttendance = asyncHandler(async (req, res) => {
  const data = bulkAttendanceSchema.parse(req.body);
  const result = await attendanceService.saveAttendance(req.params.id, data, req.user, req);
  sendSuccess(res, result, 'Attendance saved');
});

export const correctAttendance = asyncHandler(async (req, res) => {
  const data = correctAttendanceSchema.parse(req.body);
  const result = await attendanceService.correctAttendance(req.params.id, data, req.user, req);
  sendSuccess(res, result, 'Attendance corrected');
});

export const myAttendance = asyncHandler(async (req, res) => {
  const data = await attendanceService.studentSummary(null, req.user);
  sendSuccess(res, data);
});

export const studentSummary = asyncHandler(async (req, res) => {
  const data = await attendanceService.studentSummary(req.params.studentId, req.user);
  sendSuccess(res, data);
});

export const dashboardWidgets = asyncHandler(async (req, res) => {
  const data = await attendanceService.dashboardWidgets(req.user);
  sendSuccess(res, data);
});

export const classReport = asyncHandler(async (req, res) => {
  const data = await attendanceService.classReport(req.query, req.user);
  sendSuccess(res, data);
});

export { parsePagination };
