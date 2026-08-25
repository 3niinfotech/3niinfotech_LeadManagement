/** Role slugs — match backend seed (default-roles.js) */
export const ROLES = {
  SUPER_ADMIN: 'super_admin',
  COMPANY_ADMIN: 'company_admin',
  ADMIN: 'admin',
  OPERATIONAL_HEAD: 'operational_head',
  BRANCH_MANAGER: 'branch_manager',
  TEAM_LEADER: 'team_leader',
  COUNSELLOR: 'counsellor',
  COUNSELOR: 'counsellor',
  TEACHER: 'teacher',
  APPLICATION_OFFICER: 'application_officer',
  VISA_OFFICER: 'visa_officer',
  FINANCE_MANAGER: 'finance_manager',
  FINANCE_EXECUTIVE: 'finance_executive',
  MARKETING_MANAGER: 'marketing_manager',
  MARKETING_EXECUTIVE: 'marketing_executive',
  RECEPTIONIST: 'receptionist',
  TELECALLER: 'telecaller',
  DOCUMENT_EXECUTIVE: 'document_executive',
  COMPLIANCE_OFFICER: 'compliance_officer',
  PARTNER_MANAGER: 'partner_manager',
  PARTNER: 'partner',
  STUDENT_PORTAL: 'student_portal',
  VIEWER: 'viewer',
};

export const ROLE_META = {
  [ROLES.SUPER_ADMIN]: {
    label: 'Super Admin',
    badgeClass: 'bg-brand text-white',
    iconBg: 'bg-brand-soft text-brand',
    description: 'Full system access including audit logs',
  },
  [ROLES.COMPANY_ADMIN]: {
    label: 'Company Admin',
    badgeClass: 'bg-info text-white',
    iconBg: 'bg-info-soft text-info',
    description: 'Manage users, settings, Masters, and all CRM modules',
  },
  [ROLES.ADMIN]: {
    label: 'Admin',
    badgeClass: 'bg-info text-white',
    iconBg: 'bg-info-soft text-info',
    description: 'Manage users, settings, and all CRM modules',
  },
  [ROLES.BRANCH_MANAGER]: {
    label: 'Branch Manager',
    badgeClass: 'bg-warning text-white',
    iconBg: 'bg-warning-soft text-warning',
    description: 'Assign work, export data, oversee branch pipeline',
  },
  [ROLES.TEAM_LEADER]: {
    label: 'Team Leader',
    badgeClass: 'bg-warning text-white',
    iconBg: 'bg-warning-soft text-warning',
    description: 'Own assigned enquiries and counselling workload',
  },
  [ROLES.COUNSELLOR]: {
    label: 'Counsellor',
    badgeClass: 'bg-success text-white',
    iconBg: 'bg-success-soft text-success',
    description: 'Handle own enquiries, leads, and students — no Masters',
  },
  [ROLES.TEACHER]: {
    label: 'Teacher',
    badgeClass: 'bg-info text-white',
    iconBg: 'bg-info-soft text-info',
    description: 'Assigned classes and student attendance',
  },
  [ROLES.APPLICATION_OFFICER]: {
    label: 'Application Officer',
    badgeClass: 'bg-info text-white',
    iconBg: 'bg-info-soft text-info',
    description: 'Student applications workflow',
  },
  [ROLES.VISA_OFFICER]: {
    label: 'Visa Officer',
    badgeClass: 'bg-warning text-white',
    iconBg: 'bg-warning-soft text-warning',
    description: 'Visa case processing',
  },
  [ROLES.FINANCE_MANAGER]: {
    label: 'Finance Manager',
    badgeClass: 'bg-success text-white',
    iconBg: 'bg-success-soft text-success',
    description: 'Company invoices and collections',
  },
  [ROLES.FINANCE_EXECUTIVE]: {
    label: 'Finance Executive',
    badgeClass: 'bg-success text-white',
    iconBg: 'bg-success-soft text-success',
    description: 'Branch invoices and payment collect',
  },
  [ROLES.RECEPTIONIST]: {
    label: 'Receptionist',
    badgeClass: 'bg-brand text-white',
    iconBg: 'bg-brand-soft text-brand',
    description: 'Walk-in registration and counsellor assignment',
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
    // description: '',
  };
}

export function isAdminRole(slug) {
  return slug === ROLES.SUPER_ADMIN
    || slug === ROLES.COMPANY_ADMIN
    || slug === ROLES.ADMIN;
}

export function canManageUsers(slug, permissions = []) {
  return isAdminRole(slug)
    || permissions.includes('users.view')
    || permissions.includes('users:view');
}
