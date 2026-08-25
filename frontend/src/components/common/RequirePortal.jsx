import { Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { selectUser } from '../../redux/slices/authSlice';
import { resolvePortalFromRole, getDefaultRoute } from '../../config/portal.config';

export default function RequirePortal({ portal, children }) {
  const user = useSelector(selectUser);
  const userPortal = user?.portal || resolvePortalFromRole(user?.role?.slug);

  if (userPortal !== portal) {
    return <Navigate to={user?.defaultRoute || getDefaultRoute(userPortal, user)} replace />;
  }

  return children;
}
