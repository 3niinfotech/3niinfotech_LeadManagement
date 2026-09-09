import { asyncHandler, sendSuccess } from '../../utils/response.util.js';
import { organizationService } from './organization.service.js';
import {
  updateCompanySchema,
  createBranchSchema,
  updateBranchSchema,
  branchStatusSchema,
} from './organization.validators.js';

export const getCompany = asyncHandler(async (req, res) => {
  const data = await organizationService.getCompany(req.user);
  sendSuccess(res, data);
});

export const updateCompany = asyncHandler(async (req, res) => {
  const payload = updateCompanySchema.parse(req.body);
  const data = await organizationService.updateCompany(payload, req.user, req);
  sendSuccess(res, data, 'Company updated');
});

export const uploadBranding = asyncHandler(async (req, res) => {
  const data = await organizationService.uploadBranding(req.file, req.query.kind, req.user, req);
  sendSuccess(res, data, 'Branding uploaded');
});

export const listBranches = asyncHandler(async (req, res) => {
  const data = await organizationService.listBranches(req.query, req.user);
  sendSuccess(res, data);
});

export const createBranch = asyncHandler(async (req, res) => {
  const payload = createBranchSchema.parse(req.body);
  const data = await organizationService.createBranch(payload, req.user, req);
  sendSuccess(res, data, 'Branch created', 201);
});

export const updateBranch = asyncHandler(async (req, res) => {
  const payload = updateBranchSchema.parse(req.body);
  const data = await organizationService.updateBranch(req.params.id, payload, req.user, req);
  sendSuccess(res, data, 'Branch updated');
});

export const updateBranchStatus = asyncHandler(async (req, res) => {
  const { isActive } = branchStatusSchema.parse(req.body);
  const data = await organizationService.updateBranchStatus(req.params.id, isActive, req.user, req);
  sendSuccess(res, data, 'Branch status updated');
});

export const deleteBranch = asyncHandler(async (req, res) => {
  const data = await organizationService.removeBranch(req.params.id, req.user, req);
  sendSuccess(res, data, 'Branch deleted');
});

export const getViewingBranch = asyncHandler(async (req, res) => {
  const data = await organizationService.getViewingBranchContext(req.user);
  sendSuccess(res, data);
});

export const setViewingBranch = asyncHandler(async (req, res) => {
  const branchId = req.body?.branchId ?? null;
  const data = await organizationService.setViewingBranch(branchId, req.user, req);
  sendSuccess(res, data, 'Viewing branch updated');
});
