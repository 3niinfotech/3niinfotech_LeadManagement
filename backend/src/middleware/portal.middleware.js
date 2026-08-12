import { AppError } from '../utils/response.util.js';
import { PORTALS } from '../config/portal.config.js';

/** Require authenticated user to belong to the given portal */
export const requirePortal = (...allowedPortals) => (req, res, next) => {
  if (!req.user) return next(new AppError('Authentication required', 401));

  const roleSlug = req.user.role?.slug;
  let userPortal = req.user.portal;

  if (!userPortal) {
    if (roleSlug === 'student_portal') userPortal = PORTALS.STUDENT;
    else if (roleSlug === 'partner') userPortal = PORTALS.AGENT;
    else userPortal = PORTALS.ADMIN;
  }

  if (!allowedPortals.includes(userPortal)) {
    return next(new AppError('This action is not available in your portal', 403));
  }

  next();
};
