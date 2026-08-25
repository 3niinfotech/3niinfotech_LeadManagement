import ModuleToolbar, {
  ModuleToolbarSearch,
  ModuleToolbarActions,
} from '../../../components/layout/ModuleToolbar';
import SearchInput from '../../../components/ui/SearchInput';
import Button from '../../../components/ui/Button';
import IconButton from '../../../components/ui/IconButton';
import { FiFilter, FiPlus, FiRefreshCw, FiDownload } from 'react-icons/fi';
import PermissionGate from '../../../components/common/PermissionGate';
import { PERMISSIONS } from '../../../config/permissions';

export default function MasterToolbar({
  search,
  onSearchChange,
  filtersOpen,
  onToggleFilters,
  activeFilterCount = 0,
  onRefresh,
  refreshing = false,
  onAdd,
  onExport,
  exporting = false,
  selectedCount = 0,
  onBulkActivate,
  onBulkDeactivate,
  onBulkDelete,
  singularLabel = 'Record',
  canManage = false,
}) {
  return (
    <ModuleToolbar>
      <ModuleToolbarSearch>
        <SearchInput
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search masters..."
          aria-label="Search masters"
        />
      </ModuleToolbarSearch>

      <ModuleToolbarActions>
        <Button
          variant={filtersOpen ? 'outline-primary' : 'outline'}
          size="sm"
          icon={FiFilter}
          onClick={onToggleFilters}
        >
          Filters{activeFilterCount > 0 ? ` (${activeFilterCount})` : ''}
        </Button>
        <IconButton
          icon={FiRefreshCw}
          label="Refresh"
          variant="toolbar"
          onClick={onRefresh}
          disabled={refreshing}
          className={refreshing ? 'animate-spin' : ''}
        />
        {canManage && selectedCount > 0 && (
          <>
            <Button size="sm" variant="outline" onClick={onBulkActivate}>
              Activate ({selectedCount})
            </Button>
            <Button size="sm" variant="outline" onClick={onBulkDeactivate}>
              Deactivate ({selectedCount})
            </Button>
            <Button size="sm" variant="outline-danger" onClick={onBulkDelete}>
              Delete ({selectedCount})
            </Button>
          </>
        )}
        <Button
          variant="outline"
          size="sm"
          icon={FiDownload}
          onClick={onExport}
          loading={exporting}
        >
          Export CSV
        </Button>
        {canManage && (
          <PermissionGate permission={PERMISSIONS.MASTERS_MANAGE}>
            <Button size="sm" icon={FiPlus} onClick={onAdd}>
              Add {singularLabel}
            </Button>
          </PermissionGate>
        )}
      </ModuleToolbarActions>
    </ModuleToolbar>
  );
}
