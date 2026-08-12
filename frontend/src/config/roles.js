/** Role slugs — match backend seed */
export const ROLES = {
  SUPER_ADMIN: 'super_admin',
  ADMIN: 'admin',
  MANAGER: 'manager',
  COUNSELOR: 'counselor',
  VIEWER: 'viewer',
};

export const ROLE_META = {
  [ROLES.SUPER_ADMIN]: {
    label: 'Super Admin',
    badgeClass: 'bg-brand text-white',
    iconBg: 'bg-brand-soft text-brand',
    description: 'Full system access including audit logs',
  },
  [ROLES.ADMIN]: {
    label: 'Admin',
    badgeClass: 'bg-info text-white',
    iconBg: 'bg-info-soft text-info',
    description: 'Manage users, settings, and all CRM modules',
  },
  [ROLES.MANAGER]: {
    label: 'Manager',
    badgeClass: 'bg-warning text-white',
    iconBg: 'bg-warning-soft text-warning',
    description: 'Assign work, export data, oversee team pipeline',
  },
  [ROLES.COUNSELOR]: {
    label: 'Counselor',
    badgeClass: 'bg-success text-white',
    iconBg: 'bg-success-soft text-success',
    description: 'Handle enquiries, leads, and student counselling',
  },
  [ROLES.VIEWER]: {
    label: 'Viewer',
    badgeClass: 'bg-secondary-500 text-white',
    iconBg: 'bg-row-hover text-text-secondary',
    description: 'Read-only access to CRM data',
  },
};

export function getRoleMeta(slug) {
  return ROLE_META[slug] || {
    label: slug?.replace(/_/g, ' ') || 'Member',
    badgeClass: 'bg-text-secondary text-white',
    iconBg: 'bg-row-hover text-text-secondary',
    description: '',
  };
}

export function isAdminRole(slug) {
  return slug === ROLES.SUPER_ADMIN || slug === 'company_admin' || slug === ROLES.ADMIN;
}

export function canManageUsers(slug, permissions = []) {
  return isAdminRole(slug)
    || permissions.includes('users.view')
    || permissions.includes('users:view');
}
