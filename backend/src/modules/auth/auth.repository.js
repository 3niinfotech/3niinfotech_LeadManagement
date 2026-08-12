import prisma from '../../config/database.js';
import { softDeleteWhere } from '../../utils/response.util.js';

export const authRepository = {
  findByEmail: (email) =>
    prisma.user.findFirst({
      where: { email, ...softDeleteWhere },
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

  createRefreshToken: (data) =>
    prisma.refreshToken.create({ data }),

  findRefreshToken: (token) =>
    prisma.refreshToken.findFirst({
      where: { token, revokedAt: null, expiresAt: { gt: new Date() } },
      include: { user: { include: { role: true } } },
    }),

  revokeRefreshToken: (token) =>
    prisma.refreshToken.updateMany({
      where: { token },
      data: { revokedAt: new Date() },
    }),

  revokeAllUserTokens: (userId) =>
    prisma.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    }),
};
