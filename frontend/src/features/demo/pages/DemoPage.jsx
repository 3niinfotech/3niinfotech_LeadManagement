import { useState, useMemo, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { FiMonitor, FiPlus } from 'react-icons/fi';
import ModulePageCard from '../../../components/layout/ModulePageLayout';
import Button from '../../../components/ui/Button';
import PermissionGate from '../../../components/common/PermissionGate';
import { buildDemoSummaryItems } from '../config/demoSummary.config';
import { ROUTES } from '../../../config/routes';
import { PERMISSIONS } from '../../../config/permissions';
import { usePermissions } from '../../../hooks/usePermissions';
import toastService from '../../../services/toast/toast.service';

import DemoToolbar from '../components/DemoToolbar';
import DemoFilters from '../components/DemoFilters';
import DemoGrid from '../components/DemoGrid';
import ScheduleDemoModal from '../components/ScheduleDemoModal';
import MarkAttendanceModal from '../components/MarkAttendanceModal';
import RescheduleDemoModal from '../components/RescheduleDemoModal';
import CancelDemoModal from '../components/CancelDemoModal';
import DemoBulkActionModal from '../components/DemoBulkActionModal';

import {
  useListDemosQuery,
  useGetDemoSummaryQuery,
  useExportDemosMutation,
  useMarkDemoAttendanceMutation,
} from '../../enquiry/redux/enquiryApiSlice';

import {
  selectDemoUi,
  toggleDemoFilters,
  setActiveDemoView,
  setSelectedDemoRowIds,
  openScheduleDemoModal,
  closeScheduleDemoModal,
  openMarkAttendanceModal,
  closeMarkAttendanceModal,
  openRescheduleDemoModal,
  closeRescheduleDemoModal,
  openCancelDemoModal,
  closeCancelDemoModal,
  openDemoDetailDrawer,
  closeDemoDetailDrawer,
  openDemoBulkAction,
  closeDemoBulkAction,
  resetDemoListUi,
} from '../redux/demoUiSlice';

import { useDemoFilters } from '../hooks/useDemoFilters';

export default function DemoPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { can, canAny } = usePermissions();

  const {
    filtersOpen,
    activeView,
    activeSummaryFilter,
    selectedRowIds,
    columnDensity,
    scheduleModalOpen,
    attendanceModalOpen,
    rescheduleModalOpen,
    cancelModalOpen,
    detailDrawerOpen,
    bulkActionModal,
    activeDemo,
  } = useSelector(selectDemoUi);

  const {
    queryParams,
    search,
    setSearch,
    applyFilters,
    resetFilters,
    selectSummaryCard,
    branchLocked,
    canViewAllBranches,
    filters,
  } = useDemoFilters();

  const [filterDraft, setFilterDraft] = useState({});
  const [refreshing, setRefreshing] = useState(false);
  const [refreshToken, setRefreshToken] = useState(0);

  useEffect(() => {
    setFilterDraft((prev) => ({
      ...prev,
      branchId: filters.branchId || undefined,
    }));
  }, [filters.branchId]);

  const canCreate = canAny([
    PERMISSIONS.ENQUIRIES_CREATE,
    PERMISSIONS.ENQUIRIES_UPDATE,
    PERMISSIONS.CALENDAR_CREATE,
  ]);

  const summaryParams = useMemo(() => {
    const { sessionStatus, attendance, result, page, limit, view, ...rest } = queryParams;
    return rest;
  }, [queryParams]);

  const {
    data: listResult,
    isLoading,
    isFetching,
    refetch,
  } = useListDemosQuery(queryParams, {
    placeholderData: (previousData) => previousData,
  });

  const {
    data: summary,
    isLoading: summaryLoading,
    refetch: refetchSummary,
  } = useGetDemoSummaryQuery(summaryParams);

  const [exportDemos, { isLoading: exportLoading }] = useExportDemosMutation();
  const [markDemoAttendance] = useMarkDemoAttendanceMutation();
  const [markingId, setMarkingId] = useState(null);

  const rows = listResult?.data || [];
  const gridLoading = isLoading && rows.length === 0;
  const gridFetching = isFetching && rows.length > 0;
  const statItems = useMemo(() => buildDemoSummaryItems(summary), [summary]);

  const canMark = can(PERMISSIONS.ENQUIRIES_UPDATE);

  const handleQuickMark = async (row, attendance) => {
    const enquiryId = row?.enquiry?.id || row?.enquiryId;
    if (!enquiryId || !row?.id) return;
    setMarkingId(row.id);
    try {
      await markDemoAttendance({
        id: enquiryId,
        demoId: row.id,
        attendance,
      }).unwrap();
      toastService.success(`Marked ${attendance}`);
      refetch();
      refetchSummary();
    } catch (e) {
      toastService.error(e?.data?.message || 'Failed to mark attendance');
    } finally {
      setMarkingId(null);
    }
  };

  const handleExport = async () => {
    try {
      const body = { ...queryParams };
      if (selectedRowIds.length > 0) {
        body.ids = selectedRowIds;
      }
      const res = await exportDemos(body).unwrap();
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
            ? `${count} selected demo${count === 1 ? '' : 's'} exported`
            : `${count} demo session${count === 1 ? '' : 's'} exported`,
          description: 'Excel spreadsheet is ready for download.',
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
    dispatch(resetDemoListUi());
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
    return () => {
      cancelled = true;
    };
  }, [refreshToken, refetch, refetchSummary]);

  const handleBulkSuccess = () => {
    dispatch(setSelectedDemoRowIds([]));
    refetch();
    refetchSummary();
  };

  const handleActionSuccess = () => {
    refetch();
    refetchSummary();
  };

  return (
    <>
      <div className="h-full min-h-0 flex flex-col">
        <ModulePageCard
          title="Demo Management"
          subtitle="Scheduled trial classes, faculty assignment, student attendance & conversion outcomes"
          icon={FiMonitor}
          iconColor="primary"
          scroll="contain"
          breadcrumbs={[
            { label: 'Dashboard', path: ROUTES.DASHBOARD },
            { label: 'Demo Management' },
          ]}
          actions={
            canCreate ? (
              <PermissionGate
                permissions={[
                  PERMISSIONS.ENQUIRIES_CREATE,
                  PERMISSIONS.ENQUIRIES_UPDATE,
                  PERMISSIONS.CALENDAR_CREATE,
                ]}
              >
                <Button
                  variant="primary"
                  size="sm"
                  icon={FiPlus}
                  onClick={() => dispatch(openScheduleDemoModal())}
                >
                  Schedule Demo
                </Button>
              </PermissionGate>
            ) : null
          }
        >
          <ModulePageCard.Stats
            items={statItems}
            activeFilter={activeSummaryFilter}
            onSelect={selectSummaryCard}
            loading={summaryLoading}
            ariaLabel="Demo status filters"
            layout="grid"
          />

          <ModulePageCard.Toolbar>
            <DemoToolbar
              search={search}
              onSearchChange={setSearch}
              activeView={activeView}
              onViewChange={(v) => dispatch(setActiveDemoView(v))}
              onScheduleDemo={canCreate ? () => dispatch(openScheduleDemoModal()) : undefined}
              onExport={handleExport}
              exportLoading={exportLoading}
              filtersOpen={filtersOpen}
              onToggleFilters={() => dispatch(toggleDemoFilters())}
              selectedCount={selectedRowIds.length}
              onBulkAction={(action) => dispatch(openDemoBulkAction(action))}
              onBulkExport={handleBulkExport}
              onRefresh={handleRefresh}
              refreshLoading={refreshing || isFetching}
            />
          </ModulePageCard.Toolbar>

          <ModulePageCard.Filters>
            <DemoFilters
              open={filtersOpen}
              values={filterDraft}
              onChange={setFilterDraft}
              onSearch={() => applyFilters(filterDraft)}
              onReset={() => {
                const next = branchLocked ? { branchId: filters.branchId } : {};
                setFilterDraft(next);
                resetFilters();
              }}
              onClose={() => dispatch(toggleDemoFilters())}
              branchLocked={branchLocked}
              canViewAllBranches={canViewAllBranches}
            />
          </ModulePageCard.Filters>

          <ModulePageCard.Table className="flex-1 min-h-0">
            <DemoGrid
              rows={rows}
              loading={gridLoading}
              fetching={gridFetching}
              density={columnDensity}
              canMark={canMark}
              markingId={markingId}
              onRowClick={(row) => {
                const enquiryId = row?.enquiry?.id || row?.enquiryId;
                if (enquiryId) navigate(ROUTES.ENQUIRY_TAB(enquiryId, 'demo'));
              }}
              onOpenDetail={(row) => {
                const enquiryId = row?.enquiry?.id || row?.enquiryId;
                if (enquiryId) navigate(ROUTES.ENQUIRY_TAB(enquiryId, 'demo'));
              }}
              onMarkAttendance={(row) => dispatch(openMarkAttendanceModal(row))}
              onQuickMark={handleQuickMark}
              onReschedule={(row) => dispatch(openRescheduleDemoModal(row))}
              onCancel={(row) => dispatch(openCancelDemoModal(row))}
              onSelectionChanged={(selected) =>
                dispatch(setSelectedDemoRowIds((selected || []).map((r) => r.id)))
              }
              onScheduleDemo={canCreate ? () => dispatch(openScheduleDemoModal()) : undefined}
            />
          </ModulePageCard.Table>
        </ModulePageCard>
      </div>

      {/* Modals */}
      <ScheduleDemoModal
        open={scheduleModalOpen}
        onClose={() => dispatch(closeScheduleDemoModal())}
        initialEnquiry={activeDemo?.enquiry}
        onSuccess={handleActionSuccess}
      />

      <MarkAttendanceModal
        open={attendanceModalOpen}
        onClose={() => dispatch(closeMarkAttendanceModal())}
        demo={activeDemo}
        onSuccess={handleActionSuccess}
      />

      <RescheduleDemoModal
        open={rescheduleModalOpen}
        onClose={() => dispatch(closeRescheduleDemoModal())}
        demo={activeDemo}
        onSuccess={handleActionSuccess}
      />

      <CancelDemoModal
        open={cancelModalOpen}
        onClose={() => dispatch(closeCancelDemoModal())}
        demo={activeDemo}
        onSuccess={handleActionSuccess}
      />

      <DemoBulkActionModal
        action={bulkActionModal}
        open={Boolean(bulkActionModal)}
        onClose={() => dispatch(closeDemoBulkAction())}
        selectedIds={selectedRowIds}
        onSuccess={handleBulkSuccess}
      />
    </>
  );
}
