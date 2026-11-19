import { asyncHandler, sendSuccess } from '../../utils/response.util.js';
import { paymentProofService } from './payment-proof.service.js';

export const createPaymentProof = asyncHandler(async (req, res) => {
  const proof = await paymentProofService.create(req.body, req.user.id, req);
  sendSuccess(res, proof, 'Payment proof submitted successfully', 201);
});

export const getPaymentProofs = asyncHandler(async (req, res) => {
  const proofs = await paymentProofService.getAll(req.query);
  sendSuccess(res, proofs);
});

export const getPaymentProof = asyncHandler(async (req, res) => {
  const proof = await paymentProofService.getById(req.params.id);
  sendSuccess(res, proof);
});

export const reviewPaymentProof = asyncHandler(async (req, res) => {
  const result = await paymentProofService.review(req.params.id, req.body, req.user.id, req);
  sendSuccess(res, result, `Payment proof ${req.body.status.toLowerCase()} successfully`);
});

