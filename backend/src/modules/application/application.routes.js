import { Router } from 'express';
import { authenticate, authorize } from '../../middleware/auth.middleware.js';
import { PERMISSIONS } from '../../config/permissions.js';
import * as applicationController from './application.controller.js';

const router = Router();
router.use(authenticate);

router.get('/summary', authorize(PERMISSIONS.APPLICATIONS_VIEW), applicationController.getApplicationSummary);
router.post('/export', authorize(PERMISSIONS.APPLICATIONS_VIEW), applicationController.exportApplications);
router.get('/', authorize(PERMISSIONS.APPLICATIONS_VIEW), applicationController.getApplications);
router.get('/:id', authorize(PERMISSIONS.APPLICATIONS_VIEW), applicationController.getApplication);
router.post('/', authorize(PERMISSIONS.APPLICATIONS_CREATE), applicationController.createApplication);
router.put('/:id', authorize(PERMISSIONS.APPLICATIONS_UPDATE), applicationController.updateApplication);
router.delete('/:id', authorize(PERMISSIONS.APPLICATIONS_DELETE), applicationController.deleteApplication);

export default router;
