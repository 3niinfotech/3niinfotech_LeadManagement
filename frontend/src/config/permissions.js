/** Legacy colon keys → dot keys (mirrors backend) */
const LEGACY_ALIASES = {
  'dashboard:view': 'dashboard.view',
  'enquiries:view': 'enquiry.view',
  'enquiries:create': 'enquiry.create',
  'enquiries:update': 'enquiry.update',
  'enquiries:delete': 'enquiry.delete',
  'enquiries:export': 'enquiry.export',
  'leads:view': 'lead.view',
  'leads:create': 'lead.create',
  'leads:update': 'lead.update',
  'leads:delete': 'lead.delete',
  'leads:assign': 'lead.assign',
  'leads:export': 'lead.export',
  'students:view': 'student.view',
  'students:create': 'student.create',
  'students:update': 'student.update',
  'students:delete': 'student.delete',
  'students:assign': 'student.assign',
  'students:export': 'student.export',
  'applications:view': 'application.view',
  'visas:view': 'visa.view',
  'invoices:view': 'accounts.invoice.view',
  'partners:view': 'partner.view',
  'documents:view': 'document.view',
  'reports:view': 'reports.view',
  'users:view': 'users.view',
  'settings:view': 'settings.view',
  'settings:update': 'settings.manage',
};

export const normalizePermission = (key) => {
  if (!key) return key;
  if (LEGACY_ALIASES[key]) return LEGACY_ALIASES[key];
  return String(key).replace(/:/g, '.');
};

export const PERMISSIONS = {
  DASHBOARD_VIEW: 'dashboard.view',
  ENQUIRIES_VIEW: 'enquiry.view',
  ENQUIRIES_CREATE: 'enquiry.create',
  ENQUIRIES_UPDATE: 'enquiry.update',
  ENQUIRIES_DELETE: 'enquiry.delete',
  ENQUIRIES_EXPORT: 'enquiry.export',
  WALKIN_VIEW: 'reception.walkin.view',
  WALKIN_CREATE: 'reception.walkin.create',
  WALKIN_UPDATE: 'reception.walkin.update',
  WALKIN_DELETE: 'reception.walkin.delete',
  WALKIN_ASSIGN: 'reception.walkin.assign',
  LEADS_VIEW: 'lead.view',
  LEADS_CREATE: 'lead.create',
  LEADS_UPDATE: 'lead.update',
  LEADS_DELETE: 'lead.delete',
  LEADS_ASSIGN: 'lead.assign',
  LEADS_EXPORT: 'lead.export',
  STUDENTS_VIEW: 'student.view',
  STUDENTS_CREATE: 'student.create',
  STUDENTS_UPDATE: 'student.update',
  STUDENTS_DELETE: 'student.delete',
  STUDENTS_ASSIGN: 'student.assign',
  STUDENTS_EXPORT: 'student.export',
  APPLICATIONS_VIEW: 'application.view',
  VISAS_VIEW: 'visa.view',
  INVOICES_VIEW: 'accounts.invoice.view',
  PARTNERS_VIEW: 'partner.view',
  DOCUMENTS_VIEW: 'document.view',
  REPORTS_VIEW: 'reports.view',
  USERS_VIEW: 'users.view',
  USERS_CREATE: 'users.create',
  USERS_UPDATE: 'users.update',
  ROLES_VIEW: 'roles.view',
  ROLES_CREATE: 'roles.create',
  ROLES_UPDATE: 'roles.update',
  ROLES_DELETE: 'roles.delete',
  ROLES_ASSIGN: 'roles.assign',
  ROLES_EXPORT: 'roles.export',
  ROLES_CLONE: 'roles.clone',
  SETTINGS_VIEW: 'settings.view',
  SETTINGS_UPDATE: 'settings.manage',
  MASTERS_VIEW: 'masters.view',
  MASTERS_MANAGE: 'masters.manage',
};

const normalizeSet = (perms = []) => new Set(perms.map(normalizePermission));

export const hasPermission = (userPermissions, permission) => {
  const set = normalizeSet(userPermissions);
  if (set.has('*')) return true;
  return set.has(normalizePermission(permission));
};

export const hasAnyPermission = (userPermissions, permissions) =>
  permissions.some((p) => hasPermission(userPermissions, p));
