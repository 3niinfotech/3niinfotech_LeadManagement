import { Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { usePermissions } from '../../hooks/usePermissions';
import { selectIsAuthenticated } from '../../redux/slices/authSlice';
import { ROUTES } from '../../config/routes';

export default function PermissionRoute({ permission, permissions, children }) {
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const { canAny } = usePermissions();

  if (!isAuthenticated) return <Navigate to={ROUTES.LOGIN} replace />;

  const required = permissions || (permission ? [permission] : []);
  if (required.length && !canAny(required)) {
    return <Navigate to="/403" replace />;
  }

  return children;
}
