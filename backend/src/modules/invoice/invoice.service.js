import { z } from 'zod';
import { AppError } from '../../utils/response.util.js';
import { parseSort } from '../../utils/response.util.js';
import { invoiceRepository, INVOICE_SORT_FIELDS } from './invoice.repository.js';
import prisma from '../../config/database.js';
import { auditLog } from '../../middleware/audit.middleware.js';

const dateInput = z.string().optional().nullable();

export const createInvoiceSchema = z.object({
  studentId: z.string().optional().nullable(),
  invoiceNo: z.string().min(1),
  amount: z.coerce.number(),
  tax: z.coerce.number().optional().default(0),
  total: z.coerce.number(),
  currency: z.string().max(10).optional().nullable(),
  status: z.enum(['DRAFT', 'SENT', 'PAID', 'PARTIAL', 'OVERDUE', 'CANCELLED']).optional(),
  dueDate: dateInput,
  paidAt: dateInput,
  notes: z.string().optional().nullable(),
});

export const updateInvoiceSchema = createInvoiceSchema.partial();

const parseDate = (value) => (value ? new Date(value) : null);

function requireCompany(user) {
  const companyId = user?.companyId;
  if (!companyId) throw new AppError('Company context required', 403);
  return companyId;
}

export const invoiceService = {
  getAll: async (query, user) => {
    const companyId = requireCompany(user);
    const sort = parseSort(query, INVOICE_SORT_FIELDS);
    return invoiceRepository.findMany({ ...query, sort, companyId });
  },

  getById: async (id, user) => {
    const companyId = requireCompany(user);
    const record = await invoiceRepository.findById(id, companyId);
    if (!record) throw new AppError('Invoice not found', 404);
    return record;
  },

  create: async (data, user, req) => {
    const companyId = requireCompany(user);
    const record = await invoiceRepository.create({
      ...data,
      amount: data.amount,
      tax: data.tax,
      total: data.total,
      currency: data.currency || undefined,
      dueDate: parseDate(data.dueDate),
      paidAt: parseDate(data.paidAt),
      metadata: { companyId },
      createdBy: user.id,
    });

    await prisma.activity.create({ data: { userId: user.id, action: 'CREATE', entityType: 'Invoice', entityId: record.id, description: `Invoice ${record.invoiceNo} created` } });
    await auditLog({ userId: user.id, action: 'CREATE', entityType: 'Invoice', entityId: record.id, newData: record, req });
    return record;
  },

  update: async (id, data, user, req) => {
    const companyId = requireCompany(user);
    const existing = await invoiceRepository.findById(id, companyId);
    if (!existing) throw new AppError('Invoice not found', 404);

    const record = await invoiceRepository.update(id, {
      ...data,
      updatedBy: user.id,
      amount: data.amount,
      tax: data.tax,
      total: data.total,
      dueDate: data.dueDate !== undefined ? parseDate(data.dueDate) : undefined,
      paidAt: data.paidAt !== undefined ? parseDate(data.paidAt) : undefined,
    });

    await prisma.activity.create({ data: { userId: user.id, action: 'UPDATE', entityType: 'Invoice', entityId: id, description: 'Invoice updated' } });
    await auditLog({ userId: user.id, action: 'UPDATE', entityType: 'Invoice', entityId: id, oldData: existing, newData: record, req });
    return record;
  },

  delete: async (id, user, req) => {
    const companyId = requireCompany(user);
    const existing = await invoiceRepository.findById(id, companyId);
    if (!existing) throw new AppError('Invoice not found', 404);
    await invoiceRepository.softDelete(id, user.id);
    await auditLog({ userId: user.id, action: 'DELETE', entityType: 'Invoice', entityId: id, oldData: existing, req });
  },
};
