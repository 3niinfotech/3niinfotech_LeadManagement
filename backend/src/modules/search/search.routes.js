import { Router } from 'express';
import { authenticate } from '../../middleware/auth.middleware.js';
import * as searchController from './search.controller.js';

const router = Router();

router.use(authenticate);
router.get('/suggestions', searchController.searchSuggestions);
router.get('/', searchController.globalSearch);

export default router;
