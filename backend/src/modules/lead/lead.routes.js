import { Router } from 'express';
import { authenticate, authorize } from '../../middleware/auth.middleware.js';
import { PERMISSIONS } from '../../config/permissions.js';
import * as leadController from './lead.controller.js';

const router = Router();

router.use(authenticate);

router.get('/', authorize(PERMISSIONS.LEADS_VIEW), leadController.getLeads);
router.get('/:id', authorize(PERMISSIONS.LEADS_VIEW), leadController.getLead);
router.post('/', authorize(PERMISSIONS.LEADS_CREATE), leadController.createLead);
router.put('/:id', authorize(PERMISSIONS.LEADS_UPDATE), leadController.updateLead);
router.delete('/:id', authorize(PERMISSIONS.LEADS_DELETE), leadController.deleteLead);

export default router;
