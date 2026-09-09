import { useEffect, useMemo, useState } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import {
  FiFileText, FiGlobe, FiCheckCircle, FiAlertTriangle, FiSend, FiAward,
} from 'react-icons/fi';
import ContentLoader from '../../../components/ui/ContentLoader';
import { apiGet } from '../../../api/apiClient';
import { API } from '../../../config/api';
import { ROUTES } from '../../../config/routes';
import { REPORT_ROUTES } from '../config/reports.config';
import ReportPageShell, { ReportSectionChips, ReportError, ReportEmpty } from '../components/ReportPageShell';
import {
  ReportMetricCard,
  ReportMetricGrid,
  ReportSectionCard,
  ReportSimpleTable,
  ReportViewAll,
} from '../components/ReportCleanUi';
import {
  ReportBarChart,
  ReportDonutChart,
  ReportGaugeChart,
  ReportFunnelChart,
} from '../components/MuiReportCharts';
import { useReportFilters } from '../hooks/useReportFilters';
import '../styles/reports.css';

const VIEWS = [
  { id: 'applications', label: 'Applications', icon: FiFileText },
  { id: 'visa', label: 'Visa', icon: FiGlobe },
];
const VALID = new Set(VIEWS.map((v) => v.id));

function fmt(n) {
  if (n == null) return '—';
  const v = Number(n);
  return Number.isNaN(v) ? '—' : v.toLocaleString('en-IN');
}

function toRows(summary = {}, exclude = ['total']) {
  return Object.entries(summary)
    .filter(([key]) => !exclude.includes(key))
    .map(([status, count]) => ({ status, count: Number(count) || 0 }))
    .filter((r) => r.count > 0)
    .sort((a, b) => b.count - a.count);
}

