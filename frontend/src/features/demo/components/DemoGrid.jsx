import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiPhone, FiCheck, FiX } from 'react-icons/fi';
import { FaWhatsapp } from 'react-icons/fa';
import DataGrid from '../../../components/table/DataGrid';
import { createAvatarColumn } from '../../../components/table/grid.columns';
import Badge from '../../../components/ui/Badge';
import { TABLE_DENSITY } from '../../../config/constants';
import { ROUTES } from '../../../config/routes';
import {
  getDemoAttendanceBadgeTone,
  getDemoAttendanceLabel,
  getDemoSessionStatusTone,
  getDemoResultBadgeTone,
  normalizeDemoAttendance,
  formatDemoDay,
  DEMO_SESSION_STATUS_OPTIONS,
  DEMO_RESULT_OPTIONS,
} from '../config/demoConstants';
import { getDocumentUrl } from '../../enquiry/config/enquiryDocument.config';
import { GridActionButton, GridActionGroup } from '../../../components/table/GridActionButtons';

const centerCell = 'crm-grid-cell--center';
const centerHeader = 'crm-grid-header-cell--center';

function formatDemoDateTime(dateStr) {
  if (!dateStr) return { text: '—', timeString: '', isPast: false };
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return { text: '—', timeString: '', isPast: false };

  const timeString = d.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });

  const dateString = d.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  return {
    dateString,
    timeString,
    isPast: d.getTime() < Date.now(),
    rawDate: d,
  };
}

function AttendanceCell({ data, canMark, markingId, onQuickMark, onMarkAttendance }) {
  if (!data) return null;

  const att = normalizeDemoAttendance(data.attendance);
  const tone = getDemoAttendanceBadgeTone(att);
  const label = getDemoAttendanceLabel(att);
  const inactive = data.sessionStatus === 'CANCELLED' || data.sessionStatus === 'RESCHEDULED';
  const busy = markingId === data.id;
  const showInline = canMark && !inactive && att === 'NOT_MARKED' && data.canMarkAttendance !== false;

  const titleParts = [
    label,
    data.className || data.batch,
    data.attendanceMarkedBy
      ? `Marked by ${data.attendanceMarkedBy.firstName || ''}`.trim()
      : null,
    data.attendanceMarkedAt
      ? new Date(data.attendanceMarkedAt).toLocaleString('en-IN')
      : null,
  ].filter(Boolean);

  return (
    <div
      className="inline-flex items-center justify-center gap-1 whitespace-nowrap"
      onClick={(e) => e.stopPropagation()}
      onKeyDown={(e) => e.stopPropagation()}
      role="presentation"
      title={titleParts.join(' · ')}
    >
      <Badge color={tone} size="sm">
        {label}
      </Badge>
      {showInline && (
        <>
          <button
            type="button"
            disabled={busy}
            title="Mark Present"
            aria-label="Mark Present"
            className="inline-flex items-center justify-center w-6 h-6 rounded-md border border-emerald-500/35 text-emerald-700 bg-emerald-500/10 hover:bg-emerald-500/20 disabled:opacity-50"
            onClick={() => onQuickMark?.(data, 'PRESENT')}
          >
            <FiCheck className="w-3.5 h-3.5" strokeWidth={2.5} />
          </button>
          <button
            type="button"
            disabled={busy}
            title="Mark Absent"
            aria-label="Mark Absent"
            className="inline-flex items-center justify-center w-6 h-6 rounded-md border border-rose-500/35 text-rose-700 bg-rose-500/10 hover:bg-rose-500/20 disabled:opacity-50"
            onClick={() => onQuickMark?.(data, 'ABSENT')}
          >
            <FiX className="w-3.5 h-3.5" strokeWidth={2.5} />
          </button>
        </>
      )}
      {canMark && !inactive && att === 'NOT_MARKED' && data.canMarkAttendance === false && (
        <button
          type="button"
          className="text-[10px] font-semibold text-primary hover:underline px-0.5"
          onClick={() => onMarkAttendance?.(data)}
        >
          Mark
        </button>
      )}
    </div>
  );
}

function DirectDemoActions({
  data,
  onOpenDetail,
  onMarkAttendance,
  onReschedule,
}) {
  if (!data) return null;

  const isCancelled = data.sessionStatus === 'CANCELLED';
  const isRescheduled = data.sessionStatus === 'RESCHEDULED';
  const isInactive = isCancelled || isRescheduled;

  return (
    <GridActionGroup>
      <GridActionButton
        action="view"
        title="View Demo Details"
        onClick={() => onOpenDetail?.(data)}
      />

      {!isInactive && (
        <>
          <GridActionButton
            action="attendance"
            title="Mark Attendance & Outcome"
            onClick={() => onMarkAttendance?.(data)}
          />

          <GridActionButton
            action="schedule"
            title="Reschedule Demo Session"
            onClick={() => onReschedule?.(data)}
          />
        </>
      )}
    </GridActionGroup>
  );
}

