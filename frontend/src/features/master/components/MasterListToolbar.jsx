import ModuleToolbar, {
  ModuleToolbarSearch,
  ModuleToolbarActions,
} from '../../../components/layout/ModuleToolbar';
import SearchInput from '../../../components/ui/SearchInput';
import Select from '../../../components/ui/Select';
import IconButton from '../../../components/ui/IconButton';
import { FiRefreshCw } from 'react-icons/fi';

export const MASTER_STATUS_OPTIONS = [
  { value: 'all', label: 'All statuses' },
  { value: 'active', label: 'Active only' },
  { value: 'inactive', label: 'Inactive only' },
];

/**
 * Shared master list filter bar — search + status + extra filters + refresh.
 * Replaces Card-wrapped stacked filters on Branch / Staff / Partner / Item pages.
 */
export default function MasterListToolbar({
  search = '',
  onSearchChange,
  searchPlaceholder = 'Search…',
  searchAriaLabel = 'Search masters',
  status,
  onStatusChange,
  statusOptions = MASTER_STATUS_OPTIONS,
  showStatus = true,
  filters = [],
  onRefresh,
  refreshing = false,
  hint,
  trailing,
  children,
}) {
  return (
    <div className="shrink-0 border-b border-border bg-card-bg">
      <ModuleToolbar className="!border-b-0">
        <ModuleToolbarSearch>
          <SearchInput
            value={search}
            onChange={(e) => onSearchChange?.(e.target.value)}
            placeholder={searchPlaceholder}
            aria-label={searchAriaLabel}
          />
        </ModuleToolbarSearch>

        <div className="flex flex-wrap items-center gap-2 min-w-0">
          {showStatus && onStatusChange && (
            <ToolbarSelect
              value={status}
              onChange={onStatusChange}
              options={statusOptions}
              widthClass="w-[148px]"
              ariaLabel="Filter by status"
            />
          )}

          {filters.map((filter) => (
            <ToolbarSelect
              key={filter.key || filter.name}
              value={filter.value}
              onChange={filter.onChange}
              options={filter.options || []}
              widthClass={filter.widthClass || 'w-[160px]'}
              placeholder={filter.placeholder}
              disabled={filter.disabled}
              allowClear={filter.allowClear}
              searchable={filter.searchable}
              ariaLabel={filter.ariaLabel || filter.placeholder || filter.key}
            />
          ))}

          {children}
        </div>

        <ModuleToolbarActions>
          {trailing}
          {onRefresh && (
            <IconButton
              icon={FiRefreshCw}
              label="Refresh"
              variant="toolbar"
              onClick={onRefresh}
              disabled={refreshing}
              className={refreshing ? 'animate-spin' : ''}
            />
          )}
        </ModuleToolbarActions>
      </ModuleToolbar>

      {hint ? (
        <p className="px-4 pb-3 -mt-1 text-[11px] text-text-muted leading-snug">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

function ToolbarSelect({
  value,
  onChange,
  options,
  widthClass = 'w-[148px]',
  placeholder,
  disabled = false,
  allowClear = false,
  searchable = false,
  ariaLabel,
}) {
  return (
    <div className={`${widthClass} shrink-0`}>
      <Select
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        options={options}
        placeholder={placeholder}
        disabled={disabled}
        allowClear={allowClear}
        searchable={searchable}
        size="sm"
        aria-label={ariaLabel}
      />
    </div>
  );
}
