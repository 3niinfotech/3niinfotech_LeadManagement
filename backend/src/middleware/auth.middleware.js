import { AppError } from '../utils/response.util.js';
import { extractToken, verifyAccessToken } from '../utils/jwt.util.js';
import prisma from '../config/database.js';
import { resolveUserAccess } from '../modules/rbac/rbac.resolve.js';
import { hasAnyPermission } from '../modules/rbac/rbac.util.js';

export const authenticate = async (req, res, next) => {
  try {
    const token = extractToken(req);
    if (!token) throw new AppError('Authentication required', 401);

    const decoded = verifyAccessToken(token);
    const user = await prisma.user.findFirst({
      where: { id: decoded.userId, deletedAt: null, status: 'ACTIVE' },
      include: { role: true, company: true, branch: true },
    });

    if (!user) throw new AppError('User not found or inactive', 401);

    const access = await resolveUserAccess(user.id);
    const legacyPerms = Array.isArray(user.role?.permissions) ? user.role.permissions : [];
    const permissions = access?.permissions?.length ? access.permissions : legacyPerms;
    const dataScope = access?.dataScope || user.role?.dataScope || 'OWN';

    req.user = {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: { ...user.role, permissions, dataScope },
      permissions,
      dataScope,
      companyId: user.companyId,
      branchId: user.branchId,
      portal: decoded.portal || null,
    };

    next();
  } catch (err) {
    if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
      return next(new AppError('Invalid or expired token', 401));
    }
    next(err);
  }
};

export const authorize = (...permissions) => (req, res, next) => {
  if (!req.user) return next(new AppError('Authentication required', 401));

  if (!hasAnyPermission(req.user.permissions, permissions)) {
    return next(new AppError('Insufficient permissions', 403));
  }

  next();
};
