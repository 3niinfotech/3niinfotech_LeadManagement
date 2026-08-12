import { useCallback, useMemo, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { FiDatabase, FiEye, FiEdit2, FiTrash2, FiToggleLeft, FiToggleRight } from 'react-icons/fi';
import * as FiIcons from 'react-icons/fi';
import dayjs from 'dayjs';
import ModulePageCard from '../../../components/layout/ModulePageLayout';
import Card from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';
import Pagination from '../../../components/ui/Pagination';
import DataGrid from '../../../components/table/DataGrid';
import { createActionsColumn } from '../../../components/table/grid.columns';
import { ROUTES } from '../../../config/routes';
import { resolveMasterPage } from '../../../config/master-registry.config';
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
import { useMasterList } from '../hooks/useMasterList';
import { masterApi, getApiErrorMessage } from '../services/masterApi.service';

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
  const [actionId, setActionId] = useState(null);

  const list = useMasterList(engineEntity, { enabled: Boolean(entityConfig && engineEntity) });

  const activeFilterCount = useMemo(() => Object.entries(list.filters || {}).filter(([k, v]) => {
    if (k === 'status') return v && v !== 'all';
    return v !== undefined && v !== null && v !== '';
  }).length, [list.filters]);

  const openDrawer = useCallback((mode, record = null) => {
    setDrawer({ open: true, mode, record });
  }, []);

  const closeDrawer = useCallback(() => {
    setDrawer({ open: false, mode: 'add', record: null });
  }, []);

  const handleSubmit = async (payload) => {
    setSubmitting(true);
    try {
      if (drawer.mode === 'add') {
        await masterApi.create(engineEntity, payload);
        toastService.success(`${entityConfig.singular} created`);
      } else {
        await masterApi.update(engineEntity, drawer.record.id, payload);
        toastService.success(`${entityConfig.singular} updated`);
      }
      closeDrawer();
      list.reload();
    } catch (err) {
      toastService.error(getApiErrorMessage(err, 'Save failed'));
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
    } catch (err) {
      toastService.error(getApiErrorMessage(err, 'Status update failed'));
    } finally {
      setActionId(null);
    }
  };

  const handleDelete = async (row) => {
    if (!canManage) return;
    const ok = await alertService.softDeleteConfirm({
      title: `Delete ${entityConfig.singular}`,
      text: 'This record will be soft-deleted if it has no dependencies.',
      itemName: row.name,
    });
    if (!ok) return;
    setActionId(row.id);
    try {
      await masterApi.remove(engineEntity, row.id);
      toastService.success(`${entityConfig.singular} deleted`);
      list.reload();
    } catch (err) {
      toastService.error(getApiErrorMessage(err, 'Delete failed'));
    } finally {
      setActionId(null);
    }
  };

  const columns = useMemo(() => {
    if (!entityConfig) return [];
    const cols = (entityConfig.columns || []).map((col) => {
      const def = {
        field: col.field,
        headerName: col.headerName,
        minWidth: col.minWidth,
        width: col.width,
        flex: col.flex,
        sortable: Boolean(col.sortable),
        valueGetter: col.valueGetter,
        cellRenderer: col.cellType
          ? (p) => formatCell(col.valueGetter ? col.valueGetter(p) : p.value, col.cellType)
          : undefined,
      };
      if (col.sortable) {
        def.comparator = () => 0; // server-side sort — disable client compare noise
      }
      return def;
    });

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
  }, [entityConfig, canManage, actionId, openDrawer]);

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
      <ModulePageCard title="Master" icon={FiDatabase} breadcrumbs={[{ label: 'Dashboard', path: ROUTES.DASHBOARD }, { label: 'Master', path: ROUTES.MASTER }]}>
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

  // Organization module (Company / Branch)
  if (slug === 'company') return <OrganizationCompanyPage />;
  if (slug === 'branch') return <OrganizationBranchPage />;
  if (slug === 'staff') return <MasterStaffPage />;

  // Non-engine placeholders (Feature Toggle route)
  if (!entityConfig) {
    return (
      <ModulePageCard
        title={hubItem.label}
        subtitle={hubItem.description}
        icon={Icon}
        breadcrumbs={[
          { label: 'Dashboard', path: ROUTES.DASHBOARD },
          { label: 'Master', path: ROUTES.MASTER },
          { label: hubItem.label },
        ]}
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
      subtitle={hubItem.aliasOf ? `${hubItem.description}` : entityConfig.description}
      icon={Icon}
      breadcrumbs={[
        { label: 'Dashboard', path: ROUTES.DASHBOARD },
        { label: 'Master', path: ROUTES.MASTER },
        { label: hubItem.label },
      ]}
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
          singularLabel={entityConfig.singular}
          canManage={canManage}
        />

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
                getRowId={(p) => p.data.id}
                emptyTitle={emptyTitle}
                emptyDescription={emptyDescription}
                emptyActionLabel={canManage && !list.hasSearchOrFilters ? `Add ${entityConfig.singular}` : undefined}
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
        entityConfig={entityConfig}
        record={drawer.record}
        submitting={submitting}
        onClose={closeDrawer}
        onSubmit={handleSubmit}
      />
    </ModulePageCard>
  );
}
