import { useSelector } from 'react-redux';
import { selectPermissions, selectUser } from '../redux/slices/authSlice';
import { hasAnyPermission, hasPermission } from '../config/permissions';
import { isAdminRole, canManageUsers as canManageUsersByRole } from '../config/roles';

export function usePermissions() {
  const permissions = useSelector(selectPermissions);
  const user = useSelector(selectUser);
  const roleSlug = user?.role?.slug;

  return {
    permissions,
    roleSlug,
    can: (permission) => hasPermission(permissions, permission),
    canAny: (perms) => hasAnyPermission(permissions, perms),
    isSuperAdmin: roleSlug === 'super_admin',
    isAdmin: isAdminRole(roleSlug),
    canManageUsers: canManageUsersByRole(roleSlug, permissions),
  };
}
