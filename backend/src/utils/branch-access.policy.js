import { hasPermission } from '../modules/rbac/rbac.util.js';

/** Platform operator — no company on account (rare; full access) */
export function isPlatformGlobalUser(user) {
  return user?.dataScope === 'GLOBAL' && !user?.companyId;
}

/**
 * Pure policy: which branches may this user read/write?
 * - ALL: platform global
 * - COMPANY: every branch in their company (COMPANY/GLOBAL scope OR both branch.switch + branch.view_multiple)
 * - LIST: only explicit branch ids (home branch + optional allowedBranchIds)
 * - NONE: no branch access
 */
export function resolveBranchAccessPolicy(user) {
  if (!user) return { mode: 'NONE', branchIds: [] };
  if (isPlatformGlobalUser(user)) return { mode: 'ALL', branchIds: null };

  const scope = user.dataScope || user.role?.dataScope || 'OWN';
  const perms = user.permissions || [];
  // Require BOTH permissions for multi-branch ops (matches navbar switcher gate)
  const canMulti = hasPermission(perms, 'branch.switch')
    && hasPermission(perms, 'branch.view_multiple');

  if (scope === 'GLOBAL' || scope === 'COMPANY' || canMulti) {
    return { mode: 'COMPANY', branchIds: null };
  }

  const extra = Array.isArray(user.allowedBranchIds)
    ? user.allowedBranchIds.filter(Boolean)
    : [];
  const ids = [...new Set([user.branchId, ...extra].filter(Boolean))];
  if (!ids.length) return { mode: 'NONE', branchIds: [] };
  return { mode: 'LIST', branchIds: ids };
}

/** Whether user may access a specific branch id under the policy (company already checked separately). */
export function isBranchIdAllowedByPolicy(policy, branchId) {
  if (!branchId) return false;
  if (policy.mode === 'ALL' || policy.mode === 'COMPANY') return true;
  if (policy.mode === 'LIST') return policy.branchIds.includes(branchId);
  return false;
}
