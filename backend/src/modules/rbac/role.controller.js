import { asyncHandler, sendSuccess, sendPaginated } from '../../utils/response.util.js';
import {
  roleService,
  createRoleSchema,
  updateRoleSchema,
  cloneRoleSchema,
  assignUsersSchema,
  copyPermissionsSchema,
} from './role.service.js';
import { menuService } from './menu.service.js';

export const listRoles = asyncHandler(async (req, res) => {
  const result = await roleService.list(req.query, req.user);
  sendPaginated(res, result.data, result.pagination);
});

export const getRole = asyncHandler(async (req, res) => {
  const role = await roleService.getById(req.params.id);
  sendSuccess(res, role);
});

export const createRole = asyncHandler(async (req, res) => {
  const body = createRoleSchema.parse(req.body);
  const role = await roleService.create(body, req);
  sendSuccess(res, role, 'Role created', 201);
});

export const updateRole = asyncHandler(async (req, res) => {
  const body = updateRoleSchema.parse(req.body);
  const role = await roleService.update(req.params.id, body, req);
  sendSuccess(res, role, 'Role updated');
});

export const deleteRole = asyncHandler(async (req, res) => {
  const result = await roleService.remove(req.params.id, req);
  sendSuccess(res, result, 'Role deleted');
});

export const toggleRoleActive = asyncHandler(async (req, res) => {
  const { isActive } = req.body;
  const result = await roleService.setActive(req.params.id, Boolean(isActive), req);
  sendSuccess(res, result, 'Role status updated');
});

export const cloneRole = asyncHandler(async (req, res) => {
  const body = cloneRoleSchema.parse(req.body);
  const role = await roleService.clone(req.params.id, body, req);
  sendSuccess(res, role, 'Role cloned', 201);
});

export const copyPermissions = asyncHandler(async (req, res) => {
  const { sourceRoleId } = copyPermissionsSchema.parse(req.body);
  const role = await roleService.copyPermissions(req.params.id, sourceRoleId, req);
  sendSuccess(res, role, 'Permissions copied');
});

export const assignUsers = asyncHandler(async (req, res) => {
  const { userIds } = assignUsersSchema.parse(req.body);
  const result = await roleService.assignUsers(req.params.id, userIds, req);
  sendSuccess(res, result, 'Users assigned');
});

export const getRoleHistory = asyncHandler(async (req, res) => {
  const history = await roleService.getHistory(req.params.id);
  sendSuccess(res, history);
});

export const exportRoles = asyncHandler(async (req, res) => {
  const roles = await roleService.exportRoles(req.query, req.user);
  sendSuccess(res, roles);
});

export const getPermissions = asyncHandler(async (req, res) => {
  const result = await roleService.getPermissions();
  sendSuccess(res, result);
});

export const getMenu = asyncHandler(async (req, res) => {
  const menu = await menuService.getForUser(req.user.permissions);
  sendSuccess(res, menu);
});

export const getMyAccess = asyncHandler(async (req, res) => {
  sendSuccess(res, {
    permissions: req.user.permissions,
    dataScope: req.user.dataScope,
    role: req.user.role,
  });
});
