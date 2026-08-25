import { asyncHandler, sendSuccess, sendPaginated, parsePagination } from '../../utils/response.util.js';
import { visaService, createVisaSchema, updateVisaSchema } from './visa.service.js';

export const getVisas = asyncHandler(async (req, res) => {
  const { page, limit } = parsePagination(req.query);
  const result = await visaService.getAll({ ...req.query, page, limit }, req.user);
  sendPaginated(res, result.data, result.pagination);
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
