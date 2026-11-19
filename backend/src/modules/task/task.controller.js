import { asyncHandler, sendSuccess } from '../../utils/response.util.js';
import { taskService } from './task.service.js';

export const createTask = asyncHandler(async (req, res) => {
  const result = await taskService.createTask({
    ...req.body,
    companyId: req.user.companyId,
    branchId: req.body.branchId || req.user.branchId,
    createdById: req.user.id,
  });
  sendSuccess(res, result, 'Task created successfully', 201);
});

export const getTasks = asyncHandler(async (req, res) => {
  const result = await taskService.getTasks(req.user, req.query);
  sendSuccess(res, result);
});

export const getTaskStats = asyncHandler(async (req, res) => {
  const result = await taskService.getTaskStats(req.user);
  sendSuccess(res, result);
});

export const getTaskById = asyncHandler(async (req, res) => {
  const result = await taskService.getTaskById(req.params.id, req.user);
  sendSuccess(res, result);
});

export const updateTask = asyncHandler(async (req, res) => {
  const result = await taskService.updateTask(req.params.id, req.body, req.user);
  sendSuccess(res, result, 'Task updated successfully');
});

export const completeTask = asyncHandler(async (req, res) => {
  const result = await taskService.updateTask(req.params.id, { status: 'COMPLETED', remark: req.body.remark }, req.user);
  sendSuccess(res, result, 'Task completed successfully');
});

export const reassignTask = asyncHandler(async (req, res) => {
  const result = await taskService.reassignTask(req.params.id, req.body.assignedToId, req.body.reason, req.user);
  sendSuccess(res, result, 'Task reassigned successfully');
});

export const addComment = asyncHandler(async (req, res) => {
  const result = await taskService.addComment(req.params.id, req.body.comment, req.user);
  sendSuccess(res, result, 'Comment added successfully', 201);
});

export const deleteTask = asyncHandler(async (req, res) => {
  await taskService.deleteTask(req.params.id, req.user);
  sendSuccess(res, null, 'Task deleted successfully');
});

