import { z } from 'zod';
import { AppError } from '../../utils/response.util.js';
import { parseSort } from '../../utils/response.util.js';
import { applicationRepository, APPLICATION_SORT_FIELDS } from './application.repository.js';
import prisma from '../../config/database.js';
import { auditLog } from '../../middleware/audit.middleware.js';

const dateInput = z.string().optional().nullable();

export const createApplicationSchema = z.object({
  studentId: z.string().min(1),
  university: z.string().min(1),
  course: z.string().min(1),
  intake: z.string().optional().nullable(),
  country: z.string().optional().nullable(),
  status: z.enum(['DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'CONDITIONAL_OFFER', 'UNCONDITIONAL_OFFER', 'REJECTED', 'WITHDRAWN']).optional(),
  applicationNo: z.string().optional().nullable(),
  submittedAt: dateInput,
  offerDate: dateInput,
});

export const updateApplicationSchema = createApplicationSchema.partial();

const parseDate = (value) => (value ? new Date(value) : null);

export const applicationService = {
  getAll: async (query) => {
    const sort = parseSort(query, APPLICATION_SORT_FIELDS);
    return applicationRepository.findMany({ ...query, sort });
  },

  getById: async (id) => {
    const record = await applicationRepository.findById(id);
    if (!record) throw new AppError('Application not found', 404);
    return record;
  },

  create: async (data, userId, req) => {
    const applicationNo = data.applicationNo || await applicationRepository.generateCode();
    const record = await applicationRepository.create({
      ...data,
      applicationNo,
      submittedAt: parseDate(data.submittedAt),
      offerDate: parseDate(data.offerDate),
      createdBy: userId,
    });

    await prisma.activity.create({ data: { userId, action: 'CREATE', entityType: 'Application', entityId: record.id, description: `Application ${applicationNo} created` } });
    await auditLog({ userId, action: 'CREATE', entityType: 'Application', entityId: record.id, newData: record, req });
    return record;
  },

  update: async (id, data, userId, req) => {
    const existing = await applicationRepository.findById(id);
    if (!existing) throw new AppError('Application not found', 404);

    const record = await applicationRepository.update(id, {
      ...data,
      updatedBy: userId,
      submittedAt: data.submittedAt !== undefined ? parseDate(data.submittedAt) : undefined,
      offerDate: data.offerDate !== undefined ? parseDate(data.offerDate) : undefined,
    });

    await prisma.activity.create({ data: { userId, action: 'UPDATE', entityType: 'Application', entityId: id, description: 'Application updated' } });
    await auditLog({ userId, action: 'UPDATE', entityType: 'Application', entityId: id, oldData: existing, newData: record, req });
    return record;
  },

  delete: async (id, userId, req) => {
    const existing = await applicationRepository.findById(id);
    if (!existing) throw new AppError('Application not found', 404);
    await applicationRepository.softDelete(id, userId);
    await auditLog({ userId, action: 'DELETE', entityType: 'Application', entityId: id, oldData: existing, req });
  },
};
