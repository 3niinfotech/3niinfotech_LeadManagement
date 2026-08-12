import { Router } from 'express';
import { z } from 'zod';
import { authenticate, authorize } from '../../middleware/auth.middleware.js';
import { validate } from '../../middleware/validate.middleware.js';
import {
  getEffective, getAdminFeatures, updateFeatures, seedCatalog,
} from './feature.controller.js';

const updateSchema = z.object({
  updates: z.array(z.object({
    key: z.string().min(3),
    enabled: z.boolean(),
  })).min(1),
});

const router = Router();
router.use(authenticate);

router.get('/effective', getEffective);
router.get('/admin', authorize('settings.manage'), getAdminFeatures);
router.patch('/bulk', authorize('settings.manage'), validate(updateSchema), updateFeatures);
router.post('/sync-catalog', authorize('settings.manage'), seedCatalog);

export default router;
