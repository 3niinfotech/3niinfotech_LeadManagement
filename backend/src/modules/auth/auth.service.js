import { z } from 'zod';
import { AppError } from '../../utils/response.util.js';
import { comparePassword } from '../../utils/password.util.js';
import { generateAccessToken, generateRefreshToken } from '../../utils/jwt.util.js';
import { authRepository } from './auth.repository.js';
import { auditLog } from '../../middleware/audit.middleware.js';
import prisma from '../../config/database.js';
import { attachAccessToUser } from '../rbac/rbac.resolve.js';
import {
  PORTALS,
  resolvePortalFromRole,
  assertRoleMatchesPortal,
  getDefaultRoute,
} from '../../config/portal.config.js';

const userInclude = { role: true, company: true, branch: true };

const sanitizeUser = (user, portal) => {
  const { _count, password, ...rest } = user;
  const permissions = user.permissions || user.role?.permissions || [];
  const dataScope = user.dataScope || user.role?.dataScope || 'OWN';
  const resolvedPortal = portal || resolvePortalFromRole(user.role.slug);

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
    portal: resolvedPortal,
    defaultRoute: getDefaultRoute(resolvedPortal, user),
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
  login: async (email, password, portal, req) => {
    const user = await authRepository.findByEmail(email);
    if (!user) {
      await auditLog({
        action: 'LOGIN_FAILED',
        entityType: 'User',
        entityId: email,
        newData: { reason: 'unknown_email', portal },
        req,
      });
      throw new AppError('Invalid email or password', 401);
    }

    const isValid = await comparePassword(password, user.password);
    if (!isValid) {
      await auditLog({
        userId: user.id,
        action: 'LOGIN_FAILED',
        entityType: 'User',
        entityId: user.id,
        newData: { reason: 'invalid_password', portal },
        req,
      });
      throw new AppError('Invalid email or password', 401);
    }

    if (user.status !== 'ACTIVE') throw new AppError('Account is not active', 403);

    const resolvedPortal = portal || resolvePortalFromRole(user.role.slug);
    try {
      assertRoleMatchesPortal(user.role.slug, resolvedPortal);
    } catch (err) {
      throw new AppError(err.message, err.statusCode || 403);
    }

    const payload = {
      userId: user.id,
      email: user.email,
      role: user.role.slug,
      portal: resolvedPortal,
    };
    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await authRepository.createRefreshToken({ userId: user.id, token: refreshToken, expiresAt });
    await authRepository.updateLastLogin(user.id);

    await auditLog({
      userId: user.id,
      action: 'LOGIN',
      entityType: 'User',
      entityId: user.id,
      newData: { portal: resolvedPortal },
      req,
    });

    const userWithAccess = await attachAccessToUser(user);
    return {
      user: sanitizeUser(userWithAccess, resolvedPortal),
      accessToken,
      refreshToken,
      portal: resolvedPortal,
      defaultRoute: getDefaultRoute(resolvedPortal, userWithAccess),
    };
  },

  refresh: async (token) => {
    const stored = await authRepository.findRefreshToken(token);
    if (!stored) throw new AppError('Invalid refresh token', 401);

    const user = stored.user;
    const portal = resolvePortalFromRole(user.role.slug);
    const payload = { userId: user.id, email: user.email, role: user.role.slug, portal };
    const accessToken = generateAccessToken(payload);

    const userWithAccess = await attachAccessToUser(user);
    return {
      accessToken,
      user: sanitizeUser(userWithAccess, portal),
      portal,
      defaultRoute: getDefaultRoute(portal, userWithAccess),
    };
  },

  logout: async (userId, refreshToken, req) => {
    if (refreshToken) await authRepository.revokeRefreshToken(refreshToken);
    await auditLog({ userId, action: 'LOGOUT', entityType: 'User', entityId: userId, req });
  },

  getProfile: async (userId) => {
    const user = await authRepository.findById(userId);
    if (!user) throw new AppError('User not found', 404);
    const userWithAccess = await attachAccessToUser(user);
    const portal = resolvePortalFromRole(user.role.slug);
    return sanitizeUser(userWithAccess, portal);
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
  password: z.string().min(8, 'Password must be at least 8 characters'),
  portal: z.enum([PORTALS.ADMIN, PORTALS.STUDENT, PORTALS.AGENT]).optional(),
});

export const refreshSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});

export const updateProfileSchema = z.object({
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  phone: z.string().max(20).optional().nullable(),
});
