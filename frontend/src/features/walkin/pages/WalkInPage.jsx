import { useState, useMemo, Suspense, useCallback, useEffect } from 'react';
import '../styles/walkin.css';
import { useDispatch, useSelector } from 'react-redux';
import toastService from '../../../services/toast/toast.service';
import alertService from '../../../services/alert/alert.service';
import { lazyImport } from '../../../utils/lazyImport';
import { computeReceptionMetrics } from '../utils/reception.utils';
import { buildReceptionKpiItems } from '../config/receptionKpi.config';
import ReceptionPageHeader from '../components/reception/ReceptionPageHeader';
import ReceptionKpiStrip from '../components/reception/ReceptionKpiStrip';
import QuickRegistrationPanel from '../components/reception/QuickRegistrationPanel';
import AssignCounsellorDrawer from '../components/reception/AssignCounsellorDrawer';
import ReceptionChartsRow from '../components/reception/ReceptionChartsRow';
import WalkInToolbar from '../components/WalkInToolbar';
import WalkInFilters from '../components/WalkInFilters';
import WalkInGrid from '../components/WalkInGrid';
import { useWalkInFilters } from '../hooks/useWalkInFilters';
import { useWalkInDrawer } from '../hooks/useWalkInDrawer';
import { usePermissions } from '../../../hooks/usePermissions';
import { PERMISSIONS } from '../../../config/permissions';
import {
  useGetWalkInsQuery,
  useGetWalkInSummaryQuery,
  useCreateWalkInMutation,
  useUpdateWalkInMutation,
  useDeleteWalkInMutation,
  useGetWalkInBranchesQuery,
  useGetWalkInCounsellorsQuery,
} from '../redux/walkinApiSlice';
import {
  selectWalkInUi,
  toggleWalkInFilters,
  setWalkInActiveView,
  setWalkInSelectedRowIds,
  openWalkInDrawer,
} from '../redux/walkinUiSlice';

const WalkInDrawer = lazyImport(() => import('../components/WalkInDrawer'));
const POLL_MS = 30000;

const VIEW_EMPTY = {
  today: { title: 'No visitors today', description: 'Register a walk-in to see them here.' },
  unassigned: { title: 'All assigned', description: 'Visitors without a counsellor will show here if auto-assign needs a manual pick.' },
  in_counselling: { title: 'No one with counsellor', description: 'Visitors in counselling show in this tab.' },
  completed: { title: 'None done yet', description: 'Completed visits today appear here.' },
  all: { title: 'No visitors', description: 'Registered walk-ins appear in this list.' },
};

