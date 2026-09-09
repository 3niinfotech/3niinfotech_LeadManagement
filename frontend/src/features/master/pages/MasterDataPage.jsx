import { useCallback, useMemo, useState, useEffect } from 'react';
import { useParams, Link, Navigate } from 'react-router-dom';
import { z } from 'zod';
import { FiDatabase, FiEye, FiEdit2, FiTrash2, FiToggleLeft, FiToggleRight } from 'react-icons/fi';
import * as FiIcons from 'react-icons/fi';
import dayjs from 'dayjs';
import ModulePageCard from '../../../components/layout/ModulePageLayout';
import Card from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';
import Pagination from '../../../components/ui/Pagination';
import DataGrid from '../../../components/table/DataGrid';
import { createActionsColumn } from '../../../components/table/grid.columns';
import CountryFlagLabel from '../../../components/ui/CountryFlagLabel';
import { ROUTES } from '../../../config/routes';
import { resolveMasterPage, buildMasterBreadcrumbs, getMasterTypeMeta, COMMUNICATION_CHANNEL_BY_SLUG } from '../../../config/master-registry.config';
import { PERMISSIONS } from '../../../config/permissions';
import { usePermissions } from '../../../hooks/usePermissions';
import toastService from '../../../services/toast/toast.service';
import alertService from '../../../services/alert/alert.service';
import MasterToolbar from '../components/MasterToolbar';
import MasterFilters from '../components/MasterFilters';
import MasterFormDrawer from '../components/MasterFormDrawer';
import MasterItemPage, { isMasterItemSlug } from '../pages/MasterItemPage';
import OrganizationCompanyPage from '../pages/OrganizationCompanyPage';
import OrganizationBranchPage from '../pages/OrganizationBranchPage';
import MasterStaffPage from '../pages/MasterStaffPage';
import MasterPartnerPage from '../pages/MasterPartnerPage';
import ApplicationStatusPage from '../pages/ApplicationStatusPage';
import VisaStatusPage from '../pages/VisaStatusPage';
import AnnouncementsPage from '../../announcement/pages/AnnouncementsPage';
import ApplicationChecklistBulkModal from '../components/ApplicationChecklistBulkModal';
import VisaChecklistBulkModal from '../components/VisaChecklistBulkModal';
import { useMasterList } from '../hooks/useMasterList';
import { masterApi, getApiErrorMessage } from '../services/masterApi.service';
import MasterWorkflowStrip from '../components/MasterWorkflowStrip';
import { buildDeleteConfirmText } from '../utils/masterUsage.util';
import {
  ANNOUNCEMENT_AUDIENCE_OPTIONS,
  buildAnnouncementPayload,
  mapAnnouncementFormRecord,
} from '../../announcement/utils/announcement.utils';

const WORKFLOW_STATUS_SLUGS = {
  'lead-status': { title: 'Enquiry pipeline', load: () => masterApi.leadStatusWorkflow() },
  'student-status-master': { title: 'Student lifecycle', load: () => masterApi.studentStatusWorkflow() },
};

function StatusPill({ active }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold ${
        active ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'
      }`}
    >
      {active ? 'Active' : 'Inactive'}
    </span>
  );
}

function formatCell(value, cellType) {
  if (value == null || value === '') return '—';
  if (cellType === 'datetime') return dayjs(value).isValid() ? dayjs(value).format('DD MMM YYYY') : String(value);
  if (cellType === 'date') return dayjs(value).isValid() ? dayjs(value).format('DD MMM YYYY') : String(value);
  if (cellType === 'percent') return `${value}%`;
  if (cellType === 'bool') return value ? 'Yes' : 'No';
  if (cellType === 'badge') {
    return (
      <span className="inline-flex rounded-md bg-primary/10 text-primary px-2 py-0.5 text-[11px] font-semibold">
        {String(value)}
      </span>
    );
  }
  if (cellType === 'status') return <StatusPill active={Boolean(value)} />;
  return String(value);
}

function downloadMasterCsv(entity, rows = []) {
  if (!rows.length) return;
  const keys = ['id', 'code', 'name', 'isActive', 'createdAt', 'updatedAt'];
  const extra = Object.keys(rows[0] || {}).filter((key) => (
    !keys.includes(key) && ['string', 'number', 'boolean'].includes(typeof rows[0][key])
  ));
  const header = [...keys, ...extra];
  const escape = (value) => {
    const text = value == null ? '' : String(value);
    return `"${text.replace(/"/g, '""')}"`;
  };
  const lines = [
    header.join(','),
    ...rows.map((row) => header.map((key) => escape(row[key])).join(',')),
  ];
  const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${entity}-export.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

