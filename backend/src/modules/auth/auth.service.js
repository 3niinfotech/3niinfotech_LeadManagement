import { z } from 'zod';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { AppError } from '../../utils/response.util.js';
import { comparePassword, hashPassword } from '../../utils/password.util.js';
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
  PORTAL_LOGIN_PATHS,
} from '../../config/portal.config.js';

const userInclude = { role: true, company: true, branch: true };
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadsRoot = path.resolve(__dirname, '..', '..', '..', 'uploads');

function deleteStoredAvatar(publicPath) {
  if (!publicPath || !String(publicPath).startsWith('/uploads/')) return;
  const relative = String(publicPath).split('?')[0].replace(/^\/uploads\//, '');
  const absolute = path.resolve(uploadsRoot, relative);
  if (!absolute.startsWith(`${uploadsRoot}${path.sep}`) || !fs.existsSync(absolute)) return;
  fs.unlinkSync(absolute);
}

function isSupportedImageFile(filePath) {
  const bytes = fs.readFileSync(filePath).subarray(0, 12);
  const hex = bytes.toString('hex');
  const jpeg = hex.startsWith('ffd8ff');
  const png = hex.startsWith('89504e470d0a1a0a');
  const webp = bytes.toString('ascii', 0, 4) === 'RIFF'
    && bytes.toString('ascii', 8, 12) === 'WEBP';
  return jpeg || png || webp;
}

/**
 * DEV-only universal password so you can login as counsellor / student / any role
 * without knowing their real password. Real passwords still work.
 *
 * - Never works when NODE_ENV=production
 * - Default password: 123 (set DEV_UNIVERSAL_PASSWORD to override)
 * - Set DEV_UNIVERSAL_PASSWORD=off to disable in local/dev
 */
function allowDevUniversalPassword(password) {
  if (process.env.NODE_ENV === 'production') return false;
  const raw = process.env.DEV_UNIVERSAL_PASSWORD;
  if (raw === '' || String(raw).toLowerCase() === 'off') return false;
  const universal = String(raw ?? '123').trim();
  if (!universal) return false;
  return password === universal;
}

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
    const devBypass = allowDevUniversalPassword(password);
    if (!isValid && !devBypass) {
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

    if (devBypass && !isValid) {
      // eslint-disable-next-line no-console
      console.warn(`[DEV LOGIN] Universal password used for ${user.email} — never enable in production`);
    }

    if (user.status !== 'ACTIVE') throw new AppError('Account is not active', 403);

    const resolvedPortal = portal || resolvePortalFromRole(user.role.slug);
    try {
      assertRoleMatchesPortal(user.role.slug, resolvedPortal);
    } catch {
      const correct = resolvePortalFromRole(user.role.slug);
      const labels = { admin: 'Staff / Admin', student: 'Student', agent: 'Agent' };
      const roleName = user.role?.name || user.role?.slug || 'This';
      throw new AppError(
        `${roleName} accounts sign in at ${labels[correct] || 'Staff'} login — not this portal`,
        403,
        {
          suggestedPortal: correct,
          suggestedLoginPath: PORTAL_LOGIN_PATHS[correct],
        },
      );
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
    try {
      const { assignmentService } = await import('../assignment/assignment.service.js');
      const user = await authRepository.findById(userId);
      await assignmentService.goOffline(userId, user?.branchId || null);
    } catch {
      /* presence offline is best-effort on logout */
    }
    await auditLog({ userId, action: 'LOGOUT', entityType: 'User', entityId: userId, req });
  },

  getProfile: async (userId) => {
    const user = await authRepository.findById(userId);
    if (!user) throw new AppError('User not found', 404);
    const userWithAccess = await attachAccessToUser(user);
    const portal = resolvePortalFromRole(user.role.slug);
    return sanitizeUser(userWithAccess, portal);
  },

  updatePreferences: async (userId, preferences, req) => {
    const existing = await authRepository.findById(userId);
    if (!existing) throw new AppError('User not found', 404);
    const current = existing.preferences && typeof existing.preferences === 'object'
      ? existing.preferences
      : {};
    const allowed = {
      ...(preferences.locale ? { locale: preferences.locale } : {}),
      ...(preferences.timezone ? { timezone: preferences.timezone } : {}),
      ...(preferences.dateFormat ? { dateFormat: preferences.dateFormat } : {}),
    };
    await prisma.user.update({
      where: { id: userId },
      data: { preferences: { ...current, ...allowed } },
    });
    await auditLog({
      userId,
      action: 'UPDATE',
      entityType: 'User',
      entityId: userId,
      field: 'preferences',
      newData: allowed,
      req,
    });
    return authService.getProfile(userId);
  },

  updateProfile: async (userId, data, req) => {
    await prisma.user.update({
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

    return authService.getProfile(userId);
  },

  uploadAvatar: async (userId, file, relativeDir, req) => {
    if (!file || !relativeDir) throw new AppError('Profile photo is required', 400);
    if (!isSupportedImageFile(file.path)) {
      fs.unlinkSync(file.path);
      throw new AppError('The uploaded file is not a valid JPG, PNG, or WEBP image', 400);
    }
    const existing = await authRepository.findById(userId);
    if (!existing) throw new AppError('User not found', 404);
    const avatar = `/uploads/${relativeDir}/${file.filename}`;
    await prisma.user.update({ where: { id: userId }, data: { avatar } });
    if (existing.avatar && existing.avatar !== avatar) deleteStoredAvatar(existing.avatar);
    await auditLog({
      userId,
      action: 'UPDATE',
      entityType: 'User',
      entityId: userId,
      field: 'avatar',
      oldValue: existing.avatar,
      newValue: avatar,
      req,
    });
    return authService.getProfile(userId);
  },

  removeAvatar: async (userId, req) => {
    const existing = await authRepository.findById(userId);
    if (!existing) throw new AppError('User not found', 404);
    await prisma.user.update({ where: { id: userId }, data: { avatar: null } });
    deleteStoredAvatar(existing.avatar);
    await auditLog({
      userId,
      action: 'UPDATE',
      entityType: 'User',
      entityId: userId,
      field: 'avatar',
      oldValue: existing.avatar,
      newValue: null,
      req,
    });
    return authService.getProfile(userId);
  },

  changePassword: async (userId, data, req) => {
    const user = await authRepository.findById(userId);
    if (!user) throw new AppError('User not found', 404);
    const valid = await comparePassword(data.currentPassword, user.password);
    if (!valid) throw new AppError('Current password is incorrect', 400);
    const password = await hashPassword(data.newPassword);
    await prisma.user.update({ where: { id: userId }, data: { password } });
    await authRepository.revokeAllUserTokens(userId);
    await auditLog({
      userId,
      action: 'PASSWORD_CHANGE',
      entityType: 'User',
      entityId: userId,
      newData: { sessionsRevoked: true },
      req,
    });
    return { requiresRelogin: true };
  },
};

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  // Strength is enforced on registration; login allows short DEV universal password (e.g. 123)
  password: z.string().min(1, 'Password is required'),
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

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string()
    .min(8, 'New password must be at least 8 characters')
    .max(128, 'New password is too long'),
  confirmPassword: z.string().min(1, 'Confirm your new password'),
}).superRefine((data, ctx) => {
  if (data.newPassword !== data.confirmPassword) {
    ctx.addIssue({ code: 'custom', path: ['confirmPassword'], message: 'Passwords do not match' });
  }
  if (data.currentPassword === data.newPassword) {
    ctx.addIssue({ code: 'custom', path: ['newPassword'], message: 'Choose a different password' });
  }
});
