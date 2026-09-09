import { useEffect, useMemo, useState } from 'react';
import { useParams, Navigate, Link } from 'react-router-dom';
import {
  FiInbox, FiCheckCircle, FiPercent, FiUserX, FiActivity,
} from 'react-icons/fi';
import ContentLoader from '../../../components/ui/ContentLoader';
import { apiGet } from '../../../api/apiClient';
import { API } from '../../../config/api';
import { ROUTES } from '../../../config/routes';
import { getEnquiryStatusLabel } from '../../../config/constants';
import { REPORT_ROUTES, LEAD_REPORT_VIEWS } from '../config/reports.config';
import ReportPageShell, { ReportSectionChips, ReportError, ReportEmpty } from '../components/ReportPageShell';
import {
  ReportMetricCard,
  ReportMetricGrid,
  ReportSectionCard,
  ReportSimpleTable,
  ReportViewAll,
} from '../components/ReportCleanUi';
import {
  ReportDonutChart,
  ReportLineChart,
  ReportFunnelChart,
  ReportBarChart,
} from '../components/MuiReportCharts';
import {
  SourceReport,
  CountryReport,
  CounsellorReport,
  PerformanceReport,
  LostReasonReport,
} from '../components/ReportPanels';
import { useReportFilters } from '../hooks/useReportFilters';
import '../styles/reports.css';

const VALID = new Set(LEAD_REPORT_VIEWS.map((v) => v.id));

function fmt(n) {
  if (n == null) return '—';
  const v = Number(n);
  return Number.isNaN(v) ? '—' : v.toLocaleString('en-IN');
}

function ConversionDashboard({ data }) {
  const funnel = useMemo(
    () => (data?.conversion?.funnel || []).map((row) => ({
      ...row,
      label: getEnquiryStatusLabel(row.status) || row.status,
    })),
    [data],
  );

  const conv = data?.conversion || {};
  const lostTotal = (data?.lostReason || []).reduce((s, r) => s + (Number(r.count) || 0), 0);

  return (
    <div className="crm-report-stack">
      <ReportMetricGrid cols={5}>
        <ReportMetricCard label="Total Enquiries" value={fmt(conv.total)} icon={FiInbox} tone="primary" />
        <ReportMetricCard label="Converted" value={fmt(conv.converted)} icon={FiCheckCircle} tone="success" />
        <ReportMetricCard label="Conversion Rate" value={`${conv.rate ?? 0}%`} icon={FiPercent} tone="info" />
        <ReportMetricCard label="Active counsellors" value={fmt(data?.performance?.activeCounsellors)} icon={FiActivity} tone="warning" />
        <ReportMetricCard label="Lost" value={fmt(lostTotal)} icon={FiUserX} tone="danger" />
      </ReportMetricGrid>

      <div className="crm-report-grid-2">
        <ReportSectionCard title="Conversion trend" subtitle="Pipeline volume by stage">
          {funnel.length
            ? <ReportLineChart data={funnel} xKey="label" yKey="count" height={260} seriesLabel="Volume" />
            : <ReportEmpty />}
        </ReportSectionCard>
        <ReportSectionCard title="Conversion funnel" subtitle="Stage counts">
          {funnel.length
            ? <ReportFunnelChart data={funnel} nameKey="label" valueKey="count" height={260} />
            : <ReportEmpty />}
        </ReportSectionCard>
      </div>

      <div className="crm-report-grid-3">
        <ReportSectionCard title="Source performance">
          {(data?.source || []).length ? (
            <>
              <ReportDonutChart
                data={(data.source || []).slice(0, 6)}
                nameKey="source"
                valueKey="count"
                height={160}
                hideLegend
                innerRadius={36}
                outerRadius={58}
              />
              <ReportSimpleTable
                columns={[
                  { key: 'source', label: 'Source', swatchIndex: 0 },
                  { key: 'count', label: 'Leads', align: 'right' },
                  { key: 'converted', label: 'Conv', align: 'right' },
                  {
                    key: 'rate',
                    label: '%',
                    align: 'right',
                    render: (r) => `${r.rate ?? 0}%`,
                    badge: (r) => (Number(r.rate) > 0 ? 'success' : 'danger'),
                  },
                ]}
                rows={(data?.source || []).slice(0, 6)}
              />
            </>
          ) : <ReportEmpty />}
          <ReportViewAll to={`${REPORT_ROUTES.LEADS}/source`} />
        </ReportSectionCard>
        <ReportSectionCard title="Country performance">
          {(data?.country || []).length ? (
            <>
              <ReportBarChart
                data={(data.country || []).slice(0, 6)}
                xKey="country"
                yKey="count"
                height={160}
              />
              <ReportSimpleTable
                columns={[
                  { key: 'country', label: 'Country', swatchIndex: 0 },
                  { key: 'count', label: 'Leads', align: 'right' },
                  { key: 'converted', label: 'Conv', align: 'right' },
                  {
                    key: 'rate',
                    label: '%',
                    align: 'right',
                    render: (r) => `${r.rate ?? 0}%`,
                    badge: (r) => (Number(r.rate) > 0 ? 'success' : 'danger'),
                  },
                ]}
                rows={(data?.country || []).slice(0, 6)}
              />
            </>
          ) : <ReportEmpty />}
          <ReportViewAll to={`${REPORT_ROUTES.LEADS}/country`} />
        </ReportSectionCard>
        <ReportSectionCard title="Counsellor performance">
          {(data?.counsellor || []).length ? (
            <>
              <ReportBarChart
                data={(data.counsellor || []).slice(0, 6).map((r) => ({
                  ...r,
                  activity: (Number(r.followups) || 0) + (Number(r.demos) || 0) + (Number(r.assigned) || 0),
                }))}
                xKey="name"
                yKey="activity"
                height={160}
              />
              <ReportSimpleTable
                columns={[
                  { key: 'name', label: 'Counsellor', swatchIndex: 0 },
                  { key: 'assigned', label: 'Leads', align: 'right' },
                  { key: 'demos', label: 'Demo', align: 'right' },
                  { key: 'converted', label: 'Conv', align: 'right' },
                  {
                    key: 'rate',
                    label: '%',
                    align: 'right',
                    render: (r) => `${r.rate ?? 0}%`,
                    badge: (r) => (Number(r.rate) > 0 ? 'success' : 'danger'),
                  },
                ]}
                rows={(data?.counsellor || []).slice(0, 6)}
              />
            </>
          ) : <ReportEmpty />}
          <ReportViewAll to={`${REPORT_ROUTES.LEADS}/counsellor`} />
        </ReportSectionCard>
      </div>

      <ReportSectionCard title="Lost reason analysis">
        <div className="crm-report-grid-2">
          <ReportSimpleTable
            columns={[
              { key: 'reason', label: 'Lost reason' },
              { key: 'count', label: 'Count', align: 'right' },
            ]}
            rows={data?.lostReason || []}
          />
          {(data?.lostReason || []).length
            ? (
              <ReportDonutChart
                data={data.lostReason}
                nameKey="reason"
                valueKey="count"
                height={260}
                centerLabel="Total"
                centerValue={fmt(lostTotal)}
              />
            )
            : <ReportEmpty message="No lost reasons in this period." />}
        </div>
      </ReportSectionCard>

      <div className="flex gap-2">
        <Link to={ROUTES.ENQUIRIES} className="crm-rlink">Open Enquiries →</Link>
      </div>
    </div>
  );
}

