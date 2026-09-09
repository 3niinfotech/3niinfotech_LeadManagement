import { AppError } from '../../utils/response.util.js';
import { requireTenantCompany } from '../../utils/tenant.util.js';
import {
  assertBranchInTenant,
  canSwitchViewingBranch,
  getViewingBranchId,
  resolveBranchAccessPolicy,
  isBranchIdAllowedByPolicy,
} from '../../utils/tenant.util.js';
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
    if (data.logo === '') data.logo = null;
    if (data.settings && typeof data.settings === 'object') {
      const prev = existing.settings && typeof existing.settings === 'object' ? existing.settings : {};
      data.settings = { ...prev, ...data.settings };
    }

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
    const branchCount = await organizationRepository.countBranches(companyId);
    return { ...updated, branchCount };
  },

  uploadBranding: async (file, kind, user, req) => {
    const companyId = requireCompanyId(user);
    if (!file) throw new AppError('File required', 400);
    const brandingKind = kind === 'favicon' ? 'favicon' : 'logo';
    const existing = await organizationRepository.findCompanyById(companyId);
    if (!existing) throw new AppError('Company not found', 404);

    const publicPath = `/uploads/company/${companyId}/${file.filename}`;
    const data = brandingKind === 'logo'
      ? { logo: publicPath }
      : {
          settings: {
            ...(existing.settings && typeof existing.settings === 'object' ? existing.settings : {}),
            favicon: publicPath,
          },
        };

    const updated = await organizationRepository.updateCompany(companyId, data);
    await auditLog({
      userId: user.id,
      action: 'UPDATE',
      entityType: 'company',
      entityId: companyId,
      field: brandingKind,
      oldValue: brandingKind === 'logo' ? existing.logo : existing.settings?.favicon,
      newValue: publicPath,
      req,
    });
    const branchCount = await organizationRepository.countBranches(companyId);
    return { ...updated, branchCount };
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

  removeBranch: async (id, user, req) => {
    const companyId = requireCompanyId(user);
    const existing = await organizationRepository.findBranchById(id, companyId);
    if (!existing) throw new AppError('Branch not found', 404);

    const deps = await organizationRepository.countBranchDependencies(id, companyId);
    if (deps.length) {
      const parts = deps.map((d) => `${d.count} ${d.label}`);
      throw new AppError(
        `Branch cannot be deleted because it is referenced by ${parts.join(' and ')}. Deactivate instead.`,
        409,
        { dependencies: deps },
      );
    }

    await organizationRepository.softDeleteBranch(id, user.id);
    await auditLog({
      userId: user.id,
      action: 'DELETE',
      entityType: 'branch',
      entityId: id,
      oldData: existing,
      req,
    });
    return { id, deleted: true };
  },

  getViewingBranchContext: async (user) => {
    const companyId = requireCompanyId(user);
    const canSwitch = canSwitchViewingBranch(user);
    const policy = resolveBranchAccessPolicy(user);

    const allBranches = await prisma.branch.findMany({
      where: { companyId, deletedAt: null, isActive: true },
      select: { id: true, name: true, code: true, city: true },
      orderBy: { name: 'asc' },
    });

    const allowedBranches = policy.mode === 'LIST' && policy.branchIds?.length
      ? allBranches.filter((b) => policy.branchIds.includes(b.id))
      : allBranches;

    const viewingBranchId = getViewingBranchId(user);
    const validViewingId = viewingBranchId && isBranchIdAllowedByPolicy(policy, viewingBranchId)
      ? viewingBranchId
      : null;
    const viewingBranch = validViewingId
      ? allowedBranches.find((b) => b.id === validViewingId) || null
      : null;

    return {
      canSwitch,
      canViewAll: canSwitch && (policy.mode === 'COMPANY' || policy.mode === 'ALL'),
      viewingBranchId: viewingBranch?.id || null,
      viewingBranch,
      homeBranchId: user.branchId || null,
      branches: allowedBranches,
    };
  },

  setViewingBranch: async (branchId, user, req) => {
    if (!canSwitchViewingBranch(user)) {
      throw new AppError('Insufficient permissions to switch branch', 403);
    }

    const prefs = user.preferences && typeof user.preferences === 'object'
      ? { ...user.preferences }
      : {};

    if (!branchId || branchId === 'ALL') {
      delete prefs.activeViewingBranchId;
    } else {
      await assertBranchInTenant(branchId, user);
      prefs.activeViewingBranchId = branchId;
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { preferences: prefs },
    });

    await auditLog({
      userId: user.id,
      action: 'UPDATE',
      entityType: 'User',
      entityId: user.id,
      field: 'activeViewingBranchId',
      newValue: prefs.activeViewingBranchId || 'ALL',
      req,
    });

    return organizationService.getViewingBranchContext({
      ...user,
      preferences: prefs,
      viewingBranchId: prefs.activeViewingBranchId || null,
    });
  },
};
