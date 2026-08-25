import { Router } from 'express';
import { authenticate, authorize } from '../../middleware/auth.middleware.js';
import { PERMISSIONS } from '../../config/permissions.js';
import * as attendanceController from './attendance.controller.js';

const router = Router();
const view = authorize(PERMISSIONS.ATTENDANCE_VIEW, PERMISSIONS.STUDENTS_VIEW);
const mark = authorize(PERMISSIONS.ATTENDANCE_MARK, PERMISSIONS.ATTENDANCE_EDIT);
const manage = authorize(PERMISSIONS.ATTENDANCE_EDIT);
const correct = authorize(PERMISSIONS.ATTENDANCE_CORRECT);
const report = authorize(PERMISSIONS.ATTENDANCE_REPORT, PERMISSIONS.REPORTS_VIEW);

router.use(authenticate);

router.get('/me', view, attendanceController.myAttendance);
router.get('/batches', authorize(PERMISSIONS.ATTENDANCE_VIEW), attendanceController.listBatches);
router.post('/batches', manage, attendanceController.createBatch);
router.get('/batches/:id', view, attendanceController.getBatch);
router.put('/batches/:id', manage, attendanceController.updateBatch);
router.post('/batches/:id/enroll', manage, attendanceController.enrollStudents);
router.delete('/batches/:id/enroll/:studentId', manage, attendanceController.unenrollStudent);
router.post('/batches/:id/timetable', manage, attendanceController.addTimetableSlot);
router.post('/batches/:id/sessions/generate', manage, attendanceController.generateSessions);

router.get('/sessions', authorize(PERMISSIONS.ATTENDANCE_VIEW), attendanceController.listSessions);
router.get('/sessions/:id/attendance', view, attendanceController.getSessionAttendance);
router.put('/sessions/:id/attendance', mark, attendanceController.saveAttendance);
router.post('/sessions/:id/attendance/correct', correct, attendanceController.correctAttendance);

router.get('/students/:studentId', view, attendanceController.studentSummary);
router.get('/dashboard', view, attendanceController.dashboardWidgets);
router.get('/report', report, attendanceController.classReport);

export default router;
