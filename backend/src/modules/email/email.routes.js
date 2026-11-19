import { Router } from 'express';
import { authenticate } from '../../middleware/auth.middleware.js';
import * as ctrl from './email.controller.js';

const router = Router();

router.use(authenticate);

router.get('/status', ctrl.getStatus);
router.post('/test-send', ctrl.sendTest);
router.get('/preview/:templateKey', ctrl.getTemplatePreview);

export default router;
