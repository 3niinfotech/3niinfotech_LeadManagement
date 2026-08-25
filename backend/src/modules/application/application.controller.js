import { asyncHandler, sendSuccess, sendPaginated, parsePagination } from '../../utils/response.util.js';
import { applicationService, createApplicationSchema, updateApplicationSchema } from './application.service.js';

export const getApplications = asyncHandler(async (req, res) => {
  const { page, limit } = parsePagination(req.query);
  const result = await applicationService.getAll({ ...req.query, page, limit }, req.user);
  sendPaginated(res, result.data, result.pagination);
});

export const getApplication = asyncHandler(async (req, res) => {
  const record = await applicationService.getById(req.params.id, req.user);
  sendSuccess(res, record);
});

export const createApplication = asyncHandler(async (req, res) => {
  const data = createApplicationSchema.parse(req.body);
  const record = await applicationService.create(data, req.user, req);
  sendSuccess(res, record, 'Application created', 201);
});

export const updateApplication = asyncHandler(async (req, res) => {
  const data = updateApplicationSchema.parse(req.body);
  const record = await applicationService.update(req.params.id, data, req.user, req);
  sendSuccess(res, record, 'Application updated');
});

export const deleteApplication = asyncHandler(async (req, res) => {
  await applicationService.delete(req.params.id, req.user, req);
  sendSuccess(res, null, 'Application deleted');
});
