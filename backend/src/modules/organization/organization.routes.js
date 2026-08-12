import { Router } from 'express';
import { authenticate, authorize } from '../../middleware/auth.middleware.js';
import { PERMISSIONS } from '../../config/permissions.js';
import * as organizationController from './organization.controller.js';

const router = Router();

const view = authorize(
  PERMISSIONS.SETTINGS_VIEW,
  PERMISSIONS.MASTERS_VIEW,
  PERMISSIONS.ENQUIRIES_VIEW,
);
const manage = authorize(PERMISSIONS.SETTINGS_UPDATE, PERMISSIONS.MASTERS_MANAGE);

router.use(authenticate);

router.get('/company', view, organizationController.getCompany);
router.put('/company', manage, organizationController.updateCompany);
router.get('/branches', view, organizationController.listBranches);
router.post('/branches', manage, organizationController.createBranch);
router.put('/branches/:id', manage, organizationController.updateBranch);
router.patch('/branches/:id/status', manage, organizationController.updateBranchStatus);

export default router;
