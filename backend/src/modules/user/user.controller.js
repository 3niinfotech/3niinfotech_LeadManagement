import { asyncHandler, sendSuccess, sendPaginated } from '../../utils/response.util.js';
import { userService } from './user.service.js';

export const getUsers = asyncHandler(async (req, res) => {
  const result = await userService.getAll(req.query, req.user);
  sendPaginated(res, result.data, result.pagination);
});

export const getUser = asyncHandler(async (req, res) => {
  const user = await userService.getById(req.params.id, req.user);
  sendSuccess(res, user);
});

export const getRoles = asyncHandler(async (req, res) => {
  const roles = await userService.getRoles();
  sendSuccess(res, roles);
});

export const getTeamSummary = asyncHandler(async (req, res) => {
  const summary = await userService.getTeamSummary(req.user);
  sendSuccess(res, summary);
});
