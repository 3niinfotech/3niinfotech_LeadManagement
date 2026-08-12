import { useMemo } from 'react';
import DataGrid from '../../../components/table/DataGrid';
import { createActionsColumn, createAvatarColumn, GridRowActions } from '../../../components/table/grid.columns';
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
  rows, loading, fetching = false, onRowClick, onStatusChange, onEdit, onDelete, onSelectionChanged, density,
}) {
  const gridDensity = density === 'comfortable' ? TABLE_DENSITY.COMFORTABLE : TABLE_DENSITY.COMPACT;

  const columns = useMemo(() => [
    {
      field: 'tokenNumber',
      headerName: 'Token',
      width: 88,
      cellClass: `font-semibold text-brand tabular-nums ${centerCell}`,
      headerClass: centerHeader,
    },
    {
      field: 'leadCode',
      headerName: 'Lead ID',
      width: 148,
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
    {
      field: 'country',
      headerName: 'Country',
      width: 108,
      cellClass: `text-text-secondary ${centerCell}`,
      headerClass: centerHeader,
    },
    {
      field: 'interestedCourse',
      headerName: 'Course',
      flex: 1,
      minWidth: 120,
      cellClass: `text-text-secondary crm-grid-cell--truncate ${centerCell}`,
      headerClass: centerHeader,
    },
    {
      field: 'source',
      headerName: 'Source',
      width: 100,
      cellClass: `text-text-secondary ${centerCell}`,
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
      width: 156,
      cellClass: centerCell,
      headerClass: centerHeader,
      cellRenderer: (p) => (
        <WalkInStatusBadge
          status={p.value}
          onChange={(status) => onStatusChange(p.data.id, status)}
          compact
        />
      ),
    },
    {
      field: 'assignedTo',
      headerName: 'Counsellor',
      width: 130,
      valueGetter: (p) => {
        const u = p.data.assignedTo;
        return u ? `${u.firstName} ${u.lastName || ''}`.trim() : '—';
      },
      cellClass: `text-text-secondary crm-grid-cell--truncate ${centerCell}`,
      headerClass: centerHeader,
    },
    {
      field: 'walkInAt',
      headerName: 'Walk-in Time',
      width: 130,
      valueFormatter: (p) => formatWalkInTime(p.value),
      cellClass: `text-text-secondary tabular-nums ${centerCell}`,
      headerClass: centerHeader,
    },
    createActionsColumn({
      width: 88,
      cellRenderer: (p) => (
        <GridRowActions
          onEdit={() => onEdit(p.data.id)}
          onDelete={() => onDelete(p.data.id)}
        />
      ),
    }),
  ], [onDelete, onEdit, onStatusChange]);

  return (
    <DataGrid
      rows={rows}
      columns={columns}
      loading={loading}
      fetching={fetching}
      density={gridDensity}
      onRowClick={onRowClick}
      onSelectionChanged={onSelectionChanged}
      rowIdField="id"
      enableSelection
    />
  );
}
