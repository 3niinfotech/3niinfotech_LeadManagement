import { z } from 'zod';
import { AppError, parseSort } from '../../utils/response.util.js';
import { leadRepository, LEAD_SORT_FIELDS } from './lead.repository.js';
import { auditLog } from '../../middleware/audit.middleware.js';
import prisma from '../../config/database.js';

export const createLeadSchema = z.object({
  branchId: z.string().uuid(),
  assignedToId: z.string().uuid().optional().nullable(),
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  email: z.string().email().optional().nullable(),
  phone: z.string().optional().nullable(),
  country: z.string().optional().nullable(),
  source: z.string().optional().nullable(),
  status: z.enum(['NEW', 'CONTACTED', 'QUALIFIED', 'PROPOSAL', 'NEGOTIATION', 'WON', 'LOST', 'WALK_IN', 'WAITING', 'IN_COUNSELLING', 'COMPLETED', 'CANCELLED', 'APPOINTMENT']).optional(),
  priority: z.string().optional(),
  followUpAt: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export const updateLeadSchema = createLeadSchema.partial();

export const leadService = {
  getAll: async (query) => {
    const sort = parseSort(query, LEAD_SORT_FIELDS);
    return leadRepository.findMany({ ...query, sort });
  },

  getById: async (id) => {
    const lead = await leadRepository.findById(id);
    if (!lead) throw new AppError('Lead not found', 404);
    return lead;
  },

  create: async (data, userId, req) => {
    const lead = await leadRepository.create({
      ...data,
      createdBy: userId,
      followUpAt: data.followUpAt ? new Date(data.followUpAt) : null,
    });
    await prisma.activity.create({ data: { userId, leadId: lead.id, action: 'CREATE', description: 'Lead created' } });
    await auditLog({ userId, action: 'CREATE', entityType: 'Lead', entityId: lead.id, newData: lead, req });
    return lead;
  },

  update: async (id, data, userId, req) => {
    const existing = await leadRepository.findById(id);
    if (!existing) throw new AppError('Lead not found', 404);
    const lead = await leadRepository.update(id, {
      ...data,
      updatedBy: userId,
      followUpAt: data.followUpAt ? new Date(data.followUpAt) : undefined,
    });
    await auditLog({ userId, action: 'UPDATE', entityType: 'Lead', entityId: id, oldData: existing, newData: lead, req });
    return lead;
  },

  delete: async (id, userId, req) => {
    const existing = await leadRepository.findById(id);
    if (!existing) throw new AppError('Lead not found', 404);
    await leadRepository.softDelete(id, userId);
    await auditLog({ userId, action: 'DELETE', entityType: 'Lead', entityId: id, oldData: existing, req });
  },
};
