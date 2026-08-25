import { z } from 'zod';
import { AppError } from '../../utils/response.util.js';
import { AGENT_ROLE_SLUGS } from '../../config/portal.config.js';
import { partnerRepository } from './partner.repository.js';
import { auditLog } from '../../middleware/audit.middleware.js';

function requireCompany(user) {
  const companyId = user?.companyId;
  if (!companyId) throw new AppError('Company context required', 403);
  return companyId;
}

export const createPartnerSchema = z.object({
  name: z.string().min(1).max(200),
  type: z.string().max(50).optional().nullable(),
  email: z.string().email().optional().nullable().or(z.literal('')),
  phone: z.string().max(30).optional().nullable(),
  country: z.string().max(100).optional().nullable(),
  website: z.string().max(255).optional().nullable(),
  commission: z.coerce.number().min(0).max(100).optional().nullable(),
  agreementDate: z.string().optional().nullable(),
  agreementEmail: z.string().email().optional().nullable().or(z.literal('')),
  contactPerson: z.string().max(200).optional().nullable(),
  nationality: z.string().max(100).optional().nullable(),
  currencyCode: z.string().max(10).optional().nullable(),
  approvalDate: z.string().optional().nullable(),
  branchId: z.string().uuid().optional().nullable().or(z.literal('')),
  assignedToId: z.string().uuid().optional().nullable().or(z.literal('')),
  commissionRules: z.array(z.object({
    country: z.string().max(100).optional().nullable(),
    course: z.string().max(200).optional().nullable(),
    type: z.string().max(20).optional().nullable(),
    value: z.coerce.number().optional().nullable(),
    currency: z.string().max(10).optional().nullable(),
    effectiveFrom: z.string().optional().nullable(),
    isActive: z.boolean().optional(),
  })).optional(),
  isActive: z.boolean().optional(),
});

export const updatePartnerSchema = createPartnerSchema.partial();

function mergeMetadata(existing = {}, patch = {}) {
  const base = typeof existing === 'object' && existing !== null ? existing : {};
  return { ...base, ...patch };
}

function isAgentUser(user) {
  return AGENT_ROLE_SLUGS.includes(user?.role?.slug);
}

function assertAgentOwns(record, user) {
  if (isAgentUser(user) && record.userId !== user.id) {
    throw new AppError('Forbidden', 403);
  }
  return record;
}

export const partnerService = {
  getAll: async (query, user) => {
    const companyId = requireCompany(user);
    if (isAgentUser(user)) {
      return partnerRepository.findMany({ ...query, companyId, userId: user.id });
    }
    return partnerRepository.findMany({ ...query, companyId });
  },

  getById: async (id, user) => {
    const companyId = requireCompany(user);
    const record = await partnerRepository.findById(id, companyId);
    if (!record) throw new AppError('Partner not found', 404);
    return assertAgentOwns(record, user);
  },

  create: async (data, user, req) => {
    if (isAgentUser(user)) throw new AppError('Forbidden', 403);
    const companyId = requireCompany(user);
    const code = await partnerRepository.generateCode(companyId);
    const { agreementDate, agreementEmail, contactPerson, nationality, currencyCode, approvalDate, branchId, assignedToId, commissionRules, ...rest } = data;
    const record = await partnerRepository.create({
      ...rest,
      email: rest.email || null,
      code,
      type: rest.type || 'PARTNER',
      metadata: {
        companyId,
        agreementDate: agreementDate || null,
        agreementEmail: agreementEmail || null,
        contactPerson: contactPerson || null,
        nationality: nationality || null,
        currencyCode: currencyCode || null,
        approvalDate: approvalDate || null,
        branchId: branchId || null,
        assignedToId: assignedToId || null,
        commissionRules: commissionRules || [],
      },
      createdBy: user.id,
    });
    await auditLog({ userId: user.id, action: 'CREATE', entityType: 'Partner', entityId: record.id, newData: record, req });
    return record;
  },

  update: async (id, data, user, req) => {
    const companyId = requireCompany(user);
    const existing = await partnerRepository.findById(id, companyId);
    if (!existing) throw new AppError('Partner not found', 404);
    assertAgentOwns(existing, user);
    const { agreementDate, agreementEmail, contactPerson, nationality, currencyCode, approvalDate, branchId, assignedToId, commissionRules, ...rest } = data;
    const metadata = mergeMetadata(existing.metadata, {
      companyId,
      ...(agreementDate !== undefined ? { agreementDate } : {}),
      ...(agreementEmail !== undefined ? { agreementEmail } : {}),
      ...(contactPerson !== undefined ? { contactPerson } : {}),
      ...(nationality !== undefined ? { nationality } : {}),
      ...(currencyCode !== undefined ? { currencyCode } : {}),
      ...(approvalDate !== undefined ? { approvalDate } : {}),
      ...(branchId !== undefined ? { branchId } : {}),
      ...(assignedToId !== undefined ? { assignedToId } : {}),
      ...(commissionRules !== undefined ? { commissionRules } : {}),
    });
    const record = await partnerRepository.update(id, {
      ...rest,
      email: rest.email === '' ? null : rest.email,
      metadata,
      updatedBy: user.id,
    });
    await auditLog({ userId: user.id, action: 'UPDATE', entityType: 'Partner', entityId: id, oldData: existing, newData: record, req });
    return record;
  },

  updateStatus: async (id, isActive, user, req) => {
    const companyId = requireCompany(user);
    const existing = await partnerRepository.findById(id, companyId);
    if (!existing) throw new AppError('Partner not found', 404);
    assertAgentOwns(existing, user);
    const record = await partnerRepository.update(id, { isActive, updatedBy: user.id });
    await auditLog({ userId: user.id, action: 'UPDATE', entityType: 'Partner', entityId: id, oldData: existing, newData: record, req });
    return record;
  },
};
