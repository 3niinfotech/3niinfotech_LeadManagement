/**
 * Role access policy — who sees Masters, who can manage Advanced Access,
 * and the human-readable role matrix (Notepad / Documentation).
 */

/** These roles never see Masters / Settings admin surfaces (even if a key was granted). */
export const FORCE_NO_MASTERS_ROLES = new Set([
  'counsellor',
  'team_leader',
  'telecaller',
  'receptionist',
  'teacher',
  'marketing_executive',
  'document_executive',
  'application_officer',
  'visa_officer',
  'finance_executive',
  'partner',
  'student_portal',
]);

/** Permission key prefixes stripped server-side + locked in Advanced UI for field roles */
export const FORCE_DENY_PREFIXES_BY_ROLE = {
  counsellor: ['masters.', 'settings.', 'roles.', 'users.', 'audit.', 'feature.', 'accounts.', 'reception.'],
  team_leader: ['masters.', 'settings.', 'roles.', 'users.', 'audit.'],
  telecaller: ['masters.', 'settings.', 'roles.', 'users.', 'audit.', 'accounts.', 'application.', 'visa.'],
  receptionist: ['masters.', 'settings.', 'roles.', 'users.', 'audit.', 'accounts.', 'application.', 'visa.'],
  teacher: ['masters.', 'settings.', 'roles.', 'users.', 'audit.', 'accounts.', 'application.', 'visa.'],
  application_officer: ['masters.', 'settings.', 'roles.', 'users.', 'audit.', 'accounts.'],
  visa_officer: ['masters.', 'settings.', 'roles.', 'users.', 'audit.', 'accounts.'],
  partner: ['masters.', 'settings.', 'roles.', 'users.', 'audit.', 'feature.', 'accounts.', 'reception.', 'attendance.', 'teacher.', 'telecaller.'],
};

export const ADMIN_ROLE_SLUGS = new Set(['super_admin', 'company_admin', 'admin']);

/** Reception is a closed workspace; Profile is auth-scoped and needs no permission key. */
export const RECEPTIONIST_ALLOWED_PERMISSIONS = new Set([
  'dashboard.view',
  'reception.walkin.view',
  'reception.walkin.create',
  'reception.walkin.update',
  'reception.walkin.assign',
  'calendar.view',
  'calendar.create',
  'calendar.update',
  'calendar.assign',
  'calendar.complete',
  'calendar.reschedule',
]);

export function isAdminSlug(slug) {
  return ADMIN_ROLE_SLUGS.has(slug);
}

export function isMastersForcedHidden(roleSlug) {
  return FORCE_NO_MASTERS_ROLES.has(roleSlug);
}

/** Counsellor never uses Reception — register/assign is receptionist-only. */
export const FORCE_NO_RECEPTION_ROLES = new Set(['counsellor']);

export function isReceptionForcedHidden(roleSlug) {
  return FORCE_NO_RECEPTION_ROLES.has(roleSlug);
}

export function isPermissionDeniedForRole(roleSlug, permissionKey) {
  if (roleSlug === 'receptionist') {
    return !RECEPTIONIST_ALLOWED_PERMISSIONS.has(String(permissionKey || '').replace(/:/g, '.'));
  }
  const prefixes = FORCE_DENY_PREFIXES_BY_ROLE[roleSlug];
  if (!prefixes?.length || !permissionKey) return false;
  return prefixes.some((p) => permissionKey === p.slice(0, -1) || permissionKey.startsWith(p));
}

/**
 * Human guide — shown on Documentation / Role Access Notepad.
 * Keep in sync with backend default-roles.js intent.
 */
