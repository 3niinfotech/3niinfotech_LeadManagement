import { Router } from 'express';
import { authenticate, authorize } from '../../middleware/auth.middleware.js';
import { PERMISSIONS } from '../../config/permissions.js';
import * as refundController from './refund.controller.js';

const router = Router();
router.use(authenticate);

router.get('/', authorize([PERMISSIONS.REFUNDS_VIEW, PERMISSIONS.INVOICES_VIEW, 'accounts.refund.view']), refundController.getRefunds);
router.get('/:id', authorize([PERMISSIONS.REFUNDS_VIEW, PERMISSIONS.INVOICES_VIEW, 'accounts.refund.view']), refundController.getRefund);
router.post('/', authorize([PERMISSIONS.REFUNDS_MANAGE, PERMISSIONS.INVOICES_CREATE, 'accounts.refund.manage']), refundController.requestRefund);
router.post('/:id/approve', authorize([PERMISSIONS.REFUNDS_MANAGE, PERMISSIONS.INVOICES_UPDATE, 'accounts.refund.manage']), refundController.approveRefund);
router.post('/:id/reject', authorize([PERMISSIONS.REFUNDS_MANAGE, PERMISSIONS.INVOICES_UPDATE, 'accounts.refund.manage']), refundController.rejectRefund);
router.post('/:id/disburse', authorize([PERMISSIONS.REFUNDS_MANAGE, PERMISSIONS.PAYMENTS_CREATE, 'accounts.refund.manage']), refundController.disburseRefund);

export default router;

