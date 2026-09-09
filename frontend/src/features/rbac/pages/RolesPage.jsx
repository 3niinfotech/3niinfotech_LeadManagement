import { Navigate } from 'react-router-dom';
import { ROUTES } from '../../../config/routes';

/** Legacy route — unified Team & Access hub */
export default function RolesPage() {
  return <Navigate to={`${ROUTES.USERS}?tab=roles`} replace />;
}
