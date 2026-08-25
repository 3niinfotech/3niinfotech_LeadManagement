/**
 * Server-side role access guards — keep in sync with frontend access-policy.js
 */

/** Field roles that must never receive Masters / Settings / Roles admin keys */
export const FORCE_DENY_PREFIXES_BY_ROLE = {
  counsellor: ['masters.', 'settings.', 'roles.', 'users.', 'audit.', 'feature.', 'accounts.', 'reception.'],
  team_leader: ['masters.', 'settings.', 'roles.', 'users.', 'audit.'],
  telecaller: ['masters.', 'settings.', 'roles.', 'users.', 'audit.', 'accounts.', 'application.', 'visa.'],
  receptionist: ['masters.', 'settings.', 'roles.', 'users.', 'audit.', 'accounts.', 'application.', 'visa.'],
  teacher: ['masters.', 'settings.', 'roles.', 'users.', 'audit.', 'accounts.', 'application.', 'visa.'],
  application_officer: ['masters.', 'settings.', 'roles.', 'users.', 'audit.', 'accounts.'],
  visa_officer: ['masters.', 'settings.', 'roles.', 'users.', 'audit.', 'accounts.'],
};

/** Reception is an intentionally closed workspace; extra DB grants cannot widen it. */
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

export function sanitizePermissionKeysForRole(roleSlug, keys = []) {
  if (roleSlug === 'receptionist') {
    return keys.filter((key) => RECEPTIONIST_ALLOWED_PERMISSIONS.has(String(key).replace(/:/g, '.')));
  }
  const prefixes = FORCE_DENY_PREFIXES_BY_ROLE[roleSlug];
  if (!prefixes?.length) return keys;
  return keys.filter((key) => !prefixes.some(
    (p) => key === p.slice(0, -1) || String(key).startsWith(p),
  ));
}
