import {
  FiUserPlus, FiRefreshCw, FiDownload, FiSettings, FiPrinter, FiMaximize2,
} from 'react-icons/fi';
import Button from '../../../../components/ui/Button';
import ModulePageHeader from '../../../../components/layout/ModulePageHeader';

export default function ReceptionPageHeader({
  onRegister,
  onRefresh,
  onExport,
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
        subtitle="Register walk-in visitors in seconds, generate queue tokens, assign counsellors, and start the complete student journey."
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
            <Button size="sm" icon={FiUserPlus} onClick={onRegister}>
              Register Visitor
            </Button>
            <Button size="sm" variant="outline" icon={FiMaximize2} disabled title="Coming soon">
              Scan QR
            </Button>
            <Button size="sm" variant="outline" icon={FiRefreshCw} onClick={onRefresh} loading={refreshing}>
              Refresh
            </Button>
            <Button size="sm" variant="outline" icon={FiPrinter} disabled title="Select visitor to print">
              Print Token
            </Button>
            <Button size="sm" variant="outline" icon={FiDownload} onClick={onExport}>
              Export
            </Button>
            <Button size="sm" variant="ghost" icon={FiSettings} disabled title="Reception settings">
              Settings
            </Button>
          </div>
        )}
      />
    </div>
  );
}
