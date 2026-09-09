import { Navigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { selectIsAuthenticated, selectUser } from '../../redux/slices/authSlice';
import { resolvePortalFromRole, getDefaultRoute, PORTAL_META, PORTALS } from '../../config/portal.config';
import { ROUTES } from '../../config/routes';

export default function ProtectedRoute({ children, portal }) {
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const user = useSelector(selectUser);
  const location = useLocation();

  if (!isAuthenticated) {
    const pathPortal = portal || resolvePortalFromPath(location.pathname);
    const loginPath = PORTAL_META[pathPortal]?.loginPath || ROUTES.LANDING;
    return <Navigate to={loginPath} replace state={{ from: location.pathname }} />;
  }

  if (portal && user) {
    const userPortal = user.portal || resolvePortalFromRole(user.role?.slug);
    if (userPortal !== portal) {
      return <Navigate to={user.defaultRoute || getDefaultRoute(userPortal, user)} replace />;
    }
  }

  return children;
}

function resolvePortalFromPath(pathname) {
  if (pathname.startsWith('/student')) return PORTALS.STUDENT;
  if (pathname.startsWith('/agent')) return PORTALS.AGENT;
  return PORTALS.ADMIN;
}
