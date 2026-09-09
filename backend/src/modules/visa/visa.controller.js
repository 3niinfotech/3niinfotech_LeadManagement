import { asyncHandler, sendSuccess, sendPaginated, parsePagination } from '../../utils/response.util.js';
import { visaService, createVisaSchema, updateVisaSchema } from './visa.service.js';

export const getVisas = asyncHandler(async (req, res) => {
  const { page, limit } = parsePagination(req.query);
  const result = await visaService.getAll({ ...req.query, page, limit }, req.user);
  sendPaginated(res, result.data, result.pagination);
});

export const getVisaSummary = asyncHandler(async (req, res) => {
  const data = await visaService.getSummary(req.query, req.user);
  sendSuccess(res, data);
});

export const exportVisas = asyncHandler(async (req, res) => {
  const result = await visaService.exportVisas(req.body, req.user, req.user.id, req);
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', `attachment; filename="${result.filename}"`);
  res.setHeader('X-Export-Count', String(result.count));
  res.setHeader('X-Export-Selected', result.selected ? '1' : '0');
  res.send(result.buffer);
});

export const getVisa = asyncHandler(async (req, res) => {
  const record = await visaService.getById(req.params.id, req.user);
  sendSuccess(res, record);
});

export const createVisa = asyncHandler(async (req, res) => {
  const data = createVisaSchema.parse(req.body);
  const record = await visaService.create(data, req.user, req);
  sendSuccess(res, record, 'Visa case created', 201);
});

export const updateVisa = asyncHandler(async (req, res) => {
  const data = updateVisaSchema.parse(req.body);
  const record = await visaService.update(req.params.id, data, req.user, req);
  sendSuccess(res, record, 'Visa case updated');
});

export const deleteVisa = asyncHandler(async (req, res) => {
  await visaService.delete(req.params.id, req.user, req);
  sendSuccess(res, null, 'Visa case deleted');
});
