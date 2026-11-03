import { asyncHandler, sendSuccess } from '../../utils/response.util.js';
import { studentPortalService } from './student-portal.service.js';
import { uploadDocumentSchema, counselingRequestSchema, updateProfileSchema, messageCounselorSchema, submitOfflineProofSchema } from './student-portal.validators.js';

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
  let fileData = {};
  if (req.file) {
    fileData = {
      filePath: `/uploads/students/${req.file.filename}`,
      fileUrl: `/uploads/students/${req.file.filename}`,
      fileName: req.file.originalname,
      fileSize: req.file.size,
      mimeType: req.file.mimetype,
      name: (req.body.name || req.file.originalname).replace(/\.[^/.]+$/, ''),
      category: req.body.category || 'OTHER',
      remarks: req.body.remarks || null,
      replaceId: req.body.replaceId || null,
    };
  } else {
    fileData = req.body;
  }
  const body = uploadDocumentSchema.parse(fileData);
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

export const messageCounselor = asyncHandler(async (req, res) => {
  const body = messageCounselorSchema.parse(req.body);
  sendSuccess(res, await studentPortalService.sendMessageToCounselor(req.user, body), 'Message delivered to counselor');
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

export const createPaymentOrder = asyncHandler(async (req, res) => {
  sendSuccess(res, await studentPortalService.createPaymentOrder(req.user, req.body), 'Payment order created');
});

export const verifyPayment = asyncHandler(async (req, res) => {
  sendSuccess(res, await studentPortalService.verifyPayment(req.user, req.body), 'Payment verified');
});

export const submitOfflineProof = asyncHandler(async (req, res) => {
  let data = { ...req.body };
  if (req.file) {
    data.proofUrl = `/uploads/students/${req.file.filename}`;
  }
  const body = submitOfflineProofSchema.parse(data);
  sendSuccess(res, await studentPortalService.submitOfflineProof(req.user, body), 'Proof submitted for review');
});


