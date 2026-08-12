import { asyncHandler, sendSuccess, sendPaginated, parsePagination } from '../../utils/response.util.js';
import { documentService, createDocumentSchema, updateDocumentSchema } from './document.service.js';

export const getDocuments = asyncHandler(async (req, res) => {
  const { page, limit } = parsePagination(req.query);
  const result = await documentService.getAll({ ...req.query, page, limit });
  sendPaginated(res, result.data, result.pagination);
});

export const getDocument = asyncHandler(async (req, res) => {
  const record = await documentService.getById(req.params.id);
  sendSuccess(res, record);
});

export const createDocument = asyncHandler(async (req, res) => {
  const data = createDocumentSchema.parse(req.body);
  const record = await documentService.create(data, req.user.id, req);
  sendSuccess(res, record, 'Document created', 201);
});

export const updateDocument = asyncHandler(async (req, res) => {
  const data = updateDocumentSchema.parse(req.body);
  const record = await documentService.update(req.params.id, data, req.user.id, req);
  sendSuccess(res, record, 'Document updated');
});

export const deleteDocument = asyncHandler(async (req, res) => {
  await documentService.delete(req.params.id, req.user.id, req);
  sendSuccess(res, null, 'Document deleted');
});
