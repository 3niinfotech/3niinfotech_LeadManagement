import { Router } from 'express';
import { authenticate, authorize } from '../../middleware/auth.middleware.js';
import { PERMISSIONS } from '../../config/permissions.js';
import * as roleController from './role.controller.js';

const router = Router();

router.use(authenticate);

router.get('/access/me', roleController.getMyAccess);
router.get('/menu', roleController.getMenu);
router.get('/permissions', authorize(PERMISSIONS.ROLES_VIEW), roleController.getPermissions);

router.get('/', authorize(PERMISSIONS.ROLES_VIEW), roleController.listRoles);
router.get('/export', authorize(PERMISSIONS.ROLES_EXPORT), roleController.exportRoles);
router.get('/:id', authorize(PERMISSIONS.ROLES_VIEW), roleController.getRole);
router.get('/:id/history', authorize(PERMISSIONS.ROLES_VIEW), roleController.getRoleHistory);

router.post('/', authorize(PERMISSIONS.ROLES_CREATE), roleController.createRole);
router.post('/:id/clone', authorize(PERMISSIONS.ROLES_CLONE), roleController.cloneRole);
router.post('/:id/copy-permissions', authorize(PERMISSIONS.ROLES_UPDATE), roleController.copyPermissions);
router.post('/:id/assign-users', authorize(PERMISSIONS.ROLES_ASSIGN), roleController.assignUsers);

router.patch('/:id', authorize(PERMISSIONS.ROLES_UPDATE), roleController.updateRole);
router.patch('/:id/status', authorize(PERMISSIONS.ROLES_UPDATE), roleController.toggleRoleActive);

router.delete('/:id', authorize(PERMISSIONS.ROLES_DELETE), roleController.deleteRole);

export default router;
