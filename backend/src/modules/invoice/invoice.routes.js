import { Router } from 'express';
import { authenticate, authorize } from '../../middleware/auth.middleware.js';
import { PERMISSIONS } from '../../config/permissions.js';
import * as invoiceController from './invoice.controller.js';

const router = Router();
router.use(authenticate);

router.get('/accountant-dashboard', authorize(PERMISSIONS.INVOICES_VIEW, 'accounts.dashboard.view', 'dashboard.view', 'accounts.invoice.view'), invoiceController.getAccountantDashboard);
router.get('/receipts/:receiptNo', authorize(PERMISSIONS.INVOICES_VIEW, 'accounts.payment.view', 'accounts.invoice.view'), invoiceController.getReceipt);
router.get('/summary', authorize(PERMISSIONS.INVOICES_VIEW, 'accounts.invoice.view'), invoiceController.getInvoiceSummary);
router.post('/export', authorize(PERMISSIONS.INVOICES_VIEW, 'accounts.invoice.view', 'reports.export'), invoiceController.exportInvoices);
router.get('/', authorize(PERMISSIONS.INVOICES_VIEW, 'accounts.invoice.view'), invoiceController.getInvoices);
router.get('/:id', authorize(PERMISSIONS.INVOICES_VIEW, 'accounts.invoice.view'), invoiceController.getInvoice);
router.post('/', authorize(PERMISSIONS.INVOICES_CREATE, 'accounts.invoice.create'), invoiceController.createInvoice);
router.put('/:id', authorize(PERMISSIONS.INVOICES_UPDATE, 'accounts.invoice.edit'), invoiceController.updateInvoice);
router.delete('/:id', authorize(PERMISSIONS.INVOICES_DELETE, 'accounts.invoice.delete'), invoiceController.deleteInvoice);

router.post('/:id/payments', authorize(PERMISSIONS.PAYMENTS_CREATE, 'accounts.payment.collect', PERMISSIONS.INVOICES_UPDATE, 'accounts.invoice.edit'), invoiceController.collectPayment);
router.get('/:id/payments', authorize(PERMISSIONS.INVOICES_VIEW, 'accounts.payment.view', 'accounts.invoice.view'), invoiceController.getInvoicePayments);

export default router;