export default function DemoGrid({
  rows = [],
  loading = false,
  fetching = false,
  density = 'comfortable',
  canMark = false,
  markingId = null,
  onRowClick,
  onOpenDetail,
  onMarkAttendance,
  onQuickMark,
  onReschedule,
  onCancel,
  onSelectionChanged,
  onScheduleDemo,
}) {
  const navigate = useNavigate();
  const gridDensity = density === 'comfortable' ? TABLE_DENSITY.COMFORTABLE : TABLE_DENSITY.COMPACT;

  const handleOpenEnquiry = (enquiryId) => {
    if (!enquiryId) return;
    navigate(ROUTES.ENQUIRY_TAB(enquiryId, 'demo'));
  };

  const columns = useMemo(
    () => [
      createAvatarColumn({
        srcGetter: (row) => getDocumentUrl(row?.enquiry?.photoUrl) || '',
        nameGetter: (row) => `${row?.enquiry?.firstName || ''} ${row?.enquiry?.lastName || ''}`.trim(),
      }),
      {
        field: 'studentName',
        headerName: 'Student Name',
        minWidth: 140,
        flex: 1.1,
        cellClass: `text-xs font-medium text-text ${centerCell}`,
        headerClass: centerHeader,
        valueGetter: (p) => `${p.data?.enquiry?.firstName || ''} ${p.data?.enquiry?.lastName || ''}`.trim() || '—',
        cellRenderer: (p) => (
          <span className="font-semibold text-text truncate" title={p.value}>{p.value}</span>
        ),
      },
      {
        field: 'demoDay',
        headerName: 'Demo Day',
        minWidth: 88,
        flex: 0.6,
        cellClass: `text-xs ${centerCell}`,
        headerClass: centerHeader,
        valueGetter: (p) => p.data?.demoDay,
        cellRenderer: (p) => (
          <Badge color="primary" size="sm">{formatDemoDay(p.value)}</Badge>
        ),
      },
      {
        field: 'contact',
        headerName: 'Contact',
        minWidth: 140,
        flex: 1.1,
        cellClass: `text-xs ${centerCell}`,
        headerClass: centerHeader,
        valueGetter: (p) => p.data?.enquiry?.mobile || p.data?.enquiry?.email || '—',
        cellRenderer: (p) => {
          const enquiry = p.data?.enquiry;
          if (!enquiry) return <span className="text-text-muted">—</span>;
          const mobile = enquiry.mobile;
          const cleanMobile = mobile ? String(mobile).replace(/\D/g, '') : '';

          return (
            <div className="flex items-center justify-center gap-1.5 tabular-nums">
              <span className="text-text-secondary">{mobile || enquiry.email || '—'}</span>
              {cleanMobile && (
                <a
                  href={`https://wa.me/${cleanMobile}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1 rounded bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 transition-colors"
                  title="WhatsApp student"
                  onClick={(e) => e.stopPropagation()}
                >
                  <FaWhatsapp className="w-3 h-3" />
                </a>
              )}
              {cleanMobile && (
                <a
                  href={`tel:${cleanMobile}`}
                  className="p-1 rounded bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                  title="Call student"
                  onClick={(e) => e.stopPropagation()}
                >
                  <FiPhone className="w-3 h-3" />
                </a>
              )}
            </div>
          );
        },
      },
      {
        field: 'enquiryCode',
        headerName: 'Enquiry ID',
        minWidth: 110,
        flex: 0.9,
        cellClass: `text-xs font-mono font-medium text-primary ${centerCell}`,
        headerClass: centerHeader,
        valueGetter: (p) => p.data?.enquiry?.enquiryCode || '—',
        cellRenderer: (p) => {
          const code = p.value;
          const enquiryId = p.data?.enquiry?.id;
          if (!code || code === '—') return <span className="text-text-muted">—</span>;
          return (
            <button
              type="button"
              className="hover:underline font-semibold text-primary transition-colors inline-flex items-center gap-1"
              onClick={(e) => {
                e.stopPropagation();
                if (enquiryId) handleOpenEnquiry(enquiryId);
              }}
              title="Open Enquiry Workspace"
            >
              {code}
            </button>
          );
        },
      },
      {
        field: 'course',
        headerName: 'Course',
        minWidth: 120,
        flex: 1,
        cellClass: `text-xs ${centerCell}`,
        headerClass: centerHeader,
        valueGetter: (p) => p.data?.className || p.data?.enquiry?.interestedCourse || '—',
        cellRenderer: (p) => (
          <span className="font-medium text-text truncate" title={p.value}>{p.value}</span>
        ),
      },
      {
        field: 'batch',
        headerName: 'Batch',
        minWidth: 100,
        flex: 0.8,
        cellClass: `text-xs text-text-secondary ${centerCell}`,
        headerClass: centerHeader,
        valueGetter: (p) => p.data?.batch || 'Standard',
      },
      {
        field: 'demoDate',
        headerName: 'Date & Time',
        minWidth: 130,
        flex: 1.1,
        cellClass: `text-xs ${centerCell}`,
        headerClass: centerHeader,
        comparator: (d1, d2) => new Date(d1).getTime() - new Date(d2).getTime(),
        cellRenderer: (p) => {
          const info = formatDemoDateTime(p.value);
          if (!info.dateString) return <span className="text-text-muted">—</span>;
          return (
            <div className="flex flex-col items-center justify-center text-center">
              <span className="font-semibold text-text tabular-nums">{info.dateString}</span>
              <span className="text-[11px] text-text-muted tabular-nums">{info.timeString}</span>
            </div>
          );
        },
      },
      {
        field: 'faculty',
        headerName: 'Faculty',
        minWidth: 110,
        flex: 0.9,
        cellClass: `text-xs text-text-secondary ${centerCell}`,
        headerClass: centerHeader,
        valueGetter: (p) =>
          p.data?.faculty?.name ||
          `${p.data?.faculty?.firstName || ''} ${p.data?.faculty?.lastName || ''}`.trim() ||
          '—',
      },
      {
        field: 'branch',
        headerName: 'Branch',
        minWidth: 100,
        flex: 0.8,
        cellClass: `text-xs text-text-secondary ${centerCell}`,
        headerClass: centerHeader,
        valueGetter: (p) => p.data?.enquiry?.branch?.name || p.data?.enquiry?.branch?.code || '—',
      },
      {
        field: 'sessionStatus',
        headerName: 'Session',
        minWidth: 100,
        flex: 0.8,
        cellClass: `text-xs ${centerCell}`,
        headerClass: centerHeader,
        cellRenderer: (p) => {
          const status = p.value || 'SCHEDULED';
          const option = DEMO_SESSION_STATUS_OPTIONS.find((s) => s.value === status);
          const tone = getDemoSessionStatusTone(status);
          return (
            <Badge color={tone} size="sm">
              {option?.label || status}
            </Badge>
          );
        },
      },
      {
        field: 'attendance',
        headerName: 'Attendance',
        minWidth: 128,
        width: 140,
        flex: 0,
        cellClass: `text-xs ${centerCell}`,
        headerClass: centerHeader,
        valueGetter: (p) => normalizeDemoAttendance(p.data?.attendance),
        cellRenderer: (p) => (
          <AttendanceCell
            data={p.data}
            canMark={canMark}
            markingId={markingId}
            onQuickMark={onQuickMark}
            onMarkAttendance={onMarkAttendance}
          />
        ),
      },
      {
        field: 'result',
        headerName: 'Outcome',
        minWidth: 100,
        flex: 0.8,
        cellClass: `text-xs ${centerCell}`,
        headerClass: centerHeader,
        cellRenderer: (p) => {
          const res = p.value || 'PENDING';
          const option = DEMO_RESULT_OPTIONS.find((r) => r.value === res);
          const tone = getDemoResultBadgeTone(res);
          return (
            <Badge color={tone} size="sm">
              {option?.label || res}
            </Badge>
          );
        },
      },
      {
        field: 'actions',
        headerName: 'Actions',
        width: 100,
        pinned: 'right',
        cellClass: `text-xs ${centerCell}`,
        headerClass: centerHeader,
        cellRenderer: (p) => (
          <DirectDemoActions
            data={p.data}
            onOpenDetail={onOpenDetail}
            onMarkAttendance={onMarkAttendance}
            onReschedule={onReschedule}
          />
        ),
      },
    ],
    [canMark, markingId, onOpenDetail, onMarkAttendance, onQuickMark, onReschedule],
  );

  return (
    <DataGrid
      columns={columns}
      rowData={rows}
      loading={loading}
      fetching={fetching}
      density={gridDensity}
      rowSelection="multiple"
      onSelectionChanged={(selected) => onSelectionChanged?.(selected)}
      onRowClick={(row) => {
        if (onRowClick) onRowClick(row);
        else if (onOpenDetail) onOpenDetail(row);
      }}
      emptyTitle="No demo sessions found"
      emptyDescription="No demos matched your current view or filters. Schedule a new demo session to get started."
      emptyActionLabel="Schedule Demo"
      onEmptyAction={onScheduleDemo}
    />
  );
}
