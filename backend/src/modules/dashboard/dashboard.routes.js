import { Router } from 'express';
import { authenticate, authorize } from '../../middleware/auth.middleware.js';
import { PERMISSIONS } from '../../config/permissions.js';
import * as dashboardController from './dashboard.controller.js';

const router = Router();

router.use(authenticate);
router.get('/stats', authorize(PERMISSIONS.DASHBOARD_VIEW), dashboardController.getDashboardStats);
router.get('/analytics', authorize(PERMISSIONS.DASHBOARD_VIEW), dashboardController.getDashboardAnalytics);
router.get('/activity', authorize(PERMISSIONS.DASHBOARD_VIEW), dashboardController.getRecentActivity);
router.get('/my-target', authorize(PERMISSIONS.DASHBOARD_VIEW), dashboardController.getMyTarget);

export default router;
