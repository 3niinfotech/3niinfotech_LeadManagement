import { asyncHandler, sendSuccess, sendPaginated, parsePagination } from '../../utils/response.util.js';
import { authorize } from '../../middleware/auth.middleware.js';
import { PERMISSIONS } from '../../config/permissions.js';
import { studentService, createStudentSchema, updateStudentSchema } from './student.service.js';

export const getStudents = asyncHandler(async (req, res) => {
  const { page, limit } = parsePagination(req.query);
  const result = await studentService.getAll({ ...req.query, page, limit }, req.user);
  sendPaginated(res, result.data, result.pagination);
});

export const getStudentSummary = asyncHandler(async (req, res) => {
  const summary = await studentService.getSummary(req.query, req.user);
  sendSuccess(res, summary);
});

export const exportStudents = asyncHandler(async (req, res) => {
  const result = await studentService.exportStudents(req.body, req.user, req.user.id, req);
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', `attachment; filename="${result.filename}"`);
  res.setHeader('X-Export-Count', String(result.count));
  res.setHeader('X-Export-Selected', result.selected ? '1' : '0');
  res.send(result.buffer);
});

export const bulkUpdateStudentStatus = asyncHandler(async (req, res) => {
  const { ids, status } = req.body;
  await studentService.bulkUpdateStatus(ids, status, req.user.id, req);
  sendSuccess(res, null, 'Student statuses updated');
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

export const getStudentDocuments = asyncHandler(async (req, res) => {
  const data = await studentService.getDocuments(req.params.id, req.user);
  sendSuccess(res, data);
});

export const uploadStudentDocument = asyncHandler(async (req, res) => {
  if (!req.file) return res.status(400).json({ success: false, message: 'File required' });
  const doc = await studentService.addDocument(
    req.params.id,
    req.file,
    req.user.id,
    req.body.category,
    req,
  );
  sendSuccess(res, doc, 'Document uploaded', 201);
});

export const deleteStudentDocument = asyncHandler(async (req, res) => {
  await studentService.removeDocument(req.params.id, req.params.docId, req.user.id, req);
  sendSuccess(res, null, 'Document deleted');
});

export { authorize, PERMISSIONS };
