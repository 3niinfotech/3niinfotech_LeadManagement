import { asyncHandler, sendSuccess, sendPaginated, parsePagination } from '../../utils/response.util.js';
import { leadService, createLeadSchema, updateLeadSchema } from './lead.service.js';

export const getLeads = asyncHandler(async (req, res) => {
  const { page, limit } = parsePagination(req.query);
  const result = await leadService.getAll({ ...req.query, page, limit });
  sendPaginated(res, result.data, result.pagination);
});

export const getLead = asyncHandler(async (req, res) => {
  const lead = await leadService.getById(req.params.id);
  sendSuccess(res, lead);
});

export const createLead = asyncHandler(async (req, res) => {
  const data = createLeadSchema.parse(req.body);
  const lead = await leadService.create(data, req.user.id, req);
  sendSuccess(res, lead, 'Lead created', 201);
});

export const updateLead = asyncHandler(async (req, res) => {
  const data = updateLeadSchema.parse(req.body);
  const lead = await leadService.update(req.params.id, data, req.user.id, req);
  sendSuccess(res, lead, 'Lead updated');
});

export const deleteLead = asyncHandler(async (req, res) => {
  await leadService.delete(req.params.id, req.user.id, req);
  sendSuccess(res, null, 'Lead deleted');
});
