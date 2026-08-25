import { AppError } from '../../utils/response.util.js';
import {
  requireTenantCompany,
  isPlatformGlobalUser,
  resolveBranchAccessPolicy,
  applyViewingBranchClamp,
  assertBranchInTenant,
} from '../../utils/tenant.util.js';
import { hasAnyPermission } from '../rbac/rbac.util.js';
import { STUDENT_ROLE_SLUGS } from '../../config/portal.config.js';
import prisma from '../../config/database.js';

function tenantBranchWhere(companyId) {
  return { branch: { companyId, deletedAt: null } };
}

function studentEnrollmentWhere(user, entity) {
  const enrollment = { enrollments: { some: { isActive: true, student: { userId: user.id } } } };
  if (entity === 'session') return { batch: enrollment };
  return enrollment;
}

/**
 * Branch/tenant scope for academic batches & class sessions.
 * Does NOT use counsellor assignedToId — class lists come from enrollments.
 * Teachers see only batches/sessions they instruct. Students see only their enrollments.
 */
export function academicBranchScope(user, entity = 'batch') {
  if (isPlatformGlobalUser(user)) {
    const viewingClamp = applyViewingBranchClamp(user, 'branchId');
    return viewingClamp || {};
  }

  const companyId = requireTenantCompany(user);
  const tenantWall = tenantBranchWhere(companyId);
  const policy = resolveBranchAccessPolicy(user);
  const viewingClamp = applyViewingBranchClamp(user, 'branchId');

  let branchClamp = viewingClamp;
  if (!branchClamp && policy.mode === 'LIST' && policy.branchIds?.length) {
    branchClamp = { branchId: { in: policy.branchIds } };
  } else if (!branchClamp && user.branchId && policy.mode !== 'COMPANY' && policy.mode !== 'GLOBAL') {
    branchClamp = { branchId: user.branchId };
  }

  const slug = user.role?.slug;
  if (slug === 'counsellor' && user.branchId) {
    branchClamp = { branchId: user.branchId };
  }

  const parts = [tenantWall, branchClamp].filter((p) => p && Object.keys(p).length);

  if (STUDENT_ROLE_SLUGS.includes(slug)) {
    parts.push(studentEnrollmentWhere(user, entity));
  } else if (slug === 'teacher') {
    parts.push({ instructorId: user.id });
  }

  if (parts.length === 1) return parts[0];
  return { AND: parts };
}

export function canMarkAttendance(user) {
  return hasAnyPermission(user?.permissions, ['attendance.mark', 'attendance.edit', 'attendance.correct']);
}

export function canCorrectAttendance(user) {
  return hasAnyPermission(user?.permissions, ['attendance.correct']);
}

export function canEditLockedAttendance(user) {
  return canCorrectAttendance(user);
}

export async function assertSessionBranch(session, user) {
  if (!session?.branchId) throw new AppError('Session branch missing', 400);
  await assertBranchInTenant(session.branchId, user);
  return session;
}

/** Direct ID access must match teacher/student ownership, not only branch. */
export async function assertAcademicRecordAccess(record, user, kind = 'batch') {
  if (!record?.branchId) throw new AppError('Record branch missing', 400);
  await assertBranchInTenant(record.branchId, user);
  const slug = user.role?.slug;
  if (slug === 'teacher' && record.instructorId !== user.id) {
    throw new AppError('Forbidden', 403);
  }
  if (STUDENT_ROLE_SLUGS.includes(slug)) {
    const batchId = kind === 'batch' ? record.id : record.batchId;
    const enrolled = await prisma.batchEnrollment.findFirst({
      where: { batchId, isActive: true, student: { userId: user.id } },
    });
    if (!enrolled) throw new AppError('Forbidden', 403);
  }
  return record;
}
