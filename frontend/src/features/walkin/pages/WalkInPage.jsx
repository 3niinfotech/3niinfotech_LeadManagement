import { useState, useMemo, Suspense, useCallback } from 'react';
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
import LiveQueuePanel from '../components/reception/LiveQueuePanel';
import ReceptionChartsRow from '../components/reception/ReceptionChartsRow';
import WalkInToolbar from '../components/WalkInToolbar';
import WalkInFilters from '../components/WalkInFilters';
import WalkInGrid from '../components/WalkInGrid';
import { useWalkInFilters } from '../hooks/useWalkInFilters';
import { useWalkInDrawer } from '../hooks/useWalkInDrawer';
import {
  useGetWalkInsQuery,
  useGetWalkInSummaryQuery,
  useCreateWalkInMutation,
  usePatchWalkInStatusMutation,
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

export default function WalkInPage() {
  const dispatch = useDispatch();
  const {
    filtersOpen, activeView, activeSummaryFilter, columnDensity, drawerOpen,
  } = useSelector(selectWalkInUi);
  const { queryParams, search, setSearch, applyFilters, resetFilters, selectSummaryCard } = useWalkInFilters();
  const { openDrawer } = useWalkInDrawer();
  const [filterDraft, setFilterDraft] = useState({});
  const [selectedQueueId, setSelectedQueueId] = useState(null);
  const [focusFormSignal, setFocusFormSignal] = useState(0);

  const { data: listResult, isLoading, isFetching, refetch } = useGetWalkInsQuery(queryParams, {
    pollingInterval: POLL_MS,
  });
  const { data: summary, isLoading: summaryLoading, refetch: refetchSummary } = useGetWalkInSummaryQuery({}, {
    pollingInterval: POLL_MS,
  });
  const { data: branches = [] } = useGetWalkInBranchesQuery();
  const { data: counsellors = [] } = useGetWalkInCounsellorsQuery(filterDraft.branchId, { skip: !filterDraft.branchId });
  const [createWalkIn, { isLoading: creating }] = useCreateWalkInMutation();
  const [patchStatus] = usePatchWalkInStatusMutation();
  const [deleteWalkIn] = useDeleteWalkInMutation();

  const rows = listResult?.data || [];
  const gridLoading = isLoading && rows.length === 0;
  const gridFetching = isFetching && rows.length > 0;

  const metrics = useMemo(() => computeReceptionMetrics(rows, summary), [rows, summary]);
  const kpiItems = useMemo(() => buildReceptionKpiItems(metrics, summary), [metrics, summary]);

  const queueRows = useMemo(
    () => rows
      .filter((r) => ['WAITING', 'IN_COUNSELLING', 'APPOINTMENT', 'WALK_IN'].includes(r.status))
      .sort((a, b) => new Date(a.walkInAt) - new Date(b.walkInAt)),
    [rows],
  );

  const handleRefresh = useCallback(() => {
    refetch();
    refetchSummary();
  }, [refetch, refetchSummary]);

  const handleCreate = async (body) => {
    try {
      const result = await createWalkIn(body).unwrap();
      const lead = result?.data ?? result;
      toastService.success(`Registered — Token ${lead.tokenNumber} · ${lead.leadCode}`);
      handleRefresh();
      if (lead?.id) {
        setSelectedQueueId(lead.id);
        dispatch(openWalkInDrawer({ id: lead.id }));
      }
    } catch (e) {
      const msg = e?.data?.message || 'Registration failed';
      if (e?.status === 409) {
        toastService.warning(msg);
      } else {
        toastService.error(msg);
      }
    }
  };

  const handleStatusChange = async (id, status) => {
    try {
      await patchStatus({ id, status }).unwrap();
      toastService.success('Queue updated');
      handleRefresh();
    } catch (e) {
      toastService.error(e?.data?.message || 'Status update failed');
    }
  };

  const handleCallNext = () => {
    const next = queueRows.find((r) => r.status === 'WAITING');
    if (!next) {
      toastService.info('No visitors waiting in queue');
      return;
    }
    handleStatusChange(next.id, 'IN_COUNSELLING');
    setSelectedQueueId(next.id);
    openDrawer(next.id);
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

  const scrollToRegister = () => {
    setFocusFormSignal((n) => n + 1);
    document.getElementById('reception-registration-form')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <>
      <div className="crm-reception-page h-full min-h-0 flex flex-col">
        <div className="crm-reception-page__shell">
          <ReceptionPageHeader
            onRegister={scrollToRegister}
            onRefresh={handleRefresh}
            onExport={() => toastService.info('Export — use grid toolbar')}
            refreshing={isFetching}
          />

          <div className="crm-reception-page__scroll">
            <ReceptionKpiStrip
              items={kpiItems}
              activeFilter={activeSummaryFilter}
              onSelect={selectSummaryCard}
              loading={summaryLoading}
            />

            <div className="crm-reception-split">
              <QuickRegistrationPanel
                onSubmit={handleCreate}
                loading={creating}
                onOpenProfile={openDrawer}
                focusSignal={focusFormSignal}
              />
              <LiveQueuePanel
                queue={queueRows}
                selectedId={selectedQueueId}
                onSelect={setSelectedQueueId}
                onStatusChange={handleStatusChange}
                onCallNext={handleCallNext}
                loading={gridLoading}
              />
            </div>

            <ReceptionChartsRow metrics={metrics} />

            <section className="crm-reception-grid-section">
              <div className="crm-reception-grid-section__head">
                <h3 className="crm-reception-grid-section__title">Today&apos;s Walk-ins</h3>
                <p className="crm-reception-grid-section__sub">Enterprise grid · click row to open visitor drawer</p>
              </div>

              <WalkInToolbar
                search={search}
                onSearchChange={setSearch}
                activeView={activeView}
                onViewChange={(v) => dispatch(setWalkInActiveView(v))}
                onAdd={scrollToRegister}
                filtersOpen={filtersOpen}
                onToggleFilters={() => dispatch(toggleWalkInFilters())}
              />

              <WalkInFilters
                open={filtersOpen}
                values={filterDraft}
                branches={branches}
                counsellors={counsellors}
                onChange={setFilterDraft}
                onSearch={() => applyFilters(filterDraft)}
                onReset={() => { setFilterDraft({}); resetFilters(); }}
                onClose={() => dispatch(toggleWalkInFilters())}
              />

              <div className="crm-reception-grid-wrap">
                <WalkInGrid
                  rows={rows}
                  loading={gridLoading}
                  fetching={gridFetching}
                  density={columnDensity}
                  onRowClick={(row) => {
                    setSelectedQueueId(row.id);
                    openDrawer(row.id);
                  }}
                  onEdit={openDrawer}
                  onDelete={handleDelete}
                  onStatusChange={handleStatusChange}
                  onSelectionChanged={(selected) => dispatch(
                    setWalkInSelectedRowIds((selected || []).map((r) => r.id)),
                  )}
                />
              </div>
            </section>
          </div>
        </div>
      </div>

      {drawerOpen && (
        <Suspense fallback={null}>
          <WalkInDrawer />
        </Suspense>
      )}
    </>
  );
}
