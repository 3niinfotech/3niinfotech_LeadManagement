import { Router } from 'express';
import { authenticate, authorize } from '../../middleware/auth.middleware.js';
import { PERMISSIONS } from '../../config/permissions.js';
import * as studentController from './student.controller.js';

const router = Router();

router.use(authenticate);

router.get('/summary', authorize(PERMISSIONS.STUDENTS_VIEW), studentController.getStudentSummary);
router.post('/export', authorize(PERMISSIONS.STUDENTS_EXPORT), studentController.exportStudents);
router.post('/bulk-status', authorize(PERMISSIONS.STUDENTS_UPDATE), studentController.bulkUpdateStudentStatus);
router.post('/bulk-delete', authorize(PERMISSIONS.STUDENTS_DELETE), studentController.bulkDeleteStudents);
router.post('/bulk-assign', authorize(PERMISSIONS.STUDENTS_ASSIGN), studentController.bulkAssignStudents);
router.get('/', authorize(PERMISSIONS.STUDENTS_VIEW), studentController.getStudents);
router.post('/', authorize(PERMISSIONS.STUDENTS_CREATE), studentController.createStudent);
router.get('/:id', authorize(PERMISSIONS.STUDENTS_VIEW), studentController.getStudent);
router.put('/:id', authorize(PERMISSIONS.STUDENTS_UPDATE), studentController.updateStudent);
router.delete('/:id', authorize(PERMISSIONS.STUDENTS_DELETE), studentController.deleteStudent);

export default router;
