import { Router } from 'express';
import { authenticate, authorize } from '../../middleware/auth.middleware.js';
import { PERMISSIONS } from '../../config/permissions.js';
import * as invoiceController from './invoice.controller.js';

const router = Router();
router.use(authenticate);

router.get('/', authorize(PERMISSIONS.INVOICES_VIEW), invoiceController.getInvoices);
router.get('/:id', authorize(PERMISSIONS.INVOICES_VIEW), invoiceController.getInvoice);
router.post('/', authorize(PERMISSIONS.INVOICES_CREATE), invoiceController.createInvoice);
router.put('/:id', authorize(PERMISSIONS.INVOICES_UPDATE), invoiceController.updateInvoice);
router.delete('/:id', authorize(PERMISSIONS.INVOICES_DELETE), invoiceController.deleteInvoice);

export default router;
