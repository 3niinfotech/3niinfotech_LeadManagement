import { asyncHandler, sendSuccess } from '../../utils/response.util.js';
import { expenseService } from './expense.service.js';

export const getCategories = asyncHandler(async (req, res) => {
  const categories = await expenseService.getCategories(req.user.companyId);
  sendSuccess(res, categories);
});

export const createCategory = asyncHandler(async (req, res) => {
  const category = await expenseService.createCategory(req.body, req.user.companyId);
  sendSuccess(res, category, 'Expense category created', 201);
});

export const getExpenses = asyncHandler(async (req, res) => {
  const expenses = await expenseService.getAll(req.query);
  sendSuccess(res, expenses);
});

export const getExpense = asyncHandler(async (req, res) => {
  const expense = await expenseService.getById(req.params.id);
  sendSuccess(res, expense);
});

export const createExpense = asyncHandler(async (req, res) => {
  const expense = await expenseService.create(req.body, req.user.id, req);
  sendSuccess(res, expense, 'Expense recorded', 201);
});

export const approveExpense = asyncHandler(async (req, res) => {
  const expense = await expenseService.approve(req.params.id, req.user.id, req);
  sendSuccess(res, expense, 'Expense approved');
});

export const payExpense = asyncHandler(async (req, res) => {
  const expense = await expenseService.pay(req.params.id, req.user.id, req);
  sendSuccess(res, expense, 'Expense paid and posted to ledger');
});

export const deleteExpense = asyncHandler(async (req, res) => {
  await expenseService.delete(req.params.id, req.user.id, req);
  sendSuccess(res, null, 'Expense deleted');
});

