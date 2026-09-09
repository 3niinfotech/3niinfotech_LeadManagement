import { AppError } from './response.util.js';
import { softDeleteWhere } from './response.util.js';
import { buildDataScopeWhere } from './scope.util.js';
import { COUNSELLOR_ROLE_SLUGS } from '../modules/assignment/assignment.config.js';
import { STUDENT_ROLE_SLUGS, AGENT_ROLE_SLUGS } from '../config/portal.config.js';
import { hasAnyPermission, hasPermission } from '../modules/rbac/rbac.util.js';
import {
  isPlatformGlobalUser,
  resolveBranchAccessPolicy,
  isBranchIdAllowedByPolicy,
} from './branch-access.policy.js';
import prisma from '../config/database.js';

export { isPlatformGlobalUser, resolveBranchAccessPolicy, isBranchIdAllowedByPolicy };

/** User may use the Active Branch switcher (requires both permissions). */
export function canSwitchViewingBranch(user) {
  const perms = user?.permissions || [];
  return hasPermission(perms, 'branch.switch') && hasPermission(perms, 'branch.view_multiple');
}

/**
 * Server-side viewing branch from user preferences (never trust client body alone).
 * Set in auth middleware after DB load; validated via assertBranchInTenant on write.
 */
export function getViewingBranchId(user) {
  if (user?.viewingBranchId) return user.viewingBranchId;
  const prefs = user?.preferences;
  if (prefs && typeof prefs === 'object' && prefs.activeViewingBranchId) {
    return prefs.activeViewingBranchId;
  }
  return null;
}

