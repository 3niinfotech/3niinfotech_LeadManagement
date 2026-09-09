import { useState, useMemo, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { FiInbox, FiUserPlus } from 'react-icons/fi';
import ModulePageCard from '../../../components/layout/ModulePageLayout';
import Button from '../../../components/ui/Button';
import PermissionGate from '../../../components/common/PermissionGate';
import { buildEnquirySummaryItems } from '../config/enquirySummary.config';
import alertService from '../../../services/alert/alert.service';
import { ROUTES } from '../../../config/routes';
import { PERMISSIONS } from '../../../config/permissions';
import { usePermissions } from '../../../hooks/usePermissions';
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
  closeImportModal, setSelectedRowIds, setSummaryFilter, resetEnquiryListUi,
} from '../redux/enquiryUiSlice';
import { useEnquiryFilters } from '../hooks/useEnquiryFilters';
import { useEnquiryNav } from '../hooks/useEnquiryNav';
import { closeWalkInDrawer } from '../../walkin/redux/walkinUiSlice';
import { DEMO_DRIVEN_ENQUIRY_STATUSES } from '../config/enquiryDemo.config';
import { selectUser } from '../../../redux/slices/authSlice';
import { ROLES } from '../../../config/roles';

export default function EnquiryPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const user = useSelector(selectUser);
  const { can } = usePermissions();
  const isCounsellor = user?.role?.slug === ROLES.COUNSELLOR;
  const hideReceptionActions = isCounsellor;
  const { filtersOpen, activeView, activeSummaryFilter, importModalOpen, columnDensity, selectedRowIds } = useSelector(selectEnquiryUi);
  const { queryParams, search, setSearch, applyFilters, resetFilters, selectSummaryCard, branchLocked, canViewAllBranches, filters } = useEnquiryFilters();
  const { openEnquiry, openStudent } = useEnquiryNav();
  const [filterDraft, setFilterDraft] = useState({});
  const [bulkAction, setBulkAction] = useState(null);
  const [registerOpen, setRegisterOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [refreshToken, setRefreshToken] = useState(0);

  useEffect(() => {
    setFilterDraft((prev) => ({
      ...prev,
      branchId: filters.branchId || undefined,
    }));
  }, [filters.branchId]);

  const canUpdate = can(PERMISSIONS.ENQUIRIES_UPDATE);
  const canDelete = can(PERMISSIONS.ENQUIRIES_DELETE);
  const canCreate = can(PERMISSIONS.ENQUIRIES_CREATE) || can(PERMISSIONS.WALKIN_CREATE);

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
  const { data: summary, isLoading: summaryLoading, refetch: refetchSummary } = useGetEnquirySummaryQuery(summaryParams);
  const [patchStatus] = usePatchEnquiryStatusMutation();
  const [patchPriority] = usePatchEnquiryPriorityMutation();
  const [patchTags] = usePatchEnquiryTagsMutation();
  const [deleteEnquiry] = useDeleteEnquiryMutation();
  const [bulkDelete] = useBulkDeleteEnquiriesMutation();
  const [exportEnquiries, { isLoading: exportLoading }] = useExportEnquiriesMutation();

  const rows = listResult?.data || [];
  const gridLoading = isLoading && rows.length === 0;
  const gridFetching = isFetching && rows.length > 0;
  const statItems = useMemo(() => buildEnquirySummaryItems(summary), [summary]);

  const handleStatusChange = async (id, status) => {
    if (DEMO_DRIVEN_ENQUIRY_STATUSES.has(status)) {
      toastService.info('Schedule the demo date and time on the Demo tab. Status updates after the session is saved.');
      openEnquiry(id, 'demo');
      return;
    }
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

  const handleExport = async () => {
    try {
      const body = { ...queryParams };
      if (selectedRowIds.length > 0) {
        body.ids = selectedRowIds;
      }
      const res = await exportEnquiries(body).unwrap();
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
            ? `${count} selected enquir${count === 1 ? 'y' : 'ies'} exported`
            : `${count} enquir${count === 1 ? 'y' : 'ies'} exported`,
          description: 'Excel is ready — open and share, no edits needed.',
        },
        { label: 'Exported' },
      );
    } catch (e) {
      toastService.error(e?.data?.message || 'Export failed');
    }
  };

  const handleBulkExport = () => handleExport();

  const handleRefresh = () => {
    setFilterDraft({});
    resetFilters();
    dispatch(resetEnquiryListUi());
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
        subtitle={hideReceptionActions
          ? 'Follow-up, counselling & convert assigned leads'
          : 'Follow-up, counselling & convert · walk-ins stay on Reception until Interested'}
        icon={FiInbox}
        iconColor="primary"
        breadcrumbs={[{ label: 'Dashboard', path: ROUTES.DASHBOARD }, { label: 'Manage Enquiry' }]}
        actions={!hideReceptionActions && canCreate ? (
          <PermissionGate permissions={[PERMISSIONS.ENQUIRIES_CREATE, PERMISSIONS.WALKIN_CREATE]}>
            <Button variant="primary" size="sm" icon={FiUserPlus} onClick={() => navigate(ROUTES.WALK_INS)}>
              Register at Reception
            </Button>
          </PermissionGate>
        ) : null}
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
            onExport={handleExport}
            exportLoading={exportLoading}
            filtersOpen={filtersOpen}
            onToggleFilters={() => dispatch(toggleFilters())}
            selectedCount={selectedRowIds.length}
            onBulkAction={setBulkAction}
            onBulkExport={handleBulkExport}
            onBulkDelete={handleBulkDelete}
            onRefresh={handleRefresh}
            refreshLoading={refreshing || isFetching}
          />
        </ModulePageCard.Toolbar>

        <ModulePageCard.Filters>
          <EnquiryFilters
            open={filtersOpen}
            values={filterDraft}
            onChange={setFilterDraft}
            onSearch={() => applyFilters(filterDraft)}
            onReset={() => {
              const next = branchLocked ? { branchId: filters.branchId } : {};
              setFilterDraft(next);
              resetFilters();
            }}
            onClose={() => dispatch(toggleFilters())}
            branchLocked={branchLocked}
            canViewAllBranches={canViewAllBranches}
          />
        </ModulePageCard.Filters>

        <ModulePageCard.Table className="min-h-[320px]">
          <EnquiryGrid
            rows={rows}
            loading={gridLoading}
            fetching={gridFetching}
            density={columnDensity}
            onRowClick={(row) => openEnquiry(row.id)}
            onEdit={canUpdate ? (id) => openEnquiry(id) : undefined}
            onDelete={canDelete ? handleDelete : undefined}
            onStatusChange={canUpdate ? handleStatusChange : undefined}
            onPriorityChange={canUpdate ? handlePriorityChange : undefined}
            onTagsChange={canUpdate ? handleTagsChange : undefined}
            onSelectionChanged={(selected) => dispatch(setSelectedRowIds((selected || []).map((r) => r.id)))}
            onRegisterVisitor={hideReceptionActions ? undefined : () => navigate(ROUTES.WALK_INS)}
          />
        </ModulePageCard.Table>
      </ModulePageCard>
      </div>

      {registerOpen && (
        <RegisterVisitorModal
          open={registerOpen}
          onClose={() => setRegisterOpen(false)}
          onRegistered={() => {
            dispatch(setActiveView('all'));
            dispatch(setSummaryFilter(null));
            refetch();
            navigate(ROUTES.WALK_INS);
          }}
          onOpenLead={() => {
            navigate(ROUTES.WALK_INS);
          }}
          onOpenEnquiry={(id) => openEnquiry(id)}
          onOpenStudent={(student) => {
            if (student?.id) openStudent(student.id);
          }}
        />
      )}
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
