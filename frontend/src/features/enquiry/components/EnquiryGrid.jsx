import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import DataGrid from '../../../components/table/DataGrid';
import { createActionsColumn, createAvatarColumn, GridRowActions } from '../../../components/table/grid.columns';
import EnquiryStatusPill from './EnquiryStatusPill';
import EnquiryPriorityBadge from './EnquiryPriorityBadge';
import EnquiryTagChips from './EnquiryTagChips';
import { TABLE_DENSITY, getEnquiryStatusLabel, getEnquiryPriorityLabel } from '../../../config/constants';
import { getDocumentUrl } from '../config/enquiryDocument.config';
import { selectUser } from '../../../redux/slices/authSlice';

const centerCell = 'crm-grid-cell--center';
const centerHeader = 'crm-grid-header-cell--center';

export default function EnquiryGrid({
  rows, loading, fetching = false, onRowClick, onStatusChange, onPriorityChange, onTagsChange, onEdit, onDelete, onSelectionChanged, onRegisterVisitor, density,
}) {
  const gridDensity = density === 'comfortable' ? TABLE_DENSITY.COMFORTABLE : TABLE_DENSITY.COMPACT;
  const user = useSelector(selectUser);
  const myId = user?.id;

  const rowClassRules = useMemo(() => ({
    'crm-grid-row--mine': (params) => Boolean(myId && params.data?.assignedToId === myId),
  }), [myId]);

  const columns = useMemo(() => [
    {
      field: 'enquiryCode',
      headerName: 'ID',
      width: 168,
      minWidth: 156,
      cellClass: `font-medium text-text tabular-nums ${centerCell}`,
      headerClass: centerHeader,
    },
    createAvatarColumn({
      srcGetter: (row) => getDocumentUrl(row?.photoUrl) || '',
    }),
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
      width: 148,
      valueGetter: (p) => p.data.assignedTo
        ? `${p.data.assignedTo.firstName} ${p.data.assignedTo.lastName}` : '—',
      cellRenderer: (p) => {
        const name = p.value;
        if (!name || name === '—') return <span className="text-text-muted">—</span>;
        const isMine = Boolean(myId && p.data?.assignedToId === myId);
        return (
          <span className="inline-flex items-center gap-1.5 max-w-full">
            <span className="truncate">{name}</span>
            {isMine ? (
              <span className="shrink-0 rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide bg-amber-100 text-amber-800 border border-amber-200/80 dark:bg-amber-500/20 dark:text-amber-300 dark:border-amber-500/30">
                You
              </span>
            ) : null}
          </span>
        );
      },
      cellClass: `text-text-secondary crm-grid-cell--truncate ${centerCell}`,
      headerClass: centerHeader,
    },
    {
      field: 'assignedBy',
      headerName: 'Assigned By',
      width: 128,
      valueGetter: (p) => p.data.assignedBy
        ? `${p.data.assignedBy.firstName} ${p.data.assignedBy.lastName}` : '—',
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
      field: 'applyLevel',
      headerName: 'Apply Level',
      width: 120,
      minWidth: 110,
      valueGetter: (p) => p.data.applyLevel || '—',
      cellClass: `text-text-secondary crm-grid-cell--truncate ${centerCell}`,
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
      field: 'lastRemark',
      headerName: 'Last Remark',
      width: 160,
      minWidth: 140,
      valueGetter: (p) => p.data.lastRemark || '—',
      cellClass: `text-text-secondary crm-grid-cell--truncate ${centerCell}`,
      headerClass: centerHeader,
      tooltipValueGetter: (p) => p.data.lastRemark || '',
    },
    {
      field: 'createdAt',
      headerName: 'Created',
      width: 96,
      valueFormatter: (p) => new Date(p.value).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: '2-digit' }),
      cellClass: `text-text-muted tabular-nums ${centerCell}`,
      headerClass: centerHeader,
    },
    {
      field: 'updatedAt',
      headerName: 'Updated',
      width: 96,
      valueFormatter: (p) => (p.value
        ? new Date(p.value).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: '2-digit' })
        : '—'),
      cellClass: `text-text-muted tabular-nums ${centerCell}`,
      headerClass: centerHeader,
    },
    createActionsColumn({
      pinned: 'right',
      cellRenderer: GridRowActions({
        onOpenDetail: onRowClick ? (id, data) => onRowClick(data) : undefined,
        onEdit,
        onDelete,
      }),
    }),
  ], [myId, onStatusChange, onPriorityChange, onTagsChange, onRowClick, onEdit, onDelete]);

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
      emptyDescription="Assigned visitors appear here after Reception assigns you. Open a row to counsel, update status, then convert."
      emptyActionLabel="Open Reception"
      onEmptyAction={onRegisterVisitor}
      getRowId={(p) => p.data.id}
      rowClassRules={rowClassRules}
    />
  );
}
