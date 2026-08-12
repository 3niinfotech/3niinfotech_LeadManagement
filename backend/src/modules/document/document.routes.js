import { Router } from 'express';
import { authenticate, authorize } from '../../middleware/auth.middleware.js';
import { PERMISSIONS } from '../../config/permissions.js';
import * as documentController from './document.controller.js';

const router = Router();
router.use(authenticate);

router.get('/', authorize(PERMISSIONS.DOCUMENTS_VIEW), documentController.getDocuments);
router.get('/:id', authorize(PERMISSIONS.DOCUMENTS_VIEW), documentController.getDocument);
router.post('/', authorize(PERMISSIONS.DOCUMENTS_UPLOAD), documentController.createDocument);
router.put('/:id', authorize(PERMISSIONS.DOCUMENTS_UPLOAD), documentController.updateDocument);
router.delete('/:id', authorize(PERMISSIONS.DOCUMENTS_DELETE), documentController.deleteDocument);

export default router;