export default function ReportsApplicationVisaPage() {
  const { view } = useParams();
  const active = VALID.has(view) ? view : 'applications';
  const filters = useReportFilters('this_month');
  const [apps, setApps] = useState(null);
  const [visas, setVisas] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const [a, v] = await Promise.all([
        apiGet(API.APPLICATIONS_SUMMARY, filters.queryParams).catch(() => null),
        apiGet(API.VISAS_SUMMARY, filters.queryParams).catch(() => null),
      ]);
      setApps(a?.data || a || null);
      setVisas(v?.data || v || null);
    } catch (e) {
      setError(e?.message || 'Unable to load application/visa report');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.refreshKey, JSON.stringify(filters.queryParams)]);

  const appRows = useMemo(() => toRows(apps || {}), [apps]);
  const visaRows = useMemo(() => toRows(visas || {}), [visas]);

  const appOfferRate = apps?.total
    ? Math.round(((Number(apps.offer) || 0) / Number(apps.total)) * 1000) / 10
    : 0;
  const visaApproveRate = visas?.total
    ? Math.round(((Number(visas.approved) || 0) / Number(visas.total)) * 1000) / 10
    : 0;

  if (view && !VALID.has(view)) {
    return <Navigate to={`${REPORT_ROUTES.APPLICATION_VISA}/applications`} replace />;
  }

  return (
    <ReportPageShell
      title="Application & Visa"
      subtitle="Application and visa case status overview"
      breadcrumbs={[{ label: 'Application & Visa' }]}
      filters={{
        preset: filters.preset,
        onPresetChange: filters.setPreset,
        customFrom: filters.customFrom,
        customTo: filters.customTo,
        onCustomFrom: filters.setCustomFrom,
        onCustomTo: filters.setCustomTo,
        branchId: filters.branchId,
        onBranchChange: filters.setBranchId,
        branchLocked: filters.branchLocked,
        canViewAllBranches: filters.canViewAllBranches,
        onRefresh: filters.refresh,
        refreshLoading: loading,
      }}
    >
      <ReportSectionChips items={VIEWS} activeId={active} basePath={REPORT_ROUTES.APPLICATION_VISA} />

      {loading && <ContentLoader variant="dashboard" />}
      {!loading && error && <ReportError message={error} onRetry={load} />}

      {!loading && !error && active === 'applications' && (
        <div className="crm-report-stack">
          <ReportMetricGrid cols={5}>
            <ReportMetricCard label="Total" value={fmt(apps?.total)} icon={FiFileText} tone="primary" />
            <ReportMetricCard label="In Review" value={fmt(apps?.inReview)} icon={FiSend} tone="warning" />
            <ReportMetricCard label="Submitted" value={fmt(apps?.submitted)} icon={FiCheckCircle} tone="info" />
            <ReportMetricCard label="Offer" value={fmt(apps?.offer)} icon={FiAward} tone="success" />
            <ReportMetricCard label="Rejected" value={fmt(apps?.rejected)} icon={FiAlertTriangle} tone="danger" />
          </ReportMetricGrid>

          <div className="crm-report-grid-3">
            <ReportSectionCard title="Status mix" subtitle="Colorful donut">
              {appRows.length
                ? (
                  <ReportDonutChart
                    data={appRows}
                    nameKey="status"
                    valueKey="count"
                    height={260}
                    centerValue={fmt(apps?.total)}
                    centerLabel="Apps"
                  />
                )
                : <ReportEmpty />}
            </ReportSectionCard>
            <ReportSectionCard title="Status volume" subtitle="Rainbow bars">
              {appRows.length
                ? (
                  <ReportBarChart
                    data={appRows}
                    xKey="status"
                    yKey="count"
                    height={260}
                    layout={appRows.length <= 5 ? 'horizontal' : 'vertical'}
                  />
                )
                : <ReportEmpty />}
            </ReportSectionCard>
            <ReportSectionCard title="Offer rate" subtitle="Gauge">
              <ReportGaugeChart value={appOfferRate} max={100} height={240} label="Offer conversion" color="#059669" />
            </ReportSectionCard>
          </div>

          <div className="crm-report-grid-2">
            <ReportSectionCard title="Application funnel" subtitle="Stage flow">
              {appRows.length
                ? <ReportFunnelChart data={appRows} nameKey="status" valueKey="count" height={300} />
                : <ReportEmpty />}
            </ReportSectionCard>
            <ReportSectionCard title="Status breakdown">
              <ReportSimpleTable
                columns={[
                  { key: 'status', label: 'Status', swatchIndex: 0 },
                  { key: 'count', label: 'Count', align: 'right' },
                ]}
                rows={appRows}
                empty="No application status data."
              />
              <ReportViewAll to={ROUTES.APPLICATIONS} />
            </ReportSectionCard>
          </div>
        </div>
      )}

      {!loading && !error && active === 'visa' && (
        <div className="crm-report-stack">
          <ReportMetricGrid cols={5}>
            <ReportMetricCard label="Total" value={fmt(visas?.total)} icon={FiGlobe} tone="primary" />
            <ReportMetricCard label="Pending" value={fmt(visas?.pending)} icon={FiSend} tone="warning" />
            <ReportMetricCard label="Submitted" value={fmt(visas?.submitted)} icon={FiFileText} tone="info" />
            <ReportMetricCard label="Approved" value={fmt(visas?.approved)} icon={FiCheckCircle} tone="success" />
            <ReportMetricCard label="Rejected" value={fmt(visas?.rejected)} icon={FiAlertTriangle} tone="danger" />
          </ReportMetricGrid>

          <div className="crm-report-grid-3">
            <ReportSectionCard title="Visa status" subtitle="Colorful donut">
              {visaRows.length
                ? (
                  <ReportDonutChart
                    data={visaRows}
                    nameKey="status"
                    valueKey="count"
                    height={260}
                    centerValue={fmt(visas?.total)}
                    centerLabel="Cases"
                  />
                )
                : <ReportEmpty />}
            </ReportSectionCard>
            <ReportSectionCard title="Visa volume" subtitle="Rainbow bars">
              {visaRows.length
                ? (
                  <ReportBarChart
                    data={visaRows}
                    xKey="status"
                    yKey="count"
                    height={260}
                    layout={visaRows.length <= 5 ? 'horizontal' : 'vertical'}
                  />
                )
                : <ReportEmpty />}
            </ReportSectionCard>
            <ReportSectionCard title="Approval rate" subtitle="Gauge">
              <ReportGaugeChart value={visaApproveRate} max={100} height={240} label="Visa approved" color="#0284c7" />
            </ReportSectionCard>
          </div>

          <div className="crm-report-grid-2">
            <ReportSectionCard title="Visa funnel" subtitle="Stage flow">
              {visaRows.length
                ? <ReportFunnelChart data={visaRows} nameKey="status" valueKey="count" height={300} />
                : <ReportEmpty />}
            </ReportSectionCard>
            <ReportSectionCard title="Status breakdown">
              <ReportSimpleTable
                columns={[
                  { key: 'status', label: 'Status', swatchIndex: 0 },
                  { key: 'count', label: 'Count', align: 'right' },
                ]}
                rows={visaRows}
                empty="No visa status data."
              />
              <ReportViewAll to={ROUTES.VISAS} label="Open Visas" />
            </ReportSectionCard>
          </div>
        </div>
      )}
    </ReportPageShell>
  );
}