export default function ReportsLeadsPage() {
  const { view } = useParams();
  const active = VALID.has(view) ? view : 'conversion';
  const filters = useReportFilters('this_month');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await apiGet(API.REPORTS_ENQUIRIES, filters.queryParams);
      setData(res?.data || null);
    } catch (e) {
      setData(null);
      setError(e?.message || 'Unable to load lead reports');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.refreshKey, JSON.stringify(filters.queryParams)]);

  if (view && !VALID.has(view)) {
    return <Navigate to={`${REPORT_ROUTES.LEADS}/conversion`} replace />;
  }

  return (
    <ReportPageShell
      title="Lead & Conversion"
      subtitle="Lead and enquiry conversion performance"
      breadcrumbs={[{ label: 'Lead & Conversion' }]}
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
      <ReportSectionChips items={LEAD_REPORT_VIEWS} activeId={active} basePath={REPORT_ROUTES.LEADS} />

      {loading && <ContentLoader variant="dashboard" />}
      {!loading && error && <ReportError message={error} onRetry={load} />}
      {!loading && !error && !data && <ReportEmpty />}

      {!loading && !error && data && active === 'conversion' && (
        <ConversionDashboard data={data} />
      )}
      {!loading && !error && data && active === 'source' && <SourceReport data={data.source} />}
      {!loading && !error && data && active === 'country' && <CountryReport data={data.country} />}
      {!loading && !error && data && active === 'counsellor' && <CounsellorReport data={data.counsellor} />}
      {!loading && !error && data && active === 'performance' && <PerformanceReport data={data.performance} />}
      {!loading && !error && data && active === 'lostReason' && <LostReasonReport data={data.lostReason} />}
    </ReportPageShell>
  );
}
