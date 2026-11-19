import { Router } from 'express';
import { authenticate, authorize } from '../../middleware/auth.middleware.js';
import { PERMISSIONS } from '../../config/permissions.js';
import * as expenseController from './expense.controller.js';

const router = Router();
router.use(authenticate);

router.get('/categories', authorize([PERMISSIONS.EXPENSES_VIEW, PERMISSIONS.INVOICES_VIEW, 'accounts.expense.view']), expenseController.getCategories);
router.post('/categories', authorize([PERMISSIONS.EXPENSES_MANAGE, PERMISSIONS.INVOICES_CREATE, 'accounts.expense.manage']), expenseController.createCategory);

router.get('/', authorize([PERMISSIONS.EXPENSES_VIEW, PERMISSIONS.INVOICES_VIEW, 'accounts.expense.view']), expenseController.getExpenses);
router.get('/:id', authorize([PERMISSIONS.EXPENSES_VIEW, PERMISSIONS.INVOICES_VIEW, 'accounts.expense.view']), expenseController.getExpense);
router.post('/', authorize([PERMISSIONS.EXPENSES_MANAGE, PERMISSIONS.INVOICES_CREATE, 'accounts.expense.manage']), expenseController.createExpense);
router.post('/:id/approve', authorize([PERMISSIONS.EXPENSES_MANAGE, PERMISSIONS.INVOICES_UPDATE, 'accounts.expense.manage']), expenseController.approveExpense);
router.post('/:id/pay', authorize([PERMISSIONS.EXPENSES_MANAGE, PERMISSIONS.PAYMENTS_CREATE, 'accounts.expense.manage']), expenseController.payExpense);
router.delete('/:id', authorize([PERMISSIONS.EXPENSES_MANAGE, PERMISSIONS.INVOICES_DELETE, 'accounts.expense.manage']), expenseController.deleteExpense);

export default router;

