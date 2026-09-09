import { useMemo } from 'react';
import DataGrid from '../../../components/table/DataGrid';
import Badge from '../../../components/ui/Badge';
import { createAvatarColumn, createActionsColumn } from '../../../components/table/grid.columns';
import { GridActionButton, GridActionGroup } from '../../../components/table/GridActionButtons';
import {
  displayInvoiceStatus,
  formatMoney,
  getInvoiceStatusTone,
} from '../config/feesConstants';

const centerCell = 'crm-grid-cell crm-grid-cell--center';
const centerHeader = 'crm-grid-header-cell crm-grid-header-cell--center';

function studentName(row) {
  const s = row?.student;
  if (!s) return '—';
  return `${s.firstName || ''} ${s.lastName || ''}`.trim() || s.studentCode || '—';
}

function formatDate(value) {
  if (!value) return '—';
  return new Date(value).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: '2-digit',
  });
}

function FeesActions({ onView, onMarkPaid, onDelete, canUpdate, canDelete }) {
  return function ActionsCell({ data }) {
    if (!data) return null;
    const canPay = canUpdate && data.status !== 'PAID' && data.status !== 'CANCELLED';

    return (
      <GridActionGroup>
        {onView && (
          <GridActionButton action="view" title="View details" onClick={() => onView(data)} />
        )}
        {canPay && onMarkPaid && (
          <GridActionButton
            action="attendance"
            title="Mark paid"
            onClick={() => onMarkPaid(data)}
          />
        )}
        {canDelete && onDelete && (
          <GridActionButton action="delete" title="Delete" onClick={() => onDelete(data.id, data)} />
        )}
      </GridActionGroup>
    );
  };
}

export default function FeesGrid({
  rows = [],
  loading = false,
  fetching = false,
  onRowClick,
  onView,
  onMarkPaid,
  onDelete,
  onSelectionChanged,
  canUpdate = false,
  canDelete = false,
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
      field: 'invoiceNo',
      headerName: 'Invoice No',
      minWidth: 140,
      width: 150,
      cellRenderer: (p) => (
        <span className="font-mono text-[12px] font-semibold text-text tabular-nums">
          {p.value || '—'}
        </span>
      ),
      cellClass: centerCell,
      headerClass: centerHeader,
    },
    {
      field: 'student',
      headerName: 'Student',
      minWidth: 140,
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
      field: 'total',
      headerName: 'Total',
      width: 120,
      valueGetter: (p) => formatMoney(p.data?.total, p.data?.currency),
      cellClass: `${centerCell} tabular-nums font-semibold`,
      headerClass: centerHeader,
    },
    {
      field: 'amount',
      headerName: 'Amount',
      width: 100,
      valueGetter: (p) => formatMoney(p.data?.amount),
      cellClass: `${centerCell} tabular-nums text-text-muted`,
      headerClass: centerHeader,
    },
    {
      field: 'tax',
      headerName: 'Tax',
      width: 90,
      valueGetter: (p) => formatMoney(p.data?.tax),
      cellClass: `${centerCell} tabular-nums text-text-muted`,
      headerClass: centerHeader,
    },
    {
      colId: 'status',
      headerName: 'Status',
      width: 110,
      valueGetter: (p) => displayInvoiceStatus(p.data?.status),
      cellRenderer: (p) => (
        <div className="flex items-center justify-center w-full">
          <Badge color={getInvoiceStatusTone(p.data?.status)} size="sm">
            {displayInvoiceStatus(p.data?.status)}
          </Badge>
        </div>
      ),
      cellClass: centerCell,
      headerClass: centerHeader,
    },
    {
      field: 'dueDate',
      headerName: 'Due',
      width: 100,
      valueFormatter: (p) => formatDate(p.value),
      cellClass: `${centerCell} text-text-muted tabular-nums`,
      headerClass: centerHeader,
    },
    {
      field: 'paidAt',
      headerName: 'Paid',
      width: 100,
      valueFormatter: (p) => formatDate(p.value),
      cellClass: `${centerCell} text-text-muted tabular-nums`,
      headerClass: centerHeader,
    },
    createActionsColumn({
      width: canUpdate || canDelete ? 108 : 72,
      pinned: 'right',
      headerClass: centerHeader,
      cellClass: `${centerCell} crm-grid-actions-cell`,
      cellRenderer: FeesActions({
        onView: onView || onRowClick,
        onMarkPaid,
        onDelete,
        canUpdate,
        canDelete,
      }),
    }),
  ], [onRowClick, onView, onMarkPaid, onDelete, canUpdate, canDelete]);

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
      emptyTitle="No invoices yet"
      emptyDescription="Create a fee invoice for a student to start tracking collections."
      emptyActionLabel={onCreate ? 'New Invoice' : undefined}
      onEmptyAction={onCreate}
      getRowId={(p) => p.data.id}
    />
  );
}
