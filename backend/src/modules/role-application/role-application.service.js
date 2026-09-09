import { z } from 'zod';
import bcrypt from 'bcryptjs';
import prisma from '../../config/database.js';
import { AppError, buildPagination, parsePagination } from '../../utils/response.util.js';
import { auditLog } from '../../middleware/audit.middleware.js';
import {
  assertBranchBelongsToCompany,
  resolveCompanyByCode,
  requireTenantCompany,
  isPlatformGlobalUser,
} from '../../utils/tenant.util.js';
import { authRepository } from '../auth/auth.repository.js';
import { userRepository } from '../user/user.repository.js';
import { roleApplicationRepository } from './role-application.repository.js';
import {
  PUBLIC_APPLY_ROLE_SLUGS,
  BLOCKED_APPLY_ROLE_SLUGS,
  ROLE_APPLY_LABELS,
} from '../../config/role-application.config.js';

export const submitApplicationSchema = z.object({
  companyCode: z.string().min(1, 'Company code is required'),
  branchId: z.string().uuid('Invalid branch'),
  roleSlug: z.string().min(1, 'Role is required'),
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  email: z.string().email('Invalid email address'),
  phone: z.string().max(20).optional().nullable(),
  qualification: z.string().max(200).optional().nullable(),
  experience: z.string().max(2000).optional().nullable(),
  message: z.string().max(2000).optional().nullable(),
});

export const reviewApplicationSchema = z.object({
  reviewNotes: z.string().max(2000).optional().nullable(),
});

export const approveApplicationSchema = z.object({
  password: z.string().min(8, 'Password must be at least 8 characters'),
  employeeCode: z.string().max(50).optional().nullable(),
  department: z.string().max(100).optional().nullable(),
  reviewNotes: z.string().max(2000).optional().nullable(),
});

function formatApplication(row) {
  if (!row) return null;
  return {
    ...row,
    roleLabel: ROLE_APPLY_LABELS[row.roleSlug] || row.roleSlug,
    fullName: `${row.firstName} ${row.lastName}`.trim(),
  };
}

async function assertApplicableRole(roleSlug) {
  if (BLOCKED_APPLY_ROLE_SLUGS.has(roleSlug)) {
    throw new AppError('This role cannot be applied for online', 422);
  }
  if (!PUBLIC_APPLY_ROLE_SLUGS.includes(roleSlug)) {
    throw new AppError('Invalid role for application', 422);
  }
  const role = await prisma.role.findFirst({
    where: { slug: roleSlug, deletedAt: null, isActive: true },
  });
  if (!role) throw new AppError('Role is not configured', 422);
  return role;
}

function tenantWhere(requester) {
  if (isPlatformGlobalUser(requester) && !requester.companyId) return {};
  const companyId = requireTenantCompany(requester);
  return { companyId };
}

