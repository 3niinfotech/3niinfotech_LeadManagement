import { asyncHandler, sendSuccess } from '../../utils/response.util.js';
import { studentPortalService } from './student-portal.service.js';
import { uploadDocumentSchema, counselingRequestSchema, updateProfileSchema } from './student-portal.validators.js';

export const dashboard = asyncHandler(async (req, res) => {
  sendSuccess(res, await studentPortalService.dashboard(req.user));
});

export const fees = asyncHandler(async (req, res) => {
  sendSuccess(res, await studentPortalService.fees(req.user));
});

export const feeReceipt = asyncHandler(async (req, res) => {
  sendSuccess(res, await studentPortalService.feeReceipt(req.user, req.params.receiptKey));
});

export const documents = asyncHandler(async (req, res) => {
  sendSuccess(res, await studentPortalService.documents(req.user, req.query));
});

export const uploadDocument = asyncHandler(async (req, res) => {
  const body = uploadDocumentSchema.parse(req.body);
  sendSuccess(res, await studentPortalService.uploadDocument(req.user, body), 'Document uploaded', 201);
});

export const applications = asyncHandler(async (req, res) => {
  sendSuccess(res, await studentPortalService.applications(req.user));
});

export const visas = asyncHandler(async (req, res) => {
  sendSuccess(res, await studentPortalService.visas(req.user));
});

export const counseling = asyncHandler(async (req, res) => {
  sendSuccess(res, await studentPortalService.counseling(req.user));
});

export const requestCounseling = asyncHandler(async (req, res) => {
  const body = counselingRequestSchema.parse(req.body);
  sendSuccess(res, await studentPortalService.requestCounseling(req.user, body), 'Request submitted', 201);
});

export const reports = asyncHandler(async (req, res) => {
  sendSuccess(res, await studentPortalService.reports(req.user));
});

export const profile = asyncHandler(async (req, res) => {
  sendSuccess(res, await studentPortalService.profile(req.user));
});

export const updateProfile = asyncHandler(async (req, res) => {
  const body = updateProfileSchema.parse(req.body);
  sendSuccess(res, await studentPortalService.updateProfile(req.user, body), 'Profile updated');
});
