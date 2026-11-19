import { Link, useLocation } from 'react-router-dom';
import { FiBarChart2, FiDownload, FiRefreshCw } from 'react-icons/fi';
import ModulePageCard from '../../../components/layout/ModulePageLayout';
import Button from '../../../components/ui/Button';
import { ROUTES } from '../../../config/routes';
import { REPORT_NAV_TABS } from '../config/reports.config';
import ReportHeaderFilters from './ReportHeaderFilters';

export default function ReportPageShell({
  title,
  subtitle,
  breadcrumbs = [],
  actions,
  filters,
  showExport = true,
  hideNav = false,
  children,
}) {
  const location = useLocation();
  const path = location.pathname;

  const crumbs = [
    { label: 'Dashboard', path: ROUTES.DASHBOARD },
    { label: 'Reports', path: ROUTES.REPORTS },
    ...breadcrumbs,
  ];

  const headerActions = (
    <div className="flex items-center flex-wrap gap-2">
      {filters && (
        <ReportHeaderFilters {...filters} />
      )}
      {actions}
      {filters?.onRefresh && (
        <Button
          size="sm"
          variant="outline"
          icon={FiRefreshCw}
          loading={filters.refreshLoading}
          onClick={filters.onRefresh}
          className="h-8"
        >
          Refresh
        </Button>
      )}
      {showExport && (
        <Link to={ROUTES.REPORTS_EXPORT || `${ROUTES.REPORTS}/export`}>
          <Button size="sm" variant="primary" icon={FiDownload} className="h-8">
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
        {!hideNav && (
          <div className="px-4 pt-3.5 pb-1 bg-white dark:bg-slate-900 border-b border-slate-200/80 dark:border-slate-800">
            <nav className="crm-reports-nav" aria-label="Reports Navigation">
              {REPORT_NAV_TABS.map((tab) => {
                const Icon = tab.icon;
                const isExactOverview = tab.path === ROUTES.REPORTS && (path === ROUTES.REPORTS || path === `${ROUTES.REPORTS}/`);
                const isSubActive = tab.path !== ROUTES.REPORTS && path.startsWith(tab.path);
                const active = isExactOverview || isSubActive;

                return (
                  <Link
                    key={tab.id}
                    to={tab.path}
                    className={`crm-reports-nav__item ${active ? 'crm-reports-nav__item--active' : ''}`}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    <span>{tab.label}</span>
                  </Link>
                );
              })}
            </nav>
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

export function ReportEmpty({ message = 'No data available for selected filters.', icon: Icon = FiBarChart2, onResetAllTime }) {
  return (
    <div className="crm-report-empty">
      <div className="crm-report-empty__icon-wrap">
        <Icon className="w-5 h-5 text-slate-400" />
      </div>
      <p className="crm-report-empty__title text-slate-800 dark:text-slate-200">No records found</p>
      <p className="crm-report-empty__msg text-slate-500 dark:text-slate-400">{message}</p>
      {onResetAllTime && (
        <Button size="sm" variant="outline" className="mt-3" onClick={onResetAllTime}>
          View All Time Data
        </Button>
      )}
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
