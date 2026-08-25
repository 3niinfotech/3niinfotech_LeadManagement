import { asyncHandler, sendSuccess, sendPaginated, parsePagination } from '../../utils/response.util.js';
import { walkinService } from './walkin.service.js';
import {
  createWalkInSchema,
  updateWalkInSchema,
  walkInStatusSchema,
  counsellorDecisionSchema,
} from './walkin.validators.js';
import { z } from 'zod';

const noteSchema = z.object({ content: z.string().min(1).max(5000) });

export const getWalkIns = asyncHandler(async (req, res) => {
  const { page, limit } = parsePagination(req.query);
  const result = await walkinService.getAll({ ...req.query, page, limit }, req.user);
  sendPaginated(res, result.data, result.pagination);
});

export const getSummary = asyncHandler(async (req, res) => {
  const data = await walkinService.getSummary(req.query, req.user);
  sendSuccess(res, data);
});

export const getWalkIn = asyncHandler(async (req, res) => {
  const data = await walkinService.getById(req.params.id, req.user);
  sendSuccess(res, data);
});

export const checkDuplicate = asyncHandler(async (req, res) => {
  const { phone, branchId, excludeId } = req.query;
  const data = await walkinService.checkDuplicate(phone, branchId, excludeId, req.user);
  sendSuccess(res, data);
});

export const createWalkIn = asyncHandler(async (req, res) => {
  const data = createWalkInSchema.parse(req.body);
  const lead = await walkinService.create(data, req.user.id, req);
  sendSuccess(res, lead, 'Walk-in registered', 201);
});

export const updateWalkIn = asyncHandler(async (req, res) => {
  const data = updateWalkInSchema.parse(req.body);
  const lead = await walkinService.update(req.params.id, data, req.user.id, req);
  sendSuccess(res, lead, 'Walk-in updated');
});

export const patchStatus = asyncHandler(async (req, res) => {
  const { status } = walkInStatusSchema.parse(req.body);
  const lead = await walkinService.updateStatus(req.params.id, status, req.user.id, req);
  sendSuccess(res, lead, 'Status updated');
});

export const applyCounsellorDecision = asyncHandler(async (req, res) => {
  const data = counsellorDecisionSchema.parse(req.body);
  const result = await walkinService.applyCounsellorDecision(
    req.params.id,
    data,
    req.user.id,
    req,
  );
  sendSuccess(res, result, 'Counsellor decision recorded');
});

export const deleteWalkIn = asyncHandler(async (req, res) => {
  await walkinService.delete(req.params.id, req.user.id, req);
  sendSuccess(res, null, 'Walk-in removed');
});

export const addNote = asyncHandler(async (req, res) => {
  const { content } = noteSchema.parse(req.body);
  const note = await walkinService.addNote(req.params.id, content, req.user.id, req.user);
  sendSuccess(res, note, 'Note added', 201);
});

export const getBranches = asyncHandler(async (req, res) => {
  const data = await walkinService.getBranches(req.user);
  sendSuccess(res, data);
});

export const getCounsellors = asyncHandler(async (req, res) => {
  const data = await walkinService.getCounsellors(req.query.branchId, req.user);
  sendSuccess(res, data);
});

export const recommendCounsellors = asyncHandler(async (req, res) => {
  const data = await walkinService.recommendCounsellors(req.query, req.user);
  sendSuccess(res, data);
});
