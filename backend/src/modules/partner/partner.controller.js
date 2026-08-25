import { asyncHandler, sendSuccess, sendPaginated, parsePagination } from '../../utils/response.util.js';
import { partnerService, createPartnerSchema, updatePartnerSchema } from './partner.service.js';
import { z } from 'zod';

export const getPartners = asyncHandler(async (req, res) => {
  const { page, limit } = parsePagination(req.query);
  const result = await partnerService.getAll({ ...req.query, page, limit }, req.user);
  sendPaginated(res, result.data, result.pagination);
});

export const getPartner = asyncHandler(async (req, res) => {
  const record = await partnerService.getById(req.params.id, req.user);
  sendSuccess(res, record);
});

export const createPartner = asyncHandler(async (req, res) => {
  const data = createPartnerSchema.parse(req.body);
  const record = await partnerService.create(data, req.user, req);
  sendSuccess(res, record, 'Partner created', 201);
});

export const updatePartner = asyncHandler(async (req, res) => {
  const data = updatePartnerSchema.parse(req.body);
  const record = await partnerService.update(req.params.id, data, req.user, req);
  sendSuccess(res, record, 'Partner updated');
});

export const updatePartnerStatus = asyncHandler(async (req, res) => {
  const { isActive } = z.object({ isActive: z.boolean() }).parse(req.body);
  const record = await partnerService.updateStatus(req.params.id, isActive, req.user, req);
  sendSuccess(res, record, 'Partner status updated');
});
