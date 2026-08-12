import { z } from 'zod';
import { AppError } from '../../utils/response.util.js';
import { parseSort } from '../../utils/response.util.js';
import { documentRepository, DOCUMENT_SORT_FIELDS } from './document.repository.js';
import prisma from '../../config/database.js';
import { auditLog } from '../../middleware/audit.middleware.js';

export const createDocumentSchema = z.object({
  studentId: z.string().optional().nullable(),
  entityType: z.string().optional().nullable(),
  entityId: z.string().optional().nullable(),
  name: z.string().min(1),
  fileName: z.string().min(1),
  filePath: z.string().min(1),
  fileSize: z.coerce.number().optional().default(0),
  mimeType: z.string().optional().default('application/octet-stream'),
  category: z.string().optional().nullable(),
});

export const updateDocumentSchema = createDocumentSchema.partial();

export const documentService = {
  getAll: async (query) => {
    const sort = parseSort(query, DOCUMENT_SORT_FIELDS);
    return documentRepository.findMany({ ...query, sort });
  },

  getById: async (id) => {
    const record = await documentRepository.findById(id);
    if (!record) throw new AppError('Document not found', 404);
    return record;
  },

  create: async (data, userId, req) => {
    const record = await documentRepository.create({ ...data, createdBy: userId });
    await prisma.activity.create({ data: { userId, action: 'CREATE', entityType: 'Document', entityId: record.id, description: `Document ${record.name} uploaded` } });
    await auditLog({ userId, action: 'CREATE', entityType: 'Document', entityId: record.id, newData: record, req });
    return record;
  },

  update: async (id, data, userId, req) => {
    const existing = await documentRepository.findById(id);
    if (!existing) throw new AppError('Document not found', 404);

    const record = await documentRepository.update(id, data);
    await prisma.activity.create({ data: { userId, action: 'UPDATE', entityType: 'Document', entityId: id, description: 'Document updated' } });
    await auditLog({ userId, action: 'UPDATE', entityType: 'Document', entityId: id, oldData: existing, newData: record, req });
    return record;
  },

  delete: async (id, userId, req) => {
    const existing = await documentRepository.findById(id);
    if (!existing) throw new AppError('Document not found', 404);
    await documentRepository.softDelete(id, userId);
    await auditLog({ userId, action: 'DELETE', entityType: 'Document', entityId: id, oldData: existing, req });
  },
};
