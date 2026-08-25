import Avatar from '../ui/Avatar';
import { GridActionButton, GridActionGroup } from './GridActionButtons';

function fullName(row, nameGetter) {
  if (nameGetter) return nameGetter(row);
  return `${row?.firstName || ''} ${row?.lastName || ''}`.trim() || '—';
}

/** Compact profile avatar column — place before name column */
export function createAvatarColumn({
  nameGetter,
  srcGetter,
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
      <Avatar
        name={fullName(p.data, nameGetter)}
        src={srcGetter ? srcGetter(p.data) : (p.data?.photoUrl || '')}
        size="sm"
      />
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
export function GridRowActions({ onEdit, onDelete, onOpenDetail, getRowId = (row) => row?.id }) {
  return function ActionsCell({ data }) {
    if (!data) return null;
    const id = getRowId(data);

    return (
      <GridActionGroup>
        {onOpenDetail && (
          <GridActionButton
            action="view"
            title="View Details"
            onClick={() => onOpenDetail(id, data)}
          />
        )}
        {onEdit && (
          <GridActionButton
            action="edit"
            title="Edit"
            onClick={() => onEdit(id, data)}
          />
        )}
        {onDelete && (
          <GridActionButton
            action="delete"
            title="Delete"
            onClick={() => onDelete(id, data)}
          />
        )}
      </GridActionGroup>
    );
  };
}