/** Narrow multi-branch users to a single active viewing branch when set. */
export function applyViewingBranchClamp(user, branchField = 'branchId') {
  const viewingId = getViewingBranchId(user);
  if (!viewingId || !canSwitchViewingBranch(user)) return null;

  const policy = resolveBranchAccessPolicy(user);
  if (!isBranchIdAllowedByPolicy(policy, viewingId)) return null;

  // COMPANY / ALL / LIST multi-branch roles — force selected branch wall
  if (policy.mode === 'COMPANY' || policy.mode === 'ALL' || policy.mode === 'LIST') {
    return { [branchField]: viewingId };
  }
  return null;
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
 * Optional list filter: never trust client branchId.
 * Returns validated branchId to AND into where, or undefined to skip.
 */
export async function resolveOptionalBranchFilter(user, requestedBranchId) {
  if (!requestedBranchId) return undefined;
  await assertBranchInTenant(requestedBranchId, user);
  return requestedBranchId;
}

/**
 * Write path: derive effective branch. Client branchId is only accepted if allowed.
 */
export async function resolveWriteBranchId(user, requestedBranchId) {
  if (requestedBranchId) {
    await assertBranchInTenant(requestedBranchId, user);
    return requestedBranchId;
  }
  if (user?.branchId) {
    await assertBranchInTenant(user.branchId, user);
    return user.branchId;
  }
  throw new AppError('Branch is required', 400);
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
 *
 * Counsellors and team leaders always see only their assigned records (OWN),
 * even if role dataScope is TEAM/BRANCH (TEAM currently falls back to branch).
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
  const tenantWall = tenantBranchWhere(companyId);
  const slug = user.role?.slug;
  const ownerField = options.ownerField || 'assignedToId';

  // Field assignees (counsellor + team leader) — only their assigned rows.
  if (slug === 'counsellor' || slug === 'team_leader') {
    const ownWhere = { [ownerField]: user.id };
    return { AND: [ownWhere, tenantWall] };
  }

  // Teachers see only students enrolled in batches/sessions they instruct.
  if (slug === 'teacher' && options.entity === 'student') {
    const teacherStudents = {
      batchEnrollments: {
        some: {
          isActive: true,
          batch: {
            deletedAt: null,
            OR: [
              { instructorId: user.id },
              { sessions: { some: { instructorId: user.id, deletedAt: null } } },
            ],
          },
        },
      },
    };
    return { AND: [teacherStudents, tenantWall] };
  }

  const scopeWhere = buildDataScopeWhere(user, { companyViaBranch: true, ...options });
  const policy = resolveBranchAccessPolicy(user);

  // Narrow BRANCH/OWN/TEAM users to allowed branch ids even when dataScope is BRANCH
  let branchClamp = policy.mode === 'LIST' && policy.branchIds?.length
    ? { branchId: { in: policy.branchIds } }
    : null;

  const viewingClamp = applyViewingBranchClamp(user, 'branchId');
  if (viewingClamp) branchClamp = viewingClamp;

  const parts = [scopeWhere, tenantWall, branchClamp].filter((p) => p && Object.keys(p).length);
  if (parts.length === 0) return tenantWall;
  if (parts.length === 1) return parts[0];
  return { AND: parts };
}

/** Scope for Application / Visa / Invoice via related Student */
export function mergeStudentRelationScope(user) {
  const studentScope = mergeScope(user, { entity: 'student', ownerField: 'assignedToId' });
  return { student: studentScope };
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

/**
 * Branch must be in tenant company AND in the user's allowed branch set.
 * Never trust client branchId beyond this check.
 */
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
    throw new AppError('Forbidden: branch is outside your company', 403);
  }

  const policy = resolveBranchAccessPolicy(user);
  if (!isBranchIdAllowedByPolicy(policy, branchId)) {
    throw new AppError('Forbidden: you are not authorized for this branch', 403);
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

  // Counsellor home branch must be allowed for the actor when assigning within a branch write
  if (target.branchId) {
    const policy = resolveBranchAccessPolicy(user);
    if (policy.mode === 'LIST' && !isBranchIdAllowedByPolicy(policy, target.branchId)) {
      throw new AppError('Forbidden: counsellor belongs to another branch', 403);
    }
  }

  return target;
}

/**
 * Load by id; if missing → 404; if out of scope → 403 with no record payload.
 */
async function assertEntityInScope(model, id, user, scopeOptions, notFoundLabel) {
  const bare = await prisma[model].findFirst({
    where: { id, ...softDeleteWhere },
    select: { id: true },
  });
  if (!bare) throw new AppError(`${notFoundLabel} not found`, 404);

  const scopeWhere = mergeScope(user, scopeOptions);
  const record = await prisma[model].findFirst({
    where: { id, ...softDeleteWhere, ...scopeWhere },
    include: {
      branch: { select: { id: true, name: true, code: true, companyId: true } },
    },
  });
  if (!record) {
    throw new AppError(`Forbidden: ${notFoundLabel.toLowerCase()} is outside your access`, 403);
  }
  return record;
}

export async function assertLeadInTenant(leadId, user) {
  return assertEntityInScope('lead', leadId, user, {}, 'Lead');
}

export async function assertEnquiryInTenant(enquiryId, user) {
  return assertEntityInScope('enquiry', enquiryId, user, { entity: 'enquiry' }, 'Enquiry');
}

export async function assertEnquiryIdsInTenant(ids, user) {
  if (!ids?.length) return;
  const scopeWhere = mergeScope(user, { entity: 'enquiry' });
  const count = await prisma.enquiry.count({
    where: { id: { in: ids }, ...softDeleteWhere, ...scopeWhere },
  });
  if (count !== ids.length) {
    throw new AppError('Forbidden: one or more enquiries are outside your access', 403);
  }
}

export async function assertStudentInTenant(studentId, user) {
  return assertEntityInScope('student', studentId, user, { entity: 'student' }, 'Student');
}

export async function assertStudentIdsInTenant(ids, user) {
  if (!ids?.length) return;
  const scopeWhere = mergeScope(user, { entity: 'student' });
  const count = await prisma.student.count({
    where: { id: { in: ids }, ...softDeleteWhere, ...scopeWhere },
  });
  if (count !== ids.length) {
    throw new AppError('Forbidden: one or more students are outside your access', 403);
  }
}

export async function assertLeadIdsInTenant(ids, user) {
  if (!ids?.length) return;
  const scopeWhere = mergeScope(user);
  const count = await prisma.lead.count({
    where: { id: { in: ids }, ...softDeleteWhere, ...scopeWhere },
  });
  if (count !== ids.length) {
    throw new AppError('Forbidden: one or more leads are outside your access', 403);
  }
}

export async function assertApplicationInTenant(applicationId, user) {
  const bare = await prisma.application.findFirst({
    where: { id: applicationId, ...softDeleteWhere },
    select: { id: true },
  });
  if (!bare) throw new AppError('Application not found', 404);

  const relScope = mergeStudentRelationScope(user);
  const record = await prisma.application.findFirst({
    where: { id: applicationId, ...softDeleteWhere, ...relScope },
    include: {
      student: {
        select: {
          id: true, studentCode: true, firstName: true, lastName: true, branchId: true,
          branch: { select: { id: true, name: true, code: true, companyId: true } },
        },
      },
    },
  });
  if (!record) {
    throw new AppError('Forbidden: application is outside your access', 403);
  }
  return record;
}

export async function assertVisaInTenant(visaId, user) {
  const bare = await prisma.visa.findFirst({
    where: { id: visaId, ...softDeleteWhere },
    select: { id: true },
  });
  if (!bare) throw new AppError('Visa case not found', 404);

  const relScope = mergeStudentRelationScope(user);
  const record = await prisma.visa.findFirst({
    where: { id: visaId, ...softDeleteWhere, ...relScope },
    include: {
      student: {
        select: {
          id: true, studentCode: true, firstName: true, lastName: true, branchId: true,
          branch: { select: { id: true, name: true, code: true, companyId: true } },
        },
      },
    },
  });
  if (!record) {
    throw new AppError('Forbidden: visa case is outside your access', 403);
  }
  return record;
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

export { hasPermission, hasAnyPermission };
