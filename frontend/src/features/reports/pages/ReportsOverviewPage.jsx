import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  FiInbox, FiCheckCircle, FiPercent, FiPhone, FiMonitor, FiUsers,
  FiFileText, FiGlobe, FiDollarSign, FiAlertTriangle, FiClock,
  FiTrendingUp, FiBarChart2, FiFilter, FiPieChart, FiArrowRight,
} from 'react-icons/fi';
import ContentLoader from '../../../components/ui/ContentLoader';
import { apiGet } from '../../../api/apiClient';
import { API } from '../../../config/api';
import { ROUTES } from '../../../config/routes';
import { getEnquiryStatusLabel } from '../../../config/constants';
import ReportPageShell, { ReportEmpty, ReportError } from '../components/ReportPageShell';
import {
  ReportMetricCard,
  ReportMetricGrid,
  ReportSectionCard,
  ReportAttentionGrid,
} from '../components/ReportCleanUi';
import {
  ReportBarChart,
  ReportDonutChart,
  ReportLineChart,
  ReportFunnelChart,
} from '../components/MuiReportCharts';
import { useReportFilters } from '../hooks/useReportFilters';
import '../styles/reports.css';

function fmt(value, isAmount = false) {
  if (value == null) return '—';
  const n = Number(value);
  if (Number.isNaN(n)) return '—';
  if (isAmount) return `₹${n.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
  return n.toLocaleString('en-IN');
}

export default function ReportsOverviewPage() {
  const filters = useReportFilters('this_month');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await apiGet(API.REPORTS_OVERVIEW, filters.queryParams);
      setData(res?.data || null);
    } catch (e) {
      setData(null);
      setError(e?.message || 'Unable to load overview');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.refreshKey, JSON.stringify(filters.queryParams)]);

  const k = data?.kpis || {};

  const funnel = useMemo(
    () => (data?.conversion?.funnel || []).map((row) => ({
      ...row,
      label: getEnquiryStatusLabel(row.status) || row.status,
    })),
    [data],
  );

  const collectionMix = useMemo(() => {
    const inv = data?.invoices || {};
    const paid = Number(inv.paid) || 0;
    const outstanding = Number(k.outstanding) || 0;
    const overdue = Number(inv.overdue) || 0;
    const rows = [
      { label: 'Paid invoices', count: paid },
      { label: 'Outstanding amt', count: outstanding > 0 ? Math.round(outstanding) : 0 },
      { label: 'Overdue invoices', count: overdue },
    ].filter((r) => r.count > 0);
    return rows;
  }, [data, k.outstanding]);

  const attention = useMemo(
    () => (data?.needsAttention || []).map((item) => ({
      ...item,
      icon: FiAlertTriangle,
      tone: item.isAmount || /overdue/i.test(item.label || '') ? 'danger' : 'warning',
      count: item.isAmount ? fmt(item.count, true) : fmt(item.count),
    })),
    [data],
  );

  return (
    <ReportPageShell
      title="Overview"
      subtitle="Business insights, pipeline performance and operational overview"
      breadcrumbs={[{ label: 'Overview' }]}
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
      {loading && <ContentLoader variant="dashboard" />}
      {!loading && error && <ReportError message={error} onRetry={load} />}
      {!loading && !error && !data && <ReportEmpty />}

      {!loading && !error && data && (
        <div className="crm-report-stack">
          <ReportMetricGrid cols={6}>
            <ReportMetricCard label="Total Enquiries" value={fmt(k.enquiries)} icon={FiInbox} tone="primary" to={`${ROUTES.REPORTS}/leads/conversion`} />
            <ReportMetricCard label="Converted" value={fmt(k.converted)} icon={FiCheckCircle} tone="success" to={`${ROUTES.REPORTS}/leads/conversion`} />
            <ReportMetricCard label="Conversion" value={k.conversionRate != null ? `${k.conversionRate}%` : '—'} icon={FiPercent} tone="info" to={`${ROUTES.REPORTS}/leads/conversion`} />
            <ReportMetricCard label="Follow-ups due" value={fmt(k.followupsDue)} icon={FiPhone} tone="warning" to={`${ROUTES.REPORTS}/operations/followup`} />
            <ReportMetricCard label="Demos" value={fmt(k.demos)} icon={FiMonitor} tone="info" to={`${ROUTES.REPORTS}/operations/demo`} />
            <ReportMetricCard label="Students" value={fmt(k.students)} icon={FiUsers} tone="success" to={`${ROUTES.REPORTS}/academic/students`} />
            <ReportMetricCard label="Applications" value={fmt(k.applications)} icon={FiFileText} tone="primary" to={`${ROUTES.REPORTS}/application-visa/applications`} />
            <ReportMetricCard label="Visa cases" value={fmt(k.visas)} icon={FiGlobe} tone="info" to={`${ROUTES.REPORTS}/application-visa/visa`} />
            <ReportMetricCard label="Paid invoices" value={fmt(k.invoicesPaid)} icon={FiDollarSign} tone="success" to={`${ROUTES.REPORTS}/finance/collection`} />
            <ReportMetricCard label="Outstanding" value={fmt(k.outstanding, true)} icon={FiAlertTriangle} tone="danger" to={`${ROUTES.REPORTS}/finance/outstanding`} />
            <ReportMetricCard label="Overdue follow-ups" value={fmt(k.followupsOverdue)} icon={FiClock} tone="danger" to={`${ROUTES.REPORTS}/operations/followup`} />
          </ReportMetricGrid>

          <div className="crm-report-grid-2">
            <ReportSectionCard title="Pipeline by stage" subtitle="Enquiry volume across funnel stages">
              {funnel.length
                ? <ReportLineChart data={funnel} xKey="label" yKey="count" height={260} seriesLabel="Enquiries" color="#2563EB" />
                : <ReportEmpty message="No pipeline data for this period." icon={FiTrendingUp} />}
            </ReportSectionCard>
            <ReportSectionCard title="Conversion by stage" subtitle="Same funnel as progressive series">
              {funnel.length
                ? <ReportBarChart data={funnel} xKey="label" yKey="count" height={260} seriesLabel="Count" />
                : <ReportEmpty message="No conversion series for this period." icon={FiBarChart2} />}
            </ReportSectionCard>
          </div>

          <div className="crm-report-grid-2">
            <ReportSectionCard
              title="Lead pipeline"
              subtitle="Cone funnel by enquiry status"
              action={
                <Link to={`${ROUTES.REPORTS}/leads/conversion`} className="crm-rlink">
                  Open Report <FiArrowRight className="w-3.5 h-3.5 inline ml-1" />
                </Link>
              }
            >
              {funnel.length
                ? <ReportFunnelChart data={funnel} nameKey="label" valueKey="count" height={280} />
                : <ReportEmpty message="No funnel data for this period." icon={FiFilter} />}
            </ReportSectionCard>
            <ReportSectionCard
              title="Collection mix"
              subtitle="Paid vs outstanding vs overdue (live invoices)"
              action={
                <Link to={`${ROUTES.REPORTS}/finance/collection`} className="crm-rlink">
                  Open Report <FiArrowRight className="w-3.5 h-3.5 inline ml-1" />
                </Link>
              }
            >
              {collectionMix.length
                ? (
                  <ReportDonutChart
                    data={collectionMix}
                    nameKey="label"
                    valueKey="count"
                    height={280}
                    centerLabel="Finance"
                    centerValue={fmt(k.invoicesPaid)}
                  />
                )
                : <ReportEmpty message="No finance mix for this period." icon={FiPieChart} />}
            </ReportSectionCard>
          </div>

          <ReportSectionCard title="Needs attention" subtitle="Actionable items from live modules">
            <ReportAttentionGrid items={attention} />
          </ReportSectionCard>
        </div>
      )}
    </ReportPageShell>
  );
}
