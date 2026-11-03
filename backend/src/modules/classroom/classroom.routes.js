import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { authenticate, authorize } from '../../middleware/auth.middleware.js';
import { PERMISSIONS } from '../../config/permissions.js';
import * as ctrl from './classroom.controller.js';

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
  limits: { fileSize: 30 * 1024 * 1024 },
});

const router = Router();
const view = authorize(PERMISSIONS.ATTENDANCE_VIEW, PERMISSIONS.STUDENTS_VIEW);
const manage = authorize(PERMISSIONS.ATTENDANCE_MARK, PERMISSIONS.ATTENDANCE_EDIT);

router.use(authenticate);

router.get('/assignments', view, ctrl.listAssignments);
router.post('/assignments', manage, fileUpload.single('file'), ctrl.createAssignment);
router.get('/assignments/:id', view, ctrl.getAssignment);
router.put('/assignments/:id', manage, fileUpload.single('file'), ctrl.updateAssignment);
router.delete('/assignments/:id', manage, ctrl.deleteAssignment);
router.post('/assignments/:id/submit', view, fileUpload.single('file'), ctrl.submitAssignment);
router.put('/assignments/:id/submissions/:submissionId', manage, ctrl.reviewSubmission);

router.get('/tests', view, ctrl.listTests);
router.post('/tests', manage, ctrl.createTest);
router.get('/tests/:id', view, ctrl.getTest);
router.put('/tests/:id', manage, ctrl.updateTest);
router.delete('/tests/:id', manage, ctrl.deleteTest);
router.put('/tests/:id/results', manage, ctrl.saveTestResults);

router.get('/materials', view, ctrl.listMaterials);
router.post('/materials', manage, fileUpload.single('file'), ctrl.createMaterial);
router.get('/materials/:id', view, ctrl.getMaterial);
router.put('/materials/:id', manage, fileUpload.single('file'), ctrl.updateMaterial);
router.delete('/materials/:id', manage, ctrl.deleteMaterial);

router.get('/students/:studentId/remarks', view, ctrl.listRemarks);
router.post('/students/:studentId/remarks', manage, ctrl.addRemark);

router.get('/performance', view, ctrl.performanceSummary);

export default router;
