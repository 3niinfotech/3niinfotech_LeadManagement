import prisma from '../../config/database.js';
import { AppError } from '../../utils/response.util.js';
import { auditLog } from '../../middleware/audit.middleware.js';

export const expenseService = {
  getCategories: async (companyId) => {
    return prisma.expenseCategory.findMany({
      where: {
        isActive: true,
        ...(companyId ? { OR: [{ companyId }, { companyId: null }] } : {}),
      },
      orderBy: { name: 'asc' },
    });
  },

  createCategory: async (data, companyId) => {
    const { name, code, description } = data;
    if (!name || !code) throw new AppError('Category name and code are required', 400);

    return prisma.expenseCategory.create({
      data: {
        companyId: companyId || null,
        name: name.trim(),
        code: code.trim().toUpperCase(),
        description: description || null,
        isActive: true,
      },
    });
  },

  getAll: async (query) => {
    const { status, categoryId, branchId, from, to } = query || {};
    const where = {};
    if (status && status !== 'ALL') where.status = status;
    if (categoryId) where.categoryId = categoryId;
    if (branchId) where.branchId = branchId;
    if (from || to) {
      where.expenseDate = {};
      if (from) where.expenseDate.gte = new Date(from);
      if (to) {
        const toDate = new Date(to);
        toDate.setHours(23, 59, 59, 999);
        where.expenseDate.lte = toDate;
      }
    }

    return prisma.expense.findMany({
      where,
      include: {
        category: true,
        branch: { select: { id: true, name: true, code: true } },
        createdBy: { select: { id: true, firstName: true, lastName: true, email: true } },
        approvedBy: { select: { id: true, firstName: true, lastName: true, email: true } },
      },
      orderBy: { expenseDate: 'desc' },
    });
  },

  getById: async (id) => {
    const exp = await prisma.expense.findUnique({
      where: { id },
      include: {
        category: true,
        branch: { select: { id: true, name: true, code: true } },
        createdBy: { select: { id: true, firstName: true, lastName: true, email: true } },
        approvedBy: { select: { id: true, firstName: true, lastName: true, email: true } },
      },
    });
    if (!exp) throw new AppError('Expense not found', 404);
    return exp;
  },

  create: async (data, userId, req) => {
    const { branchId, categoryId, title, amount, expenseDate, paymentMethod, referenceNo, vendorName, receiptUrl, notes } = data;
    if (!categoryId) throw new AppError('Category ID is required', 400);
    if (!title) throw new AppError('Expense title is required', 400);
    const numAmount = Number(amount);
    if (isNaN(numAmount) || numAmount <= 0) throw new AppError('Valid amount is required', 400);

    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const count = await prisma.expense.count();
    const expenseNo = `EXP-${dateStr}-${String(count + 1).padStart(4, '0')}`;

    const exp = await prisma.expense.create({
      data: {
        expenseNo,
        branchId: branchId || null,
        categoryId,
        title: title.trim(),
        amount: numAmount,
        expenseDate: expenseDate ? new Date(expenseDate) : new Date(),
        paymentMethod: paymentMethod || 'BANK_TRANSFER',
        referenceNo: referenceNo || null,
        vendorName: vendorName || null,
        receiptUrl: receiptUrl || null,
        notes: notes || null,
        status: 'PENDING',
        createdById: userId,
      },
      include: { category: true, branch: true },
    });

    if (req) {
      await auditLog({
        userId,
        action: 'CREATE',
        entityType: 'Expense',
        entityId: exp.id,
        newData: exp,
        req,
      });
    }

    return exp;
  },

  approve: async (id, userId, req) => {
    const exp = await prisma.expense.findUnique({ where: { id } });
    if (!exp) throw new AppError('Expense not found', 404);
    if (exp.status !== 'PENDING') throw new AppError(`Cannot approve expense in ${exp.status} status`, 400);

    const updated = await prisma.expense.update({
      where: { id },
      data: {
        status: 'APPROVED',
        approvedById: userId,
        approvedAt: new Date(),
      },
    });

    if (req) {
      await auditLog({
        userId,
        action: 'EXPENSE_APPROVED',
        entityType: 'Expense',
        entityId: id,
        newData: updated,
        req,
      });
    }

    return updated;
  },

  pay: async (id, userId, req) => {
    const exp = await prisma.expense.findUnique({ where: { id } });
    if (!exp) throw new AppError('Expense not found', 404);
    if (exp.status === 'PAID') throw new AppError('Expense is already paid', 400);

    const numAmount = Number(exp.amount);

    const result = await prisma.$transaction(async (tx) => {
      // 1. Mark expense PAID
      const updated = await tx.expense.update({
        where: { id },
        data: {
          status: 'PAID',
          paidAt: new Date(),
          approvedById: exp.approvedById || userId,
          approvedAt: exp.approvedAt || new Date(),
        },
      });

      // 2. Post debit entry in AccountLedger
      const branchId = exp.branchId || null;
      const lastLedger = await tx.accountLedger.findFirst({
        where: branchId ? { branchId } : {},
        orderBy: { createdAt: 'desc' },
      });
      const previousBalance = Number(lastLedger?.balanceAfter || 0);
      const newBalance = Math.round((previousBalance - numAmount) * 100) / 100;

      const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
      const count = await tx.accountLedger.count();
      const entryNo = `LED-${dateStr}-${String(count + 1).padStart(5, '0')}`;

      await tx.accountLedger.create({
        data: {
          entryNo,
          branchId,
          entryType: 'EXPENSE',
          amount: numAmount,
          isCredit: false,
          balanceAfter: newBalance,
          description: `Operating expense: ${exp.title} (${exp.expenseNo})`,
          referenceType: 'EXPENSE',
          referenceId: exp.id,
          expenseId: exp.id,
          createdById: userId,
        },
      });

      return updated;
    });

    if (req) {
      await auditLog({
        userId,
        action: 'EXPENSE_PAID',
        entityType: 'Expense',
        entityId: id,
        newData: result,
        req,
      });
    }

    return result;
  },

  delete: async (id, userId, req) => {
    const exp = await prisma.expense.findUnique({ where: { id } });
    if (!exp) throw new AppError('Expense not found', 404);
    if (exp.status === 'PAID') throw new AppError('Cannot delete a paid expense', 400);

    await prisma.expense.delete({ where: { id } });

    if (req) {
      await auditLog({
        userId,
        action: 'DELETE',
        entityType: 'Expense',
        entityId: id,
        oldData: exp,
        req,
      });
    }
  },
};

