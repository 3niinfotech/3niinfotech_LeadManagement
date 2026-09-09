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
};
