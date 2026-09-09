import { useEffect, useMemo, useState } from 'react';
import { FiClock, FiRefreshCw } from 'react-icons/fi';
import ModulePageCard from '../../../components/layout/ModulePageLayout';
import Button from '../../../components/ui/Button';
import SearchInput from '../../../components/ui/SearchInput';
import ContentLoader from '../../../components/ui/ContentLoader';
import { ROUTES } from '../../../config/routes';
import { PERMISSIONS, hasAnyPermission } from '../../../config/permissions';
import { useSelector } from 'react-redux';
import { useGetMySlaQuery, useGetSlaOverviewQuery } from '../../assignment/redux/assignmentApiSlice';
import { selectPermissions } from '../../../redux/slices/authSlice';
import { formatWaitMinutes } from '../utils/sla.utils';
import {
  SLA_ICONS,
  SlaCounsellorCard,
  SlaEnquiryRow,
  SlaHero,
  SlaLiveIndicator,
  SlaMetric,
} from '../components/SlaUi';
import '../styles/sla.theme.css';

const POLL_MS = 30000;

export default function SlaCenterPage() {
  const permissions = useSelector(selectPermissions) || [];
  const isManager = hasAnyPermission(permissions, [
    PERMISSIONS.REPORTS_VIEW,
    PERMISSIONS.SETTINGS_VIEW,
  ]);

  const [view, setView] = useState(isManager ? 'overview' : 'my');
  const [statusFilter, setStatusFilter] = useState(null);
  const [search, setSearch] = useState('');
  const [lastUpdated, setLastUpdated] = useState(null);

  const queryOpts = {
    pollingInterval: POLL_MS,
    refetchOnFocus: true,
    refetchOnReconnect: true,
  };

  const { data: myData, isLoading: myLoading, refetch: refetchMy, isFetching: fetchingMy } = useGetMySlaQuery(
    { limit: 100 },
    { skip: view !== 'my', ...queryOpts },
  );

  const { data: overviewData, isLoading: overviewLoading, refetch: refetchOverview, isFetching: fetchingOverview } = useGetSlaOverviewQuery(
    { limit: 100 },
    { skip: view !== 'overview' || !isManager, ...queryOpts },
  );

  const activeData = view === 'my' ? myData : overviewData;
  const loading = view === 'my' ? myLoading : overviewLoading;
  const fetching = view === 'my' ? fetchingMy : fetchingOverview;

  useEffect(() => {
    if (!fetching && activeData) setLastUpdated(new Date());
  }, [fetching, activeData]);

  const summary = activeData?.summary;
  const config = activeData?.config;
  const slaEnabled = activeData?.slaEnabled !== false;

  const items = useMemo(() => {
    const raw = activeData?.items || [];
    const q = search.trim().toLowerCase();
    return raw.filter((row) => {
      if (statusFilter === 'AT_RISK') {
        if (!['DUE_SOON', 'OVERDUE', 'BREACHED'].includes(row.status)) return false;
      } else if (statusFilter && row.status !== statusFilter) return false;
      if (!q) return true;
      const hay = [
        row.enquiryCode,
        row.firstName,
        row.lastName,
        row.assignedTo,
        row.priority,
      ].filter(Boolean).join(' ').toLowerCase();
      return hay.includes(q);
    });
  }, [activeData?.items, statusFilter, search]);

  const counsellorStats = useMemo(
    () => overviewData?.counsellorStats || [],
    [overviewData?.counsellorStats],
  );

  const mandatoryMinutes = config?.mandatoryReassignMinutes ?? 30;

  if (loading) return <ContentLoader variant="module" />;

  return (
    <ModulePageCard
      title="SLA Center"
      subtitle="Response-time SLA for enquiries — warnings, breaches, and escalations from live assignment config."
      icon={FiClock}
      iconColor="primary"
      breadcrumbs={[{ label: 'Dashboard', path: ROUTES.DASHBOARD }, { label: 'SLA Center' }]}
      actions={(
        <Button
          variant="outline"
          size="sm"
          icon={FiRefreshCw}
          loading={fetching}
          onClick={() => (view === 'my' ? refetchMy() : refetchOverview())}
        >
          Refresh
        </Button>
      )}
    >
      <ModulePageCard.Table scroll="page">
        <div className="crm-sla-page">
          <div className="crm-sla-toolbar">
            <div className="crm-sla-tabs">
              <button
                type="button"
                className={`crm-sla-tab ${view === 'my' ? 'crm-sla-tab--active' : ''}`}
                onClick={() => { setView('my'); setStatusFilter(null); }}
              >
                My SLA
              </button>
              {isManager && (
                <button
                  type="button"
                  className={`crm-sla-tab ${view === 'overview' ? 'crm-sla-tab--active' : ''}`}
                  onClick={() => { setView('overview'); setStatusFilter(null); }}
                >
                  Manager overview
                </button>
              )}
            </div>
            <SlaLiveIndicator fetching={fetching} lastUpdated={lastUpdated} />
          </div>

          <SlaHero summary={summary} config={config} slaEnabled={slaEnabled} />

          <div className="crm-sla-metrics">
            <SlaMetric
              icon={SLA_ICONS.onTrack}
              label="On track"
              value={summary?.onTrack ?? 0}
              tone="success"
              active={statusFilter === 'ON_TRACK'}
              onClick={() => setStatusFilter((f) => (f === 'ON_TRACK' ? null : 'ON_TRACK'))}
            />
            <SlaMetric
              icon={SLA_ICONS.dueSoon}
              label="Due soon"
              value={summary?.dueSoon ?? 0}
              tone="warning"
              active={statusFilter === 'DUE_SOON'}
              onClick={() => setStatusFilter((f) => (f === 'DUE_SOON' ? null : 'DUE_SOON'))}
            />
            <SlaMetric
              icon={SLA_ICONS.overdue}
              label="Overdue / Breached"
              value={(summary?.overdue ?? 0) + (summary?.breached ?? 0)}
              tone="danger"
              active={statusFilter === 'AT_RISK'}
              onClick={() => setStatusFilter((f) => (f === 'AT_RISK' ? null : 'AT_RISK'))}
            />
            {view === 'my' && (
              <SlaMetric
                icon={SLA_ICONS.completed}
                label="Completed"
                value={summary?.completed ?? 0}
                tone="primary"
                active={statusFilter === 'COMPLETED'}
                onClick={() => setStatusFilter((f) => (f === 'COMPLETED' ? null : 'COMPLETED'))}
              />
            )}
            {view === 'overview' && (
              <>
                <SlaMetric
                  icon={SLA_ICONS.avgWait}
                  label="Avg wait"
                  value={formatWaitMinutes(summary?.avgWaitMinutes ?? 0)}
                  tone="primary"
                />
                <SlaMetric
                  icon={SLA_ICONS.reassign}
                  label="Reassignments"
                  value={summary?.reassignCount ?? 0}
                  tone="neutral"
                />
              </>
            )}
          </div>

          {view === 'overview' && counsellorStats.length > 0 && (
            <div className="crm-sla-panel">
              <div className="crm-sla-panel__head">
                <div>
                  <h3 className="crm-sla-panel__title">Counsellor SLA performance</h3>
                  <p className="crm-sla-panel__desc">Warnings, breaches, and average wait by counsellor.</p>
                </div>
              </div>
              <div className="crm-sla-counsellor-grid">
                {counsellorStats.map((c) => (
                  <SlaCounsellorCard key={c.counsellorId} stat={c} />
                ))}
              </div>
            </div>
          )}

          <div className="crm-sla-panel">
            <div className="crm-sla-panel__head">
              <div>
                <h3 className="crm-sla-panel__title">
                  {view === 'overview' ? 'At-risk enquiries' : 'My enquiries'}
                </h3>
                <p className="crm-sla-panel__desc">
                  {items.length} record{items.length === 1 ? '' : 's'}
                  {statusFilter ? ` · filtered` : ''}
                  {' · '}auto-refresh every 30s
                </p>
              </div>
              <div className="crm-sla-search">
                <SearchInput
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search enquiry, name…"
                />
              </div>
            </div>

            {!items.length ? (
              <p className="crm-sla-empty">
                {activeData?.items?.length
                  ? 'No records match your filter.'
                  : view === 'overview'
                    ? 'No at-risk SLA enquiries right now — great work!'
                    : 'No SLA records in this view.'}
              </p>
            ) : (
              <ul className="crm-sla-list">
                {items.map((row) => (
                  <SlaEnquiryRow
                    key={row.enquiryId}
                    row={row}
                    showCounsellor={view === 'overview'}
                    mandatoryMinutes={mandatoryMinutes}
                  />
                ))}
              </ul>
            )}
          </div>
        </div>
      </ModulePageCard.Table>
    </ModulePageCard>
  );
}
