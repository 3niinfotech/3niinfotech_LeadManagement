import { Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { selectUser } from '../../redux/slices/authSlice';
import { getDefaultRoute, resolvePortalFromRole } from '../../config/portal.config';

export default function RoleHomeRedirect() {
  const user = useSelector(selectUser);
  const portal = user?.portal || resolvePortalFromRole(user?.role?.slug);
  const to = user?.defaultRoute || getDefaultRoute(portal, user);
  return <Navigate to={to} replace />;
}
