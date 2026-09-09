import { useState, useEffect } from 'react';
import { FiDownload, FiFilter, FiRefreshCw, FiPlus } from 'react-icons/fi';
import Button from '../../../components/ui/Button';
import SearchInput from '../../../components/ui/SearchInput';
import ModuleToolbar, {
  ModuleToolbarSearch,
  ModuleToolbarActions,
} from '../../../components/layout/ModuleToolbar';
import PermissionGate from '../../../components/common/PermissionGate';
import { PERMISSIONS } from '../../../config/permissions';

export default function FeesToolbar({
  search,
  onSearchChange,
  onToggleFilters,
  filtersOpen,
  onCreate,
  onRefresh,
  refreshLoading = false,
  onExport,
  exportLoading = false,
  selectedCount = 0,
}) {
  const [debounced, setDebounced] = useState(search || '');

  useEffect(() => {
    const t = setTimeout(() => onSearchChange(debounced), 300);
    return () => clearTimeout(t);
  }, [debounced, onSearchChange]);

  useEffect(() => {
    setDebounced(search || '');
  }, [search]);

  return (
    <ModuleToolbar>
      <ModuleToolbarSearch>
        <SearchInput
          value={debounced}
          onChange={(e) => setDebounced(e.target.value)}
          placeholder="Search invoice no, student, notes..."
        />
      </ModuleToolbarSearch>

      <ModuleToolbarActions>
        <PermissionGate permission={PERMISSIONS.INVOICES_CREATE}>
          {onCreate && (
            <Button variant="primary" size="sm" icon={FiPlus} onClick={onCreate}>
              New Invoice
            </Button>
          )}
        </PermissionGate>

        <PermissionGate permission={PERMISSIONS.INVOICES_VIEW}>
          <Button
            variant="outline-primary"
            size="sm"
            icon={FiDownload}
            loading={exportLoading}
            onClick={onExport}
            title={selectedCount > 0 ? `Export ${selectedCount} selected` : 'Export all invoices'}
          >
            Export Excel{selectedCount > 0 ? ` (${selectedCount})` : ''}
          </Button>
        </PermissionGate>

        <Button
          variant={filtersOpen ? 'outline-primary' : 'outline'}
          size="sm"
          icon={FiFilter}
          onClick={onToggleFilters}
          aria-pressed={filtersOpen}
        >
          Filters
        </Button>

        {onRefresh && (
          <Button
            variant="outline"
            size="sm"
            icon={FiRefreshCw}
            loading={refreshLoading}
            onClick={onRefresh}
            title="Reset filters and refresh"
          >
            Refresh
          </Button>
        )}
      </ModuleToolbarActions>
    </ModuleToolbar>
  );
}
