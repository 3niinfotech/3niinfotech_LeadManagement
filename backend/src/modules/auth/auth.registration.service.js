import { z } from 'zod';
import prisma from '../../config/database.js';
import { AppError } from '../../utils/response.util.js';
import { hashPassword } from '../../utils/password.util.js';
import { auditLog } from '../../middleware/audit.middleware.js';
import {
  assertBranchBelongsToCompany,
  resolveCompanyByCode,
} from '../../utils/tenant.util.js';
import { authRepository } from './auth.repository.js';
import { studentRepository } from '../student/student.repository.js';

const passwordField = z.string().min(8, 'Password must be at least 8 characters');

async function findRoleBySlug(slug) {
  const role = await prisma.role.findFirst({
    where: { slug, deletedAt: null, isActive: true },
  });
  if (!role) throw new AppError(`Role "${slug}" is not configured`, 500);
  return role;
}

async function generatePartnerCode(companyId) {
  const company = await prisma.company.findUnique({
    where: { id: companyId },
    select: { code: true },
  });
  const coPrefix = (company?.code || 'CO').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6);
  const count = await prisma.partner.count({
    where: { deletedAt: null },
  });
  return `${coPrefix}-PTR${String(count + 1).padStart(6, '0')}`;
}

export const registerStudentSchema = z.object({
  companyCode: z.string().min(1, 'Company code is required'),
  branchId: z.string().uuid('Invalid branch'),
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  email: z.string().email('Invalid email address'),
  password: passwordField,
  phone: z.string().max(20).optional().nullable(),
});

export const registerAgentSchema = z.object({
  companyCode: z.string().min(1, 'Company code is required'),
  branchId: z.string().uuid('Invalid branch'),
  name: z.string().min(1).max(200),
  email: z.string().email('Invalid email address'),
  password: passwordField,
  phone: z.string().max(20).optional().nullable(),
  type: z.string().max(100).optional().nullable(),
});

export const registrationService = {
  listBranches: async (companyCode) => {
    const company = await resolveCompanyByCode(companyCode);
    const branches = await prisma.branch.findMany({
      where: { companyId: company.id, deletedAt: null, isActive: true },
      select: { id: true, name: true, code: true, city: true },
      orderBy: { name: 'asc' },
    });
    return { company: { id: company.id, code: company.code, name: company.name }, branches };
  },

  registerStudent: async (data, req) => {
    const existing = await authRepository.findByEmail(data.email);
    if (existing) throw new AppError('An account with this email already exists', 409);

    const company = await resolveCompanyByCode(data.companyCode);
    const branch = await assertBranchBelongsToCompany(data.branchId, company.id);
    const role = await findRoleBySlug('student_portal');
    const hashed = await hashPassword(data.password);
    const studentCode = await studentRepository.generateCode(company.id);

    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          companyId: company.id,
          branchId: branch.id,
          roleId: role.id,
          firstName: data.firstName,
          lastName: data.lastName,
          email: data.email.toLowerCase().trim(),
          password: hashed,
          phone: data.phone ?? null,
          status: 'ACTIVE',
        },
        include: { role: true, company: true, branch: true },
      });

      const student = await tx.student.create({
        data: {
          userId: user.id,
          branchId: branch.id,
          studentCode,
          firstName: data.firstName,
          lastName: data.lastName,
          email: data.email.toLowerCase().trim(),
          phone: data.phone ?? null,
          status: 'REGISTERED',
          createdBy: user.id,
        },
      });

      await tx.activity.create({
        data: {
          userId: user.id,
          studentId: student.id,
          action: 'REGISTER',
          description: `Student portal account registered (${studentCode})`,
        },
      });

      return { user, student };
    });

    await auditLog({
      userId: result.user.id,
      action: 'REGISTER',
      entityType: 'User',
      entityId: result.user.id,
      newData: { portal: 'student', studentId: result.student.id },
      req,
    });

    return result;
  },

  registerAgent: async (data, req) => {
    const existing = await authRepository.findByEmail(data.email);
    if (existing) throw new AppError('An account with this email already exists', 409);

    const company = await resolveCompanyByCode(data.companyCode);
    const branch = await assertBranchBelongsToCompany(data.branchId, company.id);
    const role = await findRoleBySlug('partner');
    const hashed = await hashPassword(data.password);
    const partnerCode = await generatePartnerCode(company.id);

    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          companyId: company.id,
          branchId: branch.id,
          roleId: role.id,
          firstName: data.name.split(' ')[0] || data.name,
          lastName: data.name.split(' ').slice(1).join(' ') || data.name,
          email: data.email.toLowerCase().trim(),
          password: hashed,
          phone: data.phone ?? null,
          status: 'ACTIVE',
        },
        include: { role: true, company: true, branch: true },
      });

      const partner = await tx.partner.create({
        data: {
          userId: user.id,
          name: data.name,
          code: partnerCode,
          type: data.type ?? null,
          email: data.email.toLowerCase().trim(),
          phone: data.phone ?? null,
          createdBy: user.id,
        },
      });

      await tx.activity.create({
        data: {
          userId: user.id,
          action: 'REGISTER',
          description: `Agent portal account registered (${partnerCode})`,
        },
      });

      return { user, partner };
    });

    await auditLog({
      userId: result.user.id,
      action: 'REGISTER',
      entityType: 'User',
      entityId: result.user.id,
      newData: { portal: 'agent', partnerId: result.partner.id },
      req,
    });

    return result;
  },
};
