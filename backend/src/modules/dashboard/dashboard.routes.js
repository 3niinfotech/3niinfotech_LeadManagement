import { Router } from 'express';
import { authenticate, authorize } from '../../middleware/auth.middleware.js';
import { PERMISSIONS } from '../../config/permissions.js';
import * as dashboardController from './dashboard.controller.js';

const router = Router();

router.use(authenticate);
router.get('/stats', authorize(PERMISSIONS.DASHBOARD_VIEW), dashboardController.getDashboardStats);
router.get('/activity', authorize(PERMISSIONS.DASHBOARD_VIEW), dashboardController.getRecentActivity);

export default router;
