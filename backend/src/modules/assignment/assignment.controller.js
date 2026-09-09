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

export const updatePresence = asyncHandler(async (req, res) => {
  await assignmentService.updatePresence(
    req.user.id,
    req.user.branchId,
    req.body.status,
  );
  sendSuccess(res, null);
});

export const getMyAvailability = asyncHandler(async (req, res) => {
  const data = await assignmentService.getMyAvailability(req.user);
  sendSuccess(res, data);
});

export const heartbeat = asyncHandler(async (req, res) => {
  await assignmentService.heartbeat(req.user.id, req.user.branchId);
  const data = await assignmentService.getMyAvailability(req.user);
  sendSuccess(res, data);
});

export const goOffline = asyncHandler(async (req, res) => {
  const data = await assignmentService.goOffline(req.user.id, req.user.branchId);
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

export const getConfig = asyncHandler(async (req, res) => {
  const data = await assignmentService.getAssignmentConfig(req.user);
  sendSuccess(res, data);
});

export const updateConfig = asyncHandler(async (req, res) => {
  const data = await assignmentService.updateAssignmentConfig(req.user, req.body);
  sendSuccess(res, data, 'Assignment rules updated');
});

export const getUnassigned = asyncHandler(async (req, res) => {
  const data = await assignmentService.getUnassignedEnquiries(req.query, req.user);
  sendSuccess(res, data);
});

export const recommendForEnquiry = asyncHandler(async (req, res) => {
  const data = await assignmentService.recommendForEnquiry(req.params.enquiryId, req.user);
  sendSuccess(res, data);
});

export const autoAssignEnquiry = asyncHandler(async (req, res) => {
  const data = await assignmentService.autoAssignEnquiry(req.params.enquiryId, req.user.id, req);
  sendSuccess(res, data, 'Enquiry auto-assigned');
});

export const bulkAutoAssign = asyncHandler(async (req, res) => {
  const data = await assignmentService.bulkAutoAssignEnquiries(req.body.ids, req.user.id, req);
  sendSuccess(res, data, 'Bulk auto-assign completed');
});

export const manualAssignEnquiry = asyncHandler(async (req, res) => {
  const data = await assignmentService.manualAssignEnquiry(
    req.params.enquiryId,
    req.body.counsellorId,
    req.body.reason,
    req.user.id,
    req,
  );
  sendSuccess(res, data, 'Enquiry assigned');
});

export const enquiryAssignmentHistory = asyncHandler(async (req, res) => {
  const data = await assignmentService.getEnquiryAssignmentHistory(req.params.enquiryId, req.user);
  sendSuccess(res, data);
});

export const temporaryOverride = asyncHandler(async (req, res) => {
  const data = await assignmentService.setTemporaryOverride(
    req.user.id,
    req.user.branchId,
    req.body,
  );
  sendSuccess(res, data, 'Override updated');
});

export const getMySla = asyncHandler(async (req, res) => {
  const data = await assignmentService.getMySla(req.user, req.query);
  sendSuccess(res, data);
});

export const getSlaOverview = asyncHandler(async (req, res) => {
  const data = await assignmentService.getSlaOverview(req.user, req.query);
  sendSuccess(res, data);
});
