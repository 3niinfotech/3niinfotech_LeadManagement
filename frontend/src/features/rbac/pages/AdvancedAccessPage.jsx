import { Navigate } from 'react-router-dom';
import { ROUTES } from '../../../config/routes';

/** Legacy route — unified Team & Access hub (roles tab) */
export default function AdvancedAccessPage() {
  return <Navigate to={`${ROUTES.USERS}?tab=roles`} replace />;
}
