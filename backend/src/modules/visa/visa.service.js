import { z } from 'zod';
import { AppError } from '../../utils/response.util.js';
import { parseSort } from '../../utils/response.util.js';
import { visaRepository, VISA_SORT_FIELDS } from './visa.repository.js';
import prisma from '../../config/database.js';
import { auditLog } from '../../middleware/audit.middleware.js';

const dateInput = z.string().optional().nullable();

export const createVisaSchema = z.object({
  studentId: z.string().min(1),
  country: z.string().min(1),
  visaType: z.string().optional().nullable(),
  status: z.enum(['NOT_STARTED', 'DOCUMENTS_COLLECTED', 'APPLICATION_SUBMITTED', 'BIOMETRICS_DONE', 'INTERVIEW_SCHEDULED', 'APPROVED', 'REJECTED', 'APPEAL']).optional(),
  applicationNo: z.string().optional().nullable(),
  submittedAt: dateInput,
  decisionAt: dateInput,
  expiryDate: dateInput,
});

export const updateVisaSchema = createVisaSchema.partial();

const parseDate = (value) => (value ? new Date(value) : null);

export const visaService = {
  getAll: async (query) => {
    const sort = parseSort(query, VISA_SORT_FIELDS);
    return visaRepository.findMany({ ...query, sort });
  },

  getById: async (id) => {
    const record = await visaRepository.findById(id);
    if (!record) throw new AppError('Visa case not found', 404);
    return record;
  },

  create: async (data, userId, req) => {
    const applicationNo = data.applicationNo || await visaRepository.generateCode();
    const record = await visaRepository.create({
      ...data,
      applicationNo,
      submittedAt: parseDate(data.submittedAt),
      decisionAt: parseDate(data.decisionAt),
      expiryDate: parseDate(data.expiryDate),
      createdBy: userId,
    });

    await prisma.activity.create({ data: { userId, action: 'CREATE', entityType: 'Visa', entityId: record.id, description: `Visa case ${applicationNo} created` } });
    await auditLog({ userId, action: 'CREATE', entityType: 'Visa', entityId: record.id, newData: record, req });
    return record;
  },

  update: async (id, data, userId, req) => {
    const existing = await visaRepository.findById(id);
    if (!existing) throw new AppError('Visa case not found', 404);

    const record = await visaRepository.update(id, {
      ...data,
      updatedBy: userId,
      submittedAt: data.submittedAt !== undefined ? parseDate(data.submittedAt) : undefined,
      decisionAt: data.decisionAt !== undefined ? parseDate(data.decisionAt) : undefined,
      expiryDate: data.expiryDate !== undefined ? parseDate(data.expiryDate) : undefined,
    });

    await prisma.activity.create({ data: { userId, action: 'UPDATE', entityType: 'Visa', entityId: id, description: 'Visa case updated' } });
    await auditLog({ userId, action: 'UPDATE', entityType: 'Visa', entityId: id, oldData: existing, newData: record, req });
    return record;
  },

  delete: async (id, userId, req) => {
    const existing = await visaRepository.findById(id);
    if (!existing) throw new AppError('Visa case not found', 404);
    await visaRepository.softDelete(id, userId);
    await auditLog({ userId, action: 'DELETE', entityType: 'Visa', entityId: id, oldData: existing, req });
  },
};
