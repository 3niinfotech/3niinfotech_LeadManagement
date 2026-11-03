import { CompanyRuntimeProvider } from '../../features/organization/CompanyRuntime';
import PortalShell from '../portal/PortalShell';
import { ROUTES } from '../../config/routes';

export default function TeacherPortalShell() {
  return (
    <CompanyRuntimeProvider>
      <PortalShell
        role="teacher"
        portalLabel="Teacher"
        profileRoute={ROUTES.PROFILE}
        notificationsRoute={ROUTES.NOTIFICATIONS}
      />
    </CompanyRuntimeProvider>
  );
}
