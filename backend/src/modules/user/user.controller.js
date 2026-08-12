import { asyncHandler, sendSuccess, sendPaginated } from '../../utils/response.util.js';
import { userService } from './user.service.js';
import { createUserSchema, updateUserSchema, userStatusSchema } from './user.validators.js';

export const getUsers = asyncHandler(async (req, res) => {
  const result = await userService.getAll(req.query, req.user);
  sendPaginated(res, result.data, result.pagination);
});

export const getUser = asyncHandler(async (req, res) => {
  const user = await userService.getById(req.params.id, req.user);
  sendSuccess(res, user);
});

export const getRoles = asyncHandler(async (req, res) => {
  const roles = await userService.getRoles(req.user);
  sendSuccess(res, roles);
});

export const getTeamSummary = asyncHandler(async (req, res) => {
  const summary = await userService.getTeamSummary(req.user);
  sendSuccess(res, summary);
});

export const getCounsellors = asyncHandler(async (req, res) => {
  const data = await userService.getCounsellors(req.query, req.user);
  sendSuccess(res, data);
});

export const createUser = asyncHandler(async (req, res) => {
  const payload = createUserSchema.parse(req.body);
  const data = await userService.create(payload, req.user, req);
  sendSuccess(res, data, 'User created', 201);
});

export const updateUser = asyncHandler(async (req, res) => {
  const payload = updateUserSchema.parse(req.body);
  const data = await userService.update(req.params.id, payload, req.user, req);
  sendSuccess(res, data, 'User updated');
});

export const updateUserStatus = asyncHandler(async (req, res) => {
  const { status } = userStatusSchema.parse(req.body);
  const data = await userService.updateStatus(req.params.id, status, req.user, req);
  sendSuccess(res, data, 'User status updated');
});
