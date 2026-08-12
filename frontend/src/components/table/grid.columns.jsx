import { FiEdit2, FiTrash2 } from 'react-icons/fi';
import Avatar from '../ui/Avatar';

function fullName(row, nameGetter) {
  if (nameGetter) return nameGetter(row);
  return `${row?.firstName || ''} ${row?.lastName || ''}`.trim() || '—';
}

/** Compact profile avatar column — place before name column */
export function createAvatarColumn({
  nameGetter,
  width = 58,
  headerName = 'Photo',
  ...overrides
} = {}) {
  return {
    colId: '__avatar',
    headerName,
    width,
    maxWidth: width,
    minWidth: width,
    sortable: false,
    resizable: false,
    suppressMovable: true,
    suppressHeaderMenuButton: true,
    cellClass: 'crm-grid-avatar-cell crm-grid-cell--center',
    headerClass: 'crm-grid-avatar-header crm-grid-header-cell--center',
    valueGetter: (p) => fullName(p.data, nameGetter),
    cellRenderer: (p) => (
      <Avatar name={fullName(p.data, nameGetter)} size="sm" />
    ),
    ...overrides,
  };
}
export const SELECTION_COLUMN_DEF = {
  width: 44,
  maxWidth: 44,
  minWidth: 44,
  pinned: 'left',
  lockPosition: 'left',
  sortable: false,
  resizable: false,
  suppressMovable: true,
  suppressHeaderMenuButton: true,
  cellClass: 'crm-grid-select-cell',
  headerClass: 'crm-grid-select-header',
};

/** @deprecated Use DataGrid rowSelection — selection column is injected automatically */
export function createSelectionColumn(overrides = {}) {
  return { ...SELECTION_COLUMN_DEF, ...overrides };
}

/** Pinned right actions column — pass pinned: null to keep scrollable */
export function createActionsColumn({
  width = 88,
  pinned = null,
  headerName = 'Actions',
  cellRenderer,
  cellClass: extraCellClass = '',
  headerClass: extraHeaderClass = '',
  ...overrides
} = {}) {
  return {
    colId: '__actions',
    headerName,
    width,
    maxWidth: width,
    minWidth: width,
    ...(pinned ? { pinned, lockPosition: pinned } : {}),
    sortable: false,
    filter: false,
    resizable: false,
    suppressMovable: true,
    suppressHeaderMenuButton: true,
    cellClass: `crm-grid-actions-cell crm-grid-cell crm-grid-cell--center ${extraCellClass}`.trim(),
    headerClass: `crm-grid-actions-header crm-grid-header-cell crm-grid-header-cell--center ${extraHeaderClass}`.trim(),
    cellRenderer,
    ...overrides,
  };
}

/** Standard edit + delete action buttons for grid rows */
export function GridRowActions({ onEdit, onDelete, getRowId = (row) => row?.id }) {
  return function ActionsCell({ data }) {
    if (!data) return null;
    const id = getRowId(data);

    return (
      <div className="crm-grid-actions" onClick={(e) => e.stopPropagation()}>
        {onEdit && (
          <button
            type="button"
            className="crm-grid-action-btn crm-grid-action-btn--edit"
            onClick={() => onEdit(id, data)}
            aria-label="Edit"
            title="Edit"
          >
            <FiEdit2 className="w-3.5 h-3.5" />
          </button>
        )}
        {onDelete && (
          <button
            type="button"
            className="crm-grid-action-btn crm-grid-action-btn--delete"
            onClick={() => onDelete(id, data)}
            aria-label="Delete"
            title="Delete"
          >
            <FiTrash2 className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    );
  };
}
