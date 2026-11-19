import { Router } from 'express';
import { authenticate, authorize } from '../../middleware/auth.middleware.js';
import { PERMISSIONS } from '../../config/permissions.js';
import * as feePlanController from './fee-plan.controller.js';

const router = Router();
router.use(authenticate);

router.get('/student/:studentId', authorize([PERMISSIONS.FEE_PLANS_VIEW, PERMISSIONS.INVOICES_VIEW, 'accounts.fee_plan.view']), feePlanController.getStudentFeePlans);
router.get('/:id', authorize([PERMISSIONS.FEE_PLANS_VIEW, PERMISSIONS.INVOICES_VIEW, 'accounts.fee_plan.view']), feePlanController.getFeePlan);
router.post('/', authorize([PERMISSIONS.FEE_PLANS_MANAGE, PERMISSIONS.INVOICES_CREATE, 'accounts.fee_plan.manage']), feePlanController.createFeePlan);
router.post('/:id/installments', authorize([PERMISSIONS.FEE_PLANS_MANAGE, PERMISSIONS.INVOICES_CREATE, 'accounts.fee_plan.manage']), feePlanController.addInstallment);
router.put('/installments/:installmentId', authorize([PERMISSIONS.FEE_PLANS_MANAGE, PERMISSIONS.INVOICES_UPDATE, 'accounts.fee_plan.manage']), feePlanController.updateInstallment);
router.delete('/:id', authorize([PERMISSIONS.FEE_PLANS_MANAGE, PERMISSIONS.INVOICES_DELETE, 'accounts.fee_plan.manage']), feePlanController.deleteFeePlan);

export default router;

