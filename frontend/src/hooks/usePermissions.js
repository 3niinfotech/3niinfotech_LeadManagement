import { useCallback, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { selectPermissions, selectUser } from '../redux/slices/authSlice';
import { hasAnyPermission, hasPermission } from '../config/permissions';
import { isAdminRole, canManageUsers as canManageUsersByRole } from '../config/roles';
import { isPermissionDeniedForRole } from '../config/access-policy';

/**
 * Stable permission helpers — safe to use in useEffect deps.
 * (Previously `can` was a new function every render → infinite load loops.)
 */
export function usePermissions() {
  const rawPermissions = useSelector(selectPermissions);
  const user = useSelector(selectUser);
  const roleSlug = user?.role?.slug;

  const permissions = useMemo(() => {
    if (!Array.isArray(rawPermissions)) return rawPermissions || [];
    return rawPermissions.filter((key) => !isPermissionDeniedForRole(roleSlug, key));
  }, [rawPermissions, roleSlug]);

  const permKey = useMemo(
    () => (Array.isArray(permissions) ? permissions.join('|') : ''),
    [permissions],
  );

  const can = useCallback(
    (permission) => hasPermission(permissions, permission),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- permKey tracks permissions content
    [permKey],
  );

  const canAny = useCallback(
    (perms) => hasAnyPermission(permissions, perms),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [permKey],
  );

  return useMemo(() => ({
    permissions,
    roleSlug,
    can,
    canAny,
    isSuperAdmin: roleSlug === 'super_admin',
    isAdmin: isAdminRole(roleSlug),
    canManageUsers: canManageUsersByRole(roleSlug, permissions),
  }), [permissions, roleSlug, can, canAny]);
}
