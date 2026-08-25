import { Router } from 'express';
import { authenticate, authorize } from '../../middleware/auth.middleware.js';
import { PERMISSIONS } from '../../config/permissions.js';
import * as partnerController from './partner.controller.js';

const router = Router();
router.use(authenticate);

const view = authorize(PERMISSIONS.PARTNERS_VIEW, PERMISSIONS.MASTERS_VIEW);
const manage = authorize(PERMISSIONS.PARTNERS_UPDATE, PERMISSIONS.PARTNERS_CREATE, PERMISSIONS.MASTERS_MANAGE);

router.get('/', view, partnerController.getPartners);
router.get('/:id', view, partnerController.getPartner);
router.post('/', manage, partnerController.createPartner);
router.put('/:id', manage, partnerController.updatePartner);
router.patch('/:id/status', manage, partnerController.updatePartnerStatus);

export default router;
