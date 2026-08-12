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

export function getDefaultRoute(portal) {
  switch (portal) {
    case PORTALS.STUDENT:
      return '/student/dashboard';
    case PORTALS.AGENT:
      return '/agent/dashboard';
    default:
      return '/admin/dashboard';
  }
}

export const PORTAL_META = {
  [PORTALS.ADMIN]: {
    label: 'Staff / Admin',
    description: 'Counsellors, managers, and internal staff',
    loginPath: '/login/admin',
    registerPath: null,
  },
  [PORTALS.STUDENT]: {
    label: 'Student Portal',
    description: 'Track applications, documents, and visa status',
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
