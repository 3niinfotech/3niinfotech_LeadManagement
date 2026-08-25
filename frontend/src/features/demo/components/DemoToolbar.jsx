import { useState, useEffect } from 'react';
import {
  FiCalendar,
  FiChevronDown,
  FiFilter,
  FiDownload,
  FiTrash2,
  FiCheckCircle,
  FiXCircle,
  FiRefreshCw,
  FiPlus,
} from 'react-icons/fi';
import Button from '../../../components/ui/Button';
import SearchInput from '../../../components/ui/SearchInput';
import SegmentControl from '../../../components/ui/SegmentControl';
import DropdownMenu from '../../../components/ui/DropdownMenu';
import ModuleToolbar, {
  ModuleToolbarSearch,
  ModuleToolbarSegments,
  ModuleToolbarActions,
} from '../../../components/layout/ModuleToolbar';
import PermissionGate from '../../../components/common/PermissionGate';
import { DEMO_VIEW_TABS } from '../config/demoConstants';
import { PERMISSIONS } from '../../../config/permissions';
import { usePermissions } from '../../../hooks/usePermissions';

export default function DemoToolbar({
  search,
  onSearchChange,
  activeView,
  onViewChange,
  onScheduleDemo,
  onExport,
  exportLoading,
  onToggleFilters,
  filtersOpen,
  selectedCount,
  onBulkAction,
  onBulkExport,
  onBulkCancel,
  onRefresh,
  refreshLoading = false,
}) {
  const { can, canAny } = usePermissions();
  const [bulkOpen, setBulkOpen] = useState(false);
  const [debounced, setDebounced] = useState(search || '');

  useEffect(() => {
    const t = setTimeout(() => onSearchChange(debounced), 300);
    return () => clearTimeout(t);
  }, [debounced, onSearchChange]);

  useEffect(() => {
    setDebounced(search || '');
  }, [search]);

  const disabled = !selectedCount;
  const canUpdate = canAny([PERMISSIONS.ENQUIRIES_UPDATE, PERMISSIONS.CALENDAR_UPDATE, PERMISSIONS.ATTENDANCE_MARK]);
  const canExport = can(PERMISSIONS.ENQUIRIES_EXPORT);
  const canCreate = canAny([PERMISSIONS.ENQUIRIES_CREATE, PERMISSIONS.ENQUIRIES_UPDATE, PERMISSIONS.CALENDAR_CREATE]);

  const bulkItems = [
    canUpdate
      ? {
          id: 'attendance',
          label: 'Mark Attendance & Outcome',
          icon: FiCheckCircle,
          tone: 'success',
          onClick: () => onBulkAction('attendance'),
          disabled,
        }
      : null,
    canUpdate
      ? {
          id: 'cancel',
          label: 'Cancel Demos',
          icon: FiXCircle,
          tone: 'danger',
          onClick: () => onBulkAction('cancel'),
          disabled,
        }
      : null,
    canExport
      ? {
          id: 'export',
          label: 'Export Selected',
          icon: FiDownload,
          tone: 'primary',
          onClick: onBulkExport,
          disabled,
        }
      : null,
  ].filter(Boolean);

  const showBulk = bulkItems.length > 0;

  return (
    <ModuleToolbar>
      <ModuleToolbarSearch>
        <SearchInput
          value={debounced}
          onChange={(e) => setDebounced(e.target.value)}
          placeholder="Search student, enquiry ID, course, faculty..."
        />
      </ModuleToolbarSearch>

      <ModuleToolbarSegments>
        <SegmentControl
          items={DEMO_VIEW_TABS}
          value={activeView}
          onChange={onViewChange}
          layoutId="crm-demo-view-pill"
        />
      </ModuleToolbarSegments>

      <ModuleToolbarActions>
        {showBulk && (
          <div className="relative">
            <Button
              variant="outline"
              size="sm"
              iconRight={FiChevronDown}
              disabled={!selectedCount}
              onClick={() => setBulkOpen((v) => !v)}
            >
              Bulk ({selectedCount || 0})
            </Button>
            <DropdownMenu
              open={bulkOpen && selectedCount > 0}
              onClose={() => setBulkOpen(false)}
              items={bulkItems}
            />
          </div>
        )}

        {canCreate && onScheduleDemo && (
          <Button
            variant="primary"
            size="sm"
            icon={FiPlus}
            onClick={onScheduleDemo}
          >
            Schedule Demo
          </Button>
        )}

        <PermissionGate permission={PERMISSIONS.ENQUIRIES_EXPORT}>
          <Button
            variant="outline-primary"
            size="sm"
            icon={FiDownload}
            loading={exportLoading}
            onClick={onExport}
            title={selectedCount > 0 ? `Export ${selectedCount} selected demos` : 'Export all filtered demos'}
          >
            Export{selectedCount > 0 ? ` (${selectedCount})` : ''}
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
            title="Reset search, filters & refresh demo table"
          >
            Refresh
          </Button>
        )}
      </ModuleToolbarActions>
    </ModuleToolbar>
  );
}
