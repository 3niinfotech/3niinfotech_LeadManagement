import { useMemo } from 'react';
import DataGrid from '../../../components/table/DataGrid';
import { createActionsColumn, createAvatarColumn, GridRowActions } from '../../../components/table/grid.columns';
import EnquiryStatusPill from './EnquiryStatusPill';
import EnquiryPriorityBadge from './EnquiryPriorityBadge';
import EnquiryTagChips from './EnquiryTagChips';
import { TABLE_DENSITY, getEnquiryStatusLabel, getEnquiryPriorityLabel } from '../../../config/constants';

const centerCell = 'crm-grid-cell--center';
const centerHeader = 'crm-grid-header-cell--center';

export default function EnquiryGrid({
  rows, loading, fetching = false, onRowClick, onStatusChange, onPriorityChange, onTagsChange, onEdit, onDelete, onSelectionChanged, onRegisterVisitor, density,
}) {
  const gridDensity = density === 'comfortable' ? TABLE_DENSITY.COMFORTABLE : TABLE_DENSITY.COMPACT;

  const columns = useMemo(() => [
    {
      field: 'enquiryCode',
      headerName: 'ID',
      width: 104,
      minWidth: 96,
      maxWidth: 116,
      cellClass: `font-medium text-text tabular-nums ${centerCell}`,
      headerClass: centerHeader,
    },
    createAvatarColumn(),
    {
      field: 'name',
      headerName: 'Name',
      width: 148,
      minWidth: 130,
      valueGetter: (p) => `${p.data.firstName} ${p.data.lastName || ''}`.trim(),
      cellClass: `text-xs font-medium text-text crm-grid-cell--truncate ${centerCell}`,
      headerClass: centerHeader,
    },
    {
      field: 'email',
      headerName: 'Email',
      flex: 1,
      minWidth: 160,
      cellClass: `text-text-secondary crm-grid-cell--truncate ${centerCell}`,
      headerClass: centerHeader,
    },
    {
      field: 'mobile',
      headerName: 'Mobile',
      width: 118,
      cellClass: `tabular-nums text-text-secondary ${centerCell}`,
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
      field: 'interestedCountry',
      headerName: 'Country',
      width: 108,
      cellClass: `text-text-secondary ${centerCell}`,
      headerClass: centerHeader,
    },
    {
      field: 'priority',
      headerName: 'Priority',
      width: 118,
      minWidth: 108,
      cellClass: `crm-grid-priority-cell ${centerCell}`,
      headerClass: centerHeader,
      tooltipValueGetter: (p) => getEnquiryPriorityLabel(p.value),
      cellRenderer: (p) => (
        <EnquiryPriorityBadge
          priority={p.value || 'MEDIUM'}
          onChange={(priority) => onPriorityChange(p.data.id, priority)}
        />
      ),
    },
    {
      field: 'status',
      headerName: 'Status',
      width: 168,
      minWidth: 156,
      cellClass: `crm-grid-status-cell ${centerCell}`,
      headerClass: centerHeader,
      tooltipValueGetter: (p) => getEnquiryStatusLabel(p.value),
      cellRenderer: (p) => (
        <EnquiryStatusPill
          status={p.value}
          onChange={(status) => onStatusChange(p.data.id, status)}
        />
      ),
    },
    {
      field: 'tags',
      headerName: 'Tags',
      width: 148,
      minWidth: 132,
      flex: 0,
      cellClass: `crm-grid-tags-cell ${centerCell}`,
      headerClass: centerHeader,
      valueGetter: (p) => (Array.isArray(p.data.tags) ? p.data.tags : []),
      cellRenderer: (p) => (
        <EnquiryTagChips
          tags={Array.isArray(p.data.tags) ? p.data.tags : []}
          onChange={(tags) => onTagsChange(p.data.id, tags)}
        />
      ),
    },
    {
      field: 'assignedTo',
      headerName: 'Assigned To',
      width: 128,
      valueGetter: (p) => p.data.assignedTo
        ? `${p.data.assignedTo.firstName} ${p.data.assignedTo.lastName}` : '—',
      cellClass: `text-text-secondary crm-grid-cell--truncate ${centerCell}`,
      headerClass: centerHeader,
    },
    {
      field: 'intake',
      headerName: 'Intake',
      width: 92,
      cellClass: `text-text-secondary ${centerCell}`,
      headerClass: centerHeader,
    },
    {
      field: 'source',
      headerName: 'Source',
      width: 96,
      cellClass: `text-text-secondary ${centerCell}`,
      headerClass: centerHeader,
    },
    {
      field: 'branch',
      headerName: 'Branch',
      width: 108,
      valueGetter: (p) => p.data.branch?.name || '—',
      cellClass: `text-text-secondary ${centerCell}`,
      headerClass: centerHeader,
    },
    {
      field: 'createdAt',
      headerName: 'Created',
      width: 96,
      valueFormatter: (p) => new Date(p.value).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: '2-digit' }),
      cellClass: `text-text-muted tabular-nums ${centerCell}`,
      headerClass: centerHeader,
    },
    createActionsColumn({
      pinned: null,
      cellRenderer: GridRowActions({ onEdit, onDelete }),
    }),
  ], [onStatusChange, onPriorityChange, onTagsChange, onEdit, onDelete]);

  return (
    <DataGrid
      columns={columns}
      rowData={rows}
      loading={loading}
      fetching={fetching}
      density={gridDensity}
      rowSelection="multiple"
      onSelectionChanged={onSelectionChanged}
      onRowClick={(data) => onRowClick?.(data)}
      pagination
      paginationPageSize={25}
      height="100%"
      emptyTitle="No enquiries yet"
      emptyDescription="Click Register Visitor — new entries appear in this table with status New."
      emptyActionLabel="Register Visitor"
      onEmptyAction={onRegisterVisitor}
      getRowId={(p) => p.data.id}
    />
  );
}
