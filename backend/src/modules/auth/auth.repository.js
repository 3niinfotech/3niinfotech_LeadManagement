import prisma from '../../config/database.js';
import { softDeleteWhere } from '../../utils/response.util.js';
import { defaultDepartmentForRole, employeeCodeFromId } from './auth.security.util.js';

export const authRepository = {
  findByEmail: (email) =>
    prisma.user.findFirst({
      where: { email: String(email || '').trim().toLowerCase(), ...softDeleteWhere },
      include: { role: true, company: true, branch: true },
    }),

  findById: (id) =>
    prisma.user.findFirst({
      where: { id, ...softDeleteWhere },
      include: {
        role: true,
        company: true,
        branch: true,
        _count: {
          select: {
            assignedEnquiries: { where: { deletedAt: null } },
            assignedLeads: { where: { deletedAt: null } },
            assignedStudents: { where: { deletedAt: null } },
          },
        },
      },
    }),

  updateLastLogin: (id) =>
    prisma.user.update({ where: { id }, data: { lastLoginAt: new Date() } }),

  ensureProfileMeta: async (user) => {
    if (!user) return user;
    const patch = {};
    if (!user.employeeCode) patch.employeeCode = employeeCodeFromId(user.id);
    if (!user.department && user.role?.slug) {
      patch.department = defaultDepartmentForRole(user.role.slug);
    }
    if (!Object.keys(patch).length) return user;
    return prisma.user.update({
      where: { id: user.id },
      data: patch,
      include: {
        role: true,
        company: true,
        branch: true,
        _count: {
          select: {
            assignedEnquiries: { where: { deletedAt: null } },
            assignedLeads: { where: { deletedAt: null } },
            assignedStudents: { where: { deletedAt: null } },
          },
        },
      },
    });
  },

  createRefreshToken: (data) =>
    prisma.refreshToken.create({ data }),

  findRefreshToken: (token) =>
    prisma.refreshToken.findFirst({
      where: { token, revokedAt: null, expiresAt: { gt: new Date() } },
      include: { user: { include: { role: true, company: true, branch: true } } },
    }),

  touchRefreshToken: (token, data = {}) =>
    prisma.refreshToken.updateMany({
      where: { token, revokedAt: null },
      data: { lastUsedAt: new Date(), ...data },
    }),

  listActiveSessions: (userId) =>
    prisma.refreshToken.findMany({
      where: { userId, revokedAt: null, expiresAt: { gt: new Date() } },
      orderBy: [{ lastUsedAt: 'desc' }, { createdAt: 'desc' }],
      select: {
        id: true,
        createdAt: true,
        expiresAt: true,
        lastUsedAt: true,
        ipAddress: true,
        userAgent: true,
        deviceLabel: true,
        token: true,
      },
    }),

  revokeRefreshToken: (token) =>
    prisma.refreshToken.updateMany({
      where: { token },
      data: { revokedAt: new Date() },
    }),

  revokeRefreshTokenById: (userId, id) =>
    prisma.refreshToken.updateMany({
      where: { id, userId, revokedAt: null },
      data: { revokedAt: new Date() },
    }),

  revokeOtherUserTokens: (userId, keepToken) =>
    prisma.refreshToken.updateMany({
      where: {
        userId,
        revokedAt: null,
        ...(keepToken ? { token: { not: keepToken } } : {}),
      },
      data: { revokedAt: new Date() },
    }),

  revokeAllUserTokens: (userId) =>
    prisma.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    }),

  countActiveSessions: (userId) =>
    prisma.refreshToken.count({
      where: { userId, revokedAt: null, expiresAt: { gt: new Date() } },
    }),

  listUserAudit: (userId, { actions, limit = 20 } = {}) =>
    prisma.auditLog.findMany({
      where: {
        userId,
        ...(actions?.length ? { action: { in: actions } } : {}),
      },
      orderBy: { createdAt: 'desc' },
      take: Math.min(Number(limit) || 20, 100),
    }),

  listApiTokens: (userId) =>
    prisma.userApiToken.findMany({
      where: { userId, revokedAt: null },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        tokenPrefix: true,
        lastUsedAt: true,
        expiresAt: true,
        createdAt: true,
      },
    }),

  createApiToken: (data) =>
    prisma.userApiToken.create({ data }),

  revokeApiToken: (userId, id) =>
    prisma.userApiToken.updateMany({
      where: { id, userId, revokedAt: null },
      data: { revokedAt: new Date() },
    }),
};
