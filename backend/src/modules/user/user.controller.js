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

export const deleteUser = asyncHandler(async (req, res) => {
  const data = await userService.delete(req.params.id, req.user, req);
  sendSuccess(res, data, 'User deleted');
});

export const uploadUserAvatar = asyncHandler(async (req, res) => {
  const data = await userService.uploadAvatar(
    req.params.id,
    req.file,
    req.avatarRelativeDir,
    req.user,
    req,
  );
  sendSuccess(res, data, 'Profile photo updated');
});

export const removeUserAvatar = asyncHandler(async (req, res) => {
  const data = await userService.removeAvatar(req.params.id, req.user, req);
  sendSuccess(res, data, 'Profile photo removed');
});

export const getWorkingHours = asyncHandler(async (req, res) => {
  const { userStaffProfileService } = await import('./user.staff-profile.service.js');
  const data = await userStaffProfileService.getWorkingHours(req.params.id, req.user);
  sendSuccess(res, data);
});

export const saveWorkingHours = asyncHandler(async (req, res) => {
  const { userStaffProfileService } = await import('./user.staff-profile.service.js');
  const data = await userStaffProfileService.saveWorkingHours(req.params.id, req.body.schedule, req.user);
  sendSuccess(res, data, 'Working hours saved');
});

export const listLeave = asyncHandler(async (req, res) => {
  const { userStaffProfileService } = await import('./user.staff-profile.service.js');
  const data = await userStaffProfileService.listLeave(req.params.id, req.user);
  sendSuccess(res, data);
});

export const createLeave = asyncHandler(async (req, res) => {
  const { userStaffProfileService } = await import('./user.staff-profile.service.js');
  const data = await userStaffProfileService.createLeave(req.params.id, req.body, req.user);
  sendSuccess(res, data, 'Leave recorded', 201);
});

export const getCounsellorSkills = asyncHandler(async (req, res) => {
  const { userStaffProfileService } = await import('./user.staff-profile.service.js');
  const data = await userStaffProfileService.getCounsellorSkills(req.params.id, req.user);
  sendSuccess(res, data);
});

export const saveCounsellorSkills = asyncHandler(async (req, res) => {
  const { userStaffProfileService } = await import('./user.staff-profile.service.js');
  const data = await userStaffProfileService.saveCounsellorSkills(req.params.id, req.body.skills, req.user);
  sendSuccess(res, data, 'Counsellor skills saved');
});
