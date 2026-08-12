import { asyncHandler, sendSuccess, sendPaginated, parsePagination } from '../../utils/response.util.js';
import { authorize } from '../../middleware/auth.middleware.js';
import { PERMISSIONS } from '../../config/permissions.js';
import { studentService, createStudentSchema, updateStudentSchema } from './student.service.js';

export const getStudents = asyncHandler(async (req, res) => {
  const { page, limit } = parsePagination(req.query);
  const result = await studentService.getAll({ ...req.query, page, limit }, req.user);
  sendPaginated(res, result.data, result.pagination);
});

export const getStudent = asyncHandler(async (req, res) => {
  const student = await studentService.getById(req.params.id, req.user);
  sendSuccess(res, student);
});

export const createStudent = asyncHandler(async (req, res) => {
  const data = createStudentSchema.parse(req.body);
  const student = await studentService.create(data, req.user.id, req);
  sendSuccess(res, student, 'Student created', 201);
});

export const updateStudent = asyncHandler(async (req, res) => {
  const data = updateStudentSchema.parse(req.body);
  const student = await studentService.update(req.params.id, data, req.user.id, req);
  sendSuccess(res, student, 'Student updated');
});

export const deleteStudent = asyncHandler(async (req, res) => {
  await studentService.delete(req.params.id, req.user.id, req);
  sendSuccess(res, null, 'Student deleted');
});

export const bulkDeleteStudents = asyncHandler(async (req, res) => {
  const { ids } = req.body;
  await studentService.bulkDelete(ids, req.user.id, req);
  sendSuccess(res, null, 'Students deleted');
});

export const bulkAssignStudents = asyncHandler(async (req, res) => {
  const { ids, assignedToId } = req.body;
  await studentService.bulkAssign(ids, assignedToId, req.user.id, req);
  sendSuccess(res, null, 'Students assigned');
});

export { authorize, PERMISSIONS };
