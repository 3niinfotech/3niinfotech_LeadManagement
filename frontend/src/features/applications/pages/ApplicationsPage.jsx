import { useEffect, useMemo, useState } from 'react';
import { FiClipboard, FiPlus } from 'react-icons/fi';
import ModulePageCard from '../../../components/layout/ModulePageLayout';
import Button from '../../../components/ui/Button';
import Pagination from '../../../components/ui/Pagination';
import PermissionGate from '../../../components/common/PermissionGate';
import MasterManageLink from '../../master/components/MasterManageLink';
import { buildApplicationSummaryItems } from '../config/applicationSummary.config';
import { ROUTES } from '../../../config/routes';
import { PERMISSIONS } from '../../../config/permissions';
import { usePermissions } from '../../../hooks/usePermissions';
import toastService from '../../../services/toast/toast.service';
import alertService from '../../../services/alert/alert.service';
import { masterApi, getApiErrorMessage } from '../../master/services/masterApi.service';

import ApplicationToolbar from '../components/ApplicationToolbar';
import ApplicationFilters from '../components/ApplicationFilters';
import ApplicationGrid from '../components/ApplicationGrid';
import ApplicationCreateModal from '../components/ApplicationCreateModal';
import ApplicationDetailModal from '../components/ApplicationDetailModal';

import {
  useListApplicationsQuery,
  useGetApplicationSummaryQuery,
  useUpdateApplicationMutation,
  useDeleteApplicationMutation,
  useExportApplicationsMutation,
} from '../redux/applicationApiSlice';
import { useApplicationFilters } from '../hooks/useApplicationFilters';

export default function ApplicationsPage() {
  const { can } = usePermissions();
  const canCreate = can(PERMISSIONS.APPLICATIONS_CREATE);
  const canUpdate = can(PERMISSIONS.APPLICATIONS_UPDATE);
  const canDelete = can(PERMISSIONS.APPLICATIONS_DELETE);

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
  } = useApplicationFilters();

  const {
    data: listResult,
    isLoading,
    isFetching,
    refetch,
  } = useListApplicationsQuery(queryParams, {
    placeholderData: (previousData) => previousData,
  });

  const {
    data: summary,
    isLoading: summaryLoading,
    refetch: refetchSummary,
  } = useGetApplicationSummaryQuery(summaryParams);

  const [updateApplication] = useUpdateApplicationMutation();
  const [deleteApplication] = useDeleteApplicationMutation();
  const [exportApplications, { isLoading: exportLoading }] = useExportApplicationsMutation();

  const rows = listResult?.data || [];
  const pagination = listResult?.pagination || { page: 1, limit: pageSize, total: 0, totalPages: 0 };
  const gridLoading = isLoading && rows.length === 0;
  const gridFetching = isFetching && rows.length > 0;
  const statItems = useMemo(() => buildApplicationSummaryItems(summary), [summary]);

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
      const res = await exportApplications(body).unwrap();
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
            ? `${count} selected application${count === 1 ? '' : 's'} exported`
            : `${count} application${count === 1 ? '' : 's'} exported`,
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
      toastService.error('Application has no country — open details to assign country');
      setDetailId(record.id);
      return;
    }
    setAdvancingId(record.id);
    try {
      const workflowRes = await masterApi.applicationStatusWorkflow(countryId);
      const workflow = Array.isArray(workflowRes?.data) ? workflowRes.data : (workflowRes || []);
      const currentId = record.metadata?.applicationStatusMasterId;
      const idx = workflow.findIndex((s) => s.value === currentId);
      const next = idx >= 0 ? workflow[idx + 1] : workflow[0];
      if (!next) {
        toastService.info('Already at the final status');
        return;
      }
      await updateApplication({
        id: record.id,
        applicationStatusMasterId: next.value,
      }).unwrap();
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
      title: 'Delete application',
      text: 'This will remove the application record.',
    });
    if (!ok) return;
    try {
      await deleteApplication(id).unwrap();
      toastService.success('Application removed');
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
          title="Admissions"
          subtitle="Track applications, approvals, and student readiness"
          icon={FiClipboard}
          iconColor="primary"
          scroll="contain"
          breadcrumbs={[
            { label: 'Dashboard', path: ROUTES.DASHBOARD },
            { label: 'Admissions' },
          ]}
          actions={(
            <div className="flex items-center gap-2">
              <MasterManageLink to="/admin/master/application-status-master">
                Manage Status
              </MasterManageLink>
              {canCreate && (
                <PermissionGate permission={PERMISSIONS.APPLICATIONS_CREATE}>
                  <Button variant="primary" size="sm" icon={FiPlus} onClick={() => setCreateOpen(true)}>
                    New Application
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
            ariaLabel="Application status filters"
            layout="grid"
          />

          <ModulePageCard.Toolbar>
            <ApplicationToolbar
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
            <ApplicationFilters
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

          <ModulePageCard.Table className="flex-1 min-h-0">
            <ApplicationGrid
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

      <ApplicationCreateModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onSuccess={handleActionSuccess}
      />

      <ApplicationDetailModal
        applicationId={detailId}
        open={Boolean(detailId)}
        onClose={() => setDetailId(null)}
        onUpdated={handleActionSuccess}
        onDeleted={handleActionSuccess}
      />
    </>
  );
}
