import { Router } from 'express';
import { authenticate } from '../../middleware/auth.middleware.js';
import * as ctrl from './email.controller.js';

const router = Router();

router.use(authenticate);

router.get('/status', ctrl.getStatus);
router.put('/settings', ctrl.updateSettings);
router.get('/recipients', ctrl.getRecipients);
router.get('/history', ctrl.getEmailHistory);
router.delete('/history/:id', ctrl.deleteEmailHistory);
router.post('/preview-custom', ctrl.previewCustomEmail);
router.post('/dispatch-custom', ctrl.dispatchCustomEmail);
router.get('/templates', ctrl.getTemplates);
router.get('/templates/:code', ctrl.getTemplateByCode);
router.put('/templates/:code', ctrl.updateTemplate);
router.post('/templates/:code/test-send', ctrl.sendTestTemplate);
router.post('/test-send', ctrl.sendTest);
router.get('/preview/:templateKey', ctrl.getTemplatePreview);

export default router;
