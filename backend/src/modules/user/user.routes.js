import { Router } from 'express';
import { authenticate, authorize } from '../../middleware/auth.middleware.js';
import { PERMISSIONS } from '../../config/permissions.js';
import * as userController from './user.controller.js';

const router = Router();

router.use(authenticate);

router.get('/roles', authorize(PERMISSIONS.USERS_VIEW), userController.getRoles);
router.get('/team-summary', authorize(PERMISSIONS.USERS_VIEW), userController.getTeamSummary);
router.get(
  '/counsellors',
  authorize(PERMISSIONS.ENQUIRIES_VIEW, PERMISSIONS.USERS_VIEW, PERMISSIONS.WALKIN_VIEW),
  userController.getCounsellors,
);
router.get('/', authorize(PERMISSIONS.USERS_VIEW), userController.getUsers);
router.post('/', authorize(PERMISSIONS.USERS_CREATE), userController.createUser);
router.get('/:id', authorize(PERMISSIONS.USERS_VIEW), userController.getUser);
router.put('/:id', authorize(PERMISSIONS.USERS_UPDATE), userController.updateUser);
router.patch('/:id/status', authorize(PERMISSIONS.USERS_UPDATE), userController.updateUserStatus);

export default router;
