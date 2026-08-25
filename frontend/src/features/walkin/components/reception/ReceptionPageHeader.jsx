import { FiUserPlus, FiRefreshCw } from 'react-icons/fi';
import Button from '../../../../components/ui/Button';
import ModulePageHeader from '../../../../components/layout/ModulePageHeader';
import PermissionGate from '../../../../components/common/PermissionGate';
import { PERMISSIONS } from '../../../../config/permissions';

export default function ReceptionPageHeader({
  onRegister,
  onRefresh,
  refreshing = false,
}) {
  const now = new Date();
  const dateStr = now.toLocaleDateString('en-IN', {
    weekday: 'short', day: 'numeric', month: 'short', year: 'numeric',
  });
  const timeStr = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });

  return (
    <div className="crm-reception-header">
      <ModulePageHeader
        title="Reception Registration"
        subtitle="Walk-ins, waiting list, and counsellor assign"
        icon={FiUserPlus}
        iconColor="primary"
        breadcrumbs={[
          { label: 'Dashboard', path: '/admin/dashboard' },
          { label: 'Reception Registration' },
        ]}
        embedded
        actions={(
          <div className="flex flex-wrap items-center gap-2">
            <span className="crm-reception-header__datetime hidden lg:inline">
              {dateStr}
              {' · '}
              {timeStr}
            </span>
            <PermissionGate permission={PERMISSIONS.WALKIN_CREATE}>
              <Button size="sm" icon={FiUserPlus} onClick={onRegister}>
                Register Visitor
              </Button>
            </PermissionGate>
            <Button size="sm" variant="outline" icon={FiRefreshCw} onClick={onRefresh} loading={refreshing}>
              Refresh
            </Button>
          </div>
        )}
      />
    </div>
  );
}
