import { Router } from 'express';
import { authenticate, authorize } from '../../middleware/auth.middleware.js';
import { PERMISSIONS } from '../../config/permissions.js';
import * as receptionController from './reception.controller.js';

const router = Router();

router.use(authenticate);

/** Operational home for reception — dashboard.view OR walk-in view */
router.get(
  '/dashboard',
  authorize(PERMISSIONS.DASHBOARD_VIEW, PERMISSIONS.WALKIN_VIEW),
  receptionController.getDashboard,
);

export default router;
