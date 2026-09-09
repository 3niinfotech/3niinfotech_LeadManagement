import { Router } from 'express';
import { authenticate, authorize } from '../../middleware/auth.middleware.js';
import { PERMISSIONS } from '../../config/permissions.js';
import * as visaController from './visa.controller.js';

const router = Router();
router.use(authenticate);

router.get('/summary', authorize(PERMISSIONS.VISAS_VIEW), visaController.getVisaSummary);
router.post('/export', authorize(PERMISSIONS.VISAS_VIEW), visaController.exportVisas);
router.get('/', authorize(PERMISSIONS.VISAS_VIEW), visaController.getVisas);
router.get('/:id', authorize(PERMISSIONS.VISAS_VIEW), visaController.getVisa);
router.post('/', authorize(PERMISSIONS.VISAS_CREATE), visaController.createVisa);
router.put('/:id', authorize(PERMISSIONS.VISAS_UPDATE), visaController.updateVisa);
router.delete('/:id', authorize(PERMISSIONS.VISAS_DELETE), visaController.deleteVisa);

export default router;
