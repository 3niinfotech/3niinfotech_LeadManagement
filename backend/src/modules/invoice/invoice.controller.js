import { asyncHandler, sendSuccess, sendPaginated, parsePagination } from '../../utils/response.util.js';
import { invoiceService, createInvoiceSchema, updateInvoiceSchema } from './invoice.service.js';

export const getInvoices = asyncHandler(async (req, res) => {
  const { page, limit } = parsePagination(req.query);
  const result = await invoiceService.getAll({ ...req.query, page, limit }, req.user);
  sendPaginated(res, result.data, result.pagination);
});

export const getInvoice = asyncHandler(async (req, res) => {
  const record = await invoiceService.getById(req.params.id, req.user);
  sendSuccess(res, record);
});

export const createInvoice = asyncHandler(async (req, res) => {
  const data = createInvoiceSchema.parse(req.body);
  const record = await invoiceService.create(data, req.user, req);
  sendSuccess(res, record, 'Invoice created', 201);
});

export const updateInvoice = asyncHandler(async (req, res) => {
  const data = updateInvoiceSchema.parse(req.body);
  const record = await invoiceService.update(req.params.id, data, req.user, req);
  sendSuccess(res, record, 'Invoice updated');
});

export const deleteInvoice = asyncHandler(async (req, res) => {
  await invoiceService.delete(req.params.id, req.user, req);
  sendSuccess(res, null, 'Invoice deleted');
});
