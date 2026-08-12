import { AppError } from './response.util.js';
import { softDeleteWhere } from './response.util.js';
import { buildDataScopeWhere } from './scope.util.js';
import prisma from '../config/database.js';

/** Platform operator — no company on account (rare; full access) */
export function isPlatformGlobalUser(user) {
  return user?.dataScope === 'GLOBAL' && !user?.companyId;
}

/** Every tenant user MUST have companyId */
export function requireTenantCompany(user) {
  if (isPlatformGlobalUser(user)) return null;
  if (!user?.companyId) {
    throw new AppError(
      'Your account is not linked to a company. Contact your administrator.',
      403,
    );
  }
  return user.companyId;
}

/** Hard wall: records only via branch belonging to this company */
export function tenantBranchWhere(companyId) {
  if (!companyId) return {};
  return {
    branch: {
      companyId,
      deletedAt: null,
    },
  };
}

/**
 * Role scope (OWN / BRANCH / TEAM / COMPANY) + mandatory tenant wall.
 * VISA1 data can never appear in VISA2 queries.
 */
export function mergeScope(user, options = {}) {
  if (isPlatformGlobalUser(user)) {
    return buildDataScopeWhere(user, { companyViaBranch: true, ...options });
  }

  const companyId = requireTenantCompany(user);
  const scopeWhere = buildDataScopeWhere(user, { companyViaBranch: true, ...options });
  const tenantWall = tenantBranchWhere(companyId);

  const parts = [scopeWhere, tenantWall].filter((p) => p && Object.keys(p).length);
  if (parts.length === 0) return tenantWall;
  if (parts.length === 1) return parts[0];
  return { AND: parts };
}

export async function assertBranchInTenant(branchId, user) {
  if (!branchId) throw new AppError('Branch is required', 400);

  const companyId = requireTenantCompany(user);
  const where = {
    id: branchId,
    deletedAt: null,
    isActive: true,
    ...(companyId ? { companyId } : {}),
  };

  const branch = await prisma.branch.findFirst({ where });
  if (!branch) {
    throw new AppError('Branch not found or not in your company', 403);
  }
  return branch;
}

export async function assertUserInTenant(targetUserId, user) {
  if (!targetUserId) return null;

  const companyId = requireTenantCompany(user);
  const where = {
    id: targetUserId,
    deletedAt: null,
    status: 'ACTIVE',
    ...(companyId ? { companyId } : {}),
  };

  const target = await prisma.user.findFirst({ where });
  if (!target) {
    throw new AppError('User not found in your company', 403);
  }
  return target;
}

export async function assertLeadInTenant(leadId, user) {
  const scopeWhere = mergeScope(user);
  const lead = await prisma.lead.findFirst({
    where: { id: leadId, ...softDeleteWhere, ...scopeWhere },
    include: {
      branch: { select: { id: true, name: true, code: true, companyId: true } },
    },
  });
  if (!lead) throw new AppError('Lead not found', 404);
  return lead;
}

export async function assertEnquiryInTenant(enquiryId, user) {
  const scopeWhere = mergeScope(user);
  const enquiry = await prisma.enquiry.findFirst({
    where: { id: enquiryId, ...softDeleteWhere, ...scopeWhere },
    include: {
      branch: { select: { id: true, name: true, code: true, companyId: true } },
    },
  });
  if (!enquiry) throw new AppError('Enquiry not found', 404);
  return enquiry;
}

export async function assertEnquiryIdsInTenant(ids, user) {
  if (!ids?.length) return;
  const scopeWhere = mergeScope(user);
  const count = await prisma.enquiry.count({
    where: { id: { in: ids }, ...softDeleteWhere, ...scopeWhere },
  });
  if (count !== ids.length) {
    throw new AppError('One or more enquiries are not in your company', 403);
  }
}

export async function assertLeadIdsInTenant(ids, user) {
  if (!ids?.length) return;
  const scopeWhere = mergeScope(user);
  const count = await prisma.lead.count({
    where: { id: { in: ids }, ...softDeleteWhere, ...scopeWhere },
  });
  if (count !== ids.length) {
    throw new AppError('One or more records are not in your company', 403);
  }
}

/** Resolve company id for code generation */
export async function resolveCompanyIdForBranch(branchId, user) {
  const branch = await assertBranchInTenant(branchId, user);
  return branch.companyId;
}

export async function getCompanyBranchIds(companyId) {
  if (!companyId) return [];
  const branches = await prisma.branch.findMany({
    where: { companyId, deletedAt: null },
    select: { id: true },
  });
  return branches.map((b) => b.id);
}
