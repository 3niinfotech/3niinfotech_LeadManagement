import { Router } from 'express';
import { authenticate, authorize } from '../../middleware/auth.middleware.js';
import { PERMISSIONS } from '../../config/permissions.js';
import * as paymentProofController from './payment-proof.controller.js';

const router = Router();
router.use(authenticate);

router.get('/', authorize([PERMISSIONS.PAYMENTS_VIEW, PERMISSIONS.INVOICES_VIEW, 'accounts.payment_proof.view']), paymentProofController.getPaymentProofs);
router.get('/:id', authorize([PERMISSIONS.PAYMENTS_VIEW, PERMISSIONS.INVOICES_VIEW, 'accounts.payment_proof.view']), paymentProofController.getPaymentProof);
router.post('/', paymentProofController.createPaymentProof);
router.post('/:id/review', authorize([PERMISSIONS.PAYMENTS_CREATE, 'accounts.payment_proof.review', 'accounts.payment.collect']), paymentProofController.reviewPaymentProof);

export default router;

