import { Router } from 'express';
import { authenticate, authorize } from '../../middleware/auth.middleware.js';
import { PERMISSIONS } from '../../config/permissions.js';
import * as walkinController from './walkin.controller.js';

const router = Router();
const view = authorize(PERMISSIONS.WALKIN_VIEW);
const create = authorize(PERMISSIONS.WALKIN_CREATE);
const update = authorize(PERMISSIONS.WALKIN_UPDATE);
const remove = authorize(PERMISSIONS.WALKIN_DELETE);

router.use(authenticate);

router.get('/summary', view, walkinController.getSummary);
router.get('/branches', view, walkinController.getBranches);
router.get('/counsellors', view, walkinController.getCounsellors);
router.get('/recommend-counsellors', view, walkinController.recommendCounsellors);
router.get('/check-duplicate', view, walkinController.checkDuplicate);
router.get('/', view, walkinController.getWalkIns);
router.post('/', create, walkinController.createWalkIn);
router.get('/:id', view, walkinController.getWalkIn);
router.put('/:id', update, walkinController.updateWalkIn);
router.patch('/:id/status', update, walkinController.patchStatus);
router.post('/:id/counsellor-decision', update, walkinController.applyCounsellorDecision);
router.delete('/:id', remove, walkinController.deleteWalkIn);
router.post('/:id/notes', update, walkinController.addNote);

export default router;
