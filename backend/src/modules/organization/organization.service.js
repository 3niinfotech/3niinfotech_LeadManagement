import { AppError } from '../../utils/response.util.js';
import { requireTenantCompany } from '../../utils/tenant.util.js';
import { auditLog } from '../../middleware/audit.middleware.js';
import { organizationRepository } from './organization.repository.js';
import prisma from '../../config/database.js';

function requireCompanyId(user) {
  const companyId = requireTenantCompany(user);
  if (!companyId) throw new AppError('Company context required', 403);
  return companyId;
}

async function assertCountryInTenant(countryId, companyId) {
  if (!countryId) return null;
  const country = await prisma.country.findFirst({
    where: { id: countryId, companyId, deletedAt: null },
  });
  if (!country) throw new AppError('Country not found in your company', 422);
  return country.id;
}

export const organizationService = {
  getCompany: async (user) => {
    const companyId = requireCompanyId(user);
    const company = await organizationRepository.findCompanyById(companyId);
    if (!company) throw new AppError('Company not found', 404);
    const branchCount = await organizationRepository.countBranches(companyId);
    return { ...company, branchCount };
  },

  updateCompany: async (payload, user, req) => {
    const companyId = requireCompanyId(user);
    const existing = await organizationRepository.findCompanyById(companyId);
    if (!existing) throw new AppError('Company not found', 404);

    const data = { ...payload };
    if (data.countryId !== undefined) {
      data.countryId = await assertCountryInTenant(data.countryId || null, companyId);
    }
    if (data.email === '') data.email = null;
    if (data.website === '') data.website = null;

    const updated = await organizationRepository.updateCompany(companyId, data);
    await auditLog({
      userId: user.id,
      action: 'UPDATE',
      entityType: 'company',
      entityId: companyId,
      oldData: existing,
      newData: updated,
      req,
    });
    return updated;
  },

  listBranches: async (query, user) => {
    const companyId = requireCompanyId(user);
    return organizationRepository.listBranches(companyId, query);
  },

  createBranch: async (payload, user, req) => {
    const companyId = requireCompanyId(user);
    const code = payload.code.trim().toUpperCase();
    const existing = await prisma.branch.findFirst({
      where: { companyId, code, deletedAt: null },
    });
    if (existing) throw new AppError('Branch code already exists', 409);

    const countryId = await assertCountryInTenant(payload.countryId || null, companyId);
    const created = await organizationRepository.createBranch({
      companyId,
      name: payload.name.trim(),
      code,
      email: payload.email || null,
      phone: payload.phone || null,
      addressLine1: payload.addressLine1 || null,
      addressLine2: payload.addressLine2 || null,
      city: payload.city || null,
      state: payload.state || null,
      postalCode: payload.postalCode || null,
      countryId,
      isActive: payload.isActive ?? true,
      createdBy: user.id,
      updatedBy: user.id,
    });

    await auditLog({
      userId: user.id,
      action: 'CREATE',
      entityType: 'branch',
      entityId: created.id,
      newData: created,
      req,
    });
    return created;
  },

  updateBranch: async (id, payload, user, req) => {
    const companyId = requireCompanyId(user);
    const existing = await organizationRepository.findBranchById(id, companyId);
    if (!existing) throw new AppError('Branch not found', 404);

    const data = { ...payload, updatedBy: user.id };
    if (data.code) data.code = data.code.trim().toUpperCase();
    if (data.name) data.name = data.name.trim();
    if (data.countryId !== undefined) {
      data.countryId = await assertCountryInTenant(data.countryId || null, companyId);
    }
    if (data.email === '') data.email = null;

    const updated = await organizationRepository.updateBranch(id, data);
    await auditLog({
      userId: user.id,
      action: 'UPDATE',
      entityType: 'branch',
      entityId: id,
      oldData: existing,
      newData: updated,
      req,
    });
    return updated;
  },

  updateBranchStatus: async (id, isActive, user, req) => {
    const companyId = requireCompanyId(user);
    const existing = await organizationRepository.findBranchById(id, companyId);
    if (!existing) throw new AppError('Branch not found', 404);

    const updated = await organizationRepository.updateBranch(id, {
      isActive,
      updatedBy: user.id,
    });
    await auditLog({
      userId: user.id,
      action: 'UPDATE',
      entityType: 'branch',
      entityId: id,
      field: 'isActive',
      oldValue: String(existing.isActive),
      newValue: String(isActive),
      req,
    });
    return updated;
  },
};
