import { Router } from 'express';
import { authenticate, authorize } from '../../middleware/auth.middleware.js';
import { authLimiter } from '../../middleware/rateLimit.middleware.js';
import { PERMISSIONS } from '../../config/permissions.js';
import * as controller from './role-application.controller.js';

const router = Router();

// Public apply
router.get('/open-roles', authLimiter, controller.listOpenRoles);
router.get('/branches', authLimiter, controller.getApplyBranches);
router.post('/apply', authLimiter, controller.submitApplication);

// Admin review
router.get(
  '/summary',
  authenticate,
  authorize(PERMISSIONS.ROLE_APPLICATION_VIEW),
  controller.getApplicationSummary,
);
router.get(
  '/',
  authenticate,
  authorize(PERMISSIONS.ROLE_APPLICATION_VIEW),
  controller.listApplications,
);
router.get(
  '/:id',
  authenticate,
  authorize(PERMISSIONS.ROLE_APPLICATION_VIEW),
  controller.getApplicationById,
);
router.patch(
  '/:id/reject',
  authenticate,
  authorize(PERMISSIONS.ROLE_APPLICATION_REVIEW),
  controller.rejectApplication,
);
router.patch(
  '/:id/approve',
  authenticate,
  authorize(PERMISSIONS.ROLE_APPLICATION_APPROVE),
  controller.approveApplication,
);

export default router;
