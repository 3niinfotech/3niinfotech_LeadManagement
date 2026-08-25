import { Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { usePermissions } from '../../hooks/usePermissions';
import { selectIsAuthenticated } from '../../redux/slices/authSlice';
import { ROUTES } from '../../config/routes';
import { isMastersForcedHidden } from '../../config/access-policy';

export default function PermissionRoute({
  permission,
  permissions,
  children,
  /** Block these role slugs even if they somehow have the permission keys */
  denyRoleSlugs,
  /** Where to send denied roles (defaults to 403) */
  redirectTo,
  /** Shortcut: block field roles from Masters */
  denyMastersForcedRoles = false,
}) {
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const { canAny, roleSlug } = usePermissions();

  if (!isAuthenticated) return <Navigate to={ROUTES.LOGIN} replace />;

  if (denyMastersForcedRoles && isMastersForcedHidden(roleSlug)) {
    return <Navigate to={ROUTES.FORBIDDEN} replace />;
  }

  if (denyRoleSlugs?.length && denyRoleSlugs.includes(roleSlug)) {
    return <Navigate to={redirectTo || ROUTES.FORBIDDEN} replace />;
  }

  const required = permissions || (permission ? [permission] : []);
  if (required.length && !canAny(required)) {
    return <Navigate to={ROUTES.FORBIDDEN} replace />;
  }

  return children;
}
