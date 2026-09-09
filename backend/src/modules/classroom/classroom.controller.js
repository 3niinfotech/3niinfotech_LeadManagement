import { asyncHandler, sendSuccess, sendPaginated } from '../../utils/response.util.js';
import { classroomService } from './classroom.service.js';
import {
  createAssignmentSchema,
  updateAssignmentSchema,
  submitAssignmentSchema,
  reviewSubmissionSchema,
  createTestSchema,
  updateTestSchema,
  saveTestResultsSchema,
  createMaterialSchema,
  updateMaterialSchema,
  remarkSchema,
} from './classroom.validators.js';

export const listAssignments = asyncHandler(async (req, res) => {
  const result = await classroomService.listAssignments(req.query, req.user);
  sendPaginated(res, result.data, result.pagination);
});

export const getAssignment = asyncHandler(async (req, res) => {
  sendSuccess(res, await classroomService.getAssignment(req.params.id, req.user));
});

export const createAssignment = asyncHandler(async (req, res) => {
  const body = createAssignmentSchema.parse(req.body);
  sendSuccess(res, await classroomService.createAssignment(body, req.user), 'Assignment created', 201);
});

export const updateAssignment = asyncHandler(async (req, res) => {
  const body = updateAssignmentSchema.parse(req.body);
  sendSuccess(res, await classroomService.updateAssignment(req.params.id, body, req.user), 'Assignment updated');
});

export const deleteAssignment = asyncHandler(async (req, res) => {
  sendSuccess(res, await classroomService.deleteAssignment(req.params.id, req.user), 'Assignment deleted');
});

export const submitAssignment = asyncHandler(async (req, res) => {
  const body = submitAssignmentSchema.parse(req.body);
  sendSuccess(res, await classroomService.submitAssignment(req.params.id, body, req.user), 'Submitted');
});

export const reviewSubmission = asyncHandler(async (req, res) => {
  const body = reviewSubmissionSchema.parse(req.body);
  sendSuccess(
    res,
    await classroomService.reviewSubmission(req.params.id, req.params.submissionId, body, req.user),
    'Submission reviewed',
  );
});

export const listTests = asyncHandler(async (req, res) => {
  const result = await classroomService.listTests(req.query, req.user);
  sendPaginated(res, result.data, result.pagination);
});

export const getTest = asyncHandler(async (req, res) => {
  sendSuccess(res, await classroomService.getTest(req.params.id, req.user));
});

export const createTest = asyncHandler(async (req, res) => {
  const body = createTestSchema.parse(req.body);
  sendSuccess(res, await classroomService.createTest(body, req.user), 'Test created', 201);
});

export const updateTest = asyncHandler(async (req, res) => {
  const body = updateTestSchema.parse(req.body);
  sendSuccess(res, await classroomService.updateTest(req.params.id, body, req.user), 'Test updated');
});

export const deleteTest = asyncHandler(async (req, res) => {
  sendSuccess(res, await classroomService.deleteTest(req.params.id, req.user), 'Test deleted');
});

export const saveTestResults = asyncHandler(async (req, res) => {
  const body = saveTestResultsSchema.parse(req.body);
  sendSuccess(res, await classroomService.saveTestResults(req.params.id, body, req.user), 'Results saved');
});

export const listMaterials = asyncHandler(async (req, res) => {
  const result = await classroomService.listMaterials(req.query, req.user);
  sendPaginated(res, result.data, result.pagination);
});

export const getMaterial = asyncHandler(async (req, res) => {
  sendSuccess(res, await classroomService.getMaterial(req.params.id, req.user));
});

export const createMaterial = asyncHandler(async (req, res) => {
  const body = createMaterialSchema.parse(req.body);
  sendSuccess(res, await classroomService.createMaterial(body, req.user), 'Material created', 201);
});

export const updateMaterial = asyncHandler(async (req, res) => {
  const body = updateMaterialSchema.parse(req.body);
  sendSuccess(res, await classroomService.updateMaterial(req.params.id, body, req.user), 'Material updated');
});

export const deleteMaterial = asyncHandler(async (req, res) => {
  sendSuccess(res, await classroomService.deleteMaterial(req.params.id, req.user), 'Material deleted');
});

export const listRemarks = asyncHandler(async (req, res) => {
  sendSuccess(res, await classroomService.listRemarks(req.params.studentId, req.user));
});

export const addRemark = asyncHandler(async (req, res) => {
  const body = remarkSchema.parse(req.body);
  sendSuccess(res, await classroomService.addRemark(req.params.studentId, body, req.user), 'Remark added', 201);
});

export const performanceSummary = asyncHandler(async (req, res) => {
  sendSuccess(res, await classroomService.performanceSummary(req.query, req.user));
});
