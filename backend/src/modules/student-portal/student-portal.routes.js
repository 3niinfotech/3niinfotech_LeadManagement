import { Router } from 'express';
import { authenticate, authorize } from '../../middleware/auth.middleware.js';
import { PERMISSIONS } from '../../config/permissions.js';
import * as ctrl from './student-portal.controller.js';

const router = Router();

router.use(authenticate);

router.get('/dashboard', authorize(PERMISSIONS.STUDENTS_VIEW), ctrl.dashboard);
router.get('/fees', authorize(PERMISSIONS.STUDENTS_VIEW), ctrl.fees);
router.get('/fees/receipts/:receiptKey', authorize(PERMISSIONS.STUDENTS_VIEW), ctrl.feeReceipt);
router.get('/documents', authorize(PERMISSIONS.DOCUMENTS_VIEW), ctrl.documents);
router.post('/documents', authorize(PERMISSIONS.DOCUMENTS_UPLOAD), ctrl.uploadDocument);
router.get('/applications', authorize(PERMISSIONS.APPLICATIONS_VIEW), ctrl.applications);
router.get('/visas', authorize(PERMISSIONS.VISAS_VIEW), ctrl.visas);
router.get('/counseling', authorize(PERMISSIONS.CALENDAR_VIEW, PERMISSIONS.STUDENTS_VIEW), ctrl.counseling);
router.post('/counseling/request', authorize(PERMISSIONS.CALENDAR_VIEW, PERMISSIONS.STUDENTS_VIEW), ctrl.requestCounseling);
router.get('/reports', authorize(PERMISSIONS.ATTENDANCE_VIEW, PERMISSIONS.STUDENTS_VIEW), ctrl.reports);
router.get('/profile', authorize(PERMISSIONS.STUDENTS_VIEW), ctrl.profile);
router.patch('/profile', authorize(PERMISSIONS.STUDENTS_VIEW), ctrl.updateProfile);

export default router;
