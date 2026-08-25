import { useState, useEffect } from 'react';
import {
  FiUsers,
  FiChevronDown,
  FiFilter,
  FiDownload,
  FiTrash2,
  FiUserCheck,
  FiRefreshCw,
  FiPlus,
  FiTag,
  FiCheckCircle,
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
import { PERMISSIONS } from '../../../config/permissions';
import { usePermissions } from '../../../hooks/usePermissions';

export const STUDENT_VIEW_TABS = [
  { id: 'all', label: 'All Students', icon: FiUsers },
  { id: 'REGISTERED', label: 'Registered', icon: FiUserCheck },
  { id: 'APPLICATION_SUBMITTED', label: 'Applied', icon: FiTag },
  { id: 'VISA_GRANTED', label: 'Visa Granted', icon: FiCheckCircle },
  { id: 'ENROLLED', label: 'Enrolled', icon: FiCheckCircle },
];

export default function StudentToolbar({
  search,
  onSearchChange,
  activeView,
  onViewChange,
  onAddStudent,
  onExport,
  exportLoading,
  onToggleFilters,
  filtersOpen,
  selectedCount,
  onBulkAction,
  onBulkExport,
  onBulkDelete,
  onRefresh,
  refreshLoading = false,
}) {
  const { can } = usePermissions();
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
  const canUpdate = can(PERMISSIONS.STUDENTS_UPDATE);
  const canDelete = can(PERMISSIONS.STUDENTS_DELETE);
  const canAssign = can(PERMISSIONS.STUDENTS_ASSIGN);
  const canExport = can(PERMISSIONS.STUDENTS_EXPORT);
  const canCreate = can(PERMISSIONS.STUDENTS_CREATE);

  const bulkItems = [
    canAssign && {
      id: 'assign',
      label: 'Assign Counsellor',
      icon: FiUserCheck,
      tone: 'success',
      onClick: () => onBulkAction('assign'),
      disabled,
    },
    canUpdate && {
      id: 'status',
      label: 'Change Status',
      icon: FiRefreshCw,
      tone: 'primary',
      onClick: () => onBulkAction('status'),
      disabled,
    },
    canDelete && {
      id: 'delete',
      label: 'Delete Students',
      icon: FiTrash2,
      tone: 'danger',
      onClick: onBulkDelete,
      disabled,
    },
    canExport && {
      id: 'export',
      label: 'Export Selected',
      icon: FiDownload,
      tone: 'primary',
      onClick: onBulkExport,
      disabled,
    },
  ].filter(Boolean);

  const showBulk = bulkItems.length > 0;

  return (
    <ModuleToolbar>
      <ModuleToolbarSearch>
        <SearchInput
          value={debounced}
          onChange={(e) => setDebounced(e.target.value)}
          placeholder="Search student code, name, phone, email, country..."
        />
      </ModuleToolbarSearch>

      <ModuleToolbarSegments>
        <SegmentControl
          items={STUDENT_VIEW_TABS}
          value={activeView}
          onChange={onViewChange}
          layoutId="crm-student-view-pill"
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

        {canCreate && onAddStudent && (
          <Button
            variant="primary"
            size="sm"
            icon={FiPlus}
            onClick={onAddStudent}
          >
            Add Student
          </Button>
        )}

        <PermissionGate permission={PERMISSIONS.STUDENTS_EXPORT}>
          <Button
            variant="outline-primary"
            size="sm"
            icon={FiDownload}
            loading={exportLoading}
            onClick={onExport}
            title={selectedCount > 0 ? `Export ${selectedCount} selected students` : 'Export all filtered students'}
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
            title="Reset filters & refresh student table"
          >
            Refresh
          </Button>
        )}
      </ModuleToolbarActions>
    </ModuleToolbar>
  );
}
