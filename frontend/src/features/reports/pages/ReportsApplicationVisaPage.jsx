import { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  FiFileText,
  FiGlobe,
  FiCheckCircle,
  FiAlertTriangle,
  FiSend,
  FiAward,
  FiArrowRight,
  FiClock,
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
  ReportGaugeChart,
} from '../components/MuiReportCharts';
import { useReportFilters } from '../hooks/useReportFilters';
import '../styles/reports.css';

const TABS = [
  { id: 'applications', label: 'Applications Pipeline', icon: FiFileText },
  { id: 'visa', label: 'Visa Processing & Grants', icon: FiGlobe },
];

function fmt(n) {
  if (n == null) return '0';
  const v = Number(n);
  return Number.isNaN(v) ? '0' : v.toLocaleString('en-IN');
}

function toRows(summary = {}, exclude = ['total']) {
  return Object.entries(summary)
    .filter(([key]) => !exclude.includes(key))
    .map(([status, count]) => ({
      status: status.replace(/_/g, ' '),
      count: Number(count) || 0,
    }))
    .filter((r) => r.count > 0)
    .sort((a, b) => b.count - a.count);
}

export default function ReportsApplicationVisaPage() {
  const { view } = useParams();
  const navigate = useNavigate();
  const activeTab = TABS.some((t) => t.id === view) ? view : 'applications';

  const filters = useReportFilters('all_time');
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

  const handleTabChange = (tabId) => {
    navigate(`${ROUTES.REPORTS}/application-visa/${tabId}`);
  };

  const appRows = useMemo(() => toRows(apps || {}), [apps]);
  const visaRows = useMemo(() => toRows(visas || {}), [visas]);

  const appOfferRate = apps?.total
    ? Math.round(((Number(apps.offer) || 0) / Number(apps.total)) * 1000) / 10
    : 0;

  const visaApproveRate = visas?.total
    ? Math.round(((Number(visas.approved) || 0) / Number(visas.total)) * 1000) / 10
    : 0;

  return (
    <ReportPageShell
      title="Admissions &amp; Visa Intelligence"
      subtitle="University application lifecycle, offer conversion rates, and visa case progress"
      breadcrumbs={[{ label: 'Admissions & Visas' }]}
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

          {/* ── SECTION 1: APPLICATIONS ── */}
          {activeTab === 'applications' && (
            <div className="space-y-4">
              {/* Executive KPI Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-2xs">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Total Applications</span>
                    <span className="w-7 h-7 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                      <FiFileText className="w-3.5 h-3.5" />
                    </span>
                  </div>
                  <div className="text-2xl font-extrabold text-slate-900 dark:text-slate-50 tabular-nums">
                    {fmt(apps?.total)}
                  </div>
                  <div className="mt-2 text-xs text-slate-500">All submitted files</div>
                </div>

                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-2xs">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">In Review</span>
                    <span className="w-7 h-7 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                      <FiClock className="w-3.5 h-3.5" />
                    </span>
                  </div>
                  <div className="text-2xl font-extrabold text-amber-600 dark:text-amber-400 tabular-nums">
                    {fmt(apps?.inReview)}
                  </div>
                  <div className="mt-2 text-xs text-amber-600 dark:text-amber-400 font-medium">Under evaluation</div>
                </div>

                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-2xs">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Submitted</span>
                    <span className="w-7 h-7 rounded-lg bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 flex items-center justify-center">
                      <FiSend className="w-3.5 h-3.5" />
                    </span>
                  </div>
                  <div className="text-2xl font-extrabold text-slate-900 dark:text-slate-50 tabular-nums">
                    {fmt(apps?.submitted)}
                  </div>
                  <div className="mt-2 text-xs text-slate-500">Lodged with universities</div>
                </div>

                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-2xs">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Offers Received</span>
                    <span className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                      <FiAward className="w-3.5 h-3.5" />
                    </span>
                  </div>
                  <div className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 tabular-nums">
                    {fmt(apps?.offer)}
                  </div>
                  <div className="mt-2 text-xs text-emerald-600 dark:text-emerald-400 font-medium">{appOfferRate}% Offer Rate</div>
                </div>

                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-2xs">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Rejected / Denied</span>
                    <span className="w-7 h-7 rounded-lg bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center">
                      <FiAlertTriangle className="w-3.5 h-3.5" />
                    </span>
                  </div>
                  <div className="text-2xl font-extrabold text-rose-600 dark:text-rose-400 tabular-nums">
                    {fmt(apps?.rejected)}
                  </div>
                  <div className="mt-2 text-xs text-rose-600 dark:text-rose-400 font-medium">Unsuccessful files</div>
                </div>
              </div>

              {/* Charts Row */}
              <div className="crm-report-grid-2">
                <ReportSectionCard
                  title="Application Status Distribution"
                  subtitle="Volume of applications across lifecycle stages"
                >
                  {appRows.length > 0 ? (
                    <ReportDonutChart
                      data={appRows}
                      nameKey="status"
                      valueKey="count"
                      height={270}
                      centerLabel="Applications"
                      centerValue={fmt(apps?.total)}
                    />
                  ) : (
                    <ReportEmpty message="No application status distribution recorded." />
                  )}
                </ReportSectionCard>

                <ReportSectionCard
                  title="Stage Volume Comparison"
                  subtitle="Relative concentration of cases per status"
                >
                  {appRows.length > 0 ? (
                    <ReportBarChart
                      data={appRows}
                      xKey="status"
                      yKey="count"
                      layout="horizontal"
                      height={270}
                      color="#4f46e5"
                      seriesLabel="Cases"
                    />
                  ) : (
                    <ReportEmpty message="No stage comparison data." />
                  )}
                </ReportSectionCard>
              </div>

              {/* Status Breakdown Table */}
              <ReportSectionCard
                title="Application Status Table"
                subtitle="Complete granular breakdown of application files"
                action={
                  <Link to={ROUTES.APPLICATIONS} className="crm-rlink text-xs font-semibold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 flex items-center gap-1">
                    Manage Applications <FiArrowRight className="w-3.5 h-3.5" />
                  </Link>
                }
              >
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-700 text-slate-500 uppercase tracking-wider font-semibold">
                      <tr>
                        <th className="py-2.5 px-4">Stage Name</th>
                        <th className="py-2.5 px-4 text-right">Active Files</th>
                        <th className="py-2.5 px-4 text-right">Share of Pipeline</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {appRows.map((row) => {
                        const pctShare = apps?.total ? Math.round((row.count / apps.total) * 100) : 0;
                        return (
                          <tr key={row.status} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                            <td className="py-3 px-4 font-semibold text-slate-800 dark:text-slate-200 capitalize">
                              {row.status}
                            </td>
                            <td className="py-3 px-4 text-right tabular-nums font-bold text-slate-900 dark:text-slate-100">
                              {row.count}
                            </td>
                            <td className="py-3 px-4 text-right">
                              <span className="tabular-nums font-semibold text-slate-600 dark:text-slate-400">{pctShare}%</span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </ReportSectionCard>
            </div>
          )}

          {/* ── SECTION 2: VISA CASES ── */}
          {activeTab === 'visa' && (
            <div className="space-y-4">
              {/* Executive KPI Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-2xs">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Total Visa Files</span>
                    <span className="w-7 h-7 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                      <FiGlobe className="w-3.5 h-3.5" />
                    </span>
                  </div>
                  <div className="text-2xl font-extrabold text-slate-900 dark:text-slate-50 tabular-nums">
                    {fmt(visas?.total)}
                  </div>
                  <div className="mt-2 text-xs text-slate-500">Lodged &amp; pending cases</div>
                </div>

                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-2xs">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Pending / Processing</span>
                    <span className="w-7 h-7 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                      <FiClock className="w-3.5 h-3.5" />
                    </span>
                  </div>
                  <div className="text-2xl font-extrabold text-amber-600 dark:text-amber-400 tabular-nums">
                    {fmt(visas?.pending)}
                  </div>
                  <div className="mt-2 text-xs text-amber-600 dark:text-amber-400 font-medium">Awaiting embassy decision</div>
                </div>

                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-2xs">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Visas Approved</span>
                    <span className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                      <FiCheckCircle className="w-3.5 h-3.5" />
                    </span>
                  </div>
                  <div className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 tabular-nums">
                    {fmt(visas?.approved)}
                  </div>
                  <div className="mt-2 text-xs text-emerald-600 dark:text-emerald-400 font-medium">Granted student visas</div>
                </div>

                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-2xs">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Visas Refused</span>
                    <span className="w-7 h-7 rounded-lg bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center">
                      <FiAlertTriangle className="w-3.5 h-3.5" />
                    </span>
                  </div>
                  <div className="text-2xl font-extrabold text-rose-600 dark:text-rose-400 tabular-nums">
                    {fmt(visas?.rejected)}
                  </div>
                  <div className="mt-2 text-xs text-rose-600 dark:text-rose-400 font-medium">Refused applications</div>
                </div>
              </div>

              {/* Visa Charts */}
              <div className="crm-report-grid-2">
                <ReportSectionCard
                  title="Visa Status Distribution"
                  subtitle="Breakdown of cases across embassy stages"
                >
                  {visaRows.length > 0 ? (
                    <ReportDonutChart
                      data={visaRows}
                      nameKey="status"
                      valueKey="count"
                      height={270}
                      centerLabel="Visa Cases"
                      centerValue={fmt(visas?.total)}
                    />
                  ) : (
                    <ReportEmpty message="No visa processing records recorded." />
                  )}
                </ReportSectionCard>

                <ReportSectionCard
                  title="Visa Approval Efficiency"
                  subtitle="Embassy success rate overview"
                >
                  <div className="py-6 flex flex-col items-center justify-center text-center">
                    <div className="w-20 h-20 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-3">
                      <FiCheckCircle className="w-10 h-10" />
                    </div>
                    <div className="text-3xl font-extrabold text-slate-900 dark:text-slate-100 tabular-nums">
                      {visaApproveRate}%
                    </div>
                    <p className="text-xs text-slate-500 font-medium mt-1">Visa Approval Rate</p>
                    <p className="text-xs text-slate-400 mt-2 max-w-xs">
                      Based on resolved visa files across all branches and country embassies.
                    </p>
                  </div>
                </ReportSectionCard>
              </div>

              {/* Visa Table */}
              <ReportSectionCard
                title="Visa Processing Detail Table"
                subtitle="Live status telemetry for all lodged visa applications"
                action={
                  <Link to={ROUTES.VISAS} className="crm-rlink text-xs font-semibold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 flex items-center gap-1">
                    Manage Visas <FiArrowRight className="w-3.5 h-3.5" />
                  </Link>
                }
              >
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-700 text-slate-500 uppercase tracking-wider font-semibold">
                      <tr>
                        <th className="py-2.5 px-4">Visa Stage</th>
                        <th className="py-2.5 px-4 text-right">Case Volume</th>
                        <th className="py-2.5 px-4 text-right">Share of Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {visaRows.map((row) => {
                        const pctShare = visas?.total ? Math.round((row.count / visas.total) * 100) : 0;
                        return (
                          <tr key={row.status} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                            <td className="py-3 px-4 font-semibold text-slate-800 dark:text-slate-200 capitalize">
                              {row.status}
                            </td>
                            <td className="py-3 px-4 text-right tabular-nums font-bold text-slate-900 dark:text-slate-100">
                              {row.count}
                            </td>
                            <td className="py-3 px-4 text-right">
                              <span className="tabular-nums font-semibold text-slate-600 dark:text-slate-400">{pctShare}%</span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </ReportSectionCard>
            </div>
          )}
        </div>
      )}
    </ReportPageShell>
  );
}
