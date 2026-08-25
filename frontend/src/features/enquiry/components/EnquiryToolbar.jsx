import { useState, useEffect } from 'react';
import {
  FiUpload, FiChevronDown, FiFilter, FiDownload, FiTrash2,
  FiUserCheck, FiMail, FiPhone, FiRefreshCw, FiTag,
  FiShuffle, FiMapPin,
} from 'react-icons/fi';
import { FaWhatsapp } from 'react-icons/fa';
import Button from '../../../components/ui/Button';
import SearchInput from '../../../components/ui/SearchInput';
import SegmentControl from '../../../components/ui/SegmentControl';
import DropdownMenu from '../../../components/ui/DropdownMenu';
import ModuleToolbar, {
  ModuleToolbarSearch, ModuleToolbarSegments, ModuleToolbarActions,
} from '../../../components/layout/ModuleToolbar';
import PermissionGate from '../../../components/common/PermissionGate';
import { ENQUIRY_VIEW_TABS } from '../../../config/constants';
import { PERMISSIONS } from '../../../config/permissions';
import { usePermissions } from '../../../hooks/usePermissions';

export default function EnquiryToolbar({
  search, onSearchChange, activeView, onViewChange,
  onImport, onExport, exportLoading, onToggleFilters, filtersOpen,
  selectedCount, onBulkAction, onBulkExport, onBulkDelete,
  onRefresh, refreshLoading = false,
}) {
  const { can } = usePermissions();
  const [bulkOpen, setBulkOpen] = useState(false);
  const [debounced, setDebounced] = useState(search);

  useEffect(() => {
    const t = setTimeout(() => onSearchChange(debounced), 300);
    return () => clearTimeout(t);
  }, [debounced, onSearchChange]);

  useEffect(() => { setDebounced(search); }, [search]);

  const disabled = !selectedCount;
  const bulkItems = [
    can(PERMISSIONS.ENQUIRIES_ASSIGN) || can(PERMISSIONS.LEADS_ASSIGN) || can(PERMISSIONS.ENQUIRIES_UPDATE)
      ? { id: 'assign', label: 'Assign', icon: FiUserCheck, tone: 'success', onClick: () => onBulkAction('assign'), disabled }
      : null,
    can(PERMISSIONS.ENQUIRIES_DELETE)
      ? { id: 'delete', label: 'Delete', icon: FiTrash2, tone: 'danger', onClick: onBulkDelete, disabled }
      : null,
    can(PERMISSIONS.ENQUIRIES_UPDATE)
      ? { id: 'status', label: 'Change Status', icon: FiRefreshCw, tone: 'primary', onClick: () => onBulkAction('status'), disabled }
      : null,
    can(PERMISSIONS.ENQUIRIES_EXPORT)
      ? { id: 'export', label: 'Export', icon: FiDownload, tone: 'primary', onClick: onBulkExport, disabled }
      : null,
    can(PERMISSIONS.ENQUIRIES_UPDATE)
      ? { id: 'whatsapp', label: 'WhatsApp', icon: FaWhatsapp, tone: 'success', onClick: () => onBulkAction('whatsapp'), disabled }
      : null,
    can(PERMISSIONS.ENQUIRIES_UPDATE)
      ? { id: 'email', label: 'Email', icon: FiMail, tone: 'info', onClick: () => onBulkAction('email'), disabled }
      : null,
    can(PERMISSIONS.ENQUIRIES_UPDATE)
      ? { id: 'sms', label: 'SMS', icon: FiPhone, tone: 'info', onClick: () => onBulkAction('sms'), disabled }
      : null,
    can(PERMISSIONS.ENQUIRIES_UPDATE)
      ? { id: 'tags', label: 'Add Tag', icon: FiTag, tone: 'warning', onClick: () => onBulkAction('tags'), disabled }
      : null,
    can(PERMISSIONS.ENQUIRIES_UPDATE)
      ? { id: 'merge', label: 'Merge', icon: FiShuffle, tone: 'secondary', onClick: () => onBulkAction('merge'), disabled: disabled || selectedCount < 2 }
      : null,
    can(PERMISSIONS.ENQUIRIES_UPDATE)
      ? { id: 'branch', label: 'Move Branch', icon: FiMapPin, tone: 'secondary', onClick: () => onBulkAction('branch'), disabled }
      : null,
  ].filter(Boolean);

  const showBulk = bulkItems.length > 0;

  return (
    <ModuleToolbar>
      <ModuleToolbarSearch>
        <SearchInput
          value={debounced}
          onChange={(e) => setDebounced(e.target.value)}
          placeholder="Search enquiries..."
        />
      </ModuleToolbarSearch>

      <ModuleToolbarSegments>
        <SegmentControl
          items={ENQUIRY_VIEW_TABS}
          value={activeView}
          onChange={onViewChange}
          layoutId="crm-enquiry-view-pill"
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

        <PermissionGate permission={PERMISSIONS.ENQUIRIES_IMPORT}>
          <Button variant="outline-success" size="sm" icon={FiUpload} onClick={onImport}>
            Import
          </Button>
        </PermissionGate>

        <PermissionGate permission={PERMISSIONS.ENQUIRIES_EXPORT}>
          <Button
            variant="outline-primary"
            size="sm"
            icon={FiDownload}
            loading={exportLoading}
            onClick={onExport}
            title={selectedCount > 0 ? `Export ${selectedCount} selected` : 'Export all enquiries'}
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
            title="Reset search, filters & refresh table"
          >
            Refresh
          </Button>
        )}
      </ModuleToolbarActions>
    </ModuleToolbar>
  );
}
