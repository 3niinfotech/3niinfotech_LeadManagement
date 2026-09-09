import Breadcrumb from './Breadcrumb';
import IconBox from '../ui/IconBox';

/**
 * Shared page header — breadcrumb path, title, subtitle, icon, actions.
 * Used inside ModulePageCard and standalone via PageHeader.
 */
export default function ModulePageHeader({
  title,
  subtitle,
  icon: Icon,
  iconColor = 'primary',
  breadcrumbs = [],
  actions,
  embedded = true,
  className = '',
}) {
  const pad = embedded ? 'px-4' : 'px-1';

  return (
    <header
      data-page-header
      className={`crm-page-header shrink-0 border-b border-border bg-card-bg ${embedded ? 'crm-page-header--embedded' : 'crm-page-header--standalone'} ${className}`.trim()}
    >
      {breadcrumbs.length > 0 && (
        <div className={`${pad} pt-2.5 pb-0`}>
          <Breadcrumb items={breadcrumbs} />
        </div>
      )}

      <div
        className={`flex items-center justify-between gap-4 ${pad} ${breadcrumbs.length > 0 ? 'pt-2 pb-3' : 'py-3'}`}
      >
        <div className="flex items-center gap-3.5 min-w-0">
          {Icon && (
            <IconBox
              icon={Icon}
              color={iconColor}
              size="md"
              iconSize="md"
              variant="header"
            />
          )}
          <div className="min-w-0">
            <h1 className="text-[17px] font-semibold text-text tracking-[-0.01em] leading-tight truncate">
              {title}
            </h1>
            {subtitle && (
              <p className="text-[13px] text-text-muted leading-snug mt-1 truncate">
                {subtitle}
              </p>
            )}
          </div>
        </div>

        {actions && (
          <div className="flex items-center gap-2 shrink-0">{actions}</div>
        )}
      </div>
    </header>
  );
}

ModulePageHeader.displayName = 'ModulePageHeader';
