import { AppError } from './response.util.js';
import { softDeleteWhere } from './response.util.js';
import { buildDataScopeWhere } from './scope.util.js';
import { COUNSELLOR_ROLE_SLUGS } from '../modules/assignment/assignment.config.js';
import { STUDENT_ROLE_SLUGS, AGENT_ROLE_SLUGS } from '../config/portal.config.js';
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

/** Portal-specific ownership (student / partner) — never trust client branchId */
function portalScopeWhere(user, entity) {
  const slug = user.role?.slug;
  if (STUDENT_ROLE_SLUGS.includes(slug)) {
    if (entity === 'enquiry') return { student: { userId: user.id } };
    return { userId: user.id };
  }
  if (AGENT_ROLE_SLUGS.includes(slug)) {
    if (entity === 'enquiry') {
      return {
        OR: [
          { createdBy: user.id },
          { student: { partner: { userId: user.id } } },
        ],
      };
    }
    return { partner: { userId: user.id } };
  }
  return null;
}

/**
 * Role scope (OWN / BRANCH / TEAM / COMPANY) + mandatory tenant wall.
 * VISA1 data can never appear in VISA2 queries.
 */
export function mergeScope(user, options = {}) {
  const portalWhere = portalScopeWhere(user, options.entity);
  if (portalWhere) {
    if (isPlatformGlobalUser(user)) {
      return portalWhere;
    }
    const companyId = requireTenantCompany(user);
    return { AND: [portalWhere, tenantBranchWhere(companyId)] };
  }

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

export async function resolveCompanyByCode(companyCode) {
  const code = String(companyCode || '').trim().toUpperCase();
  if (!code) throw new AppError('Company code is required', 400);

  const company = await prisma.company.findFirst({
    where: { code, deletedAt: null },
  });
  if (!company) throw new AppError('Company not found', 404);
  return company;
}

/** Public registration — branch must belong to company (no authenticated user) */
export async function assertBranchBelongsToCompany(branchId, companyId) {
  if (!branchId) throw new AppError('Branch is required', 400);
  if (!companyId) throw new AppError('Company is required', 400);

  const branch = await prisma.branch.findFirst({
    where: {
      id: branchId,
      companyId,
      deletedAt: null,
      isActive: true,
    },
  });
  if (!branch) {
    throw new AppError('Branch not found for this company', 400);
  }
  return branch;
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

/** Assignee must be an active counsellor-eligible user in the same tenant */
export async function assertCounsellorInTenant(targetUserId, user) {
  if (!targetUserId) return null;

  const companyId = requireTenantCompany(user);
  const where = {
    id: targetUserId,
    deletedAt: null,
    status: 'ACTIVE',
    ...(companyId ? { companyId } : {}),
    role: { slug: { in: COUNSELLOR_ROLE_SLUGS } },
  };

  const target = await prisma.user.findFirst({
    where,
    include: { role: { select: { slug: true, name: true } } },
  });
  if (!target) {
    throw new AppError('Counsellor not found or not eligible in your company', 403);
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
  const scopeWhere = mergeScope(user, { entity: 'enquiry' });
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
  const scopeWhere = mergeScope(user, { entity: 'enquiry' });
  const count = await prisma.enquiry.count({
    where: { id: { in: ids }, ...softDeleteWhere, ...scopeWhere },
  });
  if (count !== ids.length) {
    throw new AppError('One or more enquiries are not in your company', 403);
  }
}

export async function assertStudentInTenant(studentId, user) {
  const scopeWhere = mergeScope(user, { entity: 'student' });
  const student = await prisma.student.findFirst({
    where: { id: studentId, ...softDeleteWhere, ...scopeWhere },
    include: {
      branch: { select: { id: true, name: true, code: true, companyId: true } },
    },
  });
  if (!student) throw new AppError('Student not found', 404);
  return student;
}

export async function assertStudentIdsInTenant(ids, user) {
  if (!ids?.length) return;
  const scopeWhere = mergeScope(user, { entity: 'student' });
  const count = await prisma.student.count({
    where: { id: { in: ids }, ...softDeleteWhere, ...scopeWhere },
  });
  if (count !== ids.length) {
    throw new AppError('One or more students are not in your scope', 403);
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
