import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  FiDollarSign,
  FiPlus,
  FiPieChart,
  FiFileText,
  FiCheckSquare,
  FiRotateCcw,
  FiBook,
  FiTrendingDown,
} from 'react-icons/fi';
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
import CollectPaymentModal from '../components/CollectPaymentModal';
import ReceiptModal from '../components/ReceiptModal';
import FinancialDashboardTab from '../components/FinancialDashboardTab';
import PaymentProofsTab from '../components/PaymentProofsTab';
import RefundsTab from '../components/RefundsTab';
import AccountingLedgerTab from '../components/AccountingLedgerTab';
import ExpensesTab from '../components/ExpensesTab';

import {
  useListInvoicesQuery,
  useGetFeesSummaryQuery,
  useUpdateInvoiceMutation,
  useDeleteInvoiceMutation,
  useExportInvoicesMutation,
} from '../redux/feesApiSlice';
import { useFeesFilters } from '../hooks/useFeesFilters';

const TABS = [
  { id: 'dashboard', label: 'Financial Dashboard', icon: FiPieChart },
  { id: 'invoices', label: 'Invoices & Billing', icon: FiFileText },
  { id: 'proofs', label: 'Payment Proofs', icon: FiCheckSquare },
  { id: 'refunds', label: 'Refunds', icon: FiRotateCcw },
  { id: 'ledger', label: 'Accounting Ledger', icon: FiBook },
  { id: 'expenses', label: 'Operating Expenses', icon: FiTrendingDown },
];

export default function FeesPage() {
  const { can } = usePermissions();
  const canCreate = can(PERMISSIONS.INVOICES_CREATE);
  const canUpdate = can(PERMISSIONS.INVOICES_UPDATE) || can(PERMISSIONS.INVOICES_EDIT);
  const canDelete = can(PERMISSIONS.INVOICES_DELETE) || can(PERMISSIONS.INVOICES_EDIT);

  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get('tab');
  const [activeTab, setActiveTab] = useState(
    tabParam && TABS.some((t) => t.id === tabParam) ? tabParam : 'dashboard'
  );

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set('tab', tabId);
      return next;
    }, { replace: true });
  };
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [filterDraft, setFilterDraft] = useState({});
  const [createOpen, setCreateOpen] = useState(false);
  const [detailId, setDetailId] = useState(null);
  const [collectInvoice, setCollectInvoice] = useState(null);
  const [activeReceipt, setActiveReceipt] = useState(null);
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
    skip: activeTab !== 'invoices',
  });

  const {
    data: summary,
    isLoading: summaryLoading,
    refetch: refetchSummary,
  } = useGetFeesSummaryQuery(summaryParams, {
    skip: activeTab !== 'invoices',
  });

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
      <div className="h-full min-h-0 flex flex-col w-full">
        <ModulePageCard
          title="Accountant & Finance Hub"
          subtitle="Invoicing, fee collections, payment receipts, refunds, general ledger & expenses"
          icon={FiDollarSign}
          iconColor="primary"
          scroll={activeTab === 'invoices' ? 'contain' : 'auto'}
          breadcrumbs={[
            { label: 'Dashboard', path: ROUTES.DASHBOARD },
            { label: 'Accounts & Finance' },
          ]}
          actions={(
            <div className="flex items-center gap-2">
              <MasterManageLink to="/admin/master/currency">Currency</MasterManageLink>
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
          {/* ── Sub Navigation Tabs ── */}
          <div className="flex items-center gap-1 border-b border-border pb-2 px-3 pt-1 overflow-x-auto shrink-0 bg-card-bg">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => handleTabChange(tab.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap cursor-pointer transition-all ${
                    isActive
                      ? 'bg-primary-50 text-primary-700 dark:bg-primary-950/50 dark:text-primary-300 font-bold shadow-xs'
                      : 'text-text-muted hover:text-text hover:bg-slate-100 dark:hover:bg-slate-800/50'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-primary-600 dark:text-primary-400' : 'text-slate-400'}`} />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* ── Tab Content ── */}
          {activeTab === 'invoices' ? (
            <>
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

              <ModulePageCard.Table className="flex-1 min-h-0">
                <FeesGrid
                  rows={rows}
                  loading={gridLoading}
                  fetching={gridFetching}
                  onRowClick={(row) => setDetailId(row.id)}
                  onView={(row) => setDetailId(row.id)}
                  onCollectPayment={(row) => setCollectInvoice(row)}
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
            </>
          ) : (
            <div className="flex-1 min-h-0 overflow-y-auto p-4 w-full">
              {activeTab === 'dashboard' && (
                <FinancialDashboardTab
                  onNavigateTab={handleTabChange}
                  onOpenInvoice={(inv) => setDetailId(inv.id)}
                />
              )}
              {activeTab === 'proofs' && (
                <PaymentProofsTab
                  onPaymentProcessed={(receipt) => {
                    handleActionSuccess();
                    if (receipt) setActiveReceipt(receipt);
                  }}
                />
              )}
              {activeTab === 'refunds' && <RefundsTab />}
              {activeTab === 'ledger' && <AccountingLedgerTab />}
              {activeTab === 'expenses' && <ExpensesTab />}
            </div>
          )}
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

      {/* Collect Payment Modal */}
      <CollectPaymentModal
        open={Boolean(collectInvoice)}
        invoice={collectInvoice}
        onClose={() => setCollectInvoice(null)}
        onSuccess={(receipt) => {
          handleActionSuccess();
          if (receipt) {
            setActiveReceipt({
              ...receipt,
              invoice: collectInvoice,
              student: collectInvoice?.student,
              payment: {
                ...(receipt.payment || {}),
                invoice: collectInvoice,
              },
            });
          }
        }}
      />

      {/* Receipt Preview & Print Modal */}
      <ReceiptModal
        open={Boolean(activeReceipt)}
        receipt={activeReceipt ? {
          ...activeReceipt,
          invoice: activeReceipt.invoice || collectInvoice,
          student: activeReceipt.student || activeReceipt.invoice?.student || collectInvoice?.student,
        } : null}
        onClose={() => setActiveReceipt(null)}
      />
    </>
  );
}
