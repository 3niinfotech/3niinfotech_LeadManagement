import { Router } from 'express';
import { authenticate, authorize } from '../../middleware/auth.middleware.js';
import { PERMISSIONS } from '../../config/permissions.js';
import * as reminderController from './reminder.controller.js';

const router = Router();

router.use(authenticate);

/** Any calendar / enquiry / lead viewer can open role-scoped reminders */
router.get(
  '/',
  authorize(
    PERMISSIONS.CALENDAR_VIEW,
    'enquiry.view',
    'enquiries:view',
    'lead.view',
    'student.view',
  ),
  reminderController.getFeed,
);

router.get(
  '/summary',
  authorize(
    PERMISSIONS.CALENDAR_VIEW,
    'enquiry.view',
    'enquiries:view',
    'lead.view',
    'student.view',
  ),
  reminderController.getSummary,
);

export default router;
