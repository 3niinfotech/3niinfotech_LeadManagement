import { Router } from 'express';
import { authenticate, authorize } from '../../middleware/auth.middleware.js';
import { PERMISSIONS } from '../../config/permissions.js';
import { AppError } from '../../utils/response.util.js';
import { isRelationalMasterEntity } from './master.registry.js';
import { isValidMasterCategory } from '../../config/master-defaults.config.js';
import * as masterController from './master.controller.js';

const router = Router();

const view = authorize(PERMISSIONS.MASTERS_VIEW);
const manage = authorize(PERMISSIONS.MASTERS_MANAGE);

/** Legacy MasterItem options keep enquiry/walk-in permissions for compatibility. */
const legacyView = authorize(PERMISSIONS.ENQUIRIES_VIEW, PERMISSIONS.MASTERS_VIEW);
const legacyCreate = authorize(PERMISSIONS.ENQUIRIES_CREATE, PERMISSIONS.MASTERS_MANAGE);

router.use(authenticate);

function requireRelationalEntity(req, _res, next) {
  if (!isRelationalMasterEntity(req.params.entity)) {
    return next(new AppError('Unknown master entity', 404));
  }
  return next();
}

function requireLegacyOrRelationalOptions(req, _res, next) {
  const slug = req.params.entity;
  if (isRelationalMasterEntity(slug) || isValidMasterCategory(slug)) {
    return next();
  }
  return next(new AppError('Unknown master category', 404));
}

// Hub summary — before /:entity
router.get('/hub/summary', view, masterController.hubSummary);

// Application Status country-grouped summary (must be before /:entity/:id)
router.get('/application-status-master/country-summary', view, masterController.applicationStatusCountrySummary);
router.get('/application-status-master/workflow', view, masterController.applicationStatusWorkflow);
router.get('/application-checklist/by-country', view, masterController.applicationChecklistByCountry);
router.post('/application-checklist/bulk', manage, masterController.bulkCreateApplicationChecklist);
router.get('/lead-status/workflow', view, masterController.leadStatusWorkflow);
router.get('/visa-status-master/country-summary', view, masterController.visaStatusCountrySummary);
router.get('/visa-status-master/workflow', view, masterController.visaStatusWorkflow);
router.get('/visa-checklist/by-country', view, masterController.visaChecklistByCountry);
router.post('/visa-checklist/bulk', manage, masterController.bulkCreateVisaChecklist);
router.get('/student-status-master/workflow', view, masterController.studentStatusWorkflow);

// Legacy MasterItem management (applyLevel, tags, fee-type, etc.)
router.get('/items/:category', (req, _res, next) => {
  if (!isValidMasterCategory(req.params.category)) {
    return next(new AppError('Unknown master category', 404));
  }
  return next();
}, legacyView, masterController.listMasterItems);
router.put('/items/:category/:id', (req, _res, next) => {
  if (!isValidMasterCategory(req.params.category)) {
    return next(new AppError('Unknown master category', 404));
  }
  return next();
}, manage, masterController.updateMasterItem);
router.patch('/items/:category/:id/status', (req, _res, next) => {
  if (!isValidMasterCategory(req.params.category)) {
    return next(new AppError('Unknown master category', 404));
  }
  return next();
}, manage, masterController.updateMasterItemStatus);
router.delete('/items/:category/:id', (req, _res, next) => {
  if (!isValidMasterCategory(req.params.category)) {
    return next(new AppError('Unknown master category', 404));
  }
  return next();
}, manage, masterController.deleteMasterItem);

// Options dispatcher (legacy MasterItem default for overlapping categories)
router.get(
  '/:entity/options',
  requireLegacyOrRelationalOptions,
  legacyView,
  masterController.getOptionsDispatcher,
);

// Legacy MasterItem upsert — unchanged path semantics
router.post(
  '/:entity/options',
  (req, _res, next) => {
    if (!isValidMasterCategory(req.params.entity)) {
      return next(new AppError('Unknown master category', 404));
    }
    req.params.category = req.params.entity;
    return next();
  },
  legacyCreate,
  masterController.upsertOption,
);

// Relational CRUD
router.get('/:entity/export', requireRelationalEntity, view, masterController.exportEntity);
router.post('/:entity/bulk/status', requireRelationalEntity, manage, masterController.bulkUpdateStatus);
router.post('/:entity/bulk/delete', requireRelationalEntity, manage, masterController.bulkRemove);
router.get('/:entity', requireRelationalEntity, view, masterController.listEntity);
router.get('/:entity/:id', requireRelationalEntity, view, masterController.getEntity);
router.post('/:entity', requireRelationalEntity, manage, masterController.createEntity);
router.put('/:entity/:id', requireRelationalEntity, manage, masterController.updateEntity);
router.patch('/:entity/:id/status', requireRelationalEntity, manage, masterController.updateEntityStatus);
router.delete('/:entity/:id', requireRelationalEntity, manage, masterController.deleteEntity);

export default router;