export default function WalkInPage() {
  const dispatch = useDispatch();
  const {
    filtersOpen, activeView, columnDensity, drawerOpen,
  } = useSelector(selectWalkInUi);
  const {
    queryParams, search, setSearch, applyFilters, resetFilters, selectSummaryCard,
    branchLocked, canViewAllBranches, filters,
  } = useWalkInFilters();
  const { openDrawer } = useWalkInDrawer();
  const { can } = usePermissions();
  const canCreate = can(PERMISSIONS.WALKIN_CREATE);
  const canUpdate = can(PERMISSIONS.WALKIN_UPDATE);
  const canDelete = can(PERMISSIONS.WALKIN_DELETE);
  const [filterDraft, setFilterDraft] = useState({});
  const [focusFormSignal, setFocusFormSignal] = useState(0);
  const [assignLead, setAssignLead] = useState(null);

  useEffect(() => {
    setFilterDraft((prev) => ({
      ...prev,
      branchId: filters.branchId || undefined,
    }));
  }, [filters.branchId]);

  const { data: listResult, isLoading, isFetching, refetch } = useGetWalkInsQuery(queryParams, {
    pollingInterval: POLL_MS,
  });
  const { data: summary, isLoading: summaryLoading, refetch: refetchSummary } = useGetWalkInSummaryQuery({}, {
    pollingInterval: POLL_MS,
  });
  const { data: branches = [] } = useGetWalkInBranchesQuery();
  const { data: counsellors = [] } = useGetWalkInCounsellorsQuery(filterDraft.branchId, { skip: !filterDraft.branchId });
  const [createWalkIn, { isLoading: creating }] = useCreateWalkInMutation();
  const [updateWalkIn, { isLoading: assigning }] = useUpdateWalkInMutation();
  const [deleteWalkIn] = useDeleteWalkInMutation();

  const rows = listResult?.data || [];
  const gridLoading = isLoading && rows.length === 0;
  const gridFetching = isFetching && rows.length > 0;

  const metrics = useMemo(() => computeReceptionMetrics(rows, summary), [rows, summary]);
  const kpiItems = useMemo(() => buildReceptionKpiItems(metrics), [metrics]);
  const emptyCopy = VIEW_EMPTY[activeView] || VIEW_EMPTY.all;

  const handleRefresh = useCallback(() => {
    refetch();
    refetchSummary();
  }, [refetch, refetchSummary]);

  const handleCreate = async (body) => {
    try {
      const result = await createWalkIn(body).unwrap();
      const lead = result?.data ?? result;
      const assignee = lead?.assignedTo
        ? `${lead.assignedTo.firstName || ''} ${lead.assignedTo.lastName || ''}`.trim()
        : 'counsellor';
      toastService.success(`Registered & assigned to ${assignee} · ${lead.leadCode}. Counsellor notified.`);
      handleRefresh();
      dispatch(setWalkInActiveView('today'));
      if (lead?.id) dispatch(openWalkInDrawer({ id: lead.id }));
      setFocusFormSignal((n) => n + 1);
    } catch (e) {
      const msg = e?.data?.message || 'Registration failed';
      if (e?.status === 409) toastService.warning(msg);
      else toastService.error(msg);
    }
  };

  const handleDelete = async (id) => {
    const ok = await alertService.confirm({
      title: 'Remove walk-in?',
      text: 'This soft-deletes the lead record.',
      confirmText: 'Remove',
    });
    if (!ok) return;
    try {
      await deleteWalkIn(id).unwrap();
      toastService.action.deleted('Walk-in removed');
      handleRefresh();
    } catch (e) {
      toastService.error(e?.data?.message || 'Delete failed');
    }
  };

  const handleAssign = async (counsellorId) => {
    if (!assignLead?.id || !counsellorId) return;
    try {
      await updateWalkIn({ id: assignLead.id, assignedToId: counsellorId }).unwrap();
      toastService.success('Counsellor assigned — notification sent');
      setAssignLead(null);
      handleRefresh();
    } catch (e) {
      toastService.error(e?.data?.message || 'Assign failed');
    }
  };

  const scrollToRegister = () => {
    setFocusFormSignal((n) => n + 1);
    document.getElementById('reception-registration-form')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const onKpiSelect = (key) => {
    selectSummaryCard(key);
    document.getElementById('reception-visitor-list')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <>
      <div className="crm-reception-page h-full min-h-0 flex flex-col">
        <div className="crm-reception-page__shell">
          <ReceptionPageHeader
            onRegister={scrollToRegister}
            onRefresh={handleRefresh}
            refreshing={isFetching}
          />

          <div className="crm-reception-page__scroll">
            <ReceptionKpiStrip
              items={kpiItems}
              activeFilter={activeView}
              onSelect={onKpiSelect}
              loading={summaryLoading}
            />

            <section id="reception-visitor-list" className="crm-reception-grid-section">
              <WalkInToolbar
                search={search}
                onSearchChange={setSearch}
                activeView={activeView}
                onViewChange={(v) => dispatch(setWalkInActiveView(v))}
                filtersOpen={filtersOpen}
                onToggleFilters={() => dispatch(toggleWalkInFilters())}
                countLabel={`${rows.length} visitor${rows.length === 1 ? '' : 's'}`}
              />

              <WalkInFilters
                open={filtersOpen}
                values={filterDraft}
                branches={branches}
                counsellors={counsellors}
                onChange={setFilterDraft}
                onSearch={() => applyFilters(filterDraft)}
                onReset={() => {
                  const next = branchLocked ? { branchId: filters.branchId } : {};
                  setFilterDraft(next);
                  resetFilters();
                }}
                onClose={() => dispatch(toggleWalkInFilters())}
                branchLocked={branchLocked}
                canViewAllBranches={canViewAllBranches}
              />

              <div className="crm-reception-grid-wrap">
                <WalkInGrid
                  rows={rows}
                  loading={gridLoading}
                  fetching={gridFetching}
                  density={columnDensity}
                  onRowClick={(row) => openDrawer(row.id)}
                  onView={openDrawer}
                  onDelete={canDelete ? handleDelete : undefined}
                  onAssign={canUpdate ? setAssignLead : undefined}
                  onSelectionChanged={(selected) => dispatch(
                    setWalkInSelectedRowIds((selected || []).map((r) => r.id)),
                  )}
                  emptyTitle={emptyCopy.title}
                  emptyDescription={emptyCopy.description}
                  emptyActionLabel={canCreate ? 'Register visitor' : undefined}
                  onEmptyAction={canCreate ? scrollToRegister : undefined}
                />
              </div>
            </section>

            {canCreate && (
              <QuickRegistrationPanel
                onSubmit={handleCreate}
                loading={creating}
                onOpenProfile={openDrawer}
                focusSignal={focusFormSignal}
              />
            )}

            <ReceptionChartsRow metrics={metrics} />
          </div>
        </div>
      </div>

      <AssignCounsellorDrawer
        open={Boolean(assignLead)}
        lead={assignLead}
        onClose={() => setAssignLead(null)}
        onAssign={handleAssign}
        saving={assigning}
      />

      {drawerOpen && (
        <Suspense fallback={null}>
          <WalkInDrawer />
        </Suspense>
      )}
    </>
  );
}
