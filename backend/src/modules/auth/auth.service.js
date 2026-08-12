import { z } from 'zod';
import { AppError } from '../../utils/response.util.js';
import { comparePassword } from '../../utils/password.util.js';
import { generateAccessToken, generateRefreshToken } from '../../utils/jwt.util.js';
import { authRepository } from './auth.repository.js';
import config from '../../config/index.js';
import { auditLog } from '../../middleware/audit.middleware.js';
import prisma from '../../config/database.js';
import { attachAccessToUser } from '../rbac/rbac.resolve.js';

const userInclude = { role: true, company: true, branch: true };

const sanitizeUser = (user) => {
  const { _count, password, ...rest } = user;
  const permissions = user.permissions || user.role?.permissions || [];
  const dataScope = user.dataScope || user.role?.dataScope || 'OWN';
  const base = {
    id: rest.id,
    email: rest.email,
    firstName: rest.firstName,
    lastName: rest.lastName,
    phone: rest.phone,
    avatar: rest.avatar,
    status: rest.status,
    preferences: rest.preferences,
    lastLoginAt: rest.lastLoginAt,
    createdAt: rest.createdAt,
    dataScope,
    permissions,
    role: {
      id: user.role.id,
      name: user.role.name,
      slug: user.role.slug,
      dataScope,
      permissions,
    },
    company: user.company ? { id: user.company.id, name: user.company.name, code: user.company.code } : null,
    branch: user.branch ? { id: user.branch.id, name: user.branch.name, code: user.branch.code } : null,
    branchId: user.branchId || user.branch?.id || null,
    companyId: user.companyId || user.company?.id || null,
  };

  if (_count) {
    base.workload = {
      enquiries: _count.assignedEnquiries,
      leads: _count.assignedLeads,
      students: _count.assignedStudents,
      total: _count.assignedEnquiries + _count.assignedLeads + _count.assignedStudents,
    };
  }

  return base;
};

export const authService = {
  login: async (email, password, req) => {
    const user = await authRepository.findByEmail(email);
    if (!user) throw new AppError('Invalid email or password', 401);

    const isValid = await comparePassword(password, user.password);
    if (!isValid) throw new AppError('Invalid email or password', 401);

    if (user.status !== 'ACTIVE') throw new AppError('Account is not active', 403);

    const payload = { userId: user.id, email: user.email, role: user.role.slug };
    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await authRepository.createRefreshToken({ userId: user.id, token: refreshToken, expiresAt });
    await authRepository.updateLastLogin(user.id);

    await auditLog({ userId: user.id, action: 'LOGIN', entityType: 'User', entityId: user.id, req });

    const userWithAccess = await attachAccessToUser(user);
    return { user: sanitizeUser(userWithAccess), accessToken, refreshToken };
  },

  refresh: async (token) => {
    const stored = await authRepository.findRefreshToken(token);
    if (!stored) throw new AppError('Invalid refresh token', 401);

    const user = stored.user;
    const payload = { userId: user.id, email: user.email, role: user.role.slug };
    const accessToken = generateAccessToken(payload);

    const userWithAccess = await attachAccessToUser(user);
    return { accessToken, user: sanitizeUser(userWithAccess) };
  },

  logout: async (userId, refreshToken, req) => {
    if (refreshToken) await authRepository.revokeRefreshToken(refreshToken);
    await auditLog({ userId, action: 'LOGOUT', entityType: 'User', entityId: userId, req });
  },

  getProfile: async (userId) => {
    const user = await authRepository.findById(userId);
    if (!user) throw new AppError('User not found', 404);
    const userWithAccess = await attachAccessToUser(user);
    return sanitizeUser(userWithAccess);
  },

  updatePreferences: async (userId, preferences) => {
    const user = await prisma.user.update({
      where: { id: userId },
      data: { preferences },
      include: userInclude,
    });
    return sanitizeUser(user);
  },

  updateProfile: async (userId, data, req) => {
    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone ?? null,
      },
      include: userInclude,
    });

    await auditLog({
      userId,
      action: 'UPDATE',
      entityType: 'User',
      entityId: userId,
      newData: { firstName: data.firstName, lastName: data.lastName, phone: data.phone },
      req,
    });

    return sanitizeUser(user);
  },
};

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const refreshSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});

export const updateProfileSchema = z.object({
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  phone: z.string().max(20).optional().nullable(),
});
