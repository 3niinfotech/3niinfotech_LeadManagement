import { Link } from 'react-router-dom';
import { FiSliders, FiToggleLeft, FiDatabase, FiChevronRight, FiUsers, FiShield } from 'react-icons/fi';
import ModulePageCard from '../../components/layout/ModulePageLayout';
import Card from '../../components/ui/Card';
import { ROUTES } from '../../config/routes';
import { PERMISSIONS } from '../../config/permissions';
import { usePermissions } from '../../hooks/usePermissions';
import NotificationPreferencesCard from '../../features/settings/components/NotificationPreferencesCard';

const LINKS = [
  {
    title: 'Staff & Users',
    description: 'Add counsellors, assign roles, and manage team members',
    path: `${ROUTES.MASTER}/staff`,
    icon: FiUsers,
    permissions: [PERMISSIONS.USERS_VIEW, PERMISSIONS.MASTERS_VIEW],
  },
  {
    title: 'Roles & Permissions',
    description: 'Configure role permissions and access matrix',
    path: ROUTES.ROLES,
    icon: FiShield,
    permissions: [PERMISSIONS.ROLES_VIEW],
  },
  {
    title: 'Feature Toggle',
    description: 'Enterprise module toggles and reception walk-in settings',
    path: ROUTES.FEATURE_TOGGLE,
    icon: FiToggleLeft,
    permissions: [PERMISSIONS.SETTINGS_UPDATE],
  },
  {
    title: 'Master Data',
    description: 'Company, academic, visa, finance, CRM and all reference masters',
    path: ROUTES.MASTER,
    icon: FiDatabase,
    permissions: [PERMISSIONS.MASTERS_VIEW, PERMISSIONS.MASTERS_MANAGE],
  },
];

export default function SettingsPage() {
  const { canAny } = usePermissions();
  const visibleLinks = LINKS.filter((item) => !item.permissions?.length || canAny(item.permissions));
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
      <div className="flex-1 min-h-0 overflow-auto p-4 space-y-4">
        <NotificationPreferencesCard />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-3xl">
          {visibleLinks.map((item) => {
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
