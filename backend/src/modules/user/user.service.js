import bcrypt from 'bcryptjs';
import fs from 'fs';
import { AppError, buildPagination, parsePagination } from '../../utils/response.util.js';
import { userRepository } from './user.repository.js';
import {
  assertBranchInTenant,
  requireTenantCompany,
  isPlatformGlobalUser,
} from '../../utils/tenant.util.js';
import prisma from '../../config/database.js';
import { auditLog } from '../../middleware/audit.middleware.js';
import {
  buildAvatarPath,
  deleteStoredAvatar,
  isSupportedImageFile,
} from '../../utils/avatar.util.js';

const formatUser = (user) => {
  if (!user) return null;
  const { _count, password, ...rest } = user;
  return {
    ...rest,
    workload: _count
      ? {
          enquiries: _count.assignedEnquiries,
          leads: _count.assignedLeads,
          students: _count.assignedStudents,
          total: _count.assignedEnquiries + _count.assignedLeads + _count.assignedStudents,
        }
      : undefined,
  };
};

async function assertRoleAssignable(roleId, requester) {
  const role = await prisma.role.findFirst({
    where: { id: roleId, deletedAt: null, isActive: true },
  });
  if (!role) throw new AppError('Role not found or inactive', 422);
  if (role.slug === 'super_admin' && requester.role?.slug !== 'super_admin') {
    throw new AppError('Only Super Admin can assign the Super Admin role', 403);
  }
  return role;
}

async function assertUserInCompany(id, requester) {
  const user = await userRepository.findById(id);
  if (!user) throw new AppError('User not found', 404);
  if (!isPlatformGlobalUser(requester) && requester.companyId && user.companyId !== requester.companyId) {
    throw new AppError('User not found in your company', 403);
  }
  return user;
}

