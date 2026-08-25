import { useMemo } from 'react';
import {
  FiEye,
  FiEdit,
  FiTrash2,
  FiPhone,
  FiSend,
  FiGlobe,
  FiFileText,
} from 'react-icons/fi';
import { FaWhatsapp } from 'react-icons/fa';
import DataGrid from '../../../components/table/DataGrid';
import { createAvatarColumn } from '../../../components/table/grid.columns';
import Badge from '../../../components/ui/Badge';
import { TABLE_DENSITY } from '../../../config/constants';
import { useStudentStatusOptions } from '../hooks/useStudentStatusOptions';

const centerCell = 'crm-grid-cell--center';
const centerHeader = 'crm-grid-header-cell--center';

import { GridActionButton, GridActionGroup } from '../../../components/table/GridActionButtons';

function DirectStudentActions({
  data,
  onOpenDetail,
  onEdit,
  onDelete,
}) {
  if (!data) return null;

  return (
    <GridActionGroup>
      <GridActionButton
        action="view"
        title="Open Student Workspace"
        onClick={() => onOpenDetail?.(data.id)}
      />

      {onEdit && (
        <GridActionButton
          action="edit"
          title="Edit Student Profile"
          onClick={() => onEdit?.(data)}
        />
      )}

      {onDelete && (
        <GridActionButton
          action="delete"
          title="Delete Student Record"
          onClick={() => onDelete?.(data.id)}
        />
      )}
    </GridActionGroup>
  );
}

