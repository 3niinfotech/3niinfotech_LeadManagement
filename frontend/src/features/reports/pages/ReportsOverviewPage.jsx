import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  FiTrendingUp,
  FiFileText,
  FiDollarSign,
  FiClock,
  FiArrowRight,
  FiPieChart,
  FiActivity,
  FiGlobe,
  FiUsers,
  FiAlertTriangle,
  FiCalendar,
} from 'react-icons/fi';
import ContentLoader from '../../../components/ui/ContentLoader';
import { apiGet } from '../../../api/apiClient';
import { API } from '../../../config/api';
import { ROUTES } from '../../../config/routes';
import { getEnquiryStatusLabel } from '../../../config/constants';
import ReportPageShell, { ReportEmpty, ReportError } from '../components/ReportPageShell';
import {
  ReportSectionCard,
  ReportAttentionGrid,
} from '../components/ReportCleanUi';
import {
  ReportBarChart,
  ReportDonutChart,
  ReportLineChart,
} from '../components/MuiReportCharts';
import { useReportFilters } from '../hooks/useReportFilters';
import '../styles/reports.css';

function fmt(value, isAmount = false) {
  if (value == null) return '0';
  const n = Number(value);
  if (Number.isNaN(n)) return '0';
  if (isAmount) return `₹${n.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
  return n.toLocaleString('en-IN');
}

export default function ReportsOverviewPage() {
  const filters = useReportFilters('all_time');
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

  const sources = useMemo(
    () => (data?.source || []).map((s) => ({
      label: s.source || 'Direct',
      count: Number(s.count) || 0,
      converted: Number(s.converted) || 0,
      rate: Number(s.rate) || 0,
    })),
    [data],
  );

  const collectionMix = useMemo(() => {
    const inv = data?.invoices || {};
    const paid = Number(inv.paid) || 0;
    const outstanding = Number(k.outstanding) || 0;
    const overdue = Number(inv.overdue) || 0;
    const rows = [
      { label: 'Paid Invoices', count: paid },
      { label: 'Outstanding Balance', count: outstanding > 0 ? Math.round(outstanding) : 0 },
      { label: 'Overdue Invoices', count: overdue },
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
      title="Executive Analytics & Reports"
      subtitle="Complete operational telemetry, student acquisition funnels, and revenue performance"
      breadcrumbs={[{ label: 'Executive Overview' }]}
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
      {!loading && !error && !data && (
        <ReportEmpty
          message="No records found in the selected timeframe."
          onResetAllTime={() => filters.setPreset('all_time')}
        />
      )}

      {!loading && !error && data && (
        <div className="crm-report-stack">
          {/* ── 4 Executive High-Impact KPI Cards ── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Card 1: Leads & Conversion */}
            <Link
              to={`${ROUTES.REPORTS}/leads`}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-2xs hover:border-indigo-400 dark:hover:border-indigo-500 hover:shadow-xs transition-all flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-center justify-between mb-2.5">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Lead Pipeline
                  </span>
                  <span className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                    <FiTrendingUp className="w-4 h-4" />
                  </span>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-extrabold text-slate-900 dark:text-slate-50 tabular-nums">
                    {fmt(k.enquiries)}
                  </span>
                  <span className="text-xs text-slate-500 font-medium">Total Enquiries</span>
                </div>
              </div>
              <div className="mt-3.5 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                <span className="inline-flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-semibold">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  {fmt(k.converted)} Converted
                </span>
                <span className="text-slate-500 font-medium">
                  {k.conversionRate != null ? `${k.conversionRate}% Rate` : '—'}
                </span>
              </div>
            </Link>

            {/* Card 2: Admissions & Visa */}
            <Link
              to={`${ROUTES.REPORTS}/application-visa`}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-2xs hover:border-emerald-400 dark:hover:border-emerald-500 hover:shadow-xs transition-all flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-center justify-between mb-2.5">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Admissions &amp; Visa
                  </span>
                  <span className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                    <FiFileText className="w-4 h-4" />
                  </span>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-extrabold text-slate-900 dark:text-slate-50 tabular-nums">
                    {fmt(k.students)}
                  </span>
                  <span className="text-xs text-slate-500 font-medium">Active Students</span>
                </div>
              </div>
              <div className="mt-3.5 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                <span className="text-indigo-600 dark:text-indigo-400 font-semibold">
                  {fmt(k.applications)} Applications
                </span>
                <span className="text-slate-500 font-medium">
                  {fmt(k.visas)} Visa Cases
                </span>
              </div>
            </Link>

            {/* Card 3: Finance & Billing */}
            <Link
              to={`${ROUTES.REPORTS}/finance`}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-2xs hover:border-sky-400 dark:hover:border-sky-500 hover:shadow-xs transition-all flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-center justify-between mb-2.5">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Revenue &amp; Collections
                  </span>
                  <span className="w-8 h-8 rounded-lg bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 flex items-center justify-center">
                    <FiDollarSign className="w-4 h-4" />
                  </span>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-extrabold text-slate-900 dark:text-slate-50 tabular-nums">
                    {fmt(k.invoicesPaid)}
                  </span>
                  <span className="text-xs text-slate-500 font-medium">Invoices Cleared</span>
                </div>
              </div>
              <div className="mt-3.5 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                <span className="text-slate-600 dark:text-slate-400 font-medium">
                  Outstanding: <strong className="text-slate-900 dark:text-slate-100">{fmt(k.outstanding, true)}</strong>
                </span>
                <span className="text-emerald-600 dark:text-emerald-400 font-semibold">100% Invoiced</span>
              </div>
            </Link>

            {/* Card 4: Operations & Tasks */}
            <Link
              to="/admin/calendar"
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-2xs hover:border-amber-400 dark:hover:border-amber-500 hover:shadow-xs transition-all flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-center justify-between mb-2.5">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Operational Tasks
                  </span>
                  <span className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                    <FiClock className="w-4 h-4" />
                  </span>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-extrabold text-rose-600 dark:text-rose-400 tabular-nums">
                    {fmt(k.followupsOverdue)}
                  </span>
                  <span className="text-xs text-slate-500 font-medium">Overdue Follow-ups</span>
                </div>
              </div>
              <div className="mt-3.5 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                <span className="text-slate-600 dark:text-slate-400 font-medium">
                  Demos: <strong className="text-slate-900 dark:text-slate-100">{fmt(k.demos)}</strong>
                </span>
                <span className="text-indigo-600 dark:text-indigo-400 font-semibold">
                  {k.attendancePresent != null ? `${Math.round((k.attendancePresent / Math.max(1, (k.attendancePresent + (k.attendanceAbsent || 0)))) * 100)}% Attended` : '—'}
                </span>
              </div>
            </Link>
          </div>

          {/* ── Row 1: Pipeline Stage Funnel & Conversion Volume ── */}
          <div className="crm-report-grid-2">
            <ReportSectionCard
              title="Pipeline Stage Progression"
              subtitle="Live enquiry progression across funnel stages"
              action={
                <Link to={`${ROUTES.REPORTS}/leads`} className="crm-rlink text-xs font-semibold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 flex items-center gap-1">
                  Full Leads Funnel <FiArrowRight className="w-3.5 h-3.5" />
                </Link>
              }
            >
              {funnel.length > 0 ? (
                <ReportBarChart
                  data={funnel}
                  xKey="label"
                  yKey="count"
                  height={270}
                  seriesLabel="Enquiries"
                  color="#4f46e5"
                />
              ) : (
                <ReportEmpty
                  message="No pipeline stages in this period."
                  onResetAllTime={() => filters.setPreset('all_time')}
                />
              )}
            </ReportSectionCard>

            <ReportSectionCard
              title="Conversion Volume Trend"
              subtitle="Enquiry volume trajectory across stages"
            >
              {funnel.length > 0 ? (
                <ReportLineChart
                  data={funnel}
                  xKey="label"
                  yKey="count"
                  height={270}
                  seriesLabel="Count"
                  color="#059669"
                />
              ) : (
                <ReportEmpty
                  message="No conversion trend data."
                  onResetAllTime={() => filters.setPreset('all_time')}
                />
              )}
            </ReportSectionCard>
          </div>

          {/* ── Row 2: Lead Acquisition Sources & Revenue Collections ── */}
          <div className="crm-report-grid-2">
            <ReportSectionCard
              title="Lead Acquisition Channels"
              subtitle="Distribution of inquiries by marketing channel"
              action={
                <Link to={`${ROUTES.REPORTS}/leads`} className="crm-rlink text-xs font-semibold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 flex items-center gap-1">
                  Source Insights <FiArrowRight className="w-3.5 h-3.5" />
                </Link>
              }
            >
              {sources.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
                  <ReportDonutChart
                    data={sources}
                    nameKey="label"
                    valueKey="count"
                    height={240}
                    centerLabel="Total Leads"
                    centerValue={fmt(k.enquiries)}
                  />
                  <div className="space-y-2">
                    {sources.map((src, idx) => (
                      <div key={src.label} className="p-2.5 rounded-lg border border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <span
                            className="w-2.5 h-2.5 rounded-full shrink-0"
                            style={{ background: `var(--crm-chart-${idx % 8}, #4f46e5)` }}
                          />
                          <span className="font-semibold text-slate-800 dark:text-slate-200">{src.label}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-slate-600 dark:text-slate-400 tabular-nums">{src.count} leads</span>
                          <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 tabular-nums">
                            {src.rate}% conv
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <ReportEmpty
                  message="No source data recorded."
                  onResetAllTime={() => filters.setPreset('all_time')}
                />
              )}
            </ReportSectionCard>

            <ReportSectionCard
              title="Revenue &amp; Billing Health"
              subtitle="Paid vs outstanding vs overdue invoices"
              action={
                <Link to={`${ROUTES.REPORTS}/finance`} className="crm-rlink text-xs font-semibold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 flex items-center gap-1">
                  Finance Details <FiArrowRight className="w-3.5 h-3.5" />
                </Link>
              }
            >
              {collectionMix.length > 0 ? (
                <ReportDonutChart
                  data={collectionMix}
                  nameKey="label"
                  valueKey="count"
                  height={250}
                  centerLabel="Invoices"
                  centerValue={fmt(k.invoicesPaid)}
                />
              ) : (
                <ReportEmpty
                  message="No billing records for this period."
                  onResetAllTime={() => filters.setPreset('all_time')}
                />
              )}
            </ReportSectionCard>
          </div>

          {/* ── Row 3: Actionable Operational Insights ── */}
          <ReportSectionCard
            title="Actionable Operations &amp; Needs Attention"
            subtitle="Prioritized items requiring immediate movement across CRM modules"
          >
            <ReportAttentionGrid
              items={attention}
              emptyMessage="All clear — no overdue follow-ups or pending bottlenecks."
            />
          </ReportSectionCard>
        </div>
      )}
    </ReportPageShell>
  );
}
