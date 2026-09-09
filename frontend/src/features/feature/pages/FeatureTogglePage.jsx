import { FiToggleLeft } from 'react-icons/fi';
import ModulePageCard from '../../../components/layout/ModulePageLayout';
import { ROUTES } from '../../../config/routes';
import FeatureTogglePanel from '../../settings/components/FeatureTogglePanel';
import '../../settings/styles/settings.theme.css';

/** Legacy route — same panel as Settings → Feature toggles. */
export default function FeatureTogglePage() {
  return (
    <ModulePageCard
      title="Feature Toggle"
      subtitle="Simple Mode vs Enterprise Mode — enable modules per company without code changes"
      icon={FiToggleLeft}
      breadcrumbs={[
        { label: 'Dashboard', path: ROUTES.DASHBOARD },
        { label: 'Settings', path: `${ROUTES.SETTINGS}?tab=features` },
        { label: 'Feature Toggle' },
      ]}
    >
      <div className="flex-1 min-h-0 overflow-auto p-4">
        <FeatureTogglePanel />
      </div>
    </ModulePageCard>
  );
}
