import { z } from 'zod';
import { AppError } from '../../utils/response.util.js';
import { parseSort } from '../../utils/response.util.js';
import { studentRepository, STUDENT_SORT_FIELDS } from './student.repository.js';
import { auditLog } from '../../middleware/audit.middleware.js';
import prisma from '../../config/database.js';
import {
  mergeScope,
  assertBranchInTenant,
  assertUserInTenant,
  assertStudentInTenant,
  assertStudentIdsInTenant,
  resolveCompanyIdForBranch,
} from '../../utils/tenant.util.js';

import { masterRepository } from '../master/master.repository.js';

export const createStudentSchema = z.object({
  branchId: z.string().uuid(),
  partnerId: z.string().uuid().optional().nullable(),
  assignedToId: z.string().uuid().optional().nullable(),
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  email: z.string().email().optional().nullable(),
  phone: z.string().optional().nullable(),
  dateOfBirth: z.string().optional().nullable(),
  gender: z.string().optional().nullable(),
  nationality: z.string().optional().nullable(),
  passportNo: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  status: z.enum(['ENQUIRY', 'REGISTERED', 'DOCUMENT_PENDING', 'APPLICATION_SUBMITTED', 'OFFER_RECEIVED', 'VISA_APPLIED', 'VISA_GRANTED', 'ENROLLED', 'DEFERRED', 'WITHDRAWN']).optional(),
  intake: z.string().optional().nullable(),
  course: z.string().optional().nullable(),
  university: z.string().optional().nullable(),
  country: z.string().optional().nullable(),
});

export const updateStudentSchema = createStudentSchema.partial();

export const studentService = {
  getAll: async (query, user) => {
    const sort = parseSort(query, STUDENT_SORT_FIELDS);
    const scopeWhere = mergeScope(user, { entity: 'student' });
    return studentRepository.findMany({ ...query, sort, scopeWhere });
  },

  getSummary: async (query, user) => {
    const scopeWhere = mergeScope(user, { entity: 'student' });
    if (query?.branchId) scopeWhere.branchId = query.branchId;
    return studentRepository.getSummaryCounts(scopeWhere);
  },

  exportStudents: async (query, user, userId, req) => {
    const { ids: requestedIds } = query;
    const selected = Array.isArray(requestedIds) && requestedIds.length > 0;
    const scopeWhere = mergeScope(user, { entity: 'student' });

    const result = await studentRepository.findMany({
      ...query,
      ...(selected ? { ids: requestedIds } : {}),
      scopeWhere,
      page: 1,
      limit: selected ? Math.max(requestedIds.length, 1) : 5000,
    });

    const { buildStudentExportWorkbook, buildStudentExportFilename } = await import('./student.export.service.js');
    const buffer = await buildStudentExportWorkbook(result.data, { selected });
    const filename = buildStudentExportFilename({ selected });

    await auditLog({
      userId,
      action: 'EXPORT',
      entityType: 'Student',
      newData: { count: result.data.length, selected },
      req,
    });

    return { buffer, filename, count: result.data.length, selected };
  },

  bulkUpdateStatus: async (ids, status, userId, req) => {
    await assertStudentIdsInTenant(ids, req.user);
    const scopeWhere = mergeScope(req.user, { entity: 'student' });
    await studentRepository.bulkUpdateStatus(ids, status, userId, scopeWhere);
    await auditLog({ userId, action: 'UPDATE', entityType: 'Student', entityId: ids.join(','), newData: { status }, req });
  },

  getById: async (id, user) => {
    return assertStudentInTenant(id, user);
  },

  create: async (data, userId, req) => {
    await assertBranchInTenant(data.branchId, req.user);
    if (data.assignedToId) await assertUserInTenant(data.assignedToId, req.user);

    const companyId = await resolveCompanyIdForBranch(data.branchId, req.user);
    const studentCode = await studentRepository.generateCode(companyId);

    let status = data.status;
    if (!status) {
      const defaultStatus = await masterRepository.findDefaultStudentStatus(companyId);
      if (defaultStatus?.code) status = defaultStatus.code;
    }

    const student = await studentRepository.create({
      ...data,
      status,
      studentCode,
      createdBy: userId,
      dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : null,
    });

    await prisma.activity.create({
      data: { userId, studentId: student.id, action: 'CREATE', description: `Student ${studentCode} created` },
    });

    await auditLog({ userId, action: 'CREATE', entityType: 'Student', entityId: student.id, newData: student, req });
    return student;
  },

  update: async (id, data, userId, req) => {
    const existing = await assertStudentInTenant(id, req.user);
    if (data.branchId) await assertBranchInTenant(data.branchId, req.user);
    if (data.assignedToId) await assertUserInTenant(data.assignedToId, req.user);

    const student = await studentRepository.update(id, {
      ...data,
      updatedBy: userId,
      dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : undefined,
    });

    await prisma.activity.create({
      data: { userId, studentId: id, action: 'UPDATE', description: 'Student record updated' },
    });

    await auditLog({ userId, action: 'UPDATE', entityType: 'Student', entityId: id, oldData: existing, newData: student, req });
    return student;
  },

  delete: async (id, userId, req) => {
    const existing = await assertStudentInTenant(id, req.user);
    await studentRepository.softDelete(id, userId);
    await auditLog({ userId, action: 'DELETE', entityType: 'Student', entityId: id, oldData: existing, req });
  },

  bulkDelete: async (ids, userId, req) => {
    await assertStudentIdsInTenant(ids, req.user);
    await studentRepository.bulkSoftDelete(ids, userId, mergeScope(req.user, { entity: 'student' }));
    await auditLog({ userId, action: 'DELETE', entityType: 'Student', entityId: ids.join(','), req });
  },

  bulkAssign: async (ids, assignedToId, userId, req) => {
    await assertStudentIdsInTenant(ids, req.user);
    if (assignedToId) await assertUserInTenant(assignedToId, req.user);
    await studentRepository.bulkAssign(ids, assignedToId, userId, mergeScope(req.user, { entity: 'student' }));
    await auditLog({ userId, action: 'ASSIGN', entityType: 'Student', entityId: ids.join(','), newData: { assignedToId }, req });
  },
};
