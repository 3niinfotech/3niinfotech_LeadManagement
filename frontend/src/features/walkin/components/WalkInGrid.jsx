import { useMemo } from 'react';
import { FiUserCheck, FiEye, FiTrash2 } from 'react-icons/fi';
import DataGrid from '../../../components/table/DataGrid';
import { createActionsColumn, createAvatarColumn } from '../../../components/table/grid.columns';
import { createCountryColumn } from '../../../components/table/countryColumn';
import WalkInStatusBadge from './WalkInStatusBadge';
import WalkInPriorityBadge from './WalkInPriorityBadge';
import { TABLE_DENSITY } from '../../../config/constants';

const centerCell = 'crm-grid-cell--center';
const centerHeader = 'crm-grid-header-cell--center';

function formatWalkInTime(value) {
  if (!value) return '—';
  return new Date(value).toLocaleString('en-IN', {
    day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
  });
}

export default function WalkInGrid({
  rows,
  loading,
  fetching = false,
  onRowClick,
  onView,
  onDelete,
  onAssign,
  onSelectionChanged,
  density,
  emptyTitle,
  emptyDescription,
  emptyActionLabel,
  onEmptyAction,
}) {
  const gridDensity = density === 'comfortable' ? TABLE_DENSITY.COMFORTABLE : TABLE_DENSITY.COMPACT;

  const columns = useMemo(() => [
    {
      field: 'leadCode',
      headerName: 'ID',
      width: 190,
      minWidth: 180,
      cellClass: `font-medium text-text tabular-nums ${centerCell}`,
      headerClass: centerHeader,
    },
    createAvatarColumn(),
    {
      field: 'name',
      headerName: 'Name',
      flex: 1,
      minWidth: 140,
      valueGetter: (p) => `${p.data.firstName} ${p.data.lastName || ''}`.trim(),
      cellClass: `text-xs font-medium text-text ${centerCell}`,
      headerClass: centerHeader,
    },
    {
      field: 'phone',
      headerName: 'Mobile',
      width: 118,
      cellClass: `tabular-nums text-text-secondary ${centerCell}`,
      headerClass: centerHeader,
    },
    createCountryColumn({
      field: 'country',
      headerName: 'Country',
      width: 140,
      valueGetter: (row) => row?.country || row?.interestedCountry || '',
    }),
    {
      field: 'interestedCourse',
      headerName: 'Course',
      flex: 1,
      minWidth: 120,
      cellClass: `text-text-secondary crm-grid-cell--truncate ${centerCell}`,
      headerClass: centerHeader,
    },
    {
      field: 'priority',
      headerName: 'Priority',
      width: 96,
      cellClass: centerCell,
      headerClass: centerHeader,
      cellRenderer: (p) => <WalkInPriorityBadge priority={p.value || 'NORMAL'} />,
    },
    {
      field: 'status',
      headerName: 'Status',
      width: 140,
      cellClass: centerCell,
      headerClass: centerHeader,
      cellRenderer: (p) => <WalkInStatusBadge status={p.value} compact />,
    },
    {
      field: 'assignedTo',
      headerName: 'Counsellor',
      width: 130,
      valueGetter: (p) => {
        const u = p.data.assignedTo;
        return u ? `${u.firstName} ${u.lastName || ''}`.trim() : 'Unassigned';
      },
      cellClass: `text-text-secondary crm-grid-cell--truncate ${centerCell}`,
      headerClass: centerHeader,
    },
    {
      field: 'walkInAt',
      headerName: 'Time',
      width: 120,
      valueFormatter: (p) => formatWalkInTime(p.value),
      cellClass: `text-text-secondary tabular-nums ${centerCell}`,
      headerClass: centerHeader,
    },
    createActionsColumn({
      width: onAssign ? 112 : 88,
      cellRenderer: (p) => {
        const row = p.data;
        if (!row) return null;
        const needsAssign = !row.assignedToId;
        return (
          <div className="crm-grid-actions" onClick={(e) => e.stopPropagation()}>
            {onAssign && needsAssign && (
              <button
                type="button"
                className="crm-grid-action-btn crm-grid-action-btn--edit"
                title="Assign counsellor"
                onClick={() => onAssign(row)}
              >
                <FiUserCheck className="w-3.5 h-3.5" />
              </button>
            )}
            {onView && (
              <button
                type="button"
                className="crm-grid-action-btn"
                title="View profile"
                onClick={() => onView(row.id)}
              >
                <FiEye className="w-3.5 h-3.5" />
              </button>
            )}
            {onDelete && (
              <button
                type="button"
                className="crm-grid-action-btn crm-grid-action-btn--delete"
                title="Remove"
                onClick={() => onDelete(row.id)}
              >
                <FiTrash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        );
      },
    }),
  ], [onAssign, onDelete, onView]);

  return (
    <DataGrid
      columns={columns}
      rowData={rows}
      loading={loading}
      fetching={fetching}
      density={gridDensity}
      rowSelection="multiple"
      onRowClick={onRowClick}
      onSelectionChanged={onSelectionChanged}
      pagination
      paginationPageSize={25}
      fitContent
      maxVisibleRows={10}
      hideSinglePagePagination
      emptyTitle={emptyTitle || 'No visitors'}
      emptyDescription={emptyDescription || 'Register a visitor or switch tab.'}
      emptyActionLabel={emptyActionLabel}
      onEmptyAction={onEmptyAction}
      getRowId={(p) => p.data.id}
    />
  );
}
