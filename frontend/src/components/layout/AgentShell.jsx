import { CompanyRuntimeProvider } from '../../features/organization/CompanyRuntime';
import PortalShell from '../portal/PortalShell';
import { ROUTES } from '../../config/routes';

export default function AgentShell() {
  return (
    <CompanyRuntimeProvider>
      <PortalShell
        role="agent"
        portalLabel="Agent Portal"
        profileRoute={ROUTES.AGENT_PROFILE}
        notificationsRoute={ROUTES.NOTIFICATIONS}
      />
    </CompanyRuntimeProvider>
  );
}
