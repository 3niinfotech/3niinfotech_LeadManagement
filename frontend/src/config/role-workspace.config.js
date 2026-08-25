/**
 * Role workspace — landing routes, nav labels, dashboard copy.
 * Keep in sync with backend/src/config/role-workspace.js
 */
export const ROLE_DEFAULT_ROUTES = {
  super_admin: '/admin/dashboard',
  company_admin: '/admin/dashboard',
  operational_head: '/admin/dashboard',
  branch_manager: '/admin/dashboard',
  team_leader: '/admin/dashboard',
  counsellor: '/admin/enquiries',
  teacher: '/admin/dashboard',
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

export const ROLE_NAV_LABELS = {
  receptionist: {
    dashboard: 'Dashboard',
    reception: 'Walk-ins',
    calendar: 'Calendar',
    settings: 'Settings',
  },
  counsellor: {
    dashboard: 'Dashboard',
    enquiries: 'My Enquiries',
    students: 'My Students',
    calendar: 'Follow-ups',
    demo: 'Demos',
    batches: 'Attendance',
  },
  teacher: {
    dashboard: 'Dashboard',
    batches: 'My Batches',
    students: 'Students',
    calendar: 'Timetable',
  },
  application_officer: {
    dashboard: 'Dashboard',
    applications: 'Applications',
    students: 'Students',
  },
  visa_officer: {
    dashboard: 'Dashboard',
    visas: 'Visa cases',
    students: 'Students',
  },
  finance_manager: {
    dashboard: 'Dashboard',
    fees: 'Invoices',
    reports: 'Reports',
  },
  finance_executive: {
    dashboard: 'Dashboard',
    fees: 'Fees',
  },
};

/** Optional path overrides by role (centralized landing/nav — not scattered role checks) */
export const ROLE_NAV_PATHS = {
  receptionist: {
    dashboard: '/admin/reception',
    settings: '/admin/profile',
  },
};

export const ROLE_NAV_PERMISSION_OVERRIDES = {
  receptionist: {
    settings: null,
  },
};

export const ROLE_WORKSPACE_META = {
  receptionist: { title: 'Reception', subtitle: "Today's appointments, visitors, and follow-ups" },
  counsellor: { title: 'Counselling', subtitle: 'Your assigned enquiries, follow-ups, and demos' },
  teacher: { title: 'Classes', subtitle: "Today's sessions and student attendance" },
  application_officer: { title: 'Applications', subtitle: 'Assigned student applications' },
  visa_officer: { title: 'Visa cases', subtitle: 'Assigned visa files and follow-ups' },
  finance_manager: { title: 'Finance', subtitle: 'Invoices, collections, and revenue' },
  finance_executive: { title: 'Collections', subtitle: 'Branch invoices and payments' },
};

export function getRoleDefaultRoute(roleSlug, fallback = '/admin/dashboard') {
  if (!roleSlug) return fallback;
  return ROLE_DEFAULT_ROUTES[roleSlug] || fallback;
}

export function applyRoleNavLabels(items = [], roleSlug) {
  const labels = ROLE_NAV_LABELS[roleSlug];
  const paths = ROLE_NAV_PATHS[roleSlug];
  const permissions = ROLE_NAV_PERMISSION_OVERRIDES[roleSlug];
  if (!labels && !paths && !permissions) return items;
  return items.map((item) => {
    const hasPermissionOverride = Object.prototype.hasOwnProperty.call(permissions || {}, item.id);
    return {
      ...item,
      label: labels?.[item.id] || item.label,
      description: roleSlug === 'receptionist' && item.id === 'settings'
        ? 'Personal profile and preferences'
        : item.description,
      path: paths?.[item.id] || item.path,
      permission: hasPermissionOverride ? permissions[item.id] : item.permission,
      permissions: hasPermissionOverride ? undefined : item.permissions,
      children: item.children ? applyRoleNavLabels(item.children, roleSlug) : item.children,
    };
  });
}
