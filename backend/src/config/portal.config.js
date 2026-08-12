/** Portal identifiers — one login surface, role-validated per portal */
export const PORTALS = {
  ADMIN: 'admin',
  STUDENT: 'student',
  AGENT: 'agent',
};

export const STUDENT_ROLE_SLUGS = ['student_portal'];
export const AGENT_ROLE_SLUGS = ['partner'];

/** Internal staff + platform roles — counsellors use admin portal */
export const ADMIN_ROLE_SLUGS = [
  'super_admin',
  'company_admin',
  'operational_head',
  'branch_manager',
  'team_leader',
  'counsellor',
  'application_officer',
  'visa_officer',
  'finance_manager',
  'finance_executive',
  'marketing_manager',
  'marketing_executive',
  'receptionist',
  'telecaller',
  'document_executive',
  'compliance_officer',
  'partner_manager',
  'viewer',
  'custom_role',
];

const PORTAL_ROLE_MAP = {
  [PORTALS.ADMIN]: ADMIN_ROLE_SLUGS,
  [PORTALS.STUDENT]: STUDENT_ROLE_SLUGS,
  [PORTALS.AGENT]: AGENT_ROLE_SLUGS,
};

export function resolvePortalFromRole(roleSlug) {
  if (STUDENT_ROLE_SLUGS.includes(roleSlug)) return PORTALS.STUDENT;
  if (AGENT_ROLE_SLUGS.includes(roleSlug)) return PORTALS.AGENT;
  return PORTALS.ADMIN;
}

export function assertRoleMatchesPortal(roleSlug, portal) {
  const allowed = PORTAL_ROLE_MAP[portal];
  if (!allowed?.includes(roleSlug)) {
    const err = new Error('Your account is not authorized for this portal');
    err.statusCode = 403;
    throw err;
  }
}

export function getDefaultRoute(portal, user = null) {
  switch (portal) {
    case PORTALS.STUDENT:
      return '/student/dashboard';
    case PORTALS.AGENT:
      return '/agent/dashboard';
    default:
      return '/admin/dashboard';
  }
}

export const PORTAL_LOGIN_PATHS = {
  [PORTALS.ADMIN]: '/login/admin',
  [PORTALS.STUDENT]: '/login/student',
  [PORTALS.AGENT]: '/login/agent',
};
