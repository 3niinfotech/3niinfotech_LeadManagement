import { asyncHandler, sendSuccess } from '../../utils/response.util.js';
import { registrationService } from '../auth/auth.registration.service.js';
import {
  roleApplicationService,
  submitApplicationSchema,
  reviewApplicationSchema,
  approveApplicationSchema,
} from './role-application.service.js';

export const listOpenRoles = asyncHandler(async (_req, res) => {
  const data = await roleApplicationService.listOpenRoles();
  sendSuccess(res, data);
});

export const getApplyBranches = asyncHandler(async (req, res) => {
  const companyCode = String(req.query.companyCode || '').trim();
  const data = await registrationService.listBranches(companyCode);
  sendSuccess(res, data);
});

export const submitApplication = asyncHandler(async (req, res) => {
  const payload = submitApplicationSchema.parse(req.body);
  const data = await roleApplicationService.submit(payload, req);
  sendSuccess(res, data, 'Application submitted successfully. Admin will review and contact you.', 201);
});

export const listApplications = asyncHandler(async (req, res) => {
  const data = await roleApplicationService.list(req.query, req.user);
  sendSuccess(res, data);
});

export const getApplicationSummary = asyncHandler(async (req, res) => {
  const data = await roleApplicationService.getSummary(req.user);
  sendSuccess(res, data);
});

export const getApplicationById = asyncHandler(async (req, res) => {
  const data = await roleApplicationService.getById(req.params.id, req.user);
  sendSuccess(res, data);
});

export const rejectApplication = asyncHandler(async (req, res) => {
  const payload = reviewApplicationSchema.parse(req.body || {});
  const data = await roleApplicationService.reject(req.params.id, payload, req.user, req);
  sendSuccess(res, data, 'Application rejected');
});

export const approveApplication = asyncHandler(async (req, res) => {
  const payload = approveApplicationSchema.parse(req.body);
  const data = await roleApplicationService.approve(req.params.id, payload, req.user, req);
  sendSuccess(res, data, 'Application approved and staff account created');
});
