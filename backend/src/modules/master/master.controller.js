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

export const listMasterItems = asyncHandler(async (req, res) => {
  const result = await masterService.listMasterItems(req.params.category, req.query, req.user);
  sendPaginated(res, result.data, result.pagination);
});

export const updateMasterItem = asyncHandler(async (req, res) => {
  const record = await masterService.updateMasterItem(
    req.params.category,
    req.params.id,
    req.body,
    req.user,
    req,
  );
  sendSuccess(res, record, 'Master item updated');
});

export const updateMasterItemStatus = asyncHandler(async (req, res) => {
  const record = await masterService.updateMasterItemStatus(
    req.params.category,
    req.params.id,
    req.body,
    req.user,
    req,
  );
  sendSuccess(res, record, 'Master item status updated');
});

export const deleteMasterItem = asyncHandler(async (req, res) => {
  const result = await masterService.removeMasterItem(
    req.params.category,
    req.params.id,
    req.user,
    req,
  );
  sendSuccess(res, result, 'Master item deleted');
});

/**
 * Dispatcher for GET /:slug/options
 * - Relational entities (default): registry options { value: id, label: name }
 * - MasterItem-only categories, or ?source=legacy: legacy label options
 */
export const getOptionsDispatcher = asyncHandler(async (req, res) => {
  const slug = req.params.entity || req.params.category;
  const source = String(req.query.source || '').toLowerCase();
  const wantLegacy = source === 'legacy' || source === 'masteritem';

  if (isRelationalMasterEntity(slug) && !wantLegacy) {
    const data = await masterService.getRelationalOptions(slug, req.query, req.user);
    return sendSuccess(res, data);
  }

  const legacyCategory = slug === 'courseFinderLevel' ? 'applyLevel' : slug;

  if (isValidMasterCategory(legacyCategory)) {
    const data = await masterService.getOptions(legacyCategory, req.user);
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

export const getEntityUsage = asyncHandler(async (req, res) => {
  const data = await masterService.getRecordUsage(req.params.entity, req.params.id, req.user);
  sendSuccess(res, data);
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

export const bulkUpdateStatus = asyncHandler(async (req, res) => {
  const data = await masterService.bulkUpdateStatus(req.params.entity, req.body, req.user, req);
  sendSuccess(res, data, 'Master status updated');
});

export const bulkRemove = asyncHandler(async (req, res) => {
  const data = await masterService.bulkRemove(req.params.entity, req.body, req.user, req);
  sendSuccess(res, data, 'Bulk delete completed');
});

export const exportEntity = asyncHandler(async (req, res) => {
  const data = await masterService.exportList(req.params.entity, req.query, req.user);
  sendSuccess(res, data);
});

export const hubSummary = asyncHandler(async (req, res) => {
  const data = await masterService.hubSummary(req.user);
  sendSuccess(res, data);
});

export const applicationStatusCountrySummary = asyncHandler(async (req, res) => {
  const data = await masterService.applicationStatusCountrySummary(req.user);
  sendSuccess(res, data);
});

export const applicationStatusWorkflow = asyncHandler(async (req, res) => {
  const data = await masterService.applicationStatusWorkflow(req.user, req.query.countryId);
  sendSuccess(res, data);
});

export const bulkCreateApplicationChecklist = asyncHandler(async (req, res) => {
  const data = await masterService.bulkCreateApplicationChecklist(req.body, req.user, req);
  sendSuccess(res, data, 'Checklist items created', 201);
});

export const applicationChecklistByCountry = asyncHandler(async (req, res) => {
  const data = await masterService.getApplicationChecklistByCountry(req.user, req.query.countryId);
  sendSuccess(res, data);
});

export const leadStatusWorkflow = asyncHandler(async (req, res) => {
  const data = await masterService.leadStatusWorkflow(req.user);
  sendSuccess(res, data);
});

export const visaStatusCountrySummary = asyncHandler(async (req, res) => {
  const data = await masterService.visaStatusCountrySummary(req.user);
  sendSuccess(res, data);
});

export const visaStatusWorkflow = asyncHandler(async (req, res) => {
  const data = await masterService.visaStatusWorkflow(req.user, req.query.countryId);
  sendSuccess(res, data);
});

export const visaChecklistByCountry = asyncHandler(async (req, res) => {
  const data = await masterService.getVisaChecklistByCountry(req.user, req.query.countryId);
  sendSuccess(res, data);
});

export const bulkCreateVisaChecklist = asyncHandler(async (req, res) => {
  const data = await masterService.bulkCreateVisaChecklist(req.body, req.user, req);
  sendSuccess(res, data, 'Visa checklist items created', 201);
});

export const studentStatusWorkflow = asyncHandler(async (req, res) => {
  const data = await masterService.studentStatusWorkflow(req.user);
  sendSuccess(res, data);
});
