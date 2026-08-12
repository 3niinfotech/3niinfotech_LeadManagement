import { Router } from 'express';
import { authenticate, authorize } from '../../middleware/auth.middleware.js';
import { PERMISSIONS } from '../../config/permissions.js';
import * as userController from './user.controller.js';

const router = Router();

router.use(authenticate);

router.get('/roles', authorize(PERMISSIONS.USERS_VIEW), userController.getRoles);
router.get('/team-summary', authorize(PERMISSIONS.USERS_VIEW), userController.getTeamSummary);
router.get('/', authorize(PERMISSIONS.USERS_VIEW), userController.getUsers);
router.get('/:id', authorize(PERMISSIONS.USERS_VIEW), userController.getUser);

export default router;
