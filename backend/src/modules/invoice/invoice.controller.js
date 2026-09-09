import { asyncHandler, sendSuccess, sendPaginated, parsePagination } from '../../utils/response.util.js';
import { invoiceService, createInvoiceSchema, updateInvoiceSchema } from './invoice.service.js';

export const getInvoices = asyncHandler(async (req, res) => {
  const { page, limit } = parsePagination(req.query);
  const result = await invoiceService.getAll({ ...req.query, page, limit }, req.user);
  sendPaginated(res, result.data, result.pagination);
});

export const getInvoiceSummary = asyncHandler(async (req, res) => {
  const data = await invoiceService.getSummary(req.query, req.user);
  sendSuccess(res, data);
});

export const exportInvoices = asyncHandler(async (req, res) => {
  const result = await invoiceService.exportInvoices(req.body, req.user, req.user.id, req);
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', `attachment; filename="${result.filename}"`);
  res.setHeader('X-Export-Count', String(result.count));
  res.setHeader('X-Export-Selected', result.selected ? '1' : '0');
  res.send(result.buffer);
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
