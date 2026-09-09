import { useEffect, useMemo, useState } from 'react';
import { FiGlobe, FiPlus } from 'react-icons/fi';
import ModulePageCard from '../../../components/layout/ModulePageLayout';
import Button from '../../../components/ui/Button';
import Pagination from '../../../components/ui/Pagination';
import PermissionGate from '../../../components/common/PermissionGate';
import MasterManageLink from '../../master/components/MasterManageLink';
import { buildVisaSummaryItems } from '../config/visaSummary.config';
import { ROUTES } from '../../../config/routes';
import { PERMISSIONS } from '../../../config/permissions';
import { usePermissions } from '../../../hooks/usePermissions';
import toastService from '../../../services/toast/toast.service';
import alertService from '../../../services/alert/alert.service';
import { masterApi, getApiErrorMessage } from '../../master/services/masterApi.service';

import VisaToolbar from '../components/VisaToolbar';
import VisaFilters from '../components/VisaFilters';
import VisaGrid from '../components/VisaGrid';
import VisaCreateModal from '../components/VisaCreateModal';
import VisaDetailModal from '../components/VisaDetailModal';

import {
  useListVisasQuery,
  useGetVisaSummaryQuery,
  useUpdateVisaMutation,
  useDeleteVisaMutation,
  useExportVisasMutation,
} from '../redux/visaApiSlice';
import { useVisaFilters } from '../hooks/useVisaFilters';

