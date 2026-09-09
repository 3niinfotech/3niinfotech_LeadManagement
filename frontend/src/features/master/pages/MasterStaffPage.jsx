import { Navigate } from 'react-router-dom';
import { ROUTES } from '../../../config/routes';

/** Legacy master route — unified Team & Access hub */
export default function MasterStaffPage() {
  return <Navigate to={ROUTES.USERS} replace />;
}
