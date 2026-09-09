import { useMemo } from 'react';
import DataGrid from '../../../components/table/DataGrid';
import Badge from '../../../components/ui/Badge';
import { createAvatarColumn, createActionsColumn } from '../../../components/table/grid.columns';
import { createCountryColumn } from '../../../components/table/countryColumn';
import { GridActionButton, GridActionGroup } from '../../../components/table/GridActionButtons';
import { displayVisaStatus, getVisaStatusTone } from '../config/visaConstants';

const centerCell = 'crm-grid-cell crm-grid-cell--center';
const centerHeader = 'crm-grid-header-cell crm-grid-header-cell--center';

function studentName(row) {
  const s = row?.student;
  if (!s) return '—';
  return `${s.firstName || ''} ${s.lastName || ''}`.trim() || s.studentCode || '—';
}

function VisaActions({ onView, onAdvance, onDelete, canUpdate, canDelete, advancingId }) {
  return function ActionsCell({ data }) {
    if (!data) return null;
    return (
      <GridActionGroup>
        {onView && (
          <GridActionButton action="view" title="View details" onClick={() => onView(data)} />
        )}
        {canUpdate && onAdvance && (
          <GridActionButton
            action="attendance"
            title="Advance status"
            disabled={advancingId === data.id}
            onClick={() => onAdvance(data)}
          />
        )}
        {canDelete && onDelete && (
          <GridActionButton action="delete" title="Delete" onClick={() => onDelete(data.id, data)} />
        )}
      </GridActionGroup>
    );
  };
}

export default function VisaGrid({
  rows = [],
  loading = false,
  fetching = false,
  onRowClick,
  onView,
  onAdvance,
  onDelete,
  onSelectionChanged,
  canUpdate = false,
  canDelete = false,
  advancingId = null,
  onCreate,
}) {
  const columns = useMemo(() => [
    createAvatarColumn({
      nameGetter: (row) => studentName(row),
      width: 56,
      headerClass: centerHeader,
      cellClass: `${centerCell} crm-grid-avatar-cell`,
    }),
    {
      field: 'student',
      headerName: 'Student',
      minWidth: 130,
      flex: 1,
      valueGetter: (p) => studentName(p.data),
      cellRenderer: (p) => (
        <span className="font-semibold text-text truncate">{studentName(p.data)}</span>
      ),
      cellClass: centerCell,
      headerClass: centerHeader,
    },
    {
      colId: 'studentCode',
      headerName: 'Student Code',
      minWidth: 150,
      width: 160,
      valueGetter: (p) => p.data?.student?.studentCode || '—',
      cellRenderer: (p) => (
        <span className="font-mono text-[12px] text-text-muted tabular-nums">
          {p.data?.student?.studentCode || '—'}
        </span>
      ),
      cellClass: centerCell,
      headerClass: centerHeader,
    },
    {
      field: 'applicationNo',
      headerName: 'Visa No',
      width: 110,
      valueFormatter: (p) => p.value || '—',
      cellClass: `${centerCell} tabular-nums font-medium`,
      headerClass: centerHeader,
    },
    createCountryColumn({
      field: 'country',
      headerName: 'Country',
      width: 140,
      valueGetter: (row) => row?.country || row?.metadata?.countryName || '',
    }),
    {
      field: 'visaType',
      headerName: 'Visa Type',
      minWidth: 120,
      flex: 0.9,
      valueFormatter: (p) => p.value || '—',
      cellClass: centerCell,
      headerClass: centerHeader,
    },
    {
      colId: 'status',
      headerName: 'Status',
      width: 150,
      valueGetter: (p) => displayVisaStatus(p.data),
      cellRenderer: (p) => (
        <div className="flex items-center justify-center w-full">
          <Badge color={getVisaStatusTone(p.data?.status, p.data?.metadata)} size="sm">
            {displayVisaStatus(p.data)}
          </Badge>
        </div>
      ),
      cellClass: centerCell,
      headerClass: centerHeader,
    },
    {
      field: 'submittedAt',
      headerName: 'Submitted',
      width: 100,
      valueFormatter: (p) => (p.value
        ? new Date(p.value).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: '2-digit' })
        : '—'),
      cellClass: `${centerCell} text-text-muted tabular-nums`,
      headerClass: centerHeader,
    },
    createActionsColumn({
      width: canUpdate || canDelete ? 108 : 72,
      pinned: 'right',
      headerClass: centerHeader,
      cellClass: `${centerCell} crm-grid-actions-cell`,
      cellRenderer: VisaActions({
        onView: onView || onRowClick,
        onAdvance,
        onDelete,
        canUpdate,
        canDelete,
        advancingId,
      }),
    }),
  ], [onRowClick, onView, onAdvance, onDelete, canUpdate, canDelete, advancingId]);

  return (
    <DataGrid
      columns={columns}
      rowData={rows}
      loading={loading}
      fetching={fetching}
      pagination={false}
      rowSelection="multiple"
      onSelectionChanged={onSelectionChanged}
      onRowClick={onRowClick}
      height="100%"
      emptyTitle="No visa cases yet"
      emptyDescription="Create a visa case for a student — status follows Visa Status master by country."
      emptyActionLabel={onCreate ? 'New Visa Case' : undefined}
      onEmptyAction={onCreate}
      getRowId={(p) => p.data.id}
    />
  );
}
