/**
 * Role workspace — default landing routes and dashboard titles.
 * Permissions still decide what is visible; this only picks a sensible home.
 */
export const ROLE_DEFAULT_ROUTES = {
  super_admin: '/admin/dashboard',
  company_admin: '/admin/dashboard',
  operational_head: '/admin/dashboard',
  branch_manager: '/admin/dashboard',
  team_leader: '/admin/dashboard',
  counsellor: '/admin/dashboard',
  teacher: '/admin/teacher/dashboard',
  receptionist: '/admin/reception',
  application_officer: '/admin/applications',
  visa_officer: '/admin/visas',
  finance_manager: '/admin/fees',
  finance_executive: '/admin/fees',
  marketing_manager: '/admin/dashboard',
  marketing_executive: '/admin/enquiries',
  telecaller: '/admin/enquiries',
  document_executive: '/admin/applications',
  compliance_officer: '/admin/reports',
  partner_manager: '/admin/master/partners',
  partner: '/agent/dashboard',
  student_portal: '/student/dashboard',
  viewer: '/admin/dashboard',
  custom_role: '/admin/dashboard',
};

export const ROLE_WORKSPACE_META = {
  receptionist: {
    title: 'Reception',
    subtitle: "Today's appointments, visitors, and follow-ups",
  },
  counsellor: {
    title: 'My counselling desk',
    subtitle: 'Pipeline, follow-ups, demos, and appointments assigned to you',
  },
  teacher: {
    title: 'Teacher workspace',
    subtitle: 'Your classes, students, and attendance',
  },
  application_officer: {
    title: 'Applications',
    subtitle: 'Assigned student applications and documents',
  },
  visa_officer: {
    title: 'Visa cases',
    subtitle: 'Assigned visa files and follow-ups',
  },
  finance_manager: {
    title: 'Finance',
    subtitle: 'Invoices, collections, and revenue',
  },
  finance_executive: {
    title: 'Collections',
    subtitle: 'Branch invoices and payments',
  },
  student_portal: {
    title: 'My dashboard',
    subtitle: 'Your courses, attendance, and applications',
  },
};

export function getRoleDefaultRoute(roleSlug, portalFallback = '/admin/dashboard') {
  if (!roleSlug) return portalFallback;
  return ROLE_DEFAULT_ROUTES[roleSlug] || portalFallback;
}
