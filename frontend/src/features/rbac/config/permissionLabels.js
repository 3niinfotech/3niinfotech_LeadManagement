/**
 * Plain-language labels for non-IT admins.
 * Technical keys (enquiry.view) stay in code — never show on UI by default.
 */

const ACTION_HINT = {
  view: 'Can open & see this page / list',
  create: 'Can add new records',
  update: 'Can edit existing records',
  edit: 'Can edit existing records',
  delete: 'Can delete records',
  assign: 'Can assign to staff / counsellor',
  export: 'Can download Excel / export',
  import: 'Can upload Excel / import',
  approve: 'Can approve',
  reject: 'Can reject',
  bulk: 'Can use bulk actions on selected rows',
  manage: 'Can change settings',
  analytics: 'Can see charts & analytics',
  upload: 'Can upload files',
  submit: 'Can submit',
  finalize: 'Can finalize',
  collect: 'Can collect payment',
  clone: 'Can copy a role',
};

/** Extra plain descriptions when name alone is not enough */
const EXTRA_HINT = {
  'enquiry.update': 'Edit button, status, priority, tags',
  'enquiry.delete': 'Delete button on enquiry rows',
  'enquiry.export': 'Export button on enquiry page',
  'enquiry.import': 'Import button on enquiry page',
  'enquiry.assign': 'Assign counsellor / bulk assign',
  'enquiry.create': 'Register visitor / create enquiry',
  'enquiry.view': 'Enquiry menu & list',
  'masters.view': 'Masters menu (setup data)',
  'masters.manage': 'Add / edit master data',
  'settings.view': 'Settings menu',
  'settings.manage': 'Change company settings & feature toggle',
  'roles.view': 'See roles list',
  'roles.update': 'Change role permissions (this page)',
  'roles.create': 'Create new custom role',
  'roles.delete': 'Delete custom role',
  'users.view': 'Staff / users list',
  'users.create': 'Add new staff user',
  'users.update': 'Edit staff user',
  'reception.walkin.create': 'Register Visitor button',
  'student.view': 'Students menu & list',
  'reports.view': 'Reports menu',
  'reports.export': 'Download reports',
  'attendance.view': 'View class and demo attendance',
  'attendance.mark': 'Mark class attendance',
  'attendance.edit': 'Edit attendance before lock',
  'attendance.correct': 'Correct locked attendance with a reason',
  'attendance.report': 'Attendance reports',
};

function actionFromKey(key = '') {
  const parts = String(key).split('.');
  return parts[parts.length - 1] || '';
}

export function getPermissionPlainLabel(perm) {
  if (!perm) return 'Permission';
  return perm.name || String(perm.key || '').replace(/\./g, ' ');
}

export function getPermissionPlainHint(perm) {
  const key = perm?.key || '';
  if (EXTRA_HINT[key]) return EXTRA_HINT[key];
  const action = actionFromKey(key);
  if (ACTION_HINT[action]) return ACTION_HINT[action];
  return 'Controls access for this action';
}

export const DATA_SCOPE_PLAIN = {
  OWN: { label: 'Only own records', help: 'User sees only what is assigned to them' },
  TEAM: { label: 'Team records', help: 'User sees their team’s work' },
  BRANCH: { label: 'Whole branch', help: 'User sees all records in their branch' },
  COMPANY: { label: 'Whole company', help: 'User sees all records in the company' },
  GLOBAL: { label: 'All companies', help: 'Platform-wide access (Super Admin)' },
};
