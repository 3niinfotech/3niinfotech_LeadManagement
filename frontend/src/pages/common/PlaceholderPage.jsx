import { useLocation } from 'react-router-dom';
import { FiTool } from 'react-icons/fi';
import ModulePageCard from '../../components/layout/ModulePageLayout';
import Card from '../../components/ui/Card';
import IconBox from '../../components/ui/IconBox';
import { ROUTES } from '../../config/routes';
import { getNavByPath } from '../../config/navIcons.config';

export default function PlaceholderPage({ title, module }) {
  const location = useLocation();
  const nav = getNavByPath(location.pathname);
  const Icon = nav?.icon || FiTool;

  return (
    <ModulePageCard
      title={title}
      subtitle={`${title} module — ready for implementation`}
      icon={Icon}
      iconColor="secondary"
      breadcrumbs={[
        { label: 'Dashboard', path: ROUTES.DASHBOARD },
        { label: title },
      ]}
    >
      <div className="flex-1 min-h-0 overflow-auto p-4">
        <Card className="text-center !p-12">
          <div className="flex flex-col items-center gap-4">
            <IconBox icon={Icon} color="secondary" size="lg" iconSize="lg" />
            <p className="text-text-muted max-w-md">
              The {module || title} module architecture is in place. Backend API routes and frontend services are ready to extend.
            </p>
          </div>
        </Card>
      </div>
    </ModulePageCard>
  );
}
