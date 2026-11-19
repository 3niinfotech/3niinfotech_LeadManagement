import { Router } from 'express';
import { authenticate, authorize } from '../../middleware/auth.middleware.js';
import { PERMISSIONS } from '../../config/permissions.js';
import * as ledgerController from './ledger.controller.js';

const router = Router();
router.use(authenticate);

router.get('/summary', authorize([PERMISSIONS.LEDGER_VIEW, PERMISSIONS.INVOICES_VIEW, 'accounts.ledger.view']), ledgerController.getLedgerSummary);
router.get('/export', authorize([PERMISSIONS.LEDGER_VIEW, PERMISSIONS.INVOICES_VIEW, 'accounts.ledger.view']), ledgerController.exportLedger);
router.get('/', authorize([PERMISSIONS.LEDGER_VIEW, PERMISSIONS.INVOICES_VIEW, 'accounts.ledger.view']), ledgerController.getLedger);

export default router;

