import { Link } from 'react-router-dom';
import { FiBarChart2, FiDownload, FiRefreshCw } from 'react-icons/fi';
import ModulePageCard from '../../../components/layout/ModulePageLayout';
import Button from '../../../components/ui/Button';
import { ROUTES } from '../../../config/routes';
import ReportFiltersBar from './ReportFiltersBar';

export default function ReportPageShell({
  title,
  subtitle,
  breadcrumbs = [],
  actions,
  filters,
  showExport = true,
  children,
}) {
  const crumbs = [
    { label: 'Dashboard', path: ROUTES.DASHBOARD },
    { label: 'Reports', path: ROUTES.REPORTS },
    ...breadcrumbs,
  ];

  const headerActions = (
    <div className="flex items-center gap-2">
      {actions}
      {filters?.onRefresh && (
        <Button
          size="sm"
          variant="outline"
          icon={FiRefreshCw}
          loading={filters.refreshLoading}
          onClick={filters.onRefresh}
        >
          Refresh
        </Button>
      )}
      {showExport && (
        <Link to={ROUTES.REPORTS_EXPORT || `${ROUTES.REPORTS}/export`}>
          <Button size="sm" variant="primary" icon={FiDownload}>
            Export
          </Button>
        </Link>
      )}
    </div>
  );

  return (
    <div className="h-full min-h-0 flex flex-col">
      <ModulePageCard
        title={title}
        subtitle={subtitle}
        icon={FiBarChart2}
        iconColor="primary"
        breadcrumbs={crumbs}
        actions={headerActions}
      >
        {filters && (
          <div className="crm-report-toolbar">
            <ReportFiltersBar {...filters} hideRefresh />
          </div>
        )}
        <div className="crm-report-body">
          {children}
        </div>
      </ModulePageCard>
    </div>
  );
}

export function ReportSectionChips({ items, activeId, basePath }) {
  return (
    <div className="crm-report-chips">
      {items.map((item) => {
        const to = `${basePath}/${item.id}`;
        const active = activeId === item.id;
        const Icon = item.icon;
        return (
          <Link
            key={item.id}
            to={to}
            className={`crm-report-chip${active ? ' crm-report-chip--active' : ''}`}
          >
            {Icon ? <Icon className="h-3.5 w-3.5" strokeWidth={1.75} /> : null}
            {item.label}
          </Link>
        );
      })}
    </div>
  );
}

export function ReportEmpty({ message = 'No data available for selected filters.', icon: Icon = FiBarChart2 }) {
  return (
    <div className="crm-report-empty">
      <div className="crm-report-empty__icon-wrap">
        <Icon className="w-5 h-5" />
      </div>
      <p className="crm-report-empty__title">No data available</p>
      <p className="crm-report-empty__msg">{message}</p>
    </div>
  );
}

export function ReportError({ message = 'Unable to load report.', onRetry }) {
  return (
    <div className="crm-report-empty crm-report-empty--error">
      <div className="crm-report-empty__icon-wrap crm-report-empty__icon-wrap--error">
        <FiBarChart2 className="w-5 h-5" />
      </div>
      <p className="crm-report-empty__title">Unable to load report</p>
      <p className="crm-report-empty__msg">{message}</p>
      {onRetry && (
        <Button size="sm" variant="outline" className="mt-3" onClick={onRetry}>
          Try Again
        </Button>
      )}
    </div>
  );
}