export const roleApplicationService = {
  listOpenRoles: async () => {
    const roles = await prisma.role.findMany({
      where: {
        slug: { in: PUBLIC_APPLY_ROLE_SLUGS },
        deletedAt: null,
        isActive: true,
      },
      select: { slug: true, name: true, description: true },
      orderBy: { name: 'asc' },
    });
    return roles.map((r) => ({
      slug: r.slug,
      name: ROLE_APPLY_LABELS[r.slug] || r.name,
      description: r.description,
    }));
  },

  submit: async (data, req) => {
    await assertApplicableRole(data.roleSlug);

    const email = data.email.toLowerCase().trim();
    const existingUser = await authRepository.findByEmail(email);
    if (existingUser) throw new AppError('An account with this email already exists', 409);

    const company = await resolveCompanyByCode(data.companyCode);
    const branch = await assertBranchBelongsToCompany(data.branchId, company.id);

    const pending = await roleApplicationRepository.findPendingByEmail(email, company.id);
    if (pending) throw new AppError('You already have a pending application for this company', 409);

    const applicationCode = await roleApplicationRepository.generateCode(company.id);

    const created = await roleApplicationRepository.create({
      applicationCode,
      companyId: company.id,
      branchId: branch.id,
      roleSlug: data.roleSlug,
      firstName: data.firstName.trim(),
      lastName: data.lastName.trim(),
      email,
      phone: data.phone?.trim() || null,
      qualification: data.qualification?.trim() || null,
      experience: data.experience?.trim() || null,
      message: data.message?.trim() || null,
    });

    await auditLog({
      action: 'CREATE',
      entityType: 'RoleApplication',
      entityId: created.id,
      newData: { applicationCode, roleSlug: data.roleSlug, email },
      req,
    });

    return formatApplication(created);
  },

  list: async (query, requester) => {
    const { page, limit, skip } = parsePagination(query);
    const where = { ...tenantWhere(requester) };
    if (query.status) where.status = query.status;
    if (query.roleSlug) where.roleSlug = query.roleSlug;
    if (query.branchId) where.branchId = query.branchId;
    if (query.search?.trim()) {
      const s = query.search.trim();
      where.OR = [
        { firstName: { contains: s, mode: 'insensitive' } },
        { lastName: { contains: s, mode: 'insensitive' } },
        { email: { contains: s, mode: 'insensitive' } },
        { applicationCode: { contains: s, mode: 'insensitive' } },
        { phone: { contains: s, mode: 'insensitive' } },
      ];
    }

    const [rows, total] = await Promise.all([
      roleApplicationRepository.findMany({ skip, limit, where }),
      roleApplicationRepository.count(where),
    ]);

    return {
      data: rows.map(formatApplication),
      pagination: buildPagination(page, limit, total),
    };
  },

  getSummary: async (requester) => {
    const companyId = isPlatformGlobalUser(requester) && !requester.companyId
      ? undefined
      : requireTenantCompany(requester);
    const groups = await roleApplicationRepository.statusSummary(companyId);
    const summary = { pending: 0, approved: 0, rejected: 0, total: 0 };
    groups.forEach((g) => {
      const key = g.status.toLowerCase();
      summary[key] = g._count._all;
      summary.total += g._count._all;
    });
    return summary;
  },

  getById: async (id, requester) => {
    const row = await roleApplicationRepository.findById(id);
    if (!row) throw new AppError('Application not found', 404);
    const where = tenantWhere(requester);
    if (where.companyId && row.companyId !== where.companyId) {
      throw new AppError('Application not found', 404);
    }
    return formatApplication(row);
  },

  reject: async (id, payload, requester, req) => {
    const row = await roleApplicationService.getById(id, requester);
    if (row.status !== 'PENDING') throw new AppError('Only pending applications can be rejected', 422);

    const updated = await roleApplicationRepository.update(id, {
      status: 'REJECTED',
      reviewNotes: payload.reviewNotes?.trim() || null,
      reviewedById: requester.id,
      reviewedAt: new Date(),
    });

    await auditLog({
      userId: requester.id,
      action: 'UPDATE',
      entityType: 'RoleApplication',
      entityId: id,
      field: 'status',
      oldValue: 'PENDING',
      newValue: 'REJECTED',
      req,
    });

    return formatApplication(updated);
  },

  approve: async (id, payload, requester, req) => {
    const row = await roleApplicationService.getById(id, requester);
    if (row.status !== 'PENDING') throw new AppError('Only pending applications can be approved', 422);

    const role = await prisma.role.findFirst({
      where: { slug: row.roleSlug, deletedAt: null, isActive: true },
    });
    if (!role) throw new AppError('Role no longer available', 422);

    const dup = await userRepository.findByEmail(row.email);
    if (dup) throw new AppError('A user with this email already exists', 409);

    const hashed = await bcrypt.hash(payload.password, 12);

    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          companyId: row.companyId,
          branchId: row.branchId,
          roleId: role.id,
          firstName: row.firstName,
          lastName: row.lastName,
          email: row.email,
          phone: row.phone,
          employeeCode: payload.employeeCode?.trim() || null,
          department: payload.department?.trim() || null,
          password: hashed,
          status: 'ACTIVE',
          createdBy: requester.id,
          updatedBy: requester.id,
        },
        include: { role: true, branch: true, company: true },
      });

      const application = await tx.roleApplication.update({
        where: { id },
        data: {
          status: 'APPROVED',
          reviewNotes: payload.reviewNotes?.trim() || null,
          reviewedById: requester.id,
          reviewedAt: new Date(),
          approvedUserId: user.id,
        },
      });

      await tx.activity.create({
        data: {
          userId: user.id,
          action: 'ROLE_APPLICATION_APPROVED',
          description: `Staff account created from application ${row.applicationCode}`,
        },
      });

      return { user, application };
    });

    await auditLog({
      userId: requester.id,
      action: 'UPDATE',
      entityType: 'RoleApplication',
      entityId: id,
      newData: { status: 'APPROVED', approvedUserId: result.user.id },
      req,
    });

    return {
      application: formatApplication(result.application),
      user: {
        id: result.user.id,
        email: result.user.email,
        firstName: result.user.firstName,
        lastName: result.user.lastName,
        role: result.user.role?.name,
      },
    };
  },
};
