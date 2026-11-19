import { z } from 'zod';
import { AppError } from '../../utils/response.util.js';
import { parseSort } from '../../utils/response.util.js';
import { invoiceRepository, INVOICE_SORT_FIELDS } from './invoice.repository.js';
import prisma from '../../config/database.js';
import { auditLog } from '../../middleware/audit.middleware.js';

const dateInput = z.string().optional().nullable();

export const createInvoiceSchema = z.object({
  studentId: z.string().optional().nullable(),
  invoiceNo: z.string().min(1).optional().nullable(),
  amount: z.coerce.number(),
  tax: z.coerce.number().optional().default(0),
  total: z.coerce.number().optional(),
  currency: z.string().max(10).optional().nullable(),
  status: z.enum(['DRAFT', 'SENT', 'PAID', 'PARTIAL', 'OVERDUE', 'CANCELLED']).optional(),
  dueDate: dateInput,
  paidAt: dateInput,
  notes: z.string().optional().nullable(),
  metadata: z.record(z.any()).optional().nullable(),
});

export const updateInvoiceSchema = createInvoiceSchema.partial();

const parseDate = (value) => (value ? new Date(value) : null);

function requireCompany(user) {
  const companyId = user?.companyId;
  if (!companyId) throw new AppError('Company context required', 403);
  return companyId;
}

function resolveTotal(data) {
  if (data.total != null && !Number.isNaN(Number(data.total))) return Number(data.total);
  return Number(data.amount || 0) + Number(data.tax || 0);
}

async function validateInvoiceMasters(companyId, data) {
  if (data.currency) {
    const code = String(data.currency).trim().toUpperCase();
    const currency = await prisma.currency.findFirst({
      where: { companyId, code, deletedAt: null, isActive: true },
    });
    if (!currency) throw new AppError(`Currency "${code}" is not configured in masters`, 422);
    data.currency = code;
  }

  const meta = data.metadata && typeof data.metadata === 'object' ? data.metadata : {};
  if (meta.taxId) {
    const taxRow = await prisma.tax.findFirst({
      where: { id: meta.taxId, companyId, deletedAt: null, isActive: true },
    });
    if (!taxRow) throw new AppError('Selected tax rate not found in masters', 422);
    if (data.tax == null || Number(data.tax) === 0) {
      const pct = Number(taxRow.taxPercentage || 0);
      const base = Number(data.amount || 0);
      data.tax = Math.round((base * pct / 100) * 100) / 100;
    }
    data.metadata = {
      ...meta,
      taxId: taxRow.id,
      taxName: taxRow.name,
      taxCode: taxRow.code,
      taxPercentage: Number(taxRow.taxPercentage || 0),
    };
  }
}

