import { useCallback, useEffect, useMemo, useState } from 'react';
import { FiChevronRight, FiEdit2, FiEye, FiList, FiTrash2 } from 'react-icons/fi';
import dayjs from 'dayjs';
import ModulePageCard from '../../../components/layout/ModulePageLayout';
import Card from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';
import Pagination from '../../../components/ui/Pagination';
import DataGrid from '../../../components/table/DataGrid';
import { createActionsColumn } from '../../../components/table/grid.columns';
import CountryFlagLabel from '../../../components/ui/CountryFlagLabel';
import { PERMISSIONS } from '../../../config/permissions';
import { usePermissions } from '../../../hooks/usePermissions';
import toastService from '../../../services/toast/toast.service';
import alertService from '../../../services/alert/alert.service';
import MasterFormDrawer from '../components/MasterFormDrawer';
import MasterToolbar from '../components/MasterToolbar';
import { useMasterList } from '../hooks/useMasterList';
import { masterApi, getApiErrorMessage } from '../services/masterApi.service';
import { apiGet } from '../../../api/apiClient';
import { getMasterEntityConfig } from '../../../config/master-entities.config';
import { getMasterHubItem, buildMasterBreadcrumbs, getMasterTypeMeta } from '../../../config/master-registry.config';

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
  if (cellType === 'bool') return value ? 'Yes' : 'No';
  if (cellType === 'status') return <StatusPill active={Boolean(value)} />;
  return String(value);
}

/**
 * Country-grouped status master UI (Application Status, Visa Status, …).
 */
