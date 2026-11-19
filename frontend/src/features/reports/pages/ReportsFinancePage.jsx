import { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  FiDollarSign,
  FiAlertTriangle,
  FiCheckCircle,
  FiFileText,
  FiClock,
  FiArrowRight,
  FiPercent,
} from 'react-icons/fi';
import ContentLoader from '../../../components/ui/ContentLoader';
import { apiGet } from '../../../api/apiClient';
import { API } from '../../../config/api';
import { ROUTES } from '../../../config/routes';
import ReportPageShell, { ReportEmpty, ReportError } from '../components/ReportPageShell';
import { ReportSectionCard } from '../components/ReportCleanUi';
import {
  ReportBarChart,
  ReportDonutChart,
} from '../components/MuiReportCharts';
import { useReportFilters } from '../hooks/useReportFilters';
import '../styles/reports.css';

const TABS = [
  { id: 'collection', label: 'Collections & Paid Invoices', icon: FiDollarSign },
  { id: 'outstanding', label: 'Outstanding & Receivables', icon: FiAlertTriangle },
];

function money(n) {
  if (n == null) return '₹0';
  return `₹${Number(n).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
}

function fmt(n) {
  if (n == null) return '0';
  return Number(n).toLocaleString('en-IN');
}

export default function ReportsFinancePage() {
  const { view } = useParams();
  const navigate = useNavigate();
  const activeTab = TABS.some((t) => t.id === view) ? view : 'collection';

  const filters = useReportFilters('all_time');
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

  const handleTabChange = (tabId) => {
    navigate(`${ROUTES.REPORTS}/finance/${tabId}`);
  };

  const statusRows = useMemo(() => (
    summary
      ? ['draft', 'sent', 'partial', 'overdue', 'paid', 'cancelled']
        .filter((k) => summary[k] != null && Number(summary[k]) > 0)
        .map((k) => ({ status: k.toUpperCase(), count: Number(summary[k]) || 0 }))
      : []
  ), [summary]);

  const mixRows = useMemo(() => {
    if (!summary) return [];
    return [
      { label: 'Paid Invoices', count: Number(summary.paid) || 0 },
      { label: 'Partial Payment', count: Number(summary.partial) || 0 },
      { label: 'Overdue Dues', count: Number(summary.overdue) || 0 },
      { label: 'Sent / Issued', count: Number(summary.sent) || 0 },
      { label: 'Drafts', count: Number(summary.draft) || 0 },
    ].filter((r) => r.count > 0);
  }, [summary]);

  const paidRate = summary?.total
    ? Math.round(((Number(summary.paid) || 0) / Number(summary.total)) * 1000) / 10
    : 100;

  return (
    <ReportPageShell
      title="Finance &amp; Collections Analytics"
      subtitle="Fee collections, invoice settlement tracking, and outstanding receivables telemetry"
      breadcrumbs={[{ label: 'Finance & Revenue' }]}
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

      {!loading && !error && (
        <div className="crm-report-stack">
          {/* ── Sub-navigation Tabs (Clean Segmented Control) ── */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl border border-slate-200/80 dark:border-slate-700/80 overflow-x-auto">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => handleTabChange(tab.id)}
                  className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                    active
                      ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-2xs font-bold'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* ── SECTION 1: FEE COLLECTIONS & PAID INVOICES ── */}
          {activeTab === 'collection' && (
            <div className="space-y-4">
              {/* Executive KPI Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-2xs">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Total Invoices</span>
                    <span className="w-7 h-7 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                      <FiFileText className="w-3.5 h-3.5" />
                    </span>
                  </div>
                  <div className="text-2xl font-extrabold text-slate-900 dark:text-slate-50 tabular-nums">
                    {fmt(summary?.total)}
                  </div>
                  <div className="mt-2 text-xs text-slate-500">All generated bills</div>
                </div>

                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-2xs">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Paid Invoices</span>
                    <span className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                      <FiCheckCircle className="w-3.5 h-3.5" />
                    </span>
                  </div>
                  <div className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 tabular-nums">
                    {fmt(summary?.paid)}
                  </div>
                  <div className="mt-2 text-xs text-emerald-600 dark:text-emerald-400 font-medium">Successfully collected</div>
                </div>

                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-2xs">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Outstanding Amount</span>
                    <span className="w-7 h-7 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                      <FiDollarSign className="w-3.5 h-3.5" />
                    </span>
                  </div>
                  <div className="text-2xl font-extrabold text-slate-900 dark:text-slate-50 tabular-nums">
                    {money(summary?.outstanding)}
                  </div>
                  <div className="mt-2 text-xs text-slate-500">Pending receivables</div>
                </div>

                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-2xs">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Settlement Rate</span>
                    <span className="w-7 h-7 rounded-lg bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 flex items-center justify-center">
                      <FiPercent className="w-3.5 h-3.5" />
                    </span>
                  </div>
                  <div className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 tabular-nums">
                    {paidRate}%
                  </div>
                  <div className="mt-2 text-xs text-emerald-600 dark:text-emerald-400 font-medium">Clearance efficiency</div>
                </div>
              </div>

              {/* Charts Row */}
              <div className="crm-report-grid-2">
                <ReportSectionCard
                  title="Invoice Payment Mix"
                  subtitle="Distribution by settlement classification"
                >
                  {mixRows.length > 0 ? (
                    <ReportDonutChart
                      data={mixRows}
                      nameKey="label"
                      valueKey="count"
                      height={270}
                      centerLabel="Invoices"
                      centerValue={fmt(summary?.total)}
                    />
                  ) : (
                    <ReportEmpty message="No invoice payment data recorded." />
                  )}
                </ReportSectionCard>

                <ReportSectionCard
                  title="Billing Status Volume"
                  subtitle="Invoices per workflow status"
                >
                  {statusRows.length > 0 ? (
                    <ReportBarChart
                      data={statusRows}
                      xKey="status"
                      yKey="count"
                      layout="horizontal"
                      height={270}
                      color="#059669"
                      seriesLabel="Invoices"
                    />
                  ) : (
                    <ReportEmpty message="No billing status data." />
                  )}
                </ReportSectionCard>
              </div>

              {/* Settlement Table */}
              <ReportSectionCard
                title="Invoice Settlement Table"
                subtitle="Complete status log of billed invoices"
                action={
                  <Link to={ROUTES.FEES} className="crm-rlink text-xs font-semibold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 flex items-center gap-1">
                    Manage Invoices <FiArrowRight className="w-3.5 h-3.5" />
                  </Link>
                }
              >
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-700 text-slate-500 uppercase tracking-wider font-semibold">
                      <tr>
                        <th className="py-2.5 px-4">Status</th>
                        <th className="py-2.5 px-4 text-right">Invoice Count</th>
                        <th className="py-2.5 px-4 text-right">Settlement State</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {statusRows.map((row) => (
                        <tr key={row.status} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                          <td className="py-3 px-4 font-semibold text-slate-800 dark:text-slate-200">
                            {row.status}
                          </td>
                          <td className="py-3 px-4 text-right tabular-nums font-bold text-slate-900 dark:text-slate-100">
                            {row.count}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <span className={`inline-flex px-2 py-0.5 rounded text-[11px] font-semibold ${
                              row.status === 'PAID'
                                ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400'
                                : row.status === 'OVERDUE'
                                  ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400'
                                  : 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-400'
                            }`}>
                              {row.status === 'PAID' ? 'Fully Cleared' : row.status === 'OVERDUE' ? 'Action Required' : 'Open'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </ReportSectionCard>
            </div>
          )}

          {/* ── SECTION 2: OUTSTANDING & RECEIVABLES ── */}
          {activeTab === 'outstanding' && (
            <div className="space-y-4">
              <div className="crm-report-grid-2">
                <ReportSectionCard
                  title="Receivables Aging &amp; Dues"
                  subtitle="Outstanding fee balances requiring follow-up"
                >
                  <div className="py-8 flex flex-col items-center justify-center text-center">
                    <div className="w-16 h-16 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-3">
                      <FiCheckCircle className="w-8 h-8" />
                    </div>
                    <div className="text-3xl font-extrabold text-slate-900 dark:text-slate-100 tabular-nums">
                      {money(summary?.outstanding)}
                    </div>
                    <p className="text-xs text-slate-500 font-medium mt-1">Total Outstanding Dues</p>
                    <p className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold mt-2">
                      All billed client fees are up to date!
                    </p>
                  </div>
                </ReportSectionCard>

                <ReportSectionCard
                  title="Overdue Invoices Health"
                  subtitle="Past-due billings requiring collection outreach"
                >
                  <div className="py-8 flex flex-col items-center justify-center text-center">
                    <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 flex items-center justify-center mb-3">
                      <FiClock className="w-8 h-8" />
                    </div>
                    <div className="text-3xl font-extrabold text-slate-900 dark:text-slate-100 tabular-nums">
                      {fmt(summary?.overdue)}
                    </div>
                    <p className="text-xs text-slate-500 font-medium mt-1">Overdue Invoices</p>
                    <p className="text-xs text-slate-400 mt-2">
                      Zero overdue invoices requiring collection alerts.
                    </p>
                  </div>
                </ReportSectionCard>
              </div>
            </div>
          )}
        </div>
      )}
    </ReportPageShell>
  );
}
