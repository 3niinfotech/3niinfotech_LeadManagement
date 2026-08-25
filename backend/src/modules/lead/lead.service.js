import { z } from 'zod';
import { AppError, parseSort } from '../../utils/response.util.js';
import { leadRepository, LEAD_SORT_FIELDS } from './lead.repository.js';
import { auditLog } from '../../middleware/audit.middleware.js';
import prisma from '../../config/database.js';
import {
  mergeScope,
  assertLeadInTenant,
  assertCounsellorInTenant,
  resolveWriteBranchId,
  resolveOptionalBranchFilter,
  resolveCompanyIdForBranch,
} from '../../utils/tenant.util.js';
import { walkinRepository } from '../walkin/walkin.repository.js';

export const createLeadSchema = z.object({
  branchId: z.string().uuid().optional().nullable(),
  assignedToId: z.string().uuid().optional().nullable(),
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  email: z.string().email().optional().nullable(),
  phone: z.string().optional().nullable(),
  country: z.string().optional().nullable(),
  source: z.string().optional().nullable(),
  status: z.enum(['WALK_IN', 'WAITING', 'IN_COUNSELLING', 'COMPLETED', 'CANCELLED', 'APPOINTMENT']).optional(),
  priority: z.string().optional(),
  followUpAt: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export const updateLeadSchema = createLeadSchema.partial();

export const leadService = {
  getAll: async (query, user) => {
    const sort = parseSort(query, LEAD_SORT_FIELDS);
    const scopeWhere = mergeScope(user);
    const branchId = await resolveOptionalBranchFilter(user, query.branchId);
    return leadRepository.findMany({
      ...query,
      branchId,
      scopeWhere,
      sort,
    });
  },

  getById: async (id, user) => assertLeadInTenant(id, user),

  create: async (data, user, req) => {
    const userId = user.id;
    const branchId = await resolveWriteBranchId(user, data.branchId);
    if (data.assignedToId) await assertCounsellorInTenant(data.assignedToId, user);
    if (!data.phone?.trim()) throw new AppError('Phone is required', 400);

    const companyId = await resolveCompanyIdForBranch(branchId, user);
    const leadCode = await walkinRepository.generateLeadCode(companyId);
    // Preserve required DB column; not a queue token (legacy field).
    const tokenNumber = `REF-${leadCode}`;

    const lead = await leadRepository.create({
      firstName: data.firstName,
      lastName: data.lastName || null,
      email: data.email || null,
      phone: data.phone.trim(),
      country: data.country || null,
      source: data.source || null,
      priority: data.priority || 'NORMAL',
      notes: data.notes || null,
      assignedToId: data.assignedToId || null,
      leadCode,
      tokenNumber,
      branchId,
      status: data.status || 'WALK_IN',
      createdBy: userId,
      followUpAt: data.followUpAt ? new Date(data.followUpAt) : null,
    });
    await prisma.activity.create({
      data: { userId, leadId: lead.id, action: 'CREATE', description: 'Lead created' },
    });
    await auditLog({
      userId,
      action: 'CREATE',
      entityType: 'Lead',
      entityId: lead.id,
      newData: { id: lead.id, leadCode, branchId, status: lead.status },
      req,
    });
    return lead;
  },

  update: async (id, data, user, req) => {
    const userId = user.id;
    const existing = await assertLeadInTenant(id, user);
    if (data.branchId) await resolveWriteBranchId(user, data.branchId);
    if (data.assignedToId) await assertCounsellorInTenant(data.assignedToId, user);

    const lead = await leadRepository.update(id, {
      ...data,
      updatedBy: userId,
      followUpAt: data.followUpAt ? new Date(data.followUpAt) : undefined,
    });
    await auditLog({
      userId,
      action: 'UPDATE',
      entityType: 'Lead',
      entityId: id,
      oldData: { id: existing.id, branchId: existing.branchId, status: existing.status },
      newData: { id: lead.id, branchId: lead.branchId, status: lead.status },
      req,
    });
    return lead;
  },

  delete: async (id, user, req) => {
    const userId = user.id;
    const existing = await assertLeadInTenant(id, user);
    await leadRepository.softDelete(id, userId);
    await auditLog({
      userId,
      action: 'DELETE',
      entityType: 'Lead',
      entityId: id,
      oldData: { id: existing.id },
      req,
    });
  },
};
