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
router.get('/:entity', requireRelationalEntity, view, masterController.listEntity);
router.get('/:entity/:id', requireRelationalEntity, view, masterController.getEntity);
router.post('/:entity', requireRelationalEntity, manage, masterController.createEntity);
router.put('/:entity/:id', requireRelationalEntity, manage, masterController.updateEntity);
router.patch('/:entity/:id/status', requireRelationalEntity, manage, masterController.updateEntityStatus);
router.delete('/:entity/:id', requireRelationalEntity, manage, masterController.deleteEntity);

export default router;
