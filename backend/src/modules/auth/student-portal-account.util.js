import prisma from '../../config/database.js';
import { AppError } from '../../utils/response.util.js';
import { hashPassword } from '../../utils/password.util.js';

/** Default student password for QA / first login / forgot-reset. */
export function getStudentDefaultPassword() {
  const raw = process.env.STUDENT_DEFAULT_PASSWORD;
  const value = String(raw ?? '123').trim();
  return value || '123';
}
export async function ensureStudentPortalUser(student, {
  plainPassword,
  tx = prisma,
} = {}) {
  if (!student?.id) throw new AppError('Student record required', 400);
  const email = String(student.email || '').trim().toLowerCase();
  if (!email) throw new AppError('Student email is required for portal login', 400);
  if (!plainPassword) throw new AppError('Password is required', 400);

  if (student.userId) {
    const existing = await tx.user.findFirst({
      where: { id: student.userId, deletedAt: null },
      include: { role: true, company: true, branch: true },
    });
    if (existing) return existing;
  }

  const byEmail = await tx.user.findFirst({
    where: { email, deletedAt: null },
    include: { role: true, company: true, branch: true },
  });
  if (byEmail) {
    if (!student.userId) {
      await tx.student.update({
        where: { id: student.id },
        data: { userId: byEmail.id },
      });
    }
    return byEmail;
  }

  const role = await tx.role.findFirst({
    where: { slug: 'student_portal', deletedAt: null, isActive: true },
  });
  if (!role) throw new AppError('Student portal role is not configured', 500);

  const branch = await tx.branch.findFirst({
    where: { id: student.branchId, deletedAt: null },
    select: { id: true, companyId: true },
  });
  if (!branch?.companyId) throw new AppError('Student branch/company missing', 400);

  const password = await hashPassword(plainPassword);
  const user = await tx.user.create({
    data: {
      email,
      password,
      passwordChangedAt: new Date(),
      firstName: student.firstName || 'Student',
      lastName: student.lastName || student.firstName || 'Portal',
      phone: student.phone || null,
      roleId: role.id,
      branchId: branch.id,
      companyId: branch.companyId,
      status: 'ACTIVE',
    },
    include: { role: true, company: true, branch: true },
  });

  await tx.student.update({
    where: { id: student.id },
    data: { userId: user.id },
  });

  return user;
}

export async function findStudentByEmail(email, tx = prisma) {
  const normalized = String(email || '').trim().toLowerCase();
  if (!normalized) return null;
  const exact = await tx.student.findFirst({
    where: { email: normalized, deletedAt: null },
  });
  if (exact) return exact;
  // SQLite has no mode:insensitive — fallback for mixed-case stored emails
  const rows = await tx.student.findMany({
    where: { deletedAt: null, email: { not: null } },
    take: 5000,
  });
  return rows.find((s) => String(s.email || '').trim().toLowerCase() === normalized) || null;
}
