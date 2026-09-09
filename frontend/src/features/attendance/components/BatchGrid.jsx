import { useMemo } from 'react';
import DataGrid from '../../../components/table/DataGrid';
import Badge from '../../../components/ui/Badge';
import { GridActionButton, GridActionGroup } from '../../../components/table/GridActionButtons';
import { TABLE_DENSITY } from '../../../config/constants';

const centerCell = 'crm-grid-cell--center';
const centerHeader = 'crm-grid-header-cell--center';

function instructorLabel(user) {
  if (!user) return 'Unassigned';
  return `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email || 'Unassigned';
}

/** Batches list — shared DataGrid */
export default function BatchGrid({
  rows = [],
  loading = false,
  fetching = false,
  onRowClick,
  onOpen,
  emptyTitle,
  emptyDescription,
  emptyActionLabel,
  onEmptyAction,
}) {
  const columns = useMemo(() => [
    {
      field: 'name',
      headerName: 'Batch',
      flex: 1.4,
      minWidth: 180,
      cellRenderer: (p) => {
        const b = p.data;
        if (!b) return null;
        return (
          <div className="min-w-0 text-left leading-tight">
            <div className="text-xs font-semibold text-text truncate">{b.name}</div>
            <div className="text-[11px] text-text-muted tabular-nums truncate">
              {b.code || '—'}
              {b.room ? ` · ${b.room}` : ''}
            </div>
          </div>
        );
      },
      cellClass: centerCell,
      headerClass: centerHeader,
    },
    {
      field: 'courseName',
      headerName: 'Course',
      flex: 1,
      minWidth: 120,
      valueGetter: (p) => p.data?.courseName || '—',
      cellClass: `text-text-secondary crm-grid-cell--truncate ${centerCell}`,
      headerClass: centerHeader,
    },
    {
      field: 'students',
      headerName: 'Students',
      width: 100,
      valueGetter: (p) => p.data?._count?.enrollments ?? 0,
      cellClass: `tabular-nums font-semibold text-text ${centerCell}`,
      headerClass: centerHeader,
    },
    {
      field: 'sessions',
      headerName: 'Sessions',
      width: 100,
      valueGetter: (p) => p.data?._count?.sessions ?? 0,
      cellClass: `tabular-nums text-text-secondary ${centerCell}`,
      headerClass: centerHeader,
    },
    {
      field: 'instructor',
      headerName: 'Faculty',
      flex: 1,
      minWidth: 130,
      valueGetter: (p) => instructorLabel(p.data?.instructor),
      cellClass: `text-text-secondary crm-grid-cell--truncate ${centerCell}`,
      headerClass: centerHeader,
    },
    {
      field: 'branch',
      headerName: 'Branch',
      flex: 0.9,
      minWidth: 110,
      valueGetter: (p) => p.data?.branch?.name || '—',
      cellClass: `text-text-secondary crm-grid-cell--truncate ${centerCell}`,
      headerClass: centerHeader,
    },
    {
      field: 'isActive',
      headerName: 'Status',
      width: 100,
      cellRenderer: (p) => (
        <Badge color={p.data?.isActive !== false ? 'success' : 'secondary'} size="sm">
          {p.data?.isActive !== false ? 'Active' : 'Inactive'}
        </Badge>
      ),
      cellClass: centerCell,
      headerClass: centerHeader,
    },
    {
      colId: 'actions',
      headerName: '',
      width: 72,
      sortable: false,
      cellRenderer: (p) => (
        <GridActionGroup>
          <GridActionButton
            action="view"
            title="Open batch"
            onClick={() => onOpen?.(p.data)}
          />
        </GridActionGroup>
      ),
      cellClass: centerCell,
      headerClass: centerHeader,
    },
  ], [onOpen]);

  return (
    <DataGrid
      columns={columns}
      rowData={rows}
      loading={loading}
      fetching={fetching}
      onRowClick={onRowClick}
      getRowId={(p) => p.data.id}
      density={TABLE_DENSITY.COMPACT}
      emptyTitle={emptyTitle}
      emptyDescription={emptyDescription}
      emptyActionLabel={emptyActionLabel}
      onEmptyAction={onEmptyAction}
      paginationPageSize={25}
    />
  );
}

/** Enrolled students inside a batch */
export function BatchStudentsGrid({
  rows = [],
  loading = false,
  canManage = false,
  onUnenroll,
  emptyTitle = 'No students enrolled yet',
  emptyDescription = 'Search a student above to enroll them in this batch.',
}) {
  const columns = useMemo(() => {
    const cols = [
      {
        field: 'student',
        headerName: 'Student',
        flex: 1.4,
        minWidth: 160,
        cellRenderer: (p) => {
          const en = p.data;
          if (!en) return null;
          const name = `${en.student?.firstName || ''} ${en.student?.lastName || ''}`.trim()
            || en.student?.studentCode
            || en.studentId
            || 'Student';
          return (
            <div className="min-w-0 text-left leading-tight">
              <div className="text-xs font-semibold text-text truncate">{name}</div>
              {en.student?.studentCode && (
                <div className="text-[11px] text-text-muted tabular-nums">{en.student.studentCode}</div>
              )}
            </div>
          );
        },
        cellClass: centerCell,
        headerClass: centerHeader,
      },
      {
        field: 'present',
        headerName: 'Present',
        width: 88,
        valueGetter: (p) => p.data?.attendance?.present ?? 0,
        cellClass: `tabular-nums text-text-secondary ${centerCell}`,
        headerClass: centerHeader,
      },
      {
        field: 'absent',
        headerName: 'Absent',
        width: 88,
        valueGetter: (p) => p.data?.attendance?.absent ?? 0,
        cellClass: `tabular-nums text-text-secondary ${centerCell}`,
        headerClass: centerHeader,
      },
      {
        field: 'percent',
        headerName: '%',
        width: 120,
        valueGetter: (p) => Number(p.data?.attendance?.percent) || 0,
        cellRenderer: (p) => {
          const pct = Number(p.data?.attendance?.percent) || 0;
          const low = Boolean(p.data?.attendance?.low);
          return (
            <span className="inline-flex items-center gap-1.5">
              <span className="tabular-nums font-semibold text-text">{pct}%</span>
              {low ? <Badge color="danger" size="sm">At risk</Badge> : null}
            </span>
          );
        },
        cellClass: centerCell,
        headerClass: centerHeader,
      },
      {
        field: 'trend',
        headerName: 'Trend',
        width: 110,
        sortable: false,
        cellRenderer: (p) => {
          const pct = Number(p.data?.attendance?.percent) || 0;
          const low = Boolean(p.data?.attendance?.low);
          return (
            <div className="crm-batch-bar" title={`${pct}%`}>
              <div
                className={`crm-batch-bar__fill ${low ? 'crm-batch-bar__fill--danger' : ''}`}
                style={{ width: `${Math.min(100, Math.max(0, pct))}%` }}
              />
            </div>
          );
        },
        cellClass: centerCell,
        headerClass: centerHeader,
      },
    ];

    if (canManage) {
      cols.push({
        colId: 'actions',
        headerName: '',
        width: 64,
        sortable: false,
        cellRenderer: (p) => (
          <GridActionGroup>
            <GridActionButton
              action="delete"
              title="Unenroll"
              onClick={() => onUnenroll?.(p.data?.studentId)}
            />
          </GridActionGroup>
        ),
        cellClass: centerCell,
        headerClass: centerHeader,
      });
    }

    return cols;
  }, [canManage, onUnenroll]);

  return (
    <DataGrid
      columns={columns}
      rowData={rows}
      loading={loading}
      getRowId={(p) => p.data.id || p.data.studentId}
      density={TABLE_DENSITY.COMPACT}
      pagination={false}
      fitContent
      maxVisibleRows={10}
      emptyTitle={emptyTitle}
      emptyDescription={emptyDescription}
      className="crm-batch-embedded-grid"
    />
  );
}

/** Class sessions inside a batch */
export function BatchSessionsGrid({
  rows = [],
  batchRoom,
  canMark = false,
  onOpen,
}) {
  const columns = useMemo(() => [
    {
      field: 'startAt',
      headerName: 'When',
      flex: 1.2,
      minWidth: 150,
      valueGetter: (p) => p.data?.startAt,
      cellRenderer: (p) => {
        const startAt = p.data?.startAt;
        if (!startAt) return '—';
        const d = new Date(startAt);
        return (
          <div className="min-w-0 text-left leading-tight">
            <div className="text-xs font-semibold text-text">
              {d.toLocaleDateString('en-IN', { weekday: 'short', day: '2-digit', month: 'short' })}
            </div>
            <div className="text-[11px] text-brand font-semibold tabular-nums">
              {d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
            </div>
          </div>
        );
      },
      cellClass: centerCell,
      headerClass: centerHeader,
    },
    {
      field: 'status',
      headerName: 'Window',
      flex: 1,
      minWidth: 110,
      valueGetter: (p) => p.data?.window?.state || p.data?.status || 'Scheduled',
      cellRenderer: (p) => {
        const state = String(p.value || 'Scheduled');
        const s = state.toUpperCase();
        let color = 'secondary';
        if (s.includes('OPEN') || s === 'LIVE') color = 'success';
        else if (s.includes('UPCOMING') || s === 'SCHEDULED' || s === 'NOT_OPEN') color = 'primary';
        else if (s.includes('CANCEL')) color = 'danger';
        return <Badge color={color} size="sm">{state.replace(/_/g, ' ')}</Badge>;
      },
      cellClass: centerCell,
      headerClass: centerHeader,
    },
    {
      field: 'room',
      headerName: 'Room',
      flex: 0.8,
      minWidth: 90,
      valueGetter: (p) => p.data?.room || batchRoom || '—',
      cellClass: `text-text-secondary ${centerCell}`,
      headerClass: centerHeader,
    },
    {
      colId: 'actions',
      headerName: '',
      width: 108,
      sortable: false,
      cellRenderer: (p) => (
        <GridActionGroup>
          <GridActionButton
            action={canMark ? 'attendance' : 'view'}
            title={canMark ? 'Take attendance' : 'View session'}
            onClick={() => onOpen?.(p.data)}
          />
        </GridActionGroup>
      ),
      cellClass: centerCell,
      headerClass: centerHeader,
    },
  ], [batchRoom, canMark, onOpen]);

  return (
    <DataGrid
      columns={columns}
      rowData={rows}
      onRowClick={onOpen}
      getRowId={(p) => p.data.id}
      density={TABLE_DENSITY.COMPACT}
      pagination={false}
      fitContent
      maxVisibleRows={12}
      emptyTitle="No sessions yet"
      emptyDescription="Add a timetable slot and generate classes."
      className="crm-batch-embedded-grid"
    />
  );
}
