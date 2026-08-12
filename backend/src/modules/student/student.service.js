import { z } from 'zod';
import { AppError } from '../../utils/response.util.js';
import { parseSort } from '../../utils/response.util.js';
import { studentRepository, STUDENT_SORT_FIELDS } from './student.repository.js';
import { auditLog } from '../../middleware/audit.middleware.js';
import prisma from '../../config/database.js';

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
  getAll: async (query) => {
    const sort = parseSort(query, STUDENT_SORT_FIELDS);
    return studentRepository.findMany({ ...query, sort });
  },

  getById: async (id) => {
    const student = await studentRepository.findById(id);
    if (!student) throw new AppError('Student not found', 404);
    return student;
  },

  create: async (data, userId, req) => {
    const studentCode = await studentRepository.generateCode();
    const student = await studentRepository.create({
      ...data,
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
    const existing = await studentRepository.findById(id);
    if (!existing) throw new AppError('Student not found', 404);

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
    const existing = await studentRepository.findById(id);
    if (!existing) throw new AppError('Student not found', 404);
    await studentRepository.softDelete(id, userId);
    await auditLog({ userId, action: 'DELETE', entityType: 'Student', entityId: id, oldData: existing, req });
  },

  bulkDelete: async (ids, userId, req) => {
    await studentRepository.bulkSoftDelete(ids, userId);
    await auditLog({ userId, action: 'DELETE', entityType: 'Student', entityId: ids.join(','), req });
  },

  bulkAssign: async (ids, assignedToId, userId, req) => {
    await studentRepository.bulkAssign(ids, assignedToId, userId);
    await auditLog({ userId, action: 'ASSIGN', entityType: 'Student', entityId: ids.join(','), newData: { assignedToId }, req });
  },
};
