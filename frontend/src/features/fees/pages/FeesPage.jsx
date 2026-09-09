import { useEffect, useMemo, useState } from 'react';
import { FiDollarSign, FiPlus } from 'react-icons/fi';
import ModulePageCard from '../../../components/layout/ModulePageLayout';
import Button from '../../../components/ui/Button';
import Pagination from '../../../components/ui/Pagination';
import PermissionGate from '../../../components/common/PermissionGate';
import MasterManageLink from '../../master/components/MasterManageLink';
import { buildFeesSummaryItems } from '../config/feesSummary.config';
import { ROUTES } from '../../../config/routes';
import { PERMISSIONS } from '../../../config/permissions';
import { usePermissions } from '../../../hooks/usePermissions';
import toastService from '../../../services/toast/toast.service';
import alertService from '../../../services/alert/alert.service';

import FeesToolbar from '../components/FeesToolbar';
import FeesFilters from '../components/FeesFilters';
import FeesGrid from '../components/FeesGrid';
import InvoiceCreateModal from '../components/InvoiceCreateModal';
import InvoiceDetailModal from '../components/InvoiceDetailModal';

import {
  useListInvoicesQuery,
  useGetFeesSummaryQuery,
  useUpdateInvoiceMutation,
  useDeleteInvoiceMutation,
  useExportInvoicesMutation,
} from '../redux/feesApiSlice';
import { useFeesFilters } from '../hooks/useFeesFilters';

export default function FeesPage() {
  const { can } = usePermissions();
  const canCreate = can(PERMISSIONS.INVOICES_CREATE);
  const canUpdate = can(PERMISSIONS.INVOICES_UPDATE) || can(PERMISSIONS.INVOICES_EDIT);
  const canDelete = can(PERMISSIONS.INVOICES_DELETE) || can(PERMISSIONS.INVOICES_EDIT);

  const [filtersOpen, setFiltersOpen] = useState(false);
  const [filterDraft, setFilterDraft] = useState({});
  const [createOpen, setCreateOpen] = useState(false);
  const [detailId, setDetailId] = useState(null);
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
  } = useFeesFilters();

  const {
    data: listResult,
    isLoading,
    isFetching,
    refetch,
  } = useListInvoicesQuery(queryParams, {
    placeholderData: (previousData) => previousData,
  });

  const {
    data: summary,
    isLoading: summaryLoading,
    refetch: refetchSummary,
  } = useGetFeesSummaryQuery(summaryParams);

  const [updateInvoice] = useUpdateInvoiceMutation();
  const [deleteInvoice] = useDeleteInvoiceMutation();
  const [exportInvoices, { isLoading: exportLoading }] = useExportInvoicesMutation();

  const rows = listResult?.data || [];
  const pagination = listResult?.pagination || { page: 1, limit: pageSize, total: 0, totalPages: 0 };
  const gridLoading = isLoading && rows.length === 0;
  const gridFetching = isFetching && rows.length > 0;
  const statItems = useMemo(() => buildFeesSummaryItems(summary), [summary]);

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
      const res = await exportInvoices(body).unwrap();
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
            ? `${count} selected invoice${count === 1 ? '' : 's'} exported`
            : `${count} invoice${count === 1 ? '' : 's'} exported`,
          description: 'Excel is ready — open and share.',
        },
        { label: 'Exported' },
      );
    } catch (e) {
      toastService.error(e?.data?.message || 'Export failed');
    }
  };

  const handleMarkPaid = async (record) => {
    try {
      await updateInvoice({
        id: record.id,
        status: 'PAID',
        paidAt: new Date().toISOString(),
      }).unwrap();
      toastService.success('Invoice marked as paid');
      handleActionSuccess();
    } catch (err) {
      toastService.error(err?.data?.message || 'Update failed');
    }
  };

  const handleDelete = async (id) => {
    const ok = await alertService.deleteConfirm({
      title: 'Delete invoice',
      text: 'This will remove the invoice from the ledger.',
    });
    if (!ok) return;
    try {
      await deleteInvoice(id).unwrap();
      toastService.success('Invoice removed');
      setSelectedRowIds((ids) => ids.filter((x) => x !== id));
      handleActionSuccess();
    } catch (err) {
      toastService.error(err?.data?.message || 'Delete failed');
    }
  };

  return (
    <>
      <div className="h-full min-h-0 flex flex-col">
        <ModulePageCard
          title="Fees"
          subtitle="Invoices, dues, and collections"
          icon={FiDollarSign}
          iconColor="primary"
          breadcrumbs={[
            { label: 'Dashboard', path: ROUTES.DASHBOARD },
            { label: 'Fees' },
          ]}
          actions={(
            <div className="flex items-center gap-2">
              <MasterManageLink to="/admin/master/currency">Manage Currency</MasterManageLink>
              {canCreate && (
                <PermissionGate permission={PERMISSIONS.INVOICES_CREATE}>
                  <Button variant="primary" size="sm" icon={FiPlus} onClick={() => setCreateOpen(true)}>
                    New Invoice
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
            ariaLabel="Invoice status filters"
            layout="grid"
          />

          <ModulePageCard.Toolbar>
            <FeesToolbar
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
            <FeesFilters
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
            <FeesGrid
              rows={rows}
              loading={gridLoading}
              fetching={gridFetching}
              onRowClick={(row) => setDetailId(row.id)}
              onView={(row) => setDetailId(row.id)}
              onMarkPaid={canUpdate ? handleMarkPaid : undefined}
              onDelete={canDelete ? handleDelete : undefined}
              onSelectionChanged={handleSelectionChanged}
              canUpdate={canUpdate}
              canDelete={canDelete}
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

      <InvoiceCreateModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onSuccess={handleActionSuccess}
      />

      <InvoiceDetailModal
        invoiceId={detailId}
        open={Boolean(detailId)}
        onClose={() => setDetailId(null)}
        onUpdated={handleActionSuccess}
        onDeleted={handleActionSuccess}
      />
    </>
  );
}
