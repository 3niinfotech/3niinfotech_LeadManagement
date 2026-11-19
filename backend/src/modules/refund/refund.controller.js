import { asyncHandler, sendSuccess } from '../../utils/response.util.js';
import { refundService } from './refund.service.js';

export const requestRefund = asyncHandler(async (req, res) => {
  const refund = await refundService.requestRefund(req.body, req.user.id, req);
  sendSuccess(res, refund, 'Refund requested successfully', 201);
});

export const getRefunds = asyncHandler(async (req, res) => {
  const refunds = await refundService.getAll(req.query);
  sendSuccess(res, refunds);
});

export const getRefund = asyncHandler(async (req, res) => {
  const refund = await refundService.getById(req.params.id);
  sendSuccess(res, refund);
});

export const approveRefund = asyncHandler(async (req, res) => {
  const refund = await refundService.approveRefund(req.params.id, req.user.id, req);
  sendSuccess(res, refund, 'Refund approved successfully');
});

export const rejectRefund = asyncHandler(async (req, res) => {
  const refund = await refundService.rejectRefund(req.params.id, req.body, req.user.id, req);
  sendSuccess(res, refund, 'Refund rejected');
});

export const disburseRefund = asyncHandler(async (req, res) => {
  const refund = await refundService.disburseRefund(req.params.id, req.body, req.user.id, req);
  sendSuccess(res, refund, 'Refund disbursed successfully');
});

