import { Router } from 'express';
import { authenticate, authorize } from '../../middleware/auth.middleware.js';
import { PERMISSIONS } from '../../config/permissions.js';
import * as reportsController from './reports.controller.js';

const router = Router();

router.use(authenticate);
router.get('/enquiries', authorize(PERMISSIONS.REPORTS_VIEW), reportsController.getEnquiryReports);

export default router;
