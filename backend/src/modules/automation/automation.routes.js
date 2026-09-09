import { Router } from 'express';
import { authenticate, authorize } from '../../middleware/auth.middleware.js';
import {
  getAutomationCenter,
  getAutomationHistory,
  updateAutomationRule,
} from './automation.controller.js';

const router = Router();
router.use(authenticate);

router.get('/', authorize('settings.view', 'settings.manage'), getAutomationCenter);
router.get('/history', authorize('settings.view', 'settings.manage'), getAutomationHistory);
router.patch('/rules/:ruleId', authorize('settings.manage'), updateAutomationRule);

export default router;