export const userService = {
  getAll: async (query, requester) => {
    const { page, limit, skip } = parsePagination(query);
    const companyId = requester.role?.slug === 'super_admin' ? query.companyId : requester.companyId;

    const excludeRoleSlugs = query.staffOnly === 'false' || query.includePortal === 'true'
      ? undefined
      : ['student_portal', 'partner'];

    const { users, total } = await userRepository.findMany({
      skip,
      limit,
      search: query.search?.trim() || undefined,
      roleSlug: query.role || undefined,
      branchId: query.branchId || undefined,
      status: query.status || undefined,
      companyId: companyId || undefined,
      excludeRoleSlugs,
    });

    return {
      data: users.map(formatUser),
      pagination: buildPagination(page, limit, total),
    };
  },

  getById: async (id, requester) => {
    const user = await assertUserInCompany(id, requester);
    return formatUser(user);
  },

  getRoles: async (requester) => {
    const roles = await userRepository.findRoles();
    if (requester.role?.slug === 'super_admin') return roles;
    return roles.filter((r) => r.slug !== 'super_admin');
  },

  getTeamSummary: async (requester) => {
    const companyId = requester.role?.slug === 'super_admin' ? undefined : requester.companyId;
    return userRepository.getTeamSummary(companyId);
  },

  getCounsellors: async (query, requester) => {
    const companyId = requireTenantCompany(requester);
    // Only filter by branch when client asks — otherwise company-wide (register can pick any counsellor)
    const branchId = query.branchId?.trim() || undefined;

    if (branchId) {
      await assertBranchInTenant(branchId, requester);
    }

    return userRepository.listCounsellors({ branchId, companyId });
  },

  create: async (payload, requester, req) => {
    const companyId = requireTenantCompany(requester);
    if (!companyId && !isPlatformGlobalUser(requester)) {
      throw new AppError('Company context required to create users', 403);
    }

    await assertBranchInTenant(payload.branchId, requester);
    await assertRoleAssignable(payload.roleId, requester);

    const dup = await userRepository.findByEmail(payload.email.trim().toLowerCase());
    if (dup) throw new AppError('Email already in use', 409);

    const hashedPassword = await bcrypt.hash(payload.password, 12);
    const created = await userRepository.create({
      companyId: companyId || undefined,
      branchId: payload.branchId,
      roleId: payload.roleId,
      firstName: payload.firstName.trim(),
      lastName: payload.lastName?.trim() || '',
      email: payload.email.trim().toLowerCase(),
      phone: payload.phone?.trim() || null,
      employeeCode: payload.employeeCode?.trim() || null,
      department: payload.department?.trim() || null,
      password: hashedPassword,
      status: payload.status || 'ACTIVE',
      createdBy: requester.id,
      updatedBy: requester.id,
    });

    await auditLog({
      userId: requester.id,
      action: 'CREATE',
      entityType: 'user',
      entityId: created.id,
      newData: formatUser(created),
      req,
    });

    return formatUser(created);
  },

  update: async (id, payload, requester, req) => {
    const existing = await assertUserInCompany(id, requester);

    if (payload.branchId) await assertBranchInTenant(payload.branchId, requester);
    if (payload.roleId) await assertRoleAssignable(payload.roleId, requester);

    if (payload.email) {
      const email = payload.email.trim().toLowerCase();
      const dup = await userRepository.findByEmail(email, id);
      if (dup) throw new AppError('Email already in use', 409);
    }

    const data = { updatedBy: requester.id };
    if (payload.firstName) data.firstName = payload.firstName.trim();
    if (payload.lastName !== undefined) data.lastName = payload.lastName?.trim() || '';
    if (payload.email) data.email = payload.email.trim().toLowerCase();
    if (payload.phone !== undefined) data.phone = payload.phone?.trim() || null;
    if (payload.employeeCode !== undefined) data.employeeCode = payload.employeeCode?.trim() || null;
    if (payload.department !== undefined) data.department = payload.department?.trim() || null;
    if (payload.roleId) data.roleId = payload.roleId;
    if (payload.branchId) data.branchId = payload.branchId;
    if (payload.status) data.status = payload.status;
    if (payload.password?.trim()) {
      data.password = await bcrypt.hash(payload.password, 12);
    }

    const updated = await userRepository.update(id, data);

    await auditLog({
      userId: requester.id,
      action: 'UPDATE',
      entityType: 'user',
      entityId: id,
      oldData: formatUser(existing),
      newData: formatUser(updated),
      req,
    });

    return formatUser(updated);
  },

  updateStatus: async (id, status, requester, req) => {
    const existing = await assertUserInCompany(id, requester);
    if (existing.id === requester.id && status !== 'ACTIVE') {
      throw new AppError('You cannot deactivate your own account', 422);
    }

    const updated = await userRepository.update(id, {
      status,
      updatedBy: requester.id,
    });

    await auditLog({
      userId: requester.id,
      action: 'UPDATE',
      entityType: 'user',
      entityId: id,
      field: 'status',
      oldValue: existing.status,
      newValue: status,
      req,
    });

    return formatUser(updated);
  },

  delete: async (id, requester, req) => {
    const existing = await assertUserInCompany(id, requester);
    if (existing.id === requester.id) {
      throw new AppError('You cannot delete your own account', 422);
    }
    if (existing.role?.slug === 'super_admin' && requester.role?.slug !== 'super_admin') {
      throw new AppError('Only Super Admin can delete Super Admin users', 403);
    }

    await userRepository.softDelete(id, requester.id);

    await auditLog({
      userId: requester.id,
      action: 'DELETE',
      entityType: 'user',
      entityId: id,
      oldData: formatUser(existing),
      req,
    });

    return { id, deleted: true };
  },

  uploadAvatar: async (id, file, relativeDir, requester, req) => {
    if (!file || !relativeDir) throw new AppError('Profile photo is required', 400);
    if (!isSupportedImageFile(file.path)) {
      fs.unlinkSync(file.path);
      throw new AppError('The uploaded file is not a valid JPG, PNG, or WEBP image', 422);
    }
    const existing = await assertUserInCompany(id, requester);
    const avatar = buildAvatarPath(relativeDir, file.filename);
    const updated = await userRepository.update(id, { avatar, updatedBy: requester.id });
    if (existing.avatar && existing.avatar !== avatar) deleteStoredAvatar(existing.avatar);
    await auditLog({
      userId: requester.id,
      action: 'UPDATE',
      entityType: 'user',
      entityId: id,
      field: 'avatar',
      oldValue: existing.avatar,
      newValue: avatar,
      req,
    });
    return formatUser(updated);
  },

  removeAvatar: async (id, requester, req) => {
    const existing = await assertUserInCompany(id, requester);
    const updated = await userRepository.update(id, { avatar: null, updatedBy: requester.id });
    deleteStoredAvatar(existing.avatar);
    await auditLog({
      userId: requester.id,
      action: 'UPDATE',
      entityType: 'user',
      entityId: id,
      field: 'avatar',
      oldValue: existing.avatar,
      newValue: null,
      req,
    });
    return formatUser(updated);
  },
};
