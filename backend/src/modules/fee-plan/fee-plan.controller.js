import { asyncHandler, sendSuccess } from '../../utils/response.util.js';
import { feePlanService } from './fee-plan.service.js';

export const getStudentFeePlans = asyncHandler(async (req, res) => {
  const plans = await feePlanService.getByStudent(req.params.studentId);
  sendSuccess(res, plans);
});

export const getFeePlan = asyncHandler(async (req, res) => {
  const plan = await feePlanService.getById(req.params.id);
  sendSuccess(res, plan);
});

export const createFeePlan = asyncHandler(async (req, res) => {
  const plan = await feePlanService.create(req.body, req.user.id, req);
  sendSuccess(res, plan, 'Fee plan created successfully', 201);
});

export const addInstallment = asyncHandler(async (req, res) => {
  const installment = await feePlanService.addInstallment(req.params.id, req.body, req.user.id, req);
  sendSuccess(res, installment, 'Installment added successfully', 201);
});

export const updateInstallment = asyncHandler(async (req, res) => {
  const installment = await feePlanService.updateInstallment(req.params.installmentId, req.body, req.user.id, req);
  sendSuccess(res, installment, 'Installment updated successfully');
});

export const deleteFeePlan = asyncHandler(async (req, res) => {
  await feePlanService.delete(req.params.id, req.user.id, req);
  sendSuccess(res, null, 'Fee plan deleted successfully');
});