export default function MasterDataPage() {
  const { slug } = useParams();
  const resolved = resolveMasterPage(slug);
  const { can } = usePermissions();
  const canManage = can(PERMISSIONS.MASTERS_MANAGE);

  const hubItem = resolved?.hubItem;
  const entityConfig = resolved?.entityConfig;
  const engineEntity = resolved?.engineEntity;
  const Icon = FiIcons[hubItem?.icon] || FiDatabase;

  const [filtersOpen, setFiltersOpen] = useState(false);
  const [drawer, setDrawer] = useState({ open: false, mode: 'add', record: null });
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [actionId, setActionId] = useState(null);
  const [bulkChecklistOpen, setBulkChecklistOpen] = useState(false);
  const [selectedRows, setSelectedRows] = useState([]);
  const [exporting, setExporting] = useState(false);
  const [workflowSteps, setWorkflowSteps] = useState([]);
  const [workflowLoading, setWorkflowLoading] = useState(false);

  const workflowConfig = WORKFLOW_STATUS_SLUGS[slug];

  const list = useMasterList(engineEntity, {
    enabled: Boolean(entityConfig && engineEntity),
    defaultSort: entityConfig?.defaultSort || 'sortOrder',
    initialFilters: COMMUNICATION_CHANNEL_BY_SLUG[slug]
      ? { channel: COMMUNICATION_CHANNEL_BY_SLUG[slug] }
      : slug === 'partner-document-checklist'
        ? { applicableFor: 'PARTNER' }
        : {},
  });

  const fieldDefaults = useMemo(() => {
    const channel = COMMUNICATION_CHANNEL_BY_SLUG[slug];
    if (slug === 'announcements') {
      return { channel: 'ANNOUNCEMENT', eventType: 'student_portal', isActive: true };
    }
    if (channel) return { channel };
    if (slug === 'partner-document-checklist') return { applicableFor: 'PARTNER' };
    return {};
  }, [slug]);

  const formEntityConfig = useMemo(() => {
    if (slug !== 'announcements' || !entityConfig) return entityConfig;
    const baseFields = entityConfig.fields.filter((f) => (
      !['eventType', 'variables'].includes(f.name)
    ));
    return {
      ...entityConfig,
      singular: 'Announcement',
      plural: 'Announcements',
      description: 'Publish notices with image, text, and role-based audience',
      fields: [
        ...baseFields.filter((f) => f.name !== 'subject'),
        { name: 'subject', label: 'Subtitle (optional)', type: 'text', required: false },
        {
          name: 'eventType',
          label: 'Target audience',
          type: 'select',
          required: true,
          options: ANNOUNCEMENT_AUDIENCE_OPTIONS,
        },
        {
          name: 'announcementImageUrl',
          label: 'Image URL (optional)',
          type: 'text',
          required: false,
          placeholder: 'https://… or /uploads/…',
        },
        { name: 'body', label: 'Message', type: 'textarea', required: true },
        { name: 'description', label: 'Internal notes (admin only)', type: 'textarea', required: false },
        { name: 'sortOrder', label: 'Sort Order', type: 'number', required: false },
        { name: 'isActive', label: 'Published / Active', type: 'switch', required: false },
      ],
      schema: z.object({
        code: z.string().min(1, 'Code is required').max(80),
        name: z.string().min(1, 'Name is required').max(200),
        channel: z.string().min(1),
        subject: z.string().max(255).optional().nullable().or(z.literal('')),
        body: z.string().min(1, 'Message is required').max(10000),
        eventType: z.string().min(1, 'Target audience is required'),
        announcementImageUrl: z.string().max(2000).optional().nullable().or(z.literal('')),
        description: z.string().max(5000).optional().nullable().or(z.literal('')),
        sortOrder: z.coerce.number().int().min(0).optional(),
        isActive: z.boolean().optional(),
      }),
    };
  }, [slug, entityConfig]);

  const reloadWorkflow = useCallback(async () => {
    if (!workflowConfig) return;
    setWorkflowLoading(true);
    try {
      const res = await workflowConfig.load();
      const rows = res?.data ?? res ?? [];
      setWorkflowSteps(Array.isArray(rows) ? rows : []);
    } catch {
      setWorkflowSteps([]);
    } finally {
      setWorkflowLoading(false);
    }
  }, [workflowConfig]);

  useEffect(() => {
    reloadWorkflow();
  }, [reloadWorkflow]);

  const activeFilterCount = useMemo(() => Object.entries(list.filters || {}).filter(([k, v]) => {
    if (k === 'status') return v && v !== 'all';
    return v !== undefined && v !== null && v !== '';
  }).length, [list.filters]);

  const openDrawer = useCallback((mode, record = null) => {
    const mapped = slug === 'announcements' && record
      ? mapAnnouncementFormRecord(record)
      : record;
    setDrawer({ open: true, mode, record: mapped });
  }, [slug]);

  const closeDrawer = useCallback(() => {
    setDrawer({ open: false, mode: 'add', record: null });
    setSubmitError(null);
  }, []);

  const handleSubmit = async (payload) => {
    setSubmitting(true);
    setSubmitError(null);
    try {
      const body = slug === 'announcements' ? buildAnnouncementPayload(payload) : payload;
      if (drawer.mode === 'add') {
        await masterApi.create(engineEntity, body);
        toastService.success(`${formEntityConfig?.singular || entityConfig.singular} created`);
      } else {
        await masterApi.update(engineEntity, drawer.record.id, body);
        toastService.success(`${formEntityConfig?.singular || entityConfig.singular} updated`);
      }
      closeDrawer();
      list.reload();
      if (workflowConfig) reloadWorkflow();
    } catch (err) {
      setSubmitError(getApiErrorMessage(err, 'Save failed'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusToggle = async (row) => {
    if (!canManage) return;
    const next = !row.isActive;
    const ok = await alertService.confirm({
      title: next ? 'Activate' : 'Deactivate',
      text: `Mark "${row.name}" as ${next ? 'active' : 'inactive'}?`,
      confirmText: next ? 'Activate' : 'Deactivate',
    });
    if (!ok) return;
    setActionId(row.id);
    try {
      await masterApi.updateStatus(engineEntity, row.id, next);
      toastService.success(`Marked ${next ? 'active' : 'inactive'}`);
      list.reload();
      if (workflowConfig) reloadWorkflow();
    } catch (err) {
      toastService.error(getApiErrorMessage(err, 'Status update failed'));
    } finally {
      setActionId(null);
    }
  };

  const handleDelete = async (row) => {
    if (!canManage) return;
    setActionId(row.id);
    let usage = null;
    try {
      const res = await masterApi.getUsage(engineEntity, row.id);
      usage = res?.data ?? res;
    } catch {
      usage = row.usageCount != null
        ? { total: row.usageCount, dependencies: row.usageDetails || [] }
        : null;
    }
    setActionId(null);

    const ok = await alertService.softDeleteConfirm({
      title: `Delete ${entityConfig.singular}`,
      text: buildDeleteConfirmText(usage, row.name),
      itemName: row.name,
    });
    if (!ok) return;
    setActionId(row.id);
    try {
      await masterApi.remove(engineEntity, row.id);
      toastService.success(`${entityConfig.singular} deleted`);
      list.reload();
      if (workflowConfig) reloadWorkflow();
    } catch (err) {
      toastService.error(getApiErrorMessage(err, 'Delete failed'));
    } finally {
      setActionId(null);
    }
  };

  const selectedIds = selectedRows.map((row) => row.id).filter(Boolean);

  const handleBulkStatus = async (isActive) => {
    if (!canManage || !selectedIds.length) return;
    const ok = await alertService.confirm({
      title: isActive ? 'Activate selected' : 'Deactivate selected',
      text: `${selectedIds.length} record(s) will be marked ${isActive ? 'active' : 'inactive'}.`,
      confirmText: isActive ? 'Activate' : 'Deactivate',
    });
    if (!ok) return;
    try {
      await masterApi.bulkStatus(engineEntity, selectedIds, isActive);
      toastService.success(`Updated ${selectedIds.length} record(s)`);
      setSelectedRows([]);
      list.reload();
    } catch (err) {
      toastService.error(getApiErrorMessage(err, 'Bulk status update failed'));
    }
  };

  const handleBulkDelete = async () => {
    if (!canManage || !selectedIds.length) return;
    const ok = await alertService.softDeleteConfirm({
      title: 'Delete selected',
      text: 'Records in use will be skipped. Deactivate those instead.',
      itemName: `${selectedIds.length} selected`,
    });
    if (!ok) return;
    try {
      const res = await masterApi.bulkRemove(engineEntity, selectedIds);
      const result = res?.data ?? res;
      const deleted = result?.deleted ?? 0;
      const blocked = result?.blocked || [];
      if (deleted) toastService.success(`Deleted ${deleted} record(s)`);
      if (blocked.length) {
        toastService.error(`${blocked.length} could not be deleted because they are in use.`);
      }
      setSelectedRows([]);
      list.reload();
    } catch (err) {
      toastService.error(getApiErrorMessage(err, 'Bulk delete failed'));
    }
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const res = await masterApi.exportList(engineEntity, {
        search: list.search || undefined,
        status: list.filters?.status,
        ...Object.fromEntries(Object.entries(list.filters || {}).filter(([, v]) => v && v !== 'all')),
      });
      const payload = res?.data ?? res;
      const rows = payload?.rows || [];
      if (!rows.length) {
        toastService.info('No records to export');
        return;
      }
      downloadMasterCsv(engineEntity, rows);
      toastService.success(`Exported ${rows.length} record(s)`);
    } catch (err) {
      toastService.error(getApiErrorMessage(err, 'Export failed'));
    } finally {
      setExporting(false);
    }
  };

  const columns = useMemo(() => {
    if (!entityConfig) return [];
    const cols = (entityConfig.columns || []).map((col) => {
      const isCountryName = engineEntity === 'country' && col.field === 'name';
      const def = {
        field: col.field,
        headerName: col.headerName,
        minWidth: col.minWidth,
        width: col.width,
        flex: col.flex,
        sortable: Boolean(col.sortable),
        valueGetter: col.valueGetter,
        cellRenderer: isCountryName
          ? (p) => (
            <CountryFlagLabel
              country={{ name: p.data?.name, isoCode: p.data?.isoCode, code: p.data?.code }}
              size="sm"
            />
          )
          : col.cellType
            ? (p) => formatCell(col.valueGetter ? col.valueGetter(p) : p.value, col.cellType)
            : undefined,
      };
      if (col.sortable) {
        def.comparator = () => 0; // server-side sort — disable client compare noise
      }
      return def;
    });

    const showUsage = list.rows?.some((row) => row.usageCount != null);
    if (showUsage) {
      cols.splice(Math.max(cols.length - 1, 0), 0, {
        field: 'usageCount',
        headerName: 'In use',
        width: 80,
        sortable: false,
        cellRenderer: (p) => {
          const count = p.data?.usageCount ?? 0;
          return (
            <span className={`text-[11px] font-semibold ${count > 0 ? 'text-amber-700' : 'text-text-muted'}`}>
              {count}
            </span>
          );
        },
      });
    }

    cols.push(createActionsColumn({
      width: canManage ? 148 : 72,
      cellRenderer: (p) => {
        const row = p.data;
        if (!row) return null;
        const busy = actionId === row.id;
        return (
          <div className="crm-grid-actions" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className="crm-grid-action-btn"
              title="View"
              aria-label="View"
              onClick={() => openDrawer('view', row)}
            >
              <FiEye className="w-3.5 h-3.5" />
            </button>
            {canManage && (
              <>
                <button
                  type="button"
                  className="crm-grid-action-btn crm-grid-action-btn--edit"
                  title="Edit"
                  aria-label="Edit"
                  disabled={busy}
                  onClick={() => openDrawer('edit', row)}
                >
                  <FiEdit2 className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  className="crm-grid-action-btn"
                  title={row.isActive ? 'Deactivate' : 'Activate'}
                  aria-label="Toggle status"
                  disabled={busy}
                  onClick={() => handleStatusToggle(row)}
                >
                  {row.isActive
                    ? <FiToggleRight className="w-3.5 h-3.5 text-emerald-600" />
                    : <FiToggleLeft className="w-3.5 h-3.5" />}
                </button>
                <button
                  type="button"
                  className="crm-grid-action-btn crm-grid-action-btn--delete"
                  title="Delete"
                  aria-label="Delete"
                  disabled={busy}
                  onClick={() => handleDelete(row)}
                >
                  <FiTrash2 className="w-3.5 h-3.5" />
                </button>
              </>
            )}
          </div>
        );
      },
    }));

    return cols;
  }, [entityConfig, engineEntity, canManage, actionId, openDrawer, handleStatusToggle, handleDelete, list.rows]);

  const onSortChanged = useCallback((event) => {
    const sorted = event.api.getColumnState().find((c) => c.sort);
    if (!sorted?.colId || sorted.colId === '__actions') return;
    const allowed = (entityConfig?.columns || []).filter((c) => c.sortable).map((c) => c.field);
    // Only top-level fields are sortable via API
    const field = sorted.colId.includes('.') ? null : sorted.colId;
    if (!field || !allowed.includes(field)) return;
    list.setSortState(field, sorted.sort === 'desc' ? 'desc' : 'asc');
  }, [entityConfig, list]);

  if (!hubItem) {
    return (
      <ModulePageCard title="Master" icon={FiDatabase} breadcrumbs={[{ label: 'Admin', path: ROUTES.DASHBOARD }, { label: 'Masters', path: ROUTES.MASTER }, { label: 'Not found' }]}>
        <div className="p-6">
          <Card className="p-8 text-center text-text-muted">Master not found.</Card>
        </div>
      </ModulePageCard>
    );
  }

  // Legacy MasterItem pages (tags, fee-type)
  if (isMasterItemSlug(slug)) {
    return <MasterItemPage />;
  }

  // Specialized parent/child UI (country summary + CRUD)
  if (slug === 'application-status-master') {
    return <ApplicationStatusPage />;
  }

  if (slug === 'visa-status-master') {
    return <VisaStatusPage />;
  }

  if (slug === 'announcements') {
    return <AnnouncementsPage />;
  }

  if (slug === 'feature-toggle') return <Navigate to={ROUTES.FEATURE_TOGGLE} replace />;
  if (slug === 'backup-export') return <Navigate to={`${ROUTES.REPORTS}/export`} replace />;
  if (slug === 'roles') return <Navigate to={ROUTES.ROLES} replace />;

  // Organization module (Company / Branch)
  if (slug === 'company-config') return <Navigate to="/admin/master/company" replace />;
  if (slug === 'company' || slug === 'invoice-config') return <OrganizationCompanyPage />;
  if (slug === 'branch') return <OrganizationBranchPage />;
  if (slug === 'staff' || slug === 'contact-list') return <MasterStaffPage />;
  if (slug === 'partners' || slug === 'partner-commission' || slug === 'partner-agreement' || slug === 'partner-agreement-email') {
    return <MasterPartnerPage slug={slug} />;
  }
  if (slug === 'associates') return <MasterPartnerPage slug="associates" defaultType="ASSOCIATE" />;

  // Non-engine placeholders (Feature Toggle route)
  if (!entityConfig) {
    return (
      <ModulePageCard
        title={hubItem.label}
        subtitle={hubItem.description}
        icon={Icon}
        breadcrumbs={buildMasterBreadcrumbs(hubItem)}
      >
        <div className="flex-1 min-h-0 overflow-auto p-4">
          <Card className="text-center !p-12">
            <div className="flex flex-col items-center gap-4 max-w-lg mx-auto">
              <span className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Icon size={28} />
              </span>
              <h3 className="text-lg font-semibold text-text">{hubItem.label}</h3>
              <p className="text-text-muted text-sm">
                This master is outside the relational Master engine (MasterItem / Feature Toggle).
                It will be wired in a later wave.
              </p>
              <Link to={ROUTES.MASTER} className="text-sm text-primary hover:underline">
                ← Back to Master Hub
              </Link>
            </div>
          </Card>
        </div>
      </ModulePageCard>
    );
  }

  const emptyTitle = list.error
    ? 'Unable to load records'
    : list.hasSearchOrFilters
      ? 'No matching records'
      : `No ${entityConfig.plural.toLowerCase()} yet`;
  const emptyDescription = list.error
    ? list.error
    : list.hasSearchOrFilters
      ? 'Try adjusting search or filters.'
      : `Click Add ${entityConfig.singular} to create the first record.`;

  return (
    <ModulePageCard
      title={hubItem.label}
      subtitle={`${getMasterTypeMeta(hubItem.type).label} · ${hubItem.aliasOf ? hubItem.description : entityConfig.description}${hubItem.usedIn?.length ? ` · Used in ${hubItem.usedIn.join(', ')}` : ''}`}
      icon={Icon}
      breadcrumbs={buildMasterBreadcrumbs(hubItem)}
      actions={null}
    >
      <div className="flex flex-col flex-1 min-h-0">
        <MasterToolbar
          search={list.search}
          onSearchChange={list.setSearch}
          filtersOpen={filtersOpen}
          onToggleFilters={() => setFiltersOpen((v) => !v)}
          activeFilterCount={activeFilterCount}
          onRefresh={list.reload}
          refreshing={list.fetching}
          onAdd={() => openDrawer('add')}
          onExport={handleExport}
          exporting={exporting}
          selectedCount={selectedIds.length}
          onBulkActivate={() => handleBulkStatus(true)}
          onBulkDeactivate={() => handleBulkStatus(false)}
          onBulkDelete={handleBulkDelete}
          singularLabel={hubItem.aliasOf ? hubItem.label : entityConfig.singular}
          canManage={canManage}
        />

        {slug === 'application-checklist' && canManage && (
          <div className="px-1 pb-2">
            <Button size="sm" variant="outline" onClick={() => setBulkChecklistOpen(true)}>
              Add Multiple Rows
            </Button>
          </div>
        )}

        {slug === 'visa-checklist' && canManage && (
          <div className="px-1 pb-2">
            <Button size="sm" variant="outline" onClick={() => setBulkChecklistOpen(true)}>
              Add Multiple Rows
            </Button>
          </div>
        )}

        <MasterFilters
          open={filtersOpen}
          filterDefs={entityConfig.filters || []}
          values={list.filters}
          onClose={() => setFiltersOpen(false)}
          onApply={(next) => {
            list.applyFilters(next);
            setFiltersOpen(false);
          }}
          onReset={(reset) => list.applyFilters(reset)}
        />

        {workflowConfig && (
          <MasterWorkflowStrip
            title={workflowConfig.title}
            steps={workflowSteps}
            loading={workflowLoading}
          />
        )}

        {list.error && list.rows.length === 0 ? (
          <div className="flex-1 flex items-center justify-center p-8">
            <Card className="p-8 text-center max-w-md">
              <p className="text-sm text-danger mb-3">{list.error}</p>
              <Button variant="outline" onClick={list.reload}>Retry</Button>
            </Card>
          </div>
        ) : (
          <>
            <ModulePageCard.Table className="min-h-[320px]">
              <DataGrid
                columns={columns}
                rowData={list.rows}
                loading={list.loading}
                fetching={list.fetching}
                pagination={false}
                rowSelection={canManage ? { mode: 'multiRow', checkboxes: true, headerCheckbox: true } : false}
                onSelectionChanged={setSelectedRows}
                getRowId={(p) => p.data.id}
                emptyTitle={emptyTitle}
                emptyDescription={emptyDescription}
                emptyActionLabel={canManage && !list.hasSearchOrFilters ? `Add ${hubItem.aliasOf ? hubItem.label : entityConfig.singular}` : undefined}
                onEmptyAction={canManage && !list.hasSearchOrFilters ? () => openDrawer('add') : undefined}
                onGridReady={(params) => {
                  params.api.addEventListener('sortChanged', onSortChanged);
                }}
              />
            </ModulePageCard.Table>
            <Pagination
              page={list.pagination.page || 1}
              limit={list.pagination.limit || 25}
              total={list.pagination.total || 0}
              totalPages={list.pagination.totalPages || 0}
              onPageChange={list.setPage}
              onPageSizeChange={list.setPageSize}
            />
          </>
        )}
      </div>

      <MasterFormDrawer
        open={drawer.open}
        mode={drawer.mode}
        entityConfig={formEntityConfig || entityConfig}
        record={drawer.record}
        submitting={submitting}
        submitError={submitError}
        fieldDefaults={fieldDefaults}
        onClose={closeDrawer}
        onSubmit={handleSubmit}
      />

      {slug === 'application-checklist' && (
        <ApplicationChecklistBulkModal
          open={bulkChecklistOpen}
          onClose={() => setBulkChecklistOpen(false)}
          onSuccess={list.reload}
        />
      )}

      {slug === 'visa-checklist' && (
        <VisaChecklistBulkModal
          open={bulkChecklistOpen}
          onClose={() => setBulkChecklistOpen(false)}
          onSuccess={list.reload}
        />
      )}
    </ModulePageCard>
  );
}
