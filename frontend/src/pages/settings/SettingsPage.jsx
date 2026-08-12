import { Link } from 'react-router-dom';
import { FiSliders, FiToggleLeft, FiDatabase, FiChevronRight } from 'react-icons/fi';
import ModulePageCard from '../../components/layout/ModulePageLayout';
import Card from '../../components/ui/Card';
import { ROUTES } from '../../config/routes';

const LINKS = [
  {
    title: 'Feature Toggle',
    description: 'ON/OFF queue, live timing, manual register, enterprise modules',
    path: ROUTES.FEATURE_TOGGLE,
    icon: FiToggleLeft,
  },
  {
    title: 'Master Data',
    description: 'Company, academic, visa, finance, CRM and all reference masters',
    path: ROUTES.MASTER,
    icon: FiDatabase,
  },
];

export default function SettingsPage() {
  return (
    <ModulePageCard
      title="Settings"
      subtitle="System configuration and module controls"
      icon={FiSliders}
      iconColor="secondary"
      breadcrumbs={[
        { label: 'Dashboard', path: ROUTES.DASHBOARD },
        { label: 'Settings' },
      ]}
    >
      <div className="flex-1 min-h-0 overflow-auto p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-3xl">
          {LINKS.map((item) => {
            const Icon = item.icon;
            return (
              <Link key={item.path} to={item.path} className="block group">
                <Card className="p-5 h-full hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <Icon size={20} />
                      </span>
                      <div>
                        <p className="font-medium text-text group-hover:text-primary">{item.title}</p>
                        <p className="text-sm text-text-muted mt-0.5">{item.description}</p>
                      </div>
                    </div>
                    <FiChevronRight className="text-text-muted group-hover:text-primary shrink-0" />
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>
      </div>
    </ModulePageCard>
  );
}
