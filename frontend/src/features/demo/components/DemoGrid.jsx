import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FiCheckCircle,
  FiCalendar,
  FiEye,
  FiPhone,
} from 'react-icons/fi';
import { FaWhatsapp } from 'react-icons/fa';
import DataGrid from '../../../components/table/DataGrid';
import { createAvatarColumn } from '../../../components/table/grid.columns';
import Badge from '../../../components/ui/Badge';
import { TABLE_DENSITY } from '../../../config/constants';
import { ROUTES } from '../../../config/routes';
import {
  getDemoAttendanceBadgeTone,
  getDemoSessionStatusTone,
  getDemoResultBadgeTone,
  DEMO_ATTENDANCE_OPTIONS,
  DEMO_SESSION_STATUS_OPTIONS,
  DEMO_RESULT_OPTIONS,
} from '../config/demoConstants';
import { getDocumentUrl } from '../../enquiry/config/enquiryDocument.config';

const centerCell = 'crm-grid-cell--center';
const centerHeader = 'crm-grid-header-cell--center';

function formatDemoDateTime(dateStr) {
  if (!dateStr) return { text: '—', timeString: '', isPast: false };
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return { text: '—', timeString: '', isPast: false };

  const now = new Date();
  const isPast = d.getTime() < now.getTime();

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
    isPast,
    rawDate: d,
  };
}

import { GridActionButton, GridActionGroup } from '../../../components/table/GridActionButtons';

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
  onRowClick,
  onOpenDetail,
  onMarkAttendance,
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
        minWidth: 150,
        flex: 1.2,
        cellClass: `text-xs font-medium text-text ${centerCell}`,
        headerClass: centerHeader,
        valueGetter: (p) => `${p.data?.enquiry?.firstName || ''} ${p.data?.enquiry?.lastName || ''}`.trim() || '—',
        cellRenderer: (p) => {
          const name = p.value;
          return <span className="font-semibold text-text truncate" title={name}>{name}</span>;
        },
      },
      {
        field: 'contact',
        headerName: 'Contact',
        minWidth: 150,
        flex: 1.2,
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
        minWidth: 120,
        flex: 1,
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
        minWidth: 130,
        flex: 1.1,
        cellClass: `text-xs ${centerCell}`,
        headerClass: centerHeader,
        valueGetter: (p) => p.data?.className || p.data?.enquiry?.interestedCourse || '—',
        cellRenderer: (p) => {
          const c = p.value;
          return <span className="font-medium text-text truncate" title={c}>{c}</span>;
        },
      },
      {
        field: 'batch',
        headerName: 'Batch',
        minWidth: 110,
        flex: 0.9,
        cellClass: `text-xs text-text-secondary ${centerCell}`,
        headerClass: centerHeader,
        valueGetter: (p) => p.data?.batch || 'Standard',
      },
      {
        field: 'demoDate',
        headerName: 'Date & Time',
        minWidth: 150,
        flex: 1.2,
        cellClass: `text-xs ${centerCell}`,
        headerClass: centerHeader,
        comparator: (d1, d2) => new Date(d1).getTime() - new Date(d2).getTime(),
        cellRenderer: (p) => {
          const info = formatDemoDateTime(p.value);
          if (info.text === '—') return <span className="text-text-muted">—</span>;

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
        minWidth: 120,
        flex: 1,
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
        minWidth: 120,
        flex: 1,
        cellClass: `text-xs text-text-secondary ${centerCell}`,
        headerClass: centerHeader,
        valueGetter: (p) => p.data?.enquiry?.branch?.name || p.data?.enquiry?.branch?.code || '—',
      },
      {
        field: 'sessionStatus',
        headerName: 'Session',
        minWidth: 110,
        flex: 0.9,
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
        minWidth: 120,
        flex: 1,
        cellClass: `text-xs ${centerCell}`,
        headerClass: centerHeader,
        cellRenderer: (p) => {
          const att = p.value || 'NOT_MARKED';
          const isPast = p.data?.demoDate && new Date(p.data.demoDate).getTime() < Date.now();
          const needsMarking = att === 'NOT_MARKED' && p.data?.sessionStatus === 'SCHEDULED' && isPast;

          if (needsMarking) {
            return (
              <Badge color="warning" size="sm">
                Pending Mark
              </Badge>
            );
          }

          const option = DEMO_ATTENDANCE_OPTIONS.find((a) => a.value === att);
          const tone = getDemoAttendanceBadgeTone(att);
          return (
            <Badge color={tone} size="sm">
              {option?.label || att}
            </Badge>
          );
        },
      },
      {
        field: 'result',
        headerName: 'Outcome',
        minWidth: 110,
        flex: 0.9,
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
    [onOpenDetail, onMarkAttendance, onReschedule],
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
