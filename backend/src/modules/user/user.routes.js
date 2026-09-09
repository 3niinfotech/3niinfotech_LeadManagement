import { Router } from 'express';
import { authenticate, authorize } from '../../middleware/auth.middleware.js';
import { PERMISSIONS } from '../../config/permissions.js';
import { staffAvatarUpload } from '../../middleware/avatar-upload.middleware.js';
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
router.post(
  '/:id/avatar',
  authorize(PERMISSIONS.USERS_UPDATE),
  staffAvatarUpload.single('file'),
  userController.uploadUserAvatar,
);
router.delete('/:id/avatar', authorize(PERMISSIONS.USERS_UPDATE), userController.removeUserAvatar);
router.delete('/:id', authorize(PERMISSIONS.USERS_DELETE), userController.deleteUser);

router.get('/:id/working-hours', authorize(PERMISSIONS.USERS_VIEW), userController.getWorkingHours);
router.put('/:id/working-hours', authorize(PERMISSIONS.USERS_UPDATE), userController.saveWorkingHours);
router.get('/:id/leave', authorize(PERMISSIONS.USERS_VIEW), userController.listLeave);
router.post('/:id/leave', authorize(PERMISSIONS.USERS_UPDATE), userController.createLeave);
router.get('/:id/counsellor-skills', authorize(PERMISSIONS.USERS_VIEW), userController.getCounsellorSkills);
router.put('/:id/counsellor-skills', authorize(PERMISSIONS.USERS_UPDATE), userController.saveCounsellorSkills);

export default router;