export default function CountryGroupedStatusPage({
  entitySlug,
  title,
  subtitle,
  breadcrumbLabel,
  countrySummaryPath,
  addButtonLabel,
}) {
  const { can } = usePermissions();
  const canManage = can(PERMISSIONS.MASTERS_MANAGE);
  const entityConfig = getMasterEntityConfig(entitySlug);
  const hubItem = getMasterHubItem(entitySlug);
  const list = useMasterList(entitySlug, { enabled: true, defaultSort: 'position' });

  const [countryGroups, setCountryGroups] = useState([]);
  const [selectedCountryId, setSelectedCountryId] = useState(null);
  const [countrySummaryLoading, setCountrySummaryLoading] = useState(false);
  const [drawer, setDrawer] = useState({ open: false, mode: 'add', record: null });
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [actionId, setActionId] = useState(null);

  const openDrawer = useCallback((mode, record = null) => setDrawer({ open: true, mode, record }), []);
  const closeDrawer = useCallback(() => {
    setDrawer({ open: false, mode: 'add', record: null });
    setSubmitError(null);
  }, []);

  const reloadCountries = useCallback(async () => {
    setCountrySummaryLoading(true);
    try {
      const res = await apiGet(countrySummaryPath);
      const data = res?.data ?? res;
      const groups = Array.isArray(data) ? data : [];
      setCountryGroups(groups);
      const first = groups.find((g) => g.countryId) || groups[0];
      setSelectedCountryId(first?.countryId || null);
    } catch (err) {
      toastService.error(getApiErrorMessage(err, 'Failed to load country summary'));
    } finally {
      setCountrySummaryLoading(false);
    }
  }, [countrySummaryPath]);

  useEffect(() => {
    reloadCountries();
  }, [reloadCountries]);

  useEffect(() => {
    if (selectedCountryId) {
      list.applyFilters({ status: 'all', countryId: selectedCountryId });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCountryId]);

  const handleSubmit = async (payload) => {
    if (!canManage) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      const nextPayload = { ...payload };
      if (drawer.mode === 'add' && !nextPayload.countryId) nextPayload.countryId = selectedCountryId;
      if (drawer.mode === 'add') {
        await masterApi.create(entitySlug, nextPayload);
        toastService.success(`${entityConfig?.singular || 'Status'} created`);
      } else {
        await masterApi.update(entitySlug, drawer.record.id, nextPayload);
        toastService.success(`${entityConfig?.singular || 'Status'} updated`);
      }
      closeDrawer();
      await reloadCountries();
      list.reload();
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
      await masterApi.updateStatus(entitySlug, row.id, next);
      toastService.success(`Marked ${next ? 'active' : 'inactive'}`);
      await reloadCountries();
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
      title: `Delete ${entityConfig?.singular || 'Status'}`,
      text: 'This record will be soft-deleted if it has no dependencies.',
      itemName: row.name,
    });
    if (!ok) return;
    setActionId(row.id);
    try {
      await masterApi.remove(entitySlug, row.id);
      toastService.success(`${entityConfig?.singular || 'Status'} deleted`);
      await reloadCountries();
      list.reload();
    } catch (err) {
      toastService.error(getApiErrorMessage(err, 'Delete failed'));
    } finally {
      setActionId(null);
    }
  };

  const onSortChanged = useCallback((event) => {
    const sorted = event.api.getColumnState().find((c) => c.sort);
    if (!sorted?.colId || sorted.colId === '__actions') return;
    const allowed = (entityConfig?.columns || []).filter((c) => c.sortable).map((c) => c.field);
    const field = sorted.colId.includes('.') ? null : sorted.colId;
    if (!field || !allowed.includes(field)) return;
    list.setSortState(field, sorted.sort === 'desc' ? 'desc' : 'asc');
  }, [entityConfig, list]);

  const columns = useMemo(() => {
    const cols = (entityConfig?.columns || []).map((col) => {
      const def = {
        field: col.field,
        headerName: col.headerName,
        minWidth: col.minWidth,
        width: col.width,
        flex: col.flex,
        sortable: Boolean(col.sortable),
        valueGetter: col.valueGetter,
        cellRenderer: col.cellType
          ? (p) => formatCell(col.valueGetter ? col.valueGetter(p) : p.data?.[col.field] ?? p.value, col.cellType)
          : undefined,
      };
      if (col.sortable) def.comparator = () => 0;
      return def;
    });

    cols.push(
      createActionsColumn({
        width: 148,
        cellRenderer: (p) => {
          const row = p.data;
          const busy = actionId === row.id;
          return (
            <div className="crm-grid-actions" onClick={(e) => e.stopPropagation()}>
              <button type="button" className="crm-grid-action-btn" title="View" aria-label="View" onClick={() => openDrawer('view', row)}>
                <FiEye className="w-3.5 h-3.5" />
              </button>
              {canManage && (
                <>
                  <button type="button" className="crm-grid-action-btn crm-grid-action-btn--edit" title="Edit" aria-label="Edit" disabled={busy} onClick={() => openDrawer('edit', row)}>
                    <FiEdit2 className="w-3.5 h-3.5" />
                  </button>
                  <button type="button" className="crm-grid-action-btn" title={row.isActive ? 'Deactivate' : 'Activate'} aria-label="Toggle status" disabled={busy} onClick={() => handleStatusToggle(row)}>
                    {row.isActive ? 'On' : 'Off'}
                  </button>
                  <button type="button" className="crm-grid-action-btn crm-grid-action-btn--delete" title="Delete" aria-label="Delete" disabled={busy} onClick={() => handleDelete(row)}>
                    <FiTrash2 className="w-3.5 h-3.5" />
                  </button>
                </>
              )}
            </div>
          );
        },
      }),
    );

    return cols;
  }, [entityConfig, canManage, actionId, openDrawer, handleStatusToggle, handleDelete]);

  return (
    <ModulePageCard
      title={title}
      subtitle={`${getMasterTypeMeta(hubItem?.type).label} · ${subtitle}${hubItem?.usedIn?.length ? ` · Used in ${hubItem.usedIn.join(', ')}` : ''}`}
      icon={FiList}
      scroll="contain"
      breadcrumbs={buildMasterBreadcrumbs(hubItem, breadcrumbLabel || title)}
    >
      <div className="flex flex-col h-full">
        <div className="flex flex-col lg:flex-row gap-4 lg:gap-6 h-full min-h-[420px]">
          <Card className="w-full lg:w-[340px] p-4 shrink-0">
            <div className="flex items-center justify-between gap-3 mb-3">
              <div>
                <div className="text-sm font-semibold text-text">Countries</div>
                <div className="text-xs text-text-muted">Select to manage statuses</div>
              </div>
              <span className="text-xs text-text-muted">
                {countrySummaryLoading ? 'Loading…' : countryGroups.length}
              </span>
            </div>
            <div className="space-y-2 overflow-auto max-h-[320px] no-scrollbar">
              {countryGroups.length === 0 ? (
                <div className="text-sm text-text-muted">No countries found.</div>
              ) : (
                countryGroups.map((g) => {
                  const active = (g.countryId || null) === (selectedCountryId || null);
                  return (
                    <button
                      key={`${g.countryId || '__none__'}`}
                      type="button"
                      onClick={() => setSelectedCountryId(g.countryId || null)}
                      className={`w-full text-left p-3 rounded-lg border transition-colors ${
                        active ? 'bg-primary/10 border-primary text-primary' : 'bg-card border-border hover:bg-row-hover'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="min-w-0">
                          <div className="text-sm font-medium truncate">
                            <CountryFlagLabel country={g.countryName} size="sm" />
                          </div>
                          <div className="text-xs text-text-muted">
                            {g.statusCount} status{g.statusCount === 1 ? '' : 'es'}
                          </div>
                        </div>
                        <FiChevronRight className={`shrink-0 ${active ? 'text-primary' : 'text-text-muted'}`} />
                      </div>
                    </button>
                  );
                })
              )}
            </div>
            <div className="mt-4">
              <Button size="sm" className="w-full" icon={FiEdit2} onClick={() => openDrawer('add', null)} disabled={!selectedCountryId}>
                {addButtonLabel || `Add ${entityConfig?.singular || 'Status'}`}
              </Button>
            </div>
          </Card>

          <div className="flex-1 min-h-0">
            <div className="flex flex-col gap-3">
              <MasterToolbar
                search={list.search}
                onSearchChange={list.setSearch}
                filtersOpen={false}
                onToggleFilters={() => {}}
                activeFilterCount={0}
                onRefresh={list.reload}
                refreshing={list.fetching}
                onAdd={() => {
                  if (!selectedCountryId) {
                    toastService.error('Select a country first');
                    return;
                  }
                  openDrawer('add', null);
                }}
                singularLabel="Status"
                canManage={canManage}
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
                  <ModulePageCard.Table className="flex-1 min-h-0">
                    <DataGrid
                      columns={columns}
                      rowData={list.rows}
                      loading={list.loading}
                      fetching={list.fetching}
                      pagination={false}
                      getRowId={(p) => p.data.id}
                      emptyTitle="No statuses"
                      emptyDescription={`Add a ${entityConfig?.singular?.toLowerCase() || 'status'} for this country.`}
                      emptyActionLabel={canManage ? 'Add Status' : undefined}
                      onEmptyAction={canManage ? () => openDrawer('add') : undefined}
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
          </div>
        </div>
      </div>

      <MasterFormDrawer
        open={drawer.open}
        mode={drawer.mode}
        entityConfig={entityConfig}
        record={drawer.record}
        submitting={submitting}
        submitError={submitError}
        onClose={closeDrawer}
        onSubmit={handleSubmit}
      />
    </ModulePageCard>
  );
}
