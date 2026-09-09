import { AppError } from '../../utils/response.util.js';
import { STUDENT_ROLE_SLUGS } from '../../config/portal.config.js';
import prisma from '../../config/database.js';
import { academicBranchScope, assertAcademicRecordAccess } from '../attendance/attendance.scope.js';
import { requireTenantCompany, isPlatformGlobalUser } from '../../utils/tenant.util.js';

export { academicBranchScope, assertAcademicRecordAccess };

export async function resolvePortalStudent(user) {
  if (!STUDENT_ROLE_SLUGS.includes(user?.role?.slug)) return null;
  const student = await prisma.student.findFirst({
    where: { userId: user.id, deletedAt: null },
  });
  if (!student) throw new AppError('Student profile not linked to this account', 404);
  return student;
}

export async function assertBatchForClassroom(batchId, user) {
  const batch = await prisma.academicBatch.findFirst({
    where: { id: batchId, deletedAt: null },
  });
  if (!batch) throw new AppError('Batch not found', 404);
  await assertAcademicRecordAccess(batch, user, 'batch');
  return batch;
}

export async function assertStudentInTeacherBatches(studentId, user) {
  if (user.role?.slug !== 'teacher') return true;
  const link = await prisma.batchEnrollment.findFirst({
    where: {
      studentId,
      isActive: true,
      batch: { instructorId: user.id, deletedAt: null },
    },
  });
  if (!link) throw new AppError('Forbidden', 403);
  return true;
}

/** Scope ClassAssignment / ClassTest / StudyMaterial lists (batch-owned). */
export function classroomItemScope(user) {
  const batchScope = academicBranchScope(user, 'batch');
  return { batch: batchScope, deletedAt: null };
}

export function companyIdOf(user) {
  if (isPlatformGlobalUser(user)) return user.companyId || null;
  return requireTenantCompany(user);
}
