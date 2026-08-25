import { hasAnyPermission } from '../../config/permissions';
import { useSelector } from 'react-redux';
import { selectPermissions } from '../../redux/slices/authSlice';

/** Hide children unless user has the permission (or any of `permissions`). */
export default function PermissionGate({
  permission,
  permissions,
  children,
  fallback = null,
}) {
  const userPermissions = useSelector(selectPermissions);
  const required = permissions || (permission ? [permission] : []);
  if (required.length && !hasAnyPermission(userPermissions, required)) {
    return fallback;
  }
  return children;
}
