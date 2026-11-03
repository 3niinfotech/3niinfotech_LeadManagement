import { useMemo } from 'react';
import { FiEye, FiExternalLink, FiTrash2, FiCalendar, FiClock, FiMapPin } from 'react-icons/fi';
import DataGrid from '../../../components/table/DataGrid';
import Badge from '../../../components/ui/Badge';
import Avatar from '../../../components/ui/Avatar';
import Button from '../../../components/ui/Button';
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
  onInspect,
  onViewProfile,
  emptyTitle = 'No students enrolled yet',
  emptyDescription = 'Search a student above to enroll them in this batch.',
}) {
  const columns = useMemo(() => {
    const cols = [
      {
        field: 'student',
        headerName: 'Student Particulars',
        flex: 1.8,
        minWidth: 200,
        valueGetter: (p) => {
          const en = p.data;
          if (!en) return '—';
          return `${en.student?.firstName || ''} ${en.student?.lastName || ''}`.trim()
            || en.student?.studentCode
            || en.studentId
            || 'Student';
        },
        cellRenderer: (p) => {
          const en = p.data;
          if (!en) return null;
          const name = `${en.student?.firstName || ''} ${en.student?.lastName || ''}`.trim()
            || en.student?.studentCode
            || en.studentId
            || 'Student';
          return (
            <div className="flex items-center gap-2.5 min-w-0 text-left py-1">
              <Avatar name={name} size="sm" />
              <div className="min-w-0">
                <button
                  type="button"
                  onClick={() => onInspect?.(en)}
                  className="text-xs font-bold text-text hover:text-brand transition-colors block truncate text-left"
                >
                  {name}
                </button>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="text-[10px] text-text-muted font-mono block">{en.student?.studentCode}</span>
                  {en.student?.phone && (
                    <span className="text-[10px] text-slate-400">· {en.student.phone}</span>
                  )}
                </div>
              </div>
            </div>
          );
        },
        cellClass: centerCell,
        headerClass: centerHeader,
      },
      {
        field: 'present',
        headerName: 'Present',
        width: 100,
        valueGetter: (p) => p.data?.attendance?.present ?? 0,
        cellRenderer: (p) => (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200/60 tabular-nums">
            ✓ {p.value} Present
          </span>
        ),
        cellClass: centerCell,
        headerClass: centerHeader,
      },
      {
        field: 'absent',
        headerName: 'Absent',
        width: 100,
        valueGetter: (p) => p.data?.attendance?.absent ?? 0,
        cellRenderer: (p) => (
          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold tabular-nums ${p.value > 0 ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400 border border-rose-200/60' : 'bg-slate-50 text-slate-500 border border-slate-200/50'}`}>
            ✕ {p.value} Absent
          </span>
        ),
        cellClass: centerCell,
        headerClass: centerHeader,
      },
      {
        field: 'percent',
        headerName: 'Attendance',
        width: 130,
        valueGetter: (p) => Number(p.data?.attendance?.percent) || 0,
        cellRenderer: (p) => {
          const pct = Number(p.data?.attendance?.percent) || 0;
          const low = Boolean(p.data?.attendance?.low) || pct < 75;
          return (
            <Badge color={low ? 'danger' : pct >= 90 ? 'success' : 'primary'} size="sm">
              {pct}% Rate
            </Badge>
          );
        },
        cellClass: centerCell,
        headerClass: centerHeader,
      },
      {
        field: 'status',
        headerName: 'Status',
        width: 110,
        cellRenderer: () => (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200/50">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            Enrolled
          </span>
        ),
        cellClass: centerCell,
        headerClass: centerHeader,
      },
      {
        colId: 'actions',
        headerName: 'Actions',
        width: 160,
        sortable: false,
        cellRenderer: (p) => {
          const en = p.data;
          return (
            <div className="flex items-center justify-center gap-1.5">
              <Button
                size="xs"
                variant="outline"
                className="px-2 py-1 text-[11px] font-semibold rounded-md shadow-2xs"
                onClick={() => onInspect?.(en)}
                title="Inspect academic details"
              >
                <FiEye className="w-3 h-3 mr-1" /> Inspect
              </Button>
              {onViewProfile && (
                <Button
                  size="xs"
                  variant="ghost"
                  className="p-1 text-slate-500 hover:text-brand rounded-md"
                  onClick={() => onViewProfile?.(en?.student?.id || en?.studentId)}
                  title="Open full profile"
                >
                  <FiExternalLink className="w-3.5 h-3.5" />
                </Button>
              )}
              {canManage && onUnenroll && (
                <Button
                  size="xs"
                  variant="ghost"
                  className="p-1 text-slate-400 hover:text-rose-600 rounded-md"
                  onClick={() => onUnenroll?.(en?.studentId)}
                  title="Unenroll student"
                >
                  <FiTrash2 className="w-3.5 h-3.5" />
                </Button>
              )}
            </div>
          );
        },
        cellClass: centerCell,
        headerClass: centerHeader,
      },
    ];

    return cols;
  }, [canManage, onInspect, onViewProfile, onUnenroll]);

  return (
    <DataGrid
      columns={columns}
      rowData={rows}
      loading={loading}
      getRowId={(p) => p.data.id || p.data.studentId}
      density={TABLE_DENSITY.COMPACT}
      pagination={false}
      fitContent
      maxVisibleRows={15}
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
      field: 'date',
      headerName: 'Session Date',
      flex: 1.2,
      minWidth: 140,
      valueGetter: (p) => p.data?.startAt,
      cellRenderer: (p) => {
        const startAt = p.data?.startAt;
        if (!startAt) return '—';
        const d = new Date(startAt);
        const isToday = new Date().toDateString() === d.toDateString();
        return (
          <div className="flex items-center gap-1.5 py-1">
            <FiCalendar className="w-3.5 h-3.5 text-text-muted shrink-0" />
            <div className="min-w-0">
              <span className="text-xs font-bold text-text block">
                {d.toLocaleDateString('en-IN', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' })}
              </span>
              {isToday && (
                <span className="inline-block text-[10px] font-bold text-brand uppercase tracking-wider">Today's Class</span>
              )}
            </div>
          </div>
        );
      },
      cellClass: centerCell,
      headerClass: centerHeader,
    },
    {
      field: 'time',
      headerName: 'Class Time',
      width: 130,
      valueGetter: (p) => p.data?.startAt,
      cellRenderer: (p) => {
        const startAt = p.data?.startAt;
        if (!startAt) return '—';
        const d = new Date(startAt);
        return (
          <div className="flex items-center justify-center gap-1 text-xs font-semibold text-slate-800 dark:text-slate-200 tabular-nums">
            <FiClock className="w-3 h-3 text-text-muted" />
            <span>{d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</span>
          </div>
        );
      },
      cellClass: centerCell,
      headerClass: centerHeader,
    },
    {
      field: 'status',
      headerName: 'Session Status',
      width: 140,
      valueGetter: (p) => p.data?.window?.state || p.data?.status || 'Scheduled',
      cellRenderer: (p) => {
        const state = String(p.value || 'Scheduled');
        const s = state.toUpperCase();
        if (s.includes('OPEN') || s === 'LIVE') {
          return (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-300">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Marking Open
            </span>
          );
        }
        if (s.includes('LOCKED')) {
          return (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300 border border-slate-200/80">
              🔒 Locked
            </span>
          );
        }
        if (s.includes('NOT_OPEN') || s === 'NOT OPEN' || s.includes('UPCOMING') || s === 'SCHEDULED') {
          return (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 border border-amber-200">
              ⏳ Upcoming
            </span>
          );
        }
        if (s.includes('CANCEL')) {
          return (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400 border border-rose-200">
              ✕ Cancelled
            </span>
          );
        }
        return <Badge color="secondary" size="sm">{state.replace(/_/g, ' ')}</Badge>;
      },
      cellClass: centerCell,
      headerClass: centerHeader,
    },
    {
      field: 'room',
      headerName: 'Room / Venue',
      flex: 1.2,
      minWidth: 150,
      valueGetter: (p) => p.data?.room || batchRoom || '—',
      cellRenderer: (p) => (
        <div className="flex items-center justify-center gap-1 text-xs font-semibold text-slate-700 dark:text-slate-300 truncate px-1" title={p.value}>
          <FiMapPin className="w-3 h-3 text-text-muted shrink-0" />
          <span className="truncate">{p.value}</span>
        </div>
      ),
      cellClass: centerCell,
      headerClass: centerHeader,
    },
    {
      colId: 'actions',
      headerName: 'Action',
      width: 160,
      sortable: false,
      cellRenderer: (p) => {
        const s = String(p.data?.window?.state || p.data?.status || '').toUpperCase();
        const isOpen = s.includes('OPEN') || s === 'LIVE';
        return (
          <button
            type="button"
            className={`crm-session-action-btn ${isOpen ? 'crm-session-action-btn--primary' : 'crm-session-action-btn--outline'}`}
            onClick={(e) => {
              e.stopPropagation();
              onOpen?.(p.data);
            }}
          >
            {isOpen ? 'Take Attendance' : 'View Attendance'}
          </button>
        );
      },
      cellClass: centerCell,
      headerClass: centerHeader,
    },
  ], [batchRoom, onOpen]);

  return (
    <DataGrid
      columns={columns}
      rowData={rows}
      onRowClick={onOpen}
      getRowId={(p) => p.data.id}
      density={TABLE_DENSITY.COMPACT}
      pagination={false}
      fitContent
      maxVisibleRows={15}
      emptyTitle="No sessions yet"
      emptyDescription="Add a timetable slot and generate classes."
      className="crm-batch-embedded-grid"
    />
  );
}
