import ModulePageHeader from './ModulePageHeader';
import SummaryStatBar from '../ui/SummaryStatBar';

/**
 * Unified module page — ONE card fills the right content area.
 * Header (breadcrumb + title) lives inside the card. Table scrolls inside card body.
 *
 * Usage:
 * <ModulePageCard title="..." breadcrumbs={[...]} icon={FiInbox} actions={...}>
 *   <ModulePageCard.Stats items={statItems} activeFilter={...} onSelect={...} loading={...} />
 *   <ModulePageCard.Toolbar>...</ModulePageCard.Toolbar>
 *   <ModulePageCard.Table>...</ModulePageCard.Table>
 * </ModulePageCard>
 */
function ModulePageCardRoot({
  title,
  subtitle,
  icon,
  iconColor = 'primary',
  breadcrumbs = [],
  actions,
  children,
  className = '',
}) {
  return (
    <div className={`module-page-root flex flex-col h-full min-h-0 ${className}`}>
      <div className="flex flex-col flex-1 min-h-0 bg-card-bg border border-card-border rounded-xl shadow-card overflow-hidden">
        <ModulePageHeader
          title={title}
          subtitle={subtitle}
          icon={icon}
          iconColor={iconColor}
          breadcrumbs={breadcrumbs}
          actions={actions}
          embedded
        />

        <div className="module-page-body flex flex-col flex-1 min-h-0 overflow-hidden">{children}</div>
      </div>
    </div>
  );
}

function Stats({
  children,
  items,
  activeFilter = null,
  onSelect,
  loading = false,
  ariaLabel,
  layout,
}) {
  if (items?.length || loading) {
    return (
      <div className="shrink-0">
        <SummaryStatBar
          items={items}
          activeFilter={activeFilter}
          onSelect={onSelect}
          loading={loading}
          ariaLabel={ariaLabel}
          layout={layout}
        />
      </div>
    );
  }

  if (!children) return null;
  return <div className="shrink-0">{children}</div>;
}

function Toolbar({ children }) {
  return <div className="shrink-0">{children}</div>;
}

function Filters({ children }) {
  return <div className="shrink-0">{children}</div>;
}

function Table({ children, className = '', scroll = 'contain' }) {
  const overflow = scroll === 'page' ? 'overflow-y-auto' : 'overflow-hidden';
  return (
    <div className={`flex-1 min-h-0 flex flex-col ${overflow} ${className}`}>
      {children}
    </div>
  );
}

const ModulePageCard = Object.assign(ModulePageCardRoot, {
  Stats,
  Toolbar,
  Filters,
  Table,
});

export default ModulePageCard;

export { buildSummaryStatItems, countByStatus } from '../ui/summaryStatBar.helpers';
export { default as SummaryStatBar } from '../ui/SummaryStatBar';

// Legacy exports — keep for gradual migration
export function ModulePageLayout({ children, className = '' }) {
  return (
    <div className={`flex flex-col h-full min-h-0 ${className}`}>
      <div className="flex flex-col flex-1 min-h-0 bg-card-bg border border-card-border rounded-xl shadow-card overflow-hidden">
        {children}
      </div>
    </div>
  );
}

export function ModulePageSection({ children, className = '' }) {
  return <div className={`shrink-0 ${className}`}>{children}</div>;
}

export function ModulePageScroll({ children, className = '' }) {
  return (
    <div className={`flex-1 min-h-0 overflow-hidden flex flex-col ${className}`}>
      {children}
    </div>
  );
}
