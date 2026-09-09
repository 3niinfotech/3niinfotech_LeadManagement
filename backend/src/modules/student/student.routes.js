import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { authenticate, authorize } from '../../middleware/auth.middleware.js';
import { PERMISSIONS } from '../../config/permissions.js';
import * as studentController from './student.controller.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadDir = path.join(__dirname, '..', '..', '..', 'uploads', 'students');
fs.mkdirSync(uploadDir, { recursive: true });

const fileUpload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, uploadDir),
    filename: (_req, file, cb) => {
      const safe = String(file.originalname || 'file').replace(/\s+/g, '-').replace(/[^\w.\-()]+/g, '');
      cb(null, `${Date.now()}-${safe || 'file'}`);
    },
  }),
});

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
router.get('/:id/documents', authorize(PERMISSIONS.DOCUMENTS_VIEW), studentController.getStudentDocuments);
router.post(
  '/:id/documents',
  authorize(PERMISSIONS.DOCUMENTS_UPLOAD),
  fileUpload.single('file'),
  studentController.uploadStudentDocument,
);
router.delete(
  '/:id/documents/:docId',
  authorize(PERMISSIONS.DOCUMENTS_DELETE),
  studentController.deleteStudentDocument,
);

export default router;
