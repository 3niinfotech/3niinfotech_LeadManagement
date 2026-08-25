import { Router } from 'express';
import { authenticate, authorize } from '../../middleware/auth.middleware.js';
import { PERMISSIONS } from '../../config/permissions.js';
import * as reportsController from './reports.controller.js';

const router = Router();

router.use(authenticate);
router.get('/enquiries', authorize(PERMISSIONS.REPORTS_VIEW), reportsController.getEnquiryReports);
router.get('/attendance', authorize(PERMISSIONS.REPORTS_VIEW, PERMISSIONS.ATTENDANCE_REPORT), reportsController.getAttendanceReport);
router.get(
  '/export/:kind',
  authorize(PERMISSIONS.REPORTS_VIEW, PERMISSIONS.REPORTS_EXPORT),
  reportsController.exportDataset,
);

export default router;