export default function VisasPage() {
  const { can } = usePermissions();
  const canCreate = can(PERMISSIONS.VISAS_CREATE) || can(PERMISSIONS.VISAS_VIEW);
  const canUpdate = can(PERMISSIONS.VISAS_UPDATE) || can(PERMISSIONS.VISAS_VIEW);
  const canDelete = can(PERMISSIONS.VISAS_DELETE);

  const [filtersOpen, setFiltersOpen] = useState(false);
  const [filterDraft, setFilterDraft] = useState({});
  const [createOpen, setCreateOpen] = useState(false);
  const [detailId, setDetailId] = useState(null);
  const [advancingId, setAdvancingId] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [refreshToken, setRefreshToken] = useState(0);
  const [selectedRowIds, setSelectedRowIds] = useState([]);

  const {
    queryParams,
    summaryParams,
    search,
    setSearch,
    page,
    setPage,
    pageSize,
    setPageSize,
    applyFilters,
    resetFilters,
    selectSummaryCard,
    activeSummaryFilter,
  } = useVisaFilters();

  const {
    data: listResult,
    isLoading,
    isFetching,
    refetch,
  } = useListVisasQuery(queryParams, {
    placeholderData: (previousData) => previousData,
  });

  const {
    data: summary,
    isLoading: summaryLoading,
    refetch: refetchSummary,
  } = useGetVisaSummaryQuery(summaryParams);

  const [updateVisa] = useUpdateVisaMutation();
  const [deleteVisa] = useDeleteVisaMutation();
  const [exportVisas, { isLoading: exportLoading }] = useExportVisasMutation();

  const rows = listResult?.data || [];
  const pagination = listResult?.pagination || { page: 1, limit: pageSize, total: 0, totalPages: 0 };
  const gridLoading = isLoading && rows.length === 0;
  const gridFetching = isFetching && rows.length > 0;
  const statItems = useMemo(() => buildVisaSummaryItems(summary), [summary]);

  const handleRefresh = () => {
    setFilterDraft({});
    resetFilters();
    setFiltersOpen(false);
    setSelectedRowIds([]);
    setRefreshToken((n) => n + 1);
  };

  useEffect(() => {
    if (!refreshToken) return undefined;
    let cancelled = false;
    setRefreshing(true);
    Promise.all([refetch(), refetchSummary()])
      .catch((e) => {
        if (!cancelled) toastService.error(e?.data?.message || 'Refresh failed');
      })
      .finally(() => {
        if (!cancelled) setRefreshing(false);
      });
    return () => { cancelled = true; };
  }, [refreshToken, refetch, refetchSummary]);

  const handleActionSuccess = () => {
    refetch();
    refetchSummary();
  };

  const handleSelectionChanged = (selectedRows) => {
    setSelectedRowIds((selectedRows || []).map((r) => r.id).filter(Boolean));
  };

  const handleExport = async () => {
    try {
      const body = { ...queryParams };
      if (selectedRowIds.length > 0) {
        body.ids = selectedRowIds;
      }
      const res = await exportVisas(body).unwrap();
      const url = URL.createObjectURL(res.blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = res.filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);

      const count = res.count || 0;
      toastService.create(
        {
          title: res.selected
            ? `${count} selected visa case${count === 1 ? '' : 's'} exported`
            : `${count} visa case${count === 1 ? '' : 's'} exported`,
          description: 'Excel is ready — open and share.',
        },
        { label: 'Exported' },
      );
    } catch (e) {
      toastService.error(e?.data?.message || 'Export failed');
    }
  };

  const advanceStatus = async (record) => {
    const countryId = record.metadata?.countryId;
    if (!countryId) {
      toastService.error('Visa has no country — open details to assign country');
      setDetailId(record.id);
      return;
    }
    setAdvancingId(record.id);
    try {
      const workflowRes = await masterApi.visaStatusWorkflow(countryId);
      const workflow = Array.isArray(workflowRes?.data) ? workflowRes.data : (workflowRes || []);
      const currentId = record.metadata?.visaStatusMasterId;
      const idx = workflow.findIndex((s) => s.value === currentId);
      const next = idx >= 0 ? workflow[idx + 1] : workflow[0];
      if (!next) {
        toastService.info('Already at the final status');
        return;
      }
      await updateVisa({ id: record.id, visaStatusMasterId: next.value }).unwrap();
      toastService.success(`Status updated to ${next.label}`);
      handleActionSuccess();
    } catch (err) {
      toastService.error(getApiErrorMessage(err, 'Update failed'));
    } finally {
      setAdvancingId(null);
    }
  };

  const handleDelete = async (id) => {
    const ok = await alertService.deleteConfirm({
      title: 'Delete visa case',
      text: 'This will remove the visa case.',
    });
    if (!ok) return;
    try {
      await deleteVisa(id).unwrap();
      toastService.success('Visa case removed');
      setSelectedRowIds((ids) => ids.filter((x) => x !== id));
      handleActionSuccess();
    } catch (err) {
      toastService.error(getApiErrorMessage(err, 'Delete failed'));
    }
  };

  return (
    <>
      <div className="h-full min-h-0 flex flex-col">
        <ModulePageCard
          title="Visa Processing"
          subtitle="Filings use Visa Status and Visa Checklist masters by country"
          icon={FiGlobe}
          iconColor="primary"
          breadcrumbs={[
            { label: 'Dashboard', path: ROUTES.DASHBOARD },
            { label: 'Visa Processing' },
          ]}
          actions={(
            <div className="flex items-center gap-2">
              <MasterManageLink to="/admin/master/visa-status-master">
                Manage Status
              </MasterManageLink>
              {canCreate && (
                <PermissionGate permissions={[PERMISSIONS.VISAS_CREATE, PERMISSIONS.VISAS_VIEW]}>
                  <Button variant="primary" size="sm" icon={FiPlus} onClick={() => setCreateOpen(true)}>
                    New Visa Case
                  </Button>
                </PermissionGate>
              )}
            </div>
          )}
        >
          <ModulePageCard.Stats
            items={statItems}
            activeFilter={activeSummaryFilter}
            onSelect={selectSummaryCard}
            loading={summaryLoading}
            ariaLabel="Visa status filters"
            layout="grid"
          />

          <ModulePageCard.Toolbar>
            <VisaToolbar
              search={search}
              onSearchChange={setSearch}
              filtersOpen={filtersOpen}
              onToggleFilters={() => setFiltersOpen((v) => !v)}
              onCreate={canCreate ? () => setCreateOpen(true) : undefined}
              onRefresh={handleRefresh}
              refreshLoading={refreshing || isFetching}
              onExport={handleExport}
              exportLoading={exportLoading}
              selectedCount={selectedRowIds.length}
            />
          </ModulePageCard.Toolbar>

          <ModulePageCard.Filters>
            <VisaFilters
              open={filtersOpen}
              values={filterDraft}
              onChange={setFilterDraft}
              onSearch={() => applyFilters(filterDraft)}
              onReset={() => {
                setFilterDraft({});
                resetFilters();
              }}
              onClose={() => setFiltersOpen(false)}
            />
          </ModulePageCard.Filters>

          <ModulePageCard.Table className="min-h-[320px]">
            <VisaGrid
              rows={rows}
              loading={gridLoading}
              fetching={gridFetching}
              onRowClick={(row) => setDetailId(row.id)}
              onView={(row) => setDetailId(row.id)}
              onAdvance={canUpdate ? advanceStatus : undefined}
              onDelete={canDelete ? handleDelete : undefined}
              onSelectionChanged={handleSelectionChanged}
              canUpdate={canUpdate}
              canDelete={canDelete}
              advancingId={advancingId}
              onCreate={canCreate ? () => setCreateOpen(true) : undefined}
            />
          </ModulePageCard.Table>

          <Pagination
            page={pagination.page || page}
            limit={pagination.limit || pageSize}
            total={pagination.total || 0}
            totalPages={pagination.totalPages || 0}
            onPageChange={setPage}
            onPageSizeChange={(limit) => {
              setPageSize(limit);
              setPage(1);
            }}
          />
        </ModulePageCard>
      </div>

      <VisaCreateModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onSuccess={handleActionSuccess}
      />

      <VisaDetailModal
        visaId={detailId}
        open={Boolean(detailId)}
        onClose={() => setDetailId(null)}
        onUpdated={handleActionSuccess}
        onDeleted={handleActionSuccess}
      />
    </>
  );
}
