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
import {
  clientIp,
  createApiTokenValue,
  parseUserAgent,
  summarizeAuditAction,
} from './auth.security.util.js';
import {
  ensureStudentPortalUser,
  findStudentByEmail,
  getStudentDefaultPassword,
} from './student-portal-account.util.js';

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

function isProduction() {
  return process.env.NODE_ENV === 'production';
}

function passwordMinLength() {
  return isProduction() ? 8 : 1;
}

const sanitizeUser = (user, portal) => {
  const { _count, password, ...rest } = user;
  const permissions = user.permissions || user.role?.permissions || [];
  const dataScope = user.dataScope || user.role?.dataScope || 'OWN';
  const resolvedPortal = portal || resolvePortalFromRole(user.role.slug);
  const prefs = rest.preferences && typeof rest.preferences === 'object' ? rest.preferences : {};

  const base = {
    id: rest.id,
    email: rest.email,
    firstName: rest.firstName,
    lastName: rest.lastName,
    phone: rest.phone,
    avatar: rest.avatar,
    employeeCode: rest.employeeCode || null,
    department: rest.department || null,
    status: rest.status,
    preferences: prefs,
    lastLoginAt: rest.lastLoginAt,
    passwordChangedAt: rest.passwordChangedAt || null,
    createdAt: rest.createdAt,
    dataScope,
    permissions,
    portal: resolvedPortal,
    defaultRoute: prefs.landingPage || getDefaultRoute(resolvedPortal, user),
    role: {
      id: user.role.id,
      name: user.role.name,
      slug: user.role.slug,
      dataScope,
      permissions,
    },
    company: user.company ? { id: user.company.id, name: user.company.name, code: user.company.code, logo: user.company.logo } : null,
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
    const normalizedEmail = String(email || '').trim().toLowerCase();
    let user = await authRepository.findByEmail(normalizedEmail);

    // Converted students often have Student row but no User login yet — bootstrap on student portal
    if (!user && portal === PORTALS.STUDENT) {
      const student = await findStudentByEmail(normalizedEmail);
      if (student) {
        const defaultPwd = getStudentDefaultPassword();
        const canBootstrap = allowDevUniversalPassword(password) || password === defaultPwd;
        if (canBootstrap) {
          user = await ensureStudentPortalUser(student, { plainPassword: defaultPwd });
        } else {
          throw new AppError(
            'Portal login is not set up yet. Use Forgot password to create your password (default 123 for testing).',
            403,
          );
        }
      }
    }

    if (!user) {
      await auditLog({
        action: 'LOGIN_FAILED',
        entityType: 'User',
        entityId: normalizedEmail,
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

    const ua = parseUserAgent(req?.headers?.['user-agent']);
    await authRepository.createRefreshToken({
      userId: user.id,
      token: refreshToken,
      expiresAt,
      ipAddress: clientIp(req),
      userAgent: ua.userAgent || null,
      deviceLabel: ua.deviceLabel,
      lastUsedAt: new Date(),
    });
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

  refresh: async (token, req) => {
    const stored = await authRepository.findRefreshToken(token);
    if (!stored) throw new AppError('Invalid refresh token', 401);

    const user = stored.user;
    const portal = resolvePortalFromRole(user.role.slug);
    const payload = { userId: user.id, email: user.email, role: user.role.slug, portal };
    const accessToken = generateAccessToken(payload);

    const ua = parseUserAgent(req?.headers?.['user-agent']);
    await authRepository.touchRefreshToken(token, {
      ipAddress: clientIp(req) || undefined,
      userAgent: ua.userAgent || undefined,
      deviceLabel: ua.deviceLabel || undefined,
    });

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
    let user = await authRepository.findById(userId);
    if (!user) throw new AppError('User not found', 404);
    user = await authRepository.ensureProfileMeta(user);
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

    const allowed = {};
    const keys = [
      'locale', 'timezone', 'dateFormat', 'theme', 'density', 'compactMode',
      'landingPage', 'pageSize', 'shortcuts', 'recentModules', 'twoFactorEnabled',
    ];
    for (const key of keys) {
      if (preferences[key] !== undefined) allowed[key] = preferences[key];
    }

    await prisma.user.update({
      where: { id: userId },
      data: { preferences: { ...current, ...allowed } },
    });
    await auditLog({
      userId,
      action: 'UPDATE',
      entityType: 'User',
      entityId: userId,
      newData: { preferences: allowed },
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
        ...(data.department !== undefined ? { department: data.department || null } : {}),
      },
      include: userInclude,
    });

    await auditLog({
      userId,
      action: 'UPDATE',
      entityType: 'User',
      entityId: userId,
      newData: {
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone,
        department: data.department,
      },
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
    await prisma.user.update({
      where: { id: userId },
      data: { password, passwordChangedAt: new Date() },
    });
    // One User password for the whole journey — revoke every session so login/portal stay in sync
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

  /**
   * Student forgot-password: resets the single User.password (same login everywhere)
   * and revokes all sessions. Non-prod defaults new password to 123 for QA testing.
   */
  forgotPassword: async (data, req) => {
    const portal = data.portal || PORTALS.STUDENT;
    if (portal !== PORTALS.STUDENT) {
      throw new AppError('Forgot password is available on the student portal only', 400);
    }

    const email = String(data.email || '').trim().toLowerCase();
    const defaultPwd = getStudentDefaultPassword();
    let plain = data.newPassword != null && String(data.newPassword).length
      ? String(data.newPassword)
      : defaultPwd;

    if (isProduction()) {
      if (!data.newPassword || String(data.newPassword).length < 8) {
        throw new AppError('Choose a new password of at least 8 characters', 400);
      }
      plain = String(data.newPassword);
    }

    let user = await authRepository.findByEmail(email);
    if (!user || user.role?.slug !== 'student_portal') {
      const student = await findStudentByEmail(email);
      if (!student) {
        throw new AppError('No student account found for this email', 404);
      }
      user = await ensureStudentPortalUser(student, { plainPassword: plain });
      await auditLog({
        userId: user.id,
        action: 'PASSWORD_RESET',
        entityType: 'User',
        entityId: user.id,
        newData: { portal, createdPortalUser: true, source: 'forgot_password' },
        req,
      });
      const createdPayload = {
        email: user.email,
        sessionsRevoked: true,
        message: 'Portal login created. Sign in with your new password.',
      };
      if (!isProduction()) {
        createdPayload.temporaryPassword = plain;
        createdPayload.hint = `Use password "${plain}" to sign in (testing default).`;
      }
      return createdPayload;
    }

    if (user.status !== 'ACTIVE') {
      throw new AppError('Account is not active. Contact your institute.', 403);
    }

    const password = await hashPassword(plain);
    await prisma.user.update({
      where: { id: user.id },
      data: { password, passwordChangedAt: new Date() },
    });
    await authRepository.revokeAllUserTokens(user.id);
    await auditLog({
      userId: user.id,
      action: 'PASSWORD_RESET',
      entityType: 'User',
      entityId: user.id,
      newData: { portal, sessionsRevoked: true, source: 'forgot_password' },
      req,
    });

    const payload = {
      email: user.email,
      sessionsRevoked: true,
      message: 'Password updated. Sign in with your new password.',
    };
    if (!isProduction()) {
      payload.temporaryPassword = plain;
      payload.hint = `Use password "${plain}" to sign in (testing default).`;
    }
    return payload;
  },

  getSecurityOverview: async (userId) => {
    const user = await authRepository.findById(userId);
    if (!user) throw new AppError('User not found', 404);
    const prefs = user.preferences && typeof user.preferences === 'object' ? user.preferences : {};
    const activeSessions = await authRepository.countActiveSessions(userId);
    const tokens = await authRepository.listApiTokens(userId);
    const twoFactorEnabled = Boolean(prefs.twoFactorEnabled);
    return {
      status: user.status,
      secure: user.status === 'ACTIVE',
      lastLoginAt: user.lastLoginAt,
      passwordChangedAt: user.passwordChangedAt,
      twoFactorEnabled,
      activeSessions,
      apiTokenCount: tokens.length,
      trustedDevices: activeSessions,
    };
  },

  listSessions: async (userId, currentRefreshToken) => {
    const rows = await authRepository.listActiveSessions(userId);
    return rows.map((row) => {
      const parsed = parseUserAgent(row.userAgent);
      return {
        id: row.id,
        current: Boolean(currentRefreshToken && row.token === currentRefreshToken),
        deviceLabel: row.deviceLabel || parsed.deviceLabel,
        browser: parsed.browser,
        os: parsed.os,
        device: parsed.device,
        ipAddress: row.ipAddress,
        createdAt: row.createdAt,
        lastUsedAt: row.lastUsedAt || row.createdAt,
        expiresAt: row.expiresAt,
      };
    });
  },

  revokeSession: async (userId, sessionId, currentRefreshToken, req) => {
    const rows = await authRepository.listActiveSessions(userId);
    const target = rows.find((r) => r.id === sessionId);
    if (!target) throw new AppError('Session not found', 404);
    if (currentRefreshToken && target.token === currentRefreshToken) {
      throw new AppError('Cannot revoke the current session here — use Logout', 400);
    }
    await authRepository.revokeRefreshTokenById(userId, sessionId);
    await auditLog({
      userId,
      action: 'UPDATE',
      entityType: 'User',
      entityId: userId,
      newData: { sessionRevoked: sessionId },
      req,
    });
    return { revoked: true };
  },

  revokeOtherSessions: async (userId, currentRefreshToken, req) => {
    if (!currentRefreshToken) throw new AppError('Current session required', 400);
    await authRepository.revokeOtherUserTokens(userId, currentRefreshToken);
    await auditLog({
      userId,
      action: 'UPDATE',
      entityType: 'User',
      entityId: userId,
      newData: { otherSessionsRevoked: true },
      req,
    });
    return { revoked: true };
  },

  listActivity: async (userId, limit = 20) => {
    const rows = await authRepository.listUserAudit(userId, {
      actions: ['LOGIN', 'LOGIN_FAILED', 'LOGOUT', 'PASSWORD_CHANGE', 'UPDATE'],
      limit,
    });
    return rows.map((row) => {
      const summary = summarizeAuditAction(row);
      const parsed = parseUserAgent(row.userAgent);
      return {
        id: row.id,
        action: row.action,
        title: summary.title,
        tone: summary.tone,
        kind: summary.kind,
        createdAt: row.createdAt,
        ipAddress: row.ipAddress,
        browser: parsed.browser,
        deviceLabel: parsed.deviceLabel,
        location: null,
      };
    });
  },

  listLoginHistory: async (userId, limit = 20) => {
    const rows = await authRepository.listUserAudit(userId, {
      actions: ['LOGIN', 'LOGIN_FAILED', 'LOGOUT'],
      limit,
    });
    return rows.map((row) => {
      const parsed = parseUserAgent(row.userAgent);
      return {
        id: row.id,
        createdAt: row.createdAt,
        device: parsed.deviceLabel,
        browser: parsed.browser,
        os: parsed.os,
        location: '—',
        ipAddress: row.ipAddress ? String(row.ipAddress).replace(/(\d+)$/, 'XX') : '—',
        status: row.action === 'LOGIN' ? 'Success' : (row.action === 'LOGIN_FAILED' ? 'Failed' : 'Logout'),
        action: row.action,
      };
    });
  },

  listApiTokens: async (userId) => authRepository.listApiTokens(userId),

  createApiToken: async (userId, { name, expiresInDays }, req) => {
    const user = await authRepository.findById(userId);
    if (!user) throw new AppError('User not found', 404);
    const label = String(name || '').trim();
    if (!label) throw new AppError('Token name is required', 422);
    const { raw, prefix, hash } = createApiTokenValue();
    let expiresAt = null;
    if (expiresInDays) {
      expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + Number(expiresInDays));
    }
    const record = await authRepository.createApiToken({
      userId,
      companyId: user.companyId || null,
      name: label,
      tokenPrefix: prefix,
      tokenHash: hash,
      expiresAt,
      createdBy: userId,
    });
    await auditLog({
      userId,
      action: 'CREATE',
      entityType: 'UserApiToken',
      entityId: record.id,
      newData: { name: label },
      req,
    });
    return {
      id: record.id,
      name: record.name,
      tokenPrefix: record.tokenPrefix,
      createdAt: record.createdAt,
      expiresAt: record.expiresAt,
      token: raw,
    };
  },

  revokeApiToken: async (userId, tokenId, req) => {
    const result = await authRepository.revokeApiToken(userId, tokenId);
    if (!result.count) throw new AppError('Token not found', 404);
    await auditLog({
      userId,
      action: 'DELETE',
      entityType: 'UserApiToken',
      entityId: tokenId,
      req,
    });
    return { revoked: true };
  },
};

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  // Strength is enforced on registration; login allows short DEV universal password (e.g. 123)
  password: z.string().min(1, 'Password is required'),
  portal: z.preprocess((val) => (typeof val === 'string' ? val.toLowerCase() : val), z.enum([PORTALS.ADMIN, PORTALS.STUDENT, PORTALS.AGENT])).optional(),
});

export const refreshSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});

export const updateProfileSchema = z.object({
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  phone: z.string().max(20).optional().nullable(),
  department: z.string().max(120).optional().nullable(),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string()
    .min(passwordMinLength(), isProduction()
      ? 'New password must be at least 8 characters'
      : 'New password is required')
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

export const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
  portal: z.preprocess((val) => (typeof val === 'string' ? val.toLowerCase() : val), z.enum([PORTALS.ADMIN, PORTALS.STUDENT, PORTALS.AGENT])).optional().default(PORTALS.STUDENT),
  newPassword: z.string().max(128).optional().nullable(),
  confirmPassword: z.string().optional().nullable(),
}).superRefine((data, ctx) => {
  const hasCustom = data.newPassword != null && String(data.newPassword).length > 0;
  if (hasCustom) {
    const min = passwordMinLength();
    if (String(data.newPassword).length < min) {
      ctx.addIssue({
        code: 'custom',
        path: ['newPassword'],
        message: isProduction()
          ? 'New password must be at least 8 characters'
          : 'New password is required',
      });
    }
    if (data.newPassword !== data.confirmPassword) {
      ctx.addIssue({ code: 'custom', path: ['confirmPassword'], message: 'Passwords do not match' });
    }
  } else if (isProduction()) {
    ctx.addIssue({
      code: 'custom',
      path: ['newPassword'],
      message: 'Choose a new password of at least 8 characters',
    });
  }
});
