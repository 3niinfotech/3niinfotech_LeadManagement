import { LEGACY_PERMISSION_ALIASES } from '../../config/permission-registry.js';

/** Normalize permission key to dot notation */
export function normalizePermissionKey(key) {
  if (!key) return key;
  if (LEGACY_PERMISSION_ALIASES[key]) return LEGACY_PERMISSION_ALIASES[key];
  return String(key).replace(/:/g, '.');
}

/** Check if user has any of the required permissions */
export function hasPermission(userPermissions = [], required) {
  const normalized = new Set(userPermissions.map(normalizePermissionKey));
  if (normalized.has('*')) return true;
  const req = normalizePermissionKey(required);
  return normalized.has(req);
}

export function hasAnyPermission(userPermissions = [], requiredList = []) {
  return requiredList.some((p) => hasPermission(userPermissions, p));
}

/** Merge role permissions from junction table + legacy JSON + user overrides */
export function mergeUserPermissions(rolePermissions = [], legacyJson = [], overrides = []) {
  const set = new Set();

  legacyJson.forEach((k) => set.add(normalizePermissionKey(k)));

  rolePermissions.forEach((rp) => {
    if (rp.granted && rp.permission?.key) {
      set.add(normalizePermissionKey(rp.permission.key));
    }
  });

  overrides.forEach((o) => {
    if (o.expiresAt && new Date(o.expiresAt) < new Date()) return;
    if (o.granted && o.permission?.key) {
      set.add(normalizePermissionKey(o.permission.key));
    } else if (!o.granted && o.permission?.key) {
      set.delete(normalizePermissionKey(o.permission.key));
    }
  });

  return [...set];
}

export function slugify(text) {
  return String(text)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '');
}
