import PortalShell from '../portal/PortalShell';
import { ROUTES } from '../../config/routes';

export default function TeacherPortalShell() {
  return (
    <PortalShell
      role="teacher"
      portalLabel="Teacher"
      profileRoute={ROUTES.PROFILE}
      notificationsRoute={ROUTES.NOTIFICATIONS}
    />
  );
}
