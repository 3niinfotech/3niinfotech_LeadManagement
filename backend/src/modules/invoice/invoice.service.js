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
  currency: z.string().optional().default('USD'),
  status: z.enum(['DRAFT', 'SENT', 'PAID', 'PARTIAL', 'OVERDUE', 'CANCELLED']).optional(),
  dueDate: dateInput,
  paidAt: dateInput,
  notes: z.string().optional().nullable(),
});

export const updateInvoiceSchema = createInvoiceSchema.partial();

const parseDate = (value) => (value ? new Date(value) : null);

export const invoiceService = {
  getAll: async (query) => {
    const sort = parseSort(query, INVOICE_SORT_FIELDS);
    return invoiceRepository.findMany({ ...query, sort });
  },

  getById: async (id) => {
    const record = await invoiceRepository.findById(id);
    if (!record) throw new AppError('Invoice not found', 404);
    return record;
  },

  create: async (data, userId, req) => {
    const record = await invoiceRepository.create({
      ...data,
      amount: data.amount,
      tax: data.tax,
      total: data.total,
      dueDate: parseDate(data.dueDate),
      paidAt: parseDate(data.paidAt),
      createdBy: userId,
    });

    await prisma.activity.create({ data: { userId, action: 'CREATE', entityType: 'Invoice', entityId: record.id, description: `Invoice ${record.invoiceNo} created` } });
    await auditLog({ userId, action: 'CREATE', entityType: 'Invoice', entityId: record.id, newData: record, req });
    return record;
  },

  update: async (id, data, userId, req) => {
    const existing = await invoiceRepository.findById(id);
    if (!existing) throw new AppError('Invoice not found', 404);

    const record = await invoiceRepository.update(id, {
      ...data,
      updatedBy: userId,
      amount: data.amount,
      tax: data.tax,
      total: data.total,
      dueDate: data.dueDate !== undefined ? parseDate(data.dueDate) : undefined,
      paidAt: data.paidAt !== undefined ? parseDate(data.paidAt) : undefined,
    });

    await prisma.activity.create({ data: { userId, action: 'UPDATE', entityType: 'Invoice', entityId: id, description: 'Invoice updated' } });
    await auditLog({ userId, action: 'UPDATE', entityType: 'Invoice', entityId: id, oldData: existing, newData: record, req });
    return record;
  },

  delete: async (id, userId, req) => {
    const existing = await invoiceRepository.findById(id);
    if (!existing) throw new AppError('Invoice not found', 404);
    await invoiceRepository.softDelete(id, userId);
    await auditLog({ userId, action: 'DELETE', entityType: 'Invoice', entityId: id, oldData: existing, req });
  },
};
