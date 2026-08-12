import { useState, useEffect } from 'react';
import {
  FiUpload, FiChevronDown, FiFilter, FiDownload, FiTrash2,
  FiUserCheck, FiMail, FiMessageSquare, FiPhone, FiRefreshCw, FiTag,
  FiShuffle, FiMapPin, FiUserPlus,
} from 'react-icons/fi';
import { FaWhatsapp } from 'react-icons/fa';
import Button from '../../../components/ui/Button';
import SearchInput from '../../../components/ui/SearchInput';
import SegmentControl from '../../../components/ui/SegmentControl';
import DropdownMenu from '../../../components/ui/DropdownMenu';
import ModuleToolbar, {
  ModuleToolbarSearch, ModuleToolbarSegments, ModuleToolbarActions,
} from '../../../components/layout/ModuleToolbar';
import { ENQUIRY_VIEW_TABS } from '../../../config/constants';

export default function EnquiryToolbar({
  search, onSearchChange, activeView, onViewChange,
  onImport, onRegisterVisitor, onToggleFilters, filtersOpen,
  selectedCount, onBulkAction, onBulkExport, onBulkDelete,
}) {
  const [bulkOpen, setBulkOpen] = useState(false);
  const [debounced, setDebounced] = useState(search);

  useEffect(() => {
    const t = setTimeout(() => onSearchChange(debounced), 300);
    return () => clearTimeout(t);
  }, [debounced, onSearchChange]);

  useEffect(() => { setDebounced(search); }, [search]);

  const disabled = !selectedCount;
  const bulkItems = [
    { id: 'assign', label: 'Assign', icon: FiUserCheck, tone: 'success', onClick: () => onBulkAction('assign'), disabled },
    { id: 'delete', label: 'Delete', icon: FiTrash2, tone: 'danger', onClick: onBulkDelete, disabled },
    { id: 'status', label: 'Change Status', icon: FiRefreshCw, tone: 'primary', onClick: () => onBulkAction('status'), disabled },
    { id: 'export', label: 'Export', icon: FiDownload, tone: 'primary', onClick: onBulkExport, disabled },
    { id: 'whatsapp', label: 'WhatsApp', icon: FaWhatsapp, tone: 'success', onClick: () => onBulkAction('whatsapp'), disabled },
    { id: 'email', label: 'Email', icon: FiMail, tone: 'info', onClick: () => onBulkAction('email'), disabled },
    { id: 'sms', label: 'SMS', icon: FiPhone, tone: 'info', onClick: () => onBulkAction('sms'), disabled },
    { id: 'tags', label: 'Add Tag', icon: FiTag, tone: 'warning', onClick: () => onBulkAction('tags'), disabled },
    { id: 'merge', label: 'Merge', icon: FiShuffle, tone: 'secondary', onClick: () => onBulkAction('merge'), disabled: disabled || selectedCount < 2 },
    { id: 'branch', label: 'Move Branch', icon: FiMapPin, tone: 'secondary', onClick: () => onBulkAction('branch'), disabled },
  ];

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
        <Button variant="primary" size="sm" icon={FiUserPlus} onClick={onRegisterVisitor}>
          Register Visitor
        </Button>

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

        <Button variant="outline-success" size="sm" icon={FiUpload} onClick={onImport}>
          Import
        </Button>

        <Button
          variant={filtersOpen ? 'outline-primary' : 'outline'}
          size="sm"
          icon={FiFilter}
          onClick={onToggleFilters}
          aria-pressed={filtersOpen}
        >
          Filters
        </Button>
      </ModuleToolbarActions>
    </ModuleToolbar>
  );
}
