import { asyncHandler, sendSuccess } from '../../utils/response.util.js';
import { assignmentService } from './assignment.service.js';
import { requireTenantCompany, assertBranchInTenant } from '../../utils/tenant.util.js';

export const resolveIdentity = asyncHandler(async (req, res) => {
  const { phone, branchId } = req.query;
  const companyId = requireTenantCompany(req.user)
    || (branchId ? (await assertBranchInTenant(branchId, req.user)).companyId : null);
  const result = await assignmentService.resolveIdentity(
    phone,
    branchId || req.user.branchId,
    companyId,
  );
  sendSuccess(res, result);
});

export const getMyQueue = asyncHandler(async (req, res) => {
  const data = await assignmentService.getMyQueue(req.user.id);
  sendSuccess(res, data);
});

export const getBranchOps = asyncHandler(async (req, res) => {
  const data = await assignmentService.getBranchOps(req.user);
  sendSuccess(res, data);
});

export const updatePresence = asyncHandler(async (req, res) => {
  const data = await assignmentService.updatePresence(
    req.user.id,
    req.user.branchId,
    req.body.status,
  );
  sendSuccess(res, data);
});

export const heartbeat = asyncHandler(async (req, res) => {
  const data = await assignmentService.heartbeat(req.user.id, req.user.branchId);
  sendSuccess(res, data);
});

export const acceptOffer = asyncHandler(async (req, res) => {
  const data = await assignmentService.acceptOffer(req.params.id, req.user, req);
  sendSuccess(res, data, 'Assignment accepted');
});

export const rejectOffer = asyncHandler(async (req, res) => {
  const data = await assignmentService.rejectOffer(
    req.params.id,
    req.user,
    req.body.reason,
    req,
  );
  sendSuccess(res, data, 'Assignment rejected — re-routing');
});

export const startSession = asyncHandler(async (req, res) => {
  const data = await assignmentService.startSession(req.params.leadId, req.user, req);
  sendSuccess(res, data, 'Counselling started');
});

export const completeSession = asyncHandler(async (req, res) => {
  const data = await assignmentService.completeSession(
    req.params.leadId,
    req.user.id,
    req.body?.outcome,
  );
  sendSuccess(res, data, 'Session completed');
});

export const reassign = asyncHandler(async (req, res) => {
  const data = await assignmentService.managerReassign(
    req.params.leadId,
    req.body.counsellorId,
    req.body.reason,
    req.user.id,
    req,
  );
  sendSuccess(res, data, 'Visitor reassigned');
});
