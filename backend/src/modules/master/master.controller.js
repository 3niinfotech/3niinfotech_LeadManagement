import { asyncHandler, sendSuccess, sendPaginated } from '../../utils/response.util.js';
import { AppError } from '../../utils/response.util.js';
import { isValidMasterCategory } from '../../config/master-defaults.config.js';
import { isRelationalMasterEntity } from './master.registry.js';
import { masterService, upsertOptionSchema } from './master.service.js';

// ─── Legacy MasterItem ───────────────────────────────────────────────────────

export const getOptions = asyncHandler(async (req, res) => {
  const data = await masterService.getOptions(req.params.category, req.user);
  sendSuccess(res, data);
});

export const upsertOption = asyncHandler(async (req, res) => {
  const { label } = upsertOptionSchema.parse(req.body);
  const data = await masterService.upsertOption(req.params.category, label, req.user);
  sendSuccess(res, data, 'Option saved', 201);
});

/**
 * Dispatcher for GET /:slug/options
 * - MasterItem categories (default): legacy label options — preserves Enquiry/Walk-in
 * - Relational-only slugs, or ?source=relational: registry options { value: id, label: name }
 */
export const getOptionsDispatcher = asyncHandler(async (req, res) => {
  const slug = req.params.entity || req.params.category;
  const source = String(req.query.source || '').toLowerCase();

  const wantRelational =
    source === 'relational' ||
    (isRelationalMasterEntity(slug) && !isValidMasterCategory(slug));

  if (wantRelational && isRelationalMasterEntity(slug)) {
    const data = await masterService.getRelationalOptions(slug, req.query, req.user);
    return sendSuccess(res, data);
  }

  if (isValidMasterCategory(slug)) {
    const data = await masterService.getOptions(slug, req.user);
    return sendSuccess(res, data);
  }

  if (isRelationalMasterEntity(slug)) {
    const data = await masterService.getRelationalOptions(slug, req.query, req.user);
    return sendSuccess(res, data);
  }

  throw new AppError('Unknown master category', 404);
});

// ─── Relational CRUD ─────────────────────────────────────────────────────────

export const listEntity = asyncHandler(async (req, res) => {
  const result = await masterService.list(req.params.entity, req.query, req.user);
  sendPaginated(res, result.data, result.pagination);
});

export const getEntity = asyncHandler(async (req, res) => {
  const record = await masterService.getById(req.params.entity, req.params.id, req.user);
  sendSuccess(res, record);
});

export const createEntity = asyncHandler(async (req, res) => {
  const record = await masterService.create(req.params.entity, req.body, req.user, req);
  sendSuccess(res, record, 'Master record created', 201);
});

export const updateEntity = asyncHandler(async (req, res) => {
  const record = await masterService.update(req.params.entity, req.params.id, req.body, req.user, req);
  sendSuccess(res, record, 'Master record updated');
});

export const updateEntityStatus = asyncHandler(async (req, res) => {
  const record = await masterService.updateStatus(req.params.entity, req.params.id, req.body, req.user, req);
  sendSuccess(res, record, 'Master status updated');
});

export const deleteEntity = asyncHandler(async (req, res) => {
  const result = await masterService.remove(req.params.entity, req.params.id, req.user, req);
  sendSuccess(res, result, 'Master record deleted');
});

export const hubSummary = asyncHandler(async (req, res) => {
  const data = await masterService.hubSummary(req.user);
  sendSuccess(res, data);
});
