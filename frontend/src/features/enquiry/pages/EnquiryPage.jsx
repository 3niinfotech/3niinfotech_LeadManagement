import { useState, useMemo, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { FiInbox } from 'react-icons/fi';
import ModulePageCard from '../../../components/layout/ModulePageLayout';
import { buildEnquirySummaryItems } from '../config/enquirySummary.config';
import alertService from '../../../services/alert/alert.service';
import { ROUTES } from '../../../config/routes';
import toastService from '../../../services/toast/toast.service';
import EnquiryToolbar from '../components/EnquiryToolbar';
import RegisterVisitorModal from '../components/RegisterVisitorModal';
import EnquiryBulkActionModal from '../components/EnquiryBulkActionModal';
import EnquiryFilters from '../components/EnquiryFilters';
import EnquiryGrid from '../components/EnquiryGrid';
import ImportModal from '../components/ImportModal';
import {
  useGetEnquiriesQuery, useGetEnquirySummaryQuery, usePatchEnquiryStatusMutation, usePatchEnquiryPriorityMutation, usePatchEnquiryTagsMutation,
  useDeleteEnquiryMutation, useBulkDeleteEnquiriesMutation, useExportEnquiriesMutation,
} from '../redux/enquiryApiSlice';
import {
  selectEnquiryUi, toggleFilters, setActiveView, openImportModal,
  closeImportModal, setSelectedRowIds, setSummaryFilter,
} from '../redux/enquiryUiSlice';
import { useEnquiryFilters } from '../hooks/useEnquiryFilters';
import { useEnquiryNav } from '../hooks/useEnquiryNav';
import { closeWalkInDrawer } from '../../walkin/redux/walkinUiSlice';

export default function EnquiryPage() {
  const dispatch = useDispatch();
  const { filtersOpen, activeView, activeSummaryFilter, importModalOpen, columnDensity, selectedRowIds } = useSelector(selectEnquiryUi);
  const { queryParams, search, setSearch, applyFilters, resetFilters, selectSummaryCard } = useEnquiryFilters();
  const { openEnquiry } = useEnquiryNav();
  const [filterDraft, setFilterDraft] = useState({});
  const [bulkAction, setBulkAction] = useState(null);
  const [registerOpen, setRegisterOpen] = useState(false);

  useEffect(() => {
    dispatch(closeWalkInDrawer());
  }, [dispatch]);

  const summaryParams = useMemo(() => {
    const { status, page, limit, ...rest } = queryParams;
    return rest;
  }, [queryParams]);

  const { data: listResult, isLoading, isFetching, refetch } = useGetEnquiriesQuery(queryParams, {
    placeholderData: (previousData) => previousData,
  });
  const { data: summary, isLoading: summaryLoading } = useGetEnquirySummaryQuery(summaryParams);
  const [patchStatus] = usePatchEnquiryStatusMutation();
  const [patchPriority] = usePatchEnquiryPriorityMutation();
  const [patchTags] = usePatchEnquiryTagsMutation();
  const [deleteEnquiry] = useDeleteEnquiryMutation();
  const [bulkDelete] = useBulkDeleteEnquiriesMutation();
  const [exportEnquiries] = useExportEnquiriesMutation();

  const rows = listResult?.data || [];
  const gridLoading = isLoading && rows.length === 0;
  const gridFetching = isFetching && rows.length > 0;
  const statItems = useMemo(() => buildEnquirySummaryItems(summary), [summary]);

  const handleStatusChange = async (id, status) => {
    try {
      await patchStatus({ id, status }).unwrap();
      toastService.success('Status updated');
    } catch (e) {
      toastService.error(e?.data?.message || 'Status update failed');
    }
  };

  const handlePriorityChange = async (id, priority) => {
    try {
      await patchPriority({ id, priority }).unwrap();
      toastService.success('Priority updated');
    } catch (e) {
      toastService.error(e?.data?.message || 'Priority update failed');
    }
  };

  const handleTagsChange = async (id, tags) => {
    try {
      await patchTags({ id, tags }).unwrap();
      toastService.success('Tags updated');
    } catch (e) {
      toastService.error(e?.data?.message || 'Tags update failed');
    }
  };

  const handleDelete = async (id) => {
    const ok = await alertService.softDeleteConfirm({
      title: 'Delete Enquiry',
      text: 'This enquiry will be soft-deleted. Continue?',
      confirmText: 'Delete',
    });
    if (!ok) return;
    try {
      await deleteEnquiry(id).unwrap();
      toastService.action.deleted('Enquiry deleted');
      refetch();
    } catch (e) {
      toastService.error(e?.data?.message || 'Delete failed');
    }
  };

  const handleBulkDelete = async () => {
    const ok = await alertService.bulkConfirm({
      action: 'delete',
      count: selectedRowIds.length,
      entity: 'enquiries',
    });
    if (!ok) return;
    try {
      await bulkDelete(selectedRowIds).unwrap();
      dispatch(setSelectedRowIds([]));
      toastService.action.deleted('Selected enquiries deleted');
      refetch();
    } catch (e) {
      toastService.error(e?.data?.message || 'Bulk delete failed');
    }
  };

  const handleBulkExport = async () => {
    const res = await exportEnquiries({ ids: selectedRowIds, ...queryParams }).unwrap();
    toastService.success(`Exported ${res?.length || res?.data?.length || 0} records`);
  };

  const selectedRows = useMemo(
    () => rows.filter((row) => selectedRowIds.includes(row.id)),
    [rows, selectedRowIds],
  );

  const handleBulkActionSuccess = () => {
    dispatch(setSelectedRowIds([]));
    refetch();
  };

  const summaryActiveFilter = activeView === 'closed' ? '__closed' : activeSummaryFilter;

  return (
    <>
      <div className="h-full min-h-0 flex flex-col">
      <ModulePageCard
        title="Manage Enquiry"
        subtitle="Register visitors · auto counsellor assignment · manage qualified enquiries"
        icon={FiInbox}
        iconColor="primary"
        breadcrumbs={[{ label: 'Dashboard', path: ROUTES.DASHBOARD }, { label: 'Manage Enquiry' }]}
      >
        <ModulePageCard.Stats
          items={statItems}
          activeFilter={summaryActiveFilter}
          onSelect={selectSummaryCard}
          loading={summaryLoading}
          ariaLabel="Enquiry status filters"
          layout="grid"
        />

        <ModulePageCard.Toolbar>
          <EnquiryToolbar
            search={search}
            onSearchChange={setSearch}
            activeView={activeView}
            onViewChange={(v) => dispatch(setActiveView(v))}
            onImport={() => dispatch(openImportModal())}
            onRegisterVisitor={() => setRegisterOpen(true)}
            filtersOpen={filtersOpen}
            onToggleFilters={() => dispatch(toggleFilters())}
            selectedCount={selectedRowIds.length}
            onBulkAction={setBulkAction}
            onBulkExport={handleBulkExport}
            onBulkDelete={handleBulkDelete}
          />
        </ModulePageCard.Toolbar>

        <ModulePageCard.Filters>
          <EnquiryFilters
            open={filtersOpen}
            values={filterDraft}
            onChange={setFilterDraft}
            onSearch={() => applyFilters(filterDraft)}
            onReset={() => { setFilterDraft({}); resetFilters(); }}
            onClose={() => dispatch(toggleFilters())}
          />
        </ModulePageCard.Filters>

        <ModulePageCard.Table className="min-h-[320px]">
          <EnquiryGrid
            rows={rows}
            loading={gridLoading}
            fetching={gridFetching}
            density={columnDensity}
            onRowClick={(row) => openEnquiry(row.id)}
            onEdit={(id) => openEnquiry(id)}
            onDelete={handleDelete}
            onStatusChange={handleStatusChange}
            onPriorityChange={handlePriorityChange}
            onTagsChange={handleTagsChange}
            onSelectionChanged={(selected) => dispatch(setSelectedRowIds((selected || []).map((r) => r.id)))}
            onRegisterVisitor={() => setRegisterOpen(true)}
          />
        </ModulePageCard.Table>
      </ModulePageCard>
      </div>

      <RegisterVisitorModal
        open={registerOpen}
        onClose={() => setRegisterOpen(false)}
        onRegistered={() => {
          dispatch(setActiveView('all'));
          dispatch(setSummaryFilter(null));
          refetch();
        }}
        onOpenLead={() => {
          toastService.info('Open Reception → Walk-ins to view visitor queue');
        }}
        onOpenEnquiry={(id) => openEnquiry(id)}
        onOpenStudent={(student) => {
          toastService.info(`Open student ${student.studentCode}`);
        }}
      />
      <ImportModal open={importModalOpen} onClose={() => dispatch(closeImportModal())} />
      <EnquiryBulkActionModal
        action={bulkAction}
        open={Boolean(bulkAction)}
        onClose={() => setBulkAction(null)}
        selectedIds={selectedRowIds}
        selectedRows={selectedRows}
        onSuccess={handleBulkActionSuccess}
      />
    </>
  );
}