export const ROLE_ACCESS_GUIDE = [
  {
    slug: 'super_admin',
    name: 'Super Admin',
    dataScope: 'GLOBAL',
    sees: 'All companies, all modules, Masters, Roles, Audit, Feature Toggle',
    hides: 'Nothing (full platform)',
    buttons: 'All create / edit / delete / export / assign / import',
    notes: 'Only platform support should use GLOBAL without a company.',
  },
  {
    slug: 'company_admin',
    name: 'Company Admin',
    dataScope: 'COMPANY',
    sees: 'Everything inside own company — Masters, Staff, Roles Advanced, Settings',
    hides: 'Other companies; audit (by default)',
    buttons: 'All company buttons',
    notes: 'Can open Masters → Advanced Access and toggle role permissions live.',
  },
  {
    slug: 'operational_head',
    name: 'Operational Head',
    dataScope: 'COMPANY',
    sees: 'Ops modules (enquiry, student, application, visa), reports, users view',
    hides: 'Masters manage, Settings manage, role edit (view only)',
    buttons: 'Module CRUD where granted; no Masters setup',
    notes: 'Cross-branch ops without config admin.',
  },
  {
    slug: 'branch_manager',
    name: 'Branch Manager',
    dataScope: 'BRANCH',
    sees: 'Own branch pipeline: reception, enquiry, students, light application/visa',
    hides: 'Masters, company settings, other branches',
    buttons: 'Assign, export, update; limited delete',
    notes: 'Manages branch team workload.',
  },
  {
    slug: 'team_leader',
    name: 'Team Leader',
    dataScope: 'OWN (forced for lists)',
    sees: 'Only records assigned to them (enquiry / lead / student)',
    hides: 'Masters (forced), Settings, other counsellors’ data',
    buttons: 'Create/update enquiry & student; no delete / no Masters',
    notes: 'Assignable as counsellor. Amber “You” rows = assigned to self.',
  },
  {
    slug: 'counsellor',
    name: 'Counsellor',
    dataScope: 'OWN',
    sees: 'Dashboard + My Enquiries / My Students / applications / documents / calendar',
    hides: 'Reception (forced), Masters (forced), Settings, Roles, Users, Fees admin',
    buttons: 'Update own enquiries and students; no Reception register/assign',
    notes: 'Reception assigns visitors → they appear on My Enquiries. Counsellor never sees the Reception page.',
  },
  {
    slug: 'application_officer',
    name: 'Application Officer',
    dataScope: 'BRANCH',
    sees: 'Student (view) + Applications module',
    hides: 'Masters, counselling pipeline tools',
    buttons: 'Application CRUD',
    notes: 'Focused application workflow.',
  },
  {
    slug: 'visa_officer',
    name: 'Visa Officer',
    dataScope: 'BRANCH',
    sees: 'Student (view) + Visa module',
    hides: 'Masters, full enquiry admin',
    buttons: 'Visa CRUD',
    notes: 'Visa stage only.',
  },
  {
    slug: 'finance_manager',
    name: 'Finance Manager',
    dataScope: 'COMPANY',
    sees: 'Accounts / invoices / payments, reports',
    hides: 'Masters CRM setup',
    buttons: 'Accounts module',
    notes: 'Company finance.',
  },
  {
    slug: 'finance_executive',
    name: 'Finance Executive',
    dataScope: 'BRANCH',
    sees: 'Invoice view/create, payment collect',
    hides: 'Masters, broad CRM',
    buttons: 'Invoice + collect',
    notes: 'Branch collections.',
  },
  {
    slug: 'receptionist',
    name: 'Receptionist',
    dataScope: 'BRANCH',
    sees: 'Reception Dashboard, Walk-ins, Calendar, own Profile / Personal Settings',
    hides: 'Enquiry, Students, Demos, Masters, finance, visa, applications, reports, users and company settings',
    buttons: 'Register/assign visitors; create, reschedule, assign and complete calendar events',
    notes: 'Closed front-desk workspace. Extra DB grants cannot widen this role.',
  },
  {
    slug: 'teacher',
    name: 'Teacher',
    dataScope: 'BRANCH (assigned batches only)',
    sees: 'Dashboard, assigned batches/classes, student class attendance',
    hides: 'Masters, finance, visa, applications, reception admin, teacher attendance',
    buttons: 'Mark student attendance while the window is open',
    notes: 'Instructor only. Teacher check-in / payroll attendance is out of scope.',
  },
  {
    slug: 'telecaller',
    name: 'Telecaller',
    dataScope: 'OWN',
    sees: 'Own enquiries / leads',
    hides: 'Masters (forced)',
    buttons: 'Create/update enquiry',
    notes: 'Outbound calling.',
  },
  {
    slug: 'student_portal',
    name: 'Student (portal)',
    dataScope: 'OWN',
    sees: 'Own student profile / applications only',
    hides: 'Staff CRM, Masters, Enquiry list of others',
    buttons: 'Portal actions only',
    notes: 'Student login surface — never staff Masters.',
  },
  {
    slug: 'partner',
    name: 'Partner (Agent)',
    dataScope: 'OWN',
    sees: 'Dashboard, My Referred Enquiries, My Students, Applications, Calendar, Profile',
    hides: 'Reception, Masters, Settings, Roles, Users, Fees admin, other agents’ records',
    buttons: 'Refer student, view application status, upload documents',
    notes: 'Partner agent workspace. Dedicated agent login surface with professional CRM workspace.',
  },
  {
    slug: 'viewer',
    name: 'Viewer',
    dataScope: 'BRANCH / COMPANY (role)',
    sees: 'Read-only modules granted',
    hides: 'Create/edit/delete buttons',
    buttons: 'None for mutations',
    notes: 'Audit-friendly read access.',
  },
];

export const ACCESS_HOWTO = [
  'Admin / Super Admin open Masters → Access Management → Advanced Access.',
  'Select a role (e.g. Counsellor). Toggle any permission checkbox.',
  'Each click calls PATCH /rbac/:id immediately — no separate Save for permissions.',
  'Affected users pick up new buttons after refresh / next login (profile reload).',
  'Masters / Settings / Roles keys stay locked OFF for Counsellor & Team Leader (forced).',
  'Data lists still respect OWN / BRANCH / COMPANY scope — permission ≠ seeing other people’s records.',
];
