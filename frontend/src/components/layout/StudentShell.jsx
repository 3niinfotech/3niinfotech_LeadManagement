import PortalShell from '../portal/PortalShell';
import { ROUTES } from '../../config/routes';

export default function StudentShell() {
  return (
    <PortalShell
      role="student"
      portalLabel="Student"
      profileRoute={ROUTES.STUDENT_PROFILE}
      notificationsRoute={ROUTES.STUDENT_NOTIFICATIONS}
    />
  );
}
