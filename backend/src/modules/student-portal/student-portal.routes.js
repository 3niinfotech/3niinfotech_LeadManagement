import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { authenticate, authorize } from '../../middleware/auth.middleware.js';
import { PERMISSIONS } from '../../config/permissions.js';
import * as ctrl from './student-portal.controller.js';

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
  limits: { fileSize: 30 * 1024 * 1024 }, // 30MB
});

const router = Router();

router.use(authenticate);

router.get('/dashboard', authorize(PERMISSIONS.STUDENTS_VIEW), ctrl.dashboard);
router.get('/fees', authorize(PERMISSIONS.STUDENTS_VIEW), ctrl.fees);
router.get('/fees/receipts/:receiptKey', authorize(PERMISSIONS.STUDENTS_VIEW), ctrl.feeReceipt);
router.get('/documents', authorize(PERMISSIONS.DOCUMENTS_VIEW), ctrl.documents);
router.post('/documents', authorize(PERMISSIONS.DOCUMENTS_UPLOAD), fileUpload.single('file'), ctrl.uploadDocument);
router.get('/applications', authorize(PERMISSIONS.APPLICATIONS_VIEW), ctrl.applications);
router.get('/visas', authorize(PERMISSIONS.VISAS_VIEW), ctrl.visas);
router.get('/counseling', authorize(PERMISSIONS.CALENDAR_VIEW, PERMISSIONS.STUDENTS_VIEW), ctrl.counseling);
router.post('/counseling/request', authorize(PERMISSIONS.CALENDAR_VIEW, PERMISSIONS.STUDENTS_VIEW), ctrl.requestCounseling);
router.post('/counselor/message', authorize(PERMISSIONS.STUDENTS_VIEW), ctrl.messageCounselor);
router.get('/reports', authorize(PERMISSIONS.ATTENDANCE_VIEW, PERMISSIONS.STUDENTS_VIEW), ctrl.reports);
router.get('/profile', authorize(PERMISSIONS.STUDENTS_VIEW), ctrl.profile);
router.patch('/profile', authorize(PERMISSIONS.STUDENTS_VIEW), ctrl.updateProfile);
router.post('/payments/create-order', authorize(PERMISSIONS.STUDENTS_VIEW), ctrl.createPaymentOrder);
router.post('/payments/verify', authorize(PERMISSIONS.STUDENTS_VIEW), ctrl.verifyPayment);
router.post('/payments/submit-offline-proof', authorize(PERMISSIONS.STUDENTS_VIEW), fileUpload.single('file'), ctrl.submitOfflineProof);


export default router;
