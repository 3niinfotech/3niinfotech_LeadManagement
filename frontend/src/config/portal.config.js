import { getRoleDefaultRoute } from './role-workspace.config';

export const PORTALS = {
  ADMIN: 'admin',
  STUDENT: 'student',
  AGENT: 'agent',
};

export const STUDENT_ROLE_SLUGS = ['student_portal'];
export const AGENT_ROLE_SLUGS = ['partner'];

export function resolvePortalFromRole(roleSlug) {
  if (STUDENT_ROLE_SLUGS.includes(roleSlug)) return PORTALS.STUDENT;
  if (AGENT_ROLE_SLUGS.includes(roleSlug)) return PORTALS.AGENT;
  return PORTALS.ADMIN;
}

export function getDefaultRoute(portal, user = null) {
  const slug = user?.role?.slug;
  switch (portal) {
    case PORTALS.STUDENT:
      return getRoleDefaultRoute(slug, '/student/dashboard');
    case PORTALS.AGENT:
      return getRoleDefaultRoute(slug, '/agent/dashboard');
    default:
      return getRoleDefaultRoute(slug, '/admin/dashboard');
  }
}

export const PORTAL_META = {
  [PORTALS.ADMIN]: {
    label: 'Staff / Admin',
    description: 'Counsellor, Reception, Teacher, Admin — Priya logs in here',
    loginPath: '/login/admin',
    registerPath: null,
  },
  [PORTALS.STUDENT]: {
    label: 'Student Portal',
    description: 'Students only (e.g. Aarav). Not for staff.',
    loginPath: '/login/student',
    registerPath: '/register/student',
  },
  [PORTALS.AGENT]: {
    label: 'Agent Portal',
    description: 'Partner agents — manage referred students',
    loginPath: '/login/agent',
    registerPath: '/register/agent',
  },
};