export const invoiceService = {
  getAll: async (query, user) => {
    const companyId = requireCompany(user);
    const sort = parseSort(query, INVOICE_SORT_FIELDS);
    return invoiceRepository.findMany({ ...query, sort, companyId, user });
  },

  getSummary: async (query, user) => {
    const companyId = requireCompany(user);
    return invoiceRepository.getSummary({ ...query, companyId, user });
  },

  exportInvoices: async (query, user, userId, req) => {
    const companyId = requireCompany(user);
    const { ids: requestedIds, ...filters } = query || {};
    const selected = Array.isArray(requestedIds) && requestedIds.length > 0;
    const sort = parseSort(filters, INVOICE_SORT_FIELDS);
    const result = await invoiceRepository.findMany({
      ...filters,
      ...(selected ? { ids: requestedIds } : {}),
      sort,
      companyId,
      user,
      page: 1,
      limit: selected ? Math.max(requestedIds.length, 1) : 5000,
    });

    const { buildInvoiceExportWorkbook, buildInvoiceExportFilename } = await import(
      './invoice.export.service.js'
    );
    const buffer = await buildInvoiceExportWorkbook(result.data, { selected });
    const filename = buildInvoiceExportFilename({ selected });

    await auditLog({
      userId,
      action: 'EXPORT',
      entityType: 'Invoice',
      newData: { count: result.data.length, selected },
      req,
    });

    return { buffer, filename, count: result.data.length, selected };
  },

  getById: async (id, user) => {
    const companyId = requireCompany(user);
    const record = await invoiceRepository.findById(id, companyId, user);
    if (!record) throw new AppError('Invoice not found', 404);
    return record;
  },

  create: async (data, user, req) => {
    const companyId = requireCompany(user);
    await validateInvoiceMasters(companyId, data);
    const invoiceNo = (data.invoiceNo && String(data.invoiceNo).trim())
      || await invoiceRepository.generateInvoiceNo(companyId);
    const amount = Number(data.amount || 0);
    const tax = Number(data.tax || 0);
    const total = resolveTotal({ ...data, amount, tax });
    const status = data.status || 'DRAFT';

    const record = await invoiceRepository.create({
      studentId: data.studentId || null,
      invoiceNo,
      amount,
      tax,
      total,
      currency: data.currency || undefined,
      status,
      dueDate: parseDate(data.dueDate),
      paidAt: status === 'PAID' ? (parseDate(data.paidAt) || new Date()) : parseDate(data.paidAt),
      notes: data.notes || null,
      metadata: {
        companyId,
        ...(data.metadata && typeof data.metadata === 'object' ? data.metadata : {}),
      },
      createdBy: user.id,
    });

    await prisma.activity.create({
      data: {
        userId: user.id,
        action: 'CREATE',
        entityType: 'Invoice',
        entityId: record.id,
        description: `Invoice ${record.invoiceNo} created`,
      },
    });
    await auditLog({
      userId: user.id,
      action: 'CREATE',
      entityType: 'Invoice',
      entityId: record.id,
      newData: record,
      req,
    });
    return record;
  },

  update: async (id, data, user, req) => {
    const companyId = requireCompany(user);
    const existing = await invoiceRepository.findById(id, companyId, user);
    if (!existing) throw new AppError('Invoice not found', 404);

    const next = { ...data };
    await validateInvoiceMasters(companyId, {
      ...next,
      amount: next.amount != null ? next.amount : existing.amount,
      metadata: next.metadata ?? existing.metadata,
    });
    if (next.amount != null || next.tax != null || next.total != null) {
      const amount = next.amount != null ? Number(next.amount) : Number(existing.amount);
      const tax = next.tax != null ? Number(next.tax) : Number(existing.tax);
      next.amount = amount;
      next.tax = tax;
      next.total = next.total != null ? Number(next.total) : amount + tax;
    }

    if (next.status === 'PAID' && next.paidAt === undefined && !existing.paidAt) {
      next.paidAt = new Date().toISOString();
    }

    const record = await invoiceRepository.update(id, {
      ...next,
      updatedBy: user.id,
      dueDate: next.dueDate !== undefined ? parseDate(next.dueDate) : undefined,
      paidAt: next.paidAt !== undefined ? parseDate(next.paidAt) : undefined,
      metadata: next.metadata !== undefined
        ? {
            ...(existing.metadata && typeof existing.metadata === 'object' ? existing.metadata : {}),
            ...(next.metadata && typeof next.metadata === 'object' ? next.metadata : {}),
            companyId,
          }
        : undefined,
    });

    await prisma.activity.create({
      data: {
        userId: user.id,
        action: 'UPDATE',
        entityType: 'Invoice',
        entityId: id,
        description: 'Invoice updated',
      },
    });
    await auditLog({
      userId: user.id,
      action: 'UPDATE',
      entityType: 'Invoice',
      entityId: id,
      oldData: existing,
      newData: record,
      req,
    });
    return record;
  },

  delete: async (id, user, req) => {
    const companyId = requireCompany(user);
    const existing = await invoiceRepository.findById(id, companyId, user);
    if (!existing) throw new AppError('Invoice not found', 404);
    await invoiceRepository.softDelete(id, user.id);
    await auditLog({
      userId: user.id,
      action: 'DELETE',
      entityType: 'Invoice',
      entityId: id,
      oldData: existing,
      req,
    });
  },

  getAccountantDashboard: async (query, user) => {
    const companyId = requireCompany(user);
    const branchId = query?.branchId || null;

    const invoiceWhere = {
      deletedAt: null,
      ...(branchId ? { student: { branchId } } : {}),
    };

    const invoices = await prisma.invoice.findMany({
      where: invoiceWhere,
      select: {
        id: true,
        amount: true,
        tax: true,
        total: true,
        amountPaid: true,
        status: true,
        dueDate: true,
        currency: true,
      },
    });

    let totalBilled = 0;
    let totalCollected = 0;
    let overdueCount = 0;
    let overdueAmount = 0;
    const now = new Date();

    for (const inv of invoices) {
      const tot = Number(inv.total || 0);
      const paid = Number(inv.amountPaid || 0);
      totalBilled += tot;
      totalCollected += paid;
      if (inv.status !== 'PAID' && inv.dueDate && new Date(inv.dueDate) < now) {
        overdueCount++;
        overdueAmount += Math.max(0, tot - paid);
      }
    }

    const totalOutstanding = Math.max(0, Math.round((totalBilled - totalCollected) * 100) / 100);

    // Today & Month Payment Collections
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const todayPayments = await prisma.admissionPayment.aggregate({
      where: {
        paidAt: { gte: startOfToday },
        ...(branchId ? { student: { branchId } } : {}),
      },
      _sum: { amount: true },
    });

    const monthPayments = await prisma.admissionPayment.aggregate({
      where: {
        paidAt: { gte: startOfMonth },
        ...(branchId ? { student: { branchId } } : {}),
      },
      _sum: { amount: true },
    });

    // Expenses
    const expensesAgg = await prisma.expense.aggregate({
      where: {
        status: 'PAID',
        ...(branchId ? { branchId } : {}),
      },
      _sum: { amount: true },
    });

    // Refunds
    const refundsAgg = await prisma.refund.aggregate({
      where: {
        status: 'PAID',
        ...(branchId ? { branchId } : {}),
      },
      _sum: { amount: true },
    });

    const totalExpenses = Number(expensesAgg._sum.amount || 0);
    const totalRefunds = Number(refundsAgg._sum.amount || 0);
    const netCashFlow = Math.round((totalCollected - totalExpenses - totalRefunds) * 100) / 100;

    // Recent Payments
    const recentPayments = await prisma.admissionPayment.findMany({
      where: branchId ? { student: { branchId } } : {},
      take: 8,
      orderBy: { paidAt: 'desc' },
      include: {
        invoice: { select: { invoiceNo: true } },
        student: { select: { firstName: true, lastName: true, studentCode: true } },
        receipts: { select: { receiptNo: true } },
      },
    });

    // Recent Expenses
    const recentExpenses = await prisma.expense.findMany({
      where: branchId ? { branchId } : {},
      take: 6,
      orderBy: { expenseDate: 'desc' },
      include: {
        category: { select: { name: true, code: true } },
      },
    });

    // Pending Proofs Count
    const pendingProofsCount = await prisma.paymentProof.count({
      where: { status: 'PENDING' },
    });

    // Pending Refunds Count
    const pendingRefundsCount = await prisma.refund.count({
      where: { status: 'PENDING' },
    });

    return {
      kpis: {
        totalBilled: Math.round(totalBilled * 100) / 100,
        totalCollected: Math.round(totalCollected * 100) / 100,
        totalOutstanding,
        overdueCount,
        overdueAmount: Math.round(overdueAmount * 100) / 100,
        todayCollected: Number(todayPayments._sum.amount || 0),
        monthCollected: Number(monthPayments._sum.amount || 0),
        totalExpenses: Math.round(totalExpenses * 100) / 100,
        totalRefunds: Math.round(totalRefunds * 100) / 100,
        netCashFlow,
        pendingProofsCount,
        pendingRefundsCount,
      },
      recentPayments,
      recentExpenses,
    };
  },
};
