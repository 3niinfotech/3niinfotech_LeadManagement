import { useEffect, useMemo, useState } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { FiDollarSign, FiAlertTriangle, FiCheckCircle, FiFileText, FiSend, FiTrendingUp } from 'react-icons/fi';
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
  { id: 'collection', label: 'Fees & Collection', icon: FiDollarSign },
  { id: 'outstanding', label: 'Outstanding', icon: FiAlertTriangle },
];
const VALID = new Set(VIEWS.map((v) => v.id));

function money(n) {
  if (n == null) return '—';
  return `₹${Number(n).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
}

function fmt(n) {
  if (n == null) return '—';
  return Number(n).toLocaleString('en-IN');
}

export default function ReportsFinancePage() {
  const { view } = useParams();
  const active = VALID.has(view) ? view : 'collection';
  const filters = useReportFilters('this_month');
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await apiGet(API.INVOICES_SUMMARY, filters.queryParams);
      setSummary(res?.data || res || null);
    } catch (e) {
      setSummary(null);
      setError(e?.message || 'Unable to load finance report');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.refreshKey, JSON.stringify(filters.queryParams)]);

  const statusRows = useMemo(() => (
    summary
      ? ['draft', 'sent', 'partial', 'overdue', 'paid', 'cancelled']
        .filter((k) => summary[k] != null && Number(summary[k]) > 0)
        .map((k) => ({ status: k, count: Number(summary[k]) || 0 }))
      : []
  ), [summary]);

  const mixRows = useMemo(() => {
    if (!summary) return [];
    return [
      { label: 'Paid', count: Number(summary.paid) || 0 },
      { label: 'Partial', count: Number(summary.partial) || 0 },
      { label: 'Overdue', count: Number(summary.overdue) || 0 },
      { label: 'Sent', count: Number(summary.sent) || 0 },
      { label: 'Draft', count: Number(summary.draft) || 0 },
    ].filter((r) => r.count > 0);
  }, [summary]);

  const openRows = useMemo(() => {
    if (!summary) return [];
    return [
      { status: 'draft', count: summary.draft || 0 },
      { status: 'sent', count: summary.sent || 0 },
      { status: 'partial', count: summary.partial || 0 },
      { status: 'overdue', count: summary.overdue || 0 },
    ].filter((r) => r.count > 0);
  }, [summary]);

  const paidRate = summary?.total
    ? Math.round(((Number(summary.paid) || 0) / Number(summary.total)) * 1000) / 10
    : 0;
  const overdueShare = summary?.total
    ? Math.round(((Number(summary.overdue) || 0) / Number(summary.total)) * 1000) / 10
    : 0;

  if (view && !VALID.has(view)) {
    return <Navigate to={`${REPORT_ROUTES.FINANCE}/collection`} replace />;
  }

  return (
    <ReportPageShell
      title="Finance"
      subtitle="Collections, outstanding payments and financial performance"
      breadcrumbs={[{ label: 'Finance' }]}
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
      <ReportSectionChips items={VIEWS} activeId={active} basePath={REPORT_ROUTES.FINANCE} />

      {loading && <ContentLoader variant="dashboard" />}
      {!loading && error && <ReportError message={error} onRetry={load} />}
      {!loading && !error && !summary && <ReportEmpty />}

      {!loading && !error && summary && active === 'collection' && (
        <div className="crm-report-stack">
          <ReportMetricGrid cols={5}>
            <ReportMetricCard label="Total invoices" value={fmt(summary.total)} icon={FiFileText} tone="primary" />
            <ReportMetricCard label="Paid" value={fmt(summary.paid)} icon={FiCheckCircle} tone="success" />
            <ReportMetricCard label="Outstanding" value={money(summary.outstanding)} icon={FiDollarSign} tone="warning" />
            <ReportMetricCard label="Partial" value={fmt(summary.partial)} icon={FiTrendingUp} tone="info" />
            <ReportMetricCard label="Sent" value={fmt(summary.sent)} icon={FiSend} tone="info" />
          </ReportMetricGrid>

          <div className="crm-report-grid-3">
            <ReportSectionCard title="Collected vs open" subtitle="Colorful donut">
              {mixRows.length
                ? (
                  <ReportDonutChart
                    data={mixRows}
                    nameKey="label"
                    valueKey="count"
                    height={260}
                    centerValue={money(summary.outstanding)}
                    centerLabel="Due"
                  />
                )
                : <ReportEmpty />}
            </ReportSectionCard>
            <ReportSectionCard title="Invoice status" subtitle="Rainbow bars">
              {statusRows.length
                ? (
                  <ReportBarChart
                    data={statusRows}
                    xKey="status"
                    yKey="count"
                    height={260}
                    layout="horizontal"
                  />
                )
                : <ReportEmpty />}
            </ReportSectionCard>
            <ReportSectionCard title="Paid rate" subtitle="Collection gauge">
              <ReportGaugeChart value={paidRate} max={100} height={240} label="Invoices paid" color="#059669" />
            </ReportSectionCard>
          </div>

          <div className="crm-report-grid-2">
            <ReportSectionCard title="Collection funnel" subtitle="Status flow">
              {statusRows.length
                ? <ReportFunnelChart data={statusRows} nameKey="status" valueKey="count" height={300} />
                : <ReportEmpty />}
            </ReportSectionCard>
            <ReportSectionCard title="Invoice status table">
              <ReportSimpleTable
                columns={[
                  { key: 'status', label: 'Status', swatchIndex: 0 },
                  { key: 'count', label: 'Count', align: 'right' },
                ]}
                rows={statusRows}
              />
              <ReportViewAll to={ROUTES.FEES} />
            </ReportSectionCard>
          </div>
        </div>
      )}

      {!loading && !error && summary && active === 'outstanding' && (
        <div className="crm-report-stack">
          <ReportMetricGrid cols={4}>
            <ReportMetricCard label="Outstanding" value={money(summary.outstanding)} icon={FiDollarSign} tone="warning" />
            <ReportMetricCard label="Overdue" value={fmt(summary.overdue)} icon={FiAlertTriangle} tone="danger" />
            <ReportMetricCard label="Partial" value={fmt(summary.partial)} icon={FiTrendingUp} tone="info" />
            <ReportMetricCard label="Sent (unpaid)" value={fmt(summary.sent)} icon={FiSend} tone="primary" />
          </ReportMetricGrid>

          <div className="crm-report-grid-3">
            <ReportSectionCard title="Open billing" subtitle="Draft → overdue">
              {openRows.length
                ? <ReportBarChart data={openRows} xKey="status" yKey="count" height={260} layout="horizontal" />
                : <ReportEmpty />}
            </ReportSectionCard>
            <ReportSectionCard title="Risk mix" subtitle="Open invoices">
              {openRows.length
                ? (
                  <ReportDonutChart
                    data={openRows.map((r) => ({ label: r.status, count: r.count }))}
                    nameKey="label"
                    valueKey="count"
                    height={260}
                    centerValue={fmt(summary.overdue)}
                    centerLabel="Overdue"
                  />
                )
                : <ReportEmpty />}
            </ReportSectionCard>
            <ReportSectionCard title="Overdue share" subtitle="Risk gauge">
              <ReportGaugeChart value={overdueShare} max={100} height={240} label="% overdue invoices" color="#dc2626" />
            </ReportSectionCard>
          </div>

          <ReportSectionCard title="Outstanding snapshot">
            <ReportSimpleTable
              columns={[
                { key: 'label', label: 'Metric' },
                { key: 'value', label: 'Value', align: 'right' },
              ]}
              rows={[
                { id: 1, label: 'Outstanding amount', value: money(summary.outstanding) },
                { id: 2, label: 'Overdue invoices', value: fmt(summary.overdue) },
                { id: 3, label: 'Partial invoices', value: fmt(summary.partial) },
                { id: 4, label: 'Sent (unpaid)', value: fmt(summary.sent) },
                { id: 5, label: 'Draft', value: fmt(summary.draft) },
              ]}
            />
            <ReportViewAll to={ROUTES.FEES} label="Open Fees" />
          </ReportSectionCard>
        </div>
      )}
    </ReportPageShell>
  );
}
