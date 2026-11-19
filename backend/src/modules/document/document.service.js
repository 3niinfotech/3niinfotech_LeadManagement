import { z } from 'zod';
import { AppError } from '../../utils/response.util.js';
import { parseSort } from '../../utils/response.util.js';
import { documentRepository, DOCUMENT_SORT_FIELDS } from './document.repository.js';
import prisma from '../../config/database.js';
import { auditLog } from '../../middleware/audit.middleware.js';
import { notifyStudentLinkedUser, notifyDocumentEvent } from '../notification/notification.dispatcher.js';

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

export const updateDocumentSchema = createDocumentSchema.partial().extend({
  status: z.enum(['UPLOADED', 'UNDER_REVIEW', 'VERIFIED', 'REJECTED', 'REQUIRED']).optional(),
  rejectionReason: z.string().optional().nullable(),
  remarks: z.string().optional().nullable(),
  metadata: z.record(z.any()).optional().nullable(),
});

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
    if (String(record.category || '').toUpperCase() === 'PHOTO' && record.filePath && record.studentId) {
      try {
        const student = await prisma.student.findUnique({
          where: { id: record.studentId },
          select: { id: true, userId: true, metadata: true },
        });
        if (student) {
          const meta = (student.metadata && typeof student.metadata === 'object') ? { ...student.metadata } : {};
          meta.photoUrl = record.filePath;
          await prisma.student.update({ where: { id: student.id }, data: { metadata: meta } });
          if (student.userId) {
            await prisma.user.update({ where: { id: student.userId }, data: { avatar: record.filePath } });
          }
        }
      } catch {}
    }

    if (record.studentId) {
      try {
        const student = await prisma.student.findUnique({
          where: { id: record.studentId },
          select: { id: true, firstName: true, lastName: true, assignedToId: true, branchId: true, branch: { select: { companyId: true } } },
        });
        if (student) {
          await notifyDocumentEvent({
            document: record,
            student,
            eventType: 'UPLOADED',
            companyId: student.branch?.companyId,
          });
        }
      } catch (e) {
        console.warn('[document.create] notifyDocumentEvent warning:', e.message);
      }
    }

    return record;
  },

  update: async (id, data, userId, req) => {
    const existing = await documentRepository.findById(id);
    if (!existing) throw new AppError('Document not found', 404);

    const existingMeta = existing.metadata && typeof existing.metadata === 'object' ? { ...existing.metadata } : {};
    const metadataUpdate = {
      ...existingMeta,
      ...(data.metadata || {}),
      ...(data.status ? { status: data.status } : {}),
      ...(data.rejectionReason !== undefined ? { rejectionReason: data.rejectionReason } : {}),
      ...(data.status === 'VERIFIED' ? { verifiedAt: new Date().toISOString(), verifiedBy: userId } : {}),
      ...(data.status === 'REJECTED' ? { rejectedAt: new Date().toISOString(), rejectedBy: userId } : {}),
    };
    const updateData = { ...data, metadata: metadataUpdate };
    delete updateData.status;
    delete updateData.rejectionReason;
    delete updateData.remarks;

    const record = await documentRepository.update(id, updateData);
    await prisma.activity.create({ data: { userId, action: 'UPDATE', entityType: 'Document', entityId: id, description: `Document ${record.name} status updated` } });
    await auditLog({ userId, action: 'UPDATE', entityType: 'Document', entityId: id, oldData: existing, newData: record, req });

    if (String(record.category || '').toUpperCase() === 'PHOTO' && record.filePath && record.studentId) {
      try {
        const student = await prisma.student.findUnique({
          where: { id: record.studentId },
          select: { id: true, userId: true, metadata: true },
        });
        if (student) {
          const meta = (student.metadata && typeof student.metadata === 'object') ? { ...student.metadata } : {};
          meta.photoUrl = record.filePath;
          await prisma.student.update({ where: { id: student.id }, data: { metadata: meta } });
          if (student.userId) {
            await prisma.user.update({ where: { id: student.userId }, data: { avatar: record.filePath } });
          }
        }
      } catch {}
    }

    const oldMeta = existing.metadata && typeof existing.metadata === 'object' ? existing.metadata : {};
    const newMeta = record.metadata && typeof record.metadata === 'object' ? record.metadata : {};
    const oldStatus = oldMeta.status;
    const newStatus = newMeta.status;

    if (existing.studentId && newStatus && oldStatus !== newStatus) {
      try {
        const student = await prisma.student.findUnique({
          where: { id: existing.studentId },
          select: { id: true, firstName: true, lastName: true, assignedToId: true, branchId: true, branch: { select: { companyId: true } } },
        });
        if (student) {
          await notifyDocumentEvent({
            document: record,
            student,
            eventType: newStatus === 'VERIFIED' ? 'APPROVED' : newStatus === 'REJECTED' ? 'REJECTED' : 'UPLOADED',
            status: newStatus,
            rejectionReason: newMeta.rejectionReason,
            reviewerUser: req?.user,
            companyId: student.branch?.companyId,
          });
        }
      } catch (e) {
        console.warn('[document.update] notifyDocumentEvent warning:', e.message);
      }
    }

    return record;
  },

  delete: async (id, userId, req) => {
    const existing = await documentRepository.findById(id);
    if (!existing) throw new AppError('Document not found', 404);
    await documentRepository.softDelete(id, userId);
    await auditLog({ userId, action: 'DELETE', entityType: 'Document', entityId: id, oldData: existing, req });
  },
};