export default function StudentGrid({
  rows = [],
  loading = false,
  fetching = false,
  density = 'comfortable',
  onRowClick,
  onOpenDetail,
  onEdit,
  onDelete,
  onSelectionChanged,
  onAddStudent,
}) {
  const { getStatusMeta } = useStudentStatusOptions();
  const gridDensity = density === 'comfortable' ? TABLE_DENSITY.COMFORTABLE : TABLE_DENSITY.COMPACT;

  const columns = useMemo(
    () => [
      createAvatarColumn({
        nameGetter: (row) => `${row?.firstName || ''} ${row?.lastName || ''}`.trim(),
      }),
      {
        field: 'studentName',
        headerName: 'Student Name',
        minWidth: 150,
        flex: 1.2,
        cellClass: `text-xs font-semibold text-text ${centerCell}`,
        headerClass: centerHeader,
        valueGetter: (p) => `${p.data?.firstName || ''} ${p.data?.lastName || ''}`.trim() || '—',
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
        valueGetter: (p) => p.data?.phone || p.data?.email || '—',
        cellRenderer: (p) => {
          const s = p.data;
          if (!s) return <span className="text-text-muted">—</span>;
          const phone = s.phone;
          const cleanPhone = phone ? String(phone).replace(/\D/g, '') : '';

          return (
            <div className="flex items-center justify-center gap-1.5 tabular-nums">
              <span className="text-text-secondary">{phone || s.email || '—'}</span>
              {cleanPhone && (
                <a
                  href={`https://wa.me/${cleanPhone}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1 rounded bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 transition-colors"
                  title="WhatsApp student"
                  onClick={(e) => e.stopPropagation()}
                >
                  <FaWhatsapp className="w-3 h-3" />
                </a>
              )}
              {cleanPhone && (
                <a
                  href={`tel:${cleanPhone}`}
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
        field: 'studentCode',
        headerName: 'Student ID',
        minWidth: 130,
        flex: 1,
        cellClass: `text-xs font-mono font-medium text-primary ${centerCell}`,
        headerClass: centerHeader,
        cellRenderer: (p) => {
          const code = p.value;
          if (!code) return <span className="text-text-muted">—</span>;
          return (
            <button
              type="button"
              className="hover:underline font-semibold text-primary transition-colors inline-flex items-center gap-1"
              onClick={(e) => {
                e.stopPropagation();
                onOpenDetail?.(p.data.id);
              }}
              title="Open Student Workspace"
            >
              {code}
            </button>
          );
        },
      },
      {
        field: 'country',
        headerName: 'Target Country',
        minWidth: 110,
        flex: 0.9,
        cellClass: `text-xs ${centerCell}`,
        headerClass: centerHeader,
        valueGetter: (p) => p.data?.country || '—',
      },
      {
        field: 'course',
        headerName: 'Course',
        minWidth: 130,
        flex: 1.1,
        cellClass: `text-xs ${centerCell}`,
        headerClass: centerHeader,
        valueGetter: (p) => p.data?.course || '—',
        cellRenderer: (p) => {
          const course = p.value;
          return <span className="font-medium text-text truncate" title={course}>{course}</span>;
        },
      },
      {
        field: 'status',
        headerName: 'Status',
        minWidth: 120,
        flex: 1,
        cellClass: `text-xs ${centerCell}`,
        headerClass: centerHeader,
        cellRenderer: (p) => {
          const meta = getStatusMeta(p.value);
          const color = meta?.color;

          if (typeof color === 'string' && color.startsWith('#')) {
            return (
              <span
                className="inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-semibold border"
                style={{ backgroundColor: `${color}18`, color, borderColor: `${color}33` }}
              >
                {meta?.label || p.value}
              </span>
            );
          }
          return <Badge color={color || 'secondary'}>{meta?.label || p.value}</Badge>;
        },
      },
      {
        field: 'assignedTo',
        headerName: 'Counsellor',
        minWidth: 120,
        flex: 1,
        cellClass: `text-xs text-text-secondary ${centerCell}`,
        headerClass: centerHeader,
        valueGetter: (p) =>
          p.data?.assignedTo
            ? `${p.data.assignedTo.firstName || ''} ${p.data.assignedTo.lastName || ''}`.trim()
            : '—',
      },
      {
        field: 'activityCounts',
        headerName: 'Apps / Visas / Docs',
        minWidth: 140,
        flex: 1.1,
        cellClass: `text-xs ${centerCell}`,
        headerClass: centerHeader,
        cellRenderer: (p) => {
          const counts = p.data?._count || {};
          const apps = counts.applications || 0;
          const visas = counts.visas || 0;
          const docs = counts.documents || 0;

          return (
            <div className="flex items-center justify-center gap-1.5 text-[11px]">
              <span
                className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 font-medium"
                title={`${apps} Applications`}
              >
                <FiSend className="w-2.5 h-2.5" /> {apps}
              </span>
              <span
                className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300 font-medium"
                title={`${visas} Visas`}
              >
                <FiGlobe className="w-2.5 h-2.5" /> {visas}
              </span>
              <span
                className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 font-medium"
                title={`${docs} Documents`}
              >
                <FiFileText className="w-2.5 h-2.5" /> {docs}
              </span>
            </div>
          );
        },
      },
      {
        field: 'branch',
        headerName: 'Branch',
        minWidth: 110,
        flex: 0.9,
        cellClass: `text-xs text-text-secondary ${centerCell}`,
        headerClass: centerHeader,
        valueGetter: (p) => p.data?.branch?.name || p.data?.branch?.code || '—',
      },
      {
        field: 'createdAt',
        headerName: 'Created',
        minWidth: 110,
        flex: 0.9,
        cellClass: `text-xs text-text-muted tabular-nums ${centerCell}`,
        headerClass: centerHeader,
        valueFormatter: (p) =>
          p.value
            ? new Date(p.value).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
            : '—',
      },
      {
        field: 'actions',
        headerName: 'Actions',
        width: 100,
        pinned: 'right',
        cellClass: `text-xs ${centerCell}`,
        headerClass: centerHeader,
        cellRenderer: (p) => (
          <DirectStudentActions
            data={p.data}
            onOpenDetail={onOpenDetail}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        ),
      },
    ],
    [getStatusMeta, onOpenDetail, onEdit, onDelete],
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
        else if (onOpenDetail) onOpenDetail(row.id);
      }}
      emptyTitle="No students found"
      emptyDescription="No students matched your search or filters. Create a new student record to get started."
      emptyActionLabel="Add Student"
      onEmptyAction={onAddStudent}
    />
  );
}
