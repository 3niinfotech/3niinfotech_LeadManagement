import { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  FiInbox,
  FiCheckCircle,
  FiPercent,
  FiUsers,
  FiXCircle,
  FiTrendingUp,
  FiLink,
  FiGlobe,
  FiUserCheck,
  FiPieChart,
  FiActivity,
  FiBarChart2,
} from 'react-icons/fi';
import ContentLoader from '../../../components/ui/ContentLoader';
import { apiGet } from '../../../api/apiClient';
import { API } from '../../../config/api';
import { ROUTES } from '../../../config/routes';
import { getEnquiryStatusLabel } from '../../../config/constants';
import CountryFlagLabel from '../../../components/ui/CountryFlagLabel';
import ReportPageShell, { ReportEmpty, ReportError } from '../components/ReportPageShell';
import { ReportSectionCard } from '../components/ReportCleanUi';
import {
  ReportBarChart,
  ReportDonutChart,
  ReportLineChart,
  ReportMultiBarChart,
} from '../components/MuiReportCharts';
import { useReportFilters } from '../hooks/useReportFilters';
import '../styles/reports.css';

const TABS = [
  { id: 'conversion', label: 'Conversion & Funnel', icon: FiTrendingUp },
  { id: 'source', label: 'Lead Sources', icon: FiLink },
  { id: 'country', label: 'Destination Countries', icon: FiGlobe },
  { id: 'counsellor', label: 'Counsellor Performance', icon: FiUserCheck },
  { id: 'lostReason', label: 'Drop & Lost Reasons', icon: FiXCircle },
];

function fmt(n) {
  if (n == null) return '0';
  const v = Number(n);
  return Number.isNaN(v) ? '0' : v.toLocaleString('en-IN');
}

export default function ReportsLeadsPage() {
  const { view } = useParams();
  const navigate = useNavigate();
  const activeTab = TABS.some((t) => t.id === view) ? view : 'conversion';

  const filters = useReportFilters('all_time');
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

  const handleTabChange = (tabId) => {
    navigate(`${ROUTES.REPORTS}/leads/${tabId}`);
  };

  const conv = data?.conversion || {};
  const funnel = useMemo(
    () => (conv.funnel || []).map((row) => ({
      ...row,
      label: getEnquiryStatusLabel(row.status) || row.status,
    })),
    [conv.funnel],
  );

  const sources = useMemo(
    () => (data?.source || []).map((s) => ({
      source: s.source || 'Direct',
      count: Number(s.count) || 0,
      converted: Number(s.converted) || 0,
      rate: Number(s.rate) || 0,
    })),
    [data?.source],
  );

  const countries = useMemo(
    () => (data?.country || []).map((c) => ({
      country: c.country || 'Unknown',
      count: Number(c.count) || 0,
      converted: Number(c.converted) || 0,
      rate: Number(c.rate) || 0,
    })),
    [data?.country],
  );

  const counsellors = useMemo(
    () => (data?.counsellor || []).map((c) => ({
      name: c.name || 'Unassigned',
      assigned: Number(c.assigned) || 0,
      converted: Number(c.converted) || 0,
      rate: Number(c.rate) || 0,
      demos: Number(c.demos) || 0,
      followups: Number(c.followups) || 0,
    })),
    [data?.counsellor],
  );

  const lostReasons = useMemo(
    () => (data?.lostReason || []).map((r) => ({
      reason: r.reason || 'Not specified',
      count: Number(r.count) || 0,
    })),
    [data?.lostReason],
  );

  const lostTotal = lostReasons.reduce((sum, r) => sum + r.count, 0);

  return (
    <ReportPageShell
      title="Leads &amp; Conversion Analytics"
      subtitle="Complete enquiry acquisition, pipeline velocity, channel ROI, and team performance"
      breadcrumbs={[{ label: 'Leads & Funnel' }]}
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
          message="No lead telemetry available."
          onResetAllTime={() => filters.setPreset('all_time')}
        />
      )}

      {!loading && !error && data && (
        <div className="crm-report-stack">
          {/* ── Executive KPI Metric Cards (Clean Enterprise) ── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-2xs">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Total Enquiries
                </span>
                <span className="w-7 h-7 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                  <FiInbox className="w-3.5 h-3.5" />
                </span>
              </div>
              <div className="text-2xl font-extrabold text-slate-900 dark:text-slate-50 tabular-nums">
                {fmt(conv.total)}
              </div>
              <div className="mt-2 text-xs text-slate-500">All captured inquiries</div>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-2xs">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Converted Leads
                </span>
                <span className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <FiCheckCircle className="w-3.5 h-3.5" />
                </span>
              </div>
              <div className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 tabular-nums">
                {fmt(conv.converted)}
              </div>
              <div className="mt-2 text-xs text-emerald-600 dark:text-emerald-400 font-medium">Successful admissions</div>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-2xs">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Conversion Rate
                </span>
                <span className="w-7 h-7 rounded-lg bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 flex items-center justify-center">
                  <FiPercent className="w-3.5 h-3.5" />
                </span>
              </div>
              <div className="text-2xl font-extrabold text-slate-900 dark:text-slate-50 tabular-nums">
                {conv.rate ?? 0}%
              </div>
              <div className="mt-2 text-xs text-slate-500">Conversion efficiency</div>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-2xs">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Active Counsellors
                </span>
                <span className="w-7 h-7 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                  <FiUsers className="w-3.5 h-3.5" />
                </span>
              </div>
              <div className="text-2xl font-extrabold text-slate-900 dark:text-slate-50 tabular-nums">
                {fmt(data?.performance?.activeCounsellors || counsellors.length)}
              </div>
              <div className="mt-2 text-xs text-slate-500">Counselling staff</div>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-2xs">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Lost / Dropped
                </span>
                <span className="w-7 h-7 rounded-lg bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center">
                  <FiXCircle className="w-3.5 h-3.5" />
                </span>
              </div>
              <div className="text-2xl font-extrabold text-rose-600 dark:text-rose-400 tabular-nums">
                {fmt(lostTotal)}
              </div>
              <div className="mt-2 text-xs text-rose-600 dark:text-rose-400 font-medium">Inquiries dropped</div>
            </div>
          </div>

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

          {/* ── TAB 1: CONVERSION & FUNNEL ── */}
          {activeTab === 'conversion' && (
            <div className="space-y-4">
              <div className="crm-report-grid-2">
                <ReportSectionCard
                  title="Pipeline Stage Progression"
                  subtitle="Volume of leads moving through each stage"
                >
                  {funnel.length > 0 ? (
                    <ReportBarChart
                      data={funnel}
                      xKey="label"
                      yKey="count"
                      height={280}
                      seriesLabel="Enquiries"
                      color="#4f46e5"
                    />
                  ) : (
                    <ReportEmpty message="No pipeline stages in this period." />
                  )}
                </ReportSectionCard>

                <ReportSectionCard
                  title="Stage Conversion Trajectory"
                  subtitle="Cumulative pipeline progression curve"
                >
                  {funnel.length > 0 ? (
                    <ReportLineChart
                      data={funnel}
                      xKey="label"
                      yKey="count"
                      height={280}
                      seriesLabel="Count"
                      color="#059669"
                    />
                  ) : (
                    <ReportEmpty message="No conversion trajectory data." />
                  )}
                </ReportSectionCard>
              </div>

              {/* Stage Table Breakdown */}
              <ReportSectionCard title="Stage Velocity &amp; Conversion Breakdown">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-700 text-slate-500 uppercase tracking-wider font-semibold">
                      <tr>
                        <th className="py-2.5 px-4">Funnel Stage</th>
                        <th className="py-2.5 px-4 text-right">Lead Count</th>
                        <th className="py-2.5 px-4 text-right">Share of Total</th>
                        <th className="py-2.5 px-4 text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {funnel.map((item) => {
                        const pctShare = conv.total ? Math.round((item.count / conv.total) * 100) : 0;
                        return (
                          <tr key={item.status} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                            <td className="py-3 px-4 font-semibold text-slate-800 dark:text-slate-200">
                              {item.label}
                            </td>
                            <td className="py-3 px-4 text-right tabular-nums font-bold text-slate-900 dark:text-slate-100">
                              {item.count}
                            </td>
                            <td className="py-3 px-4 text-right">
                              <div className="inline-flex items-center gap-2">
                                <div className="w-16 bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
                                  <div
                                    className="bg-indigo-600 h-full rounded-full"
                                    style={{ width: `${pctShare}%` }}
                                  />
                                </div>
                                <span className="tabular-nums font-medium text-slate-600 dark:text-slate-400">{pctShare}%</span>
                              </div>
                            </td>
                            <td className="py-3 px-4 text-right">
                              <span className={`inline-flex px-2 py-0.5 rounded text-[11px] font-semibold ${
                                item.status === 'CONVERTED'
                                  ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400'
                                  : 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-400'
                              }`}>
                                {item.status === 'CONVERTED' ? 'Complete' : 'In Progress'}
                              </span>
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

          {/* ── TAB 2: LEAD SOURCES ── */}
          {activeTab === 'source' && (
            <div className="space-y-4">
              <div className="crm-report-grid-2">
                <ReportSectionCard
                  title="Channel Share"
                  subtitle="Percentage of enquiries acquired by marketing channel"
                >
                  {sources.length > 0 ? (
                    <ReportDonutChart
                      data={sources}
                      nameKey="source"
                      valueKey="count"
                      height={270}
                      centerLabel="Total Leads"
                      centerValue={fmt(conv.total)}
                    />
                  ) : (
                    <ReportEmpty message="No source distribution recorded." />
                  )}
                </ReportSectionCard>

                <ReportSectionCard
                  title="Channel Conversion Performance"
                  subtitle="Enquiries acquired vs successfully converted"
                >
                  {sources.length > 0 ? (
                    <ReportMultiBarChart
                      data={sources}
                      xKey="source"
                      series={[
                        { key: 'count', label: 'Enquiries', color: '#4f46e5' },
                        { key: 'converted', label: 'Converted', color: '#059669' },
                      ]}
                      height={270}
                    />
                  ) : (
                    <ReportEmpty message="No channel comparison data." />
                  )}
                </ReportSectionCard>
              </div>

              {/* Source ROI Table */}
              <ReportSectionCard title="Marketing Channel ROI &amp; Conversion Table">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-700 text-slate-500 uppercase tracking-wider font-semibold">
                      <tr>
                        <th className="py-2.5 px-4">Channel</th>
                        <th className="py-2.5 px-4 text-right">Inquiries</th>
                        <th className="py-2.5 px-4 text-right">Converted</th>
                        <th className="py-2.5 px-4 text-right">Conversion Rate</th>
                        <th className="py-2.5 px-4 text-right">Channel Efficacy</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {sources.map((src, i) => (
                        <tr key={src.source} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                          <td className="py-3 px-4 font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                            <span
                              className="w-2.5 h-2.5 rounded-full"
                              style={{ background: `var(--crm-chart-${i % 8}, #4f46e5)` }}
                            />
                            {src.source}
                          </td>
                          <td className="py-3 px-4 text-right tabular-nums font-bold text-slate-900 dark:text-slate-100">
                            {src.count}
                          </td>
                          <td className="py-3 px-4 text-right tabular-nums font-bold text-emerald-600 dark:text-emerald-400">
                            {src.converted}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <span className={`inline-flex px-2 py-0.5 rounded text-[11px] font-semibold tabular-nums ${
                              src.rate > 0
                                ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400'
                                : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                            }`}>
                              {src.rate}%
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <span className="text-xs text-slate-500 font-medium">
                              {src.rate >= 50 ? '🌟 High Performing' : src.rate > 0 ? '✅ Active Conversion' : '⏳ In Progress'}
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

          {/* ── TAB 3: DESTINATION COUNTRIES ── */}
          {activeTab === 'country' && (
            <div className="space-y-4">
              <div className="crm-report-grid-2">
                <ReportSectionCard
                  title="Inquiries by Destination Country"
                  subtitle="Lead interest distribution across study destinations"
                >
                  {countries.length > 0 ? (
                    <ReportBarChart
                      data={countries}
                      xKey="country"
                      yKey="count"
                      layout="horizontal"
                      height={Math.max(260, countries.length * 42 + 40)}
                      color="#0284c7"
                      seriesLabel="Leads"
                    />
                  ) : (
                    <ReportEmpty message="No country interest data recorded." />
                  )}
                </ReportSectionCard>

                <ReportSectionCard
                  title="Destination Country Share"
                  subtitle="Proportion of students aiming for each nation"
                >
                  {countries.length > 0 ? (
                    <ReportDonutChart
                      data={countries}
                      nameKey="country"
                      valueKey="count"
                      height={260}
                      centerLabel="Total Leads"
                      centerValue={fmt(conv.total)}
                    />
                  ) : (
                    <ReportEmpty message="No destination countries data." />
                  )}
                </ReportSectionCard>
              </div>

              {/* Country Table */}
              <ReportSectionCard title="Country Inflow &amp; Success Metric Table">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-700 text-slate-500 uppercase tracking-wider font-semibold">
                      <tr>
                        <th className="py-2.5 px-4">Country</th>
                        <th className="py-2.5 px-4 text-right">Enquiries</th>
                        <th className="py-2.5 px-4 text-right">Converted</th>
                        <th className="py-2.5 px-4 text-right">Conversion Rate</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {countries.map((c) => (
                        <tr key={c.country} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                          <td className="py-3 px-4 font-semibold text-slate-800 dark:text-slate-200">
                            <CountryFlagLabel country={c.country} size="sm" />
                          </td>
                          <td className="py-3 px-4 text-right tabular-nums font-bold text-slate-900 dark:text-slate-100">
                            {c.count}
                          </td>
                          <td className="py-3 px-4 text-right tabular-nums font-bold text-emerald-600 dark:text-emerald-400">
                            {c.converted}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <span className={`inline-flex px-2 py-0.5 rounded text-[11px] font-semibold tabular-nums ${
                              c.rate > 0
                                ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400'
                                : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                            }`}>
                              {c.rate}%
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

          {/* ── TAB 4: COUNSELLOR PERFORMANCE ── */}
          {activeTab === 'counsellor' && (
            <div className="space-y-4">
              <div className="crm-report-grid-2">
                <ReportSectionCard
                  title="Counsellor Lead Load"
                  subtitle="Assigned enquiries vs conversions per counsellor"
                >
                  {counsellors.length > 0 ? (
                    <ReportMultiBarChart
                      data={counsellors}
                      xKey="name"
                      series={[
                        { key: 'assigned', label: 'Assigned', color: '#4f46e5' },
                        { key: 'converted', label: 'Converted', color: '#059669' },
                      ]}
                      height={270}
                    />
                  ) : (
                    <ReportEmpty message="No counsellor data recorded." />
                  )}
                </ReportSectionCard>

                <ReportSectionCard
                  title="Team Efficiency Overview"
                  subtitle="Average conversion rates &amp; top performers"
                >
                  <div className="space-y-3 pt-2">
                    <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex items-center justify-between">
                      <div>
                        <span className="text-xs text-slate-500 font-medium">Top Performer</span>
                        <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 mt-0.5">
                          {data?.performance?.topCounsellor?.name || counsellors[0]?.name || '—'}
                        </h4>
                      </div>
                      <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300">
                        {data?.performance?.topCounsellor?.rate ?? counsellors[0]?.rate ?? 0}% Rate
                      </span>
                    </div>

                    <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex items-center justify-between">
                      <div>
                        <span className="text-xs text-slate-500 font-medium">Avg Team Conversion Rate</span>
                        <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 mt-0.5">
                          {data?.performance?.avgConversionRate ?? 0}%
                        </h4>
                      </div>
                      <span className="text-xs text-slate-500 font-medium">
                        {counsellors.length} Counsellors active
                      </span>
                    </div>
                  </div>
                </ReportSectionCard>
              </div>

              {/* Counsellor Leaderboard Table */}
              <ReportSectionCard title="Counsellor Performance Leaderboard">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-700 text-slate-500 uppercase tracking-wider font-semibold">
                      <tr>
                        <th className="py-2.5 px-4">Counsellor</th>
                        <th className="py-2.5 px-4 text-right">Leads Assigned</th>
                        <th className="py-2.5 px-4 text-right">Demos Taken</th>
                        <th className="py-2.5 px-4 text-right">Converted</th>
                        <th className="py-2.5 px-4 text-right">Conversion Rate</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {counsellors.map((c) => (
                        <tr key={c.name} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                          <td className="py-3 px-4 font-semibold text-slate-800 dark:text-slate-200">
                            {c.name}
                          </td>
                          <td className="py-3 px-4 text-right tabular-nums font-bold text-slate-900 dark:text-slate-100">
                            {c.assigned}
                          </td>
                          <td className="py-3 px-4 text-right tabular-nums text-slate-600 dark:text-slate-400">
                            {c.demos}
                          </td>
                          <td className="py-3 px-4 text-right tabular-nums font-bold text-emerald-600 dark:text-emerald-400">
                            {c.converted}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <span className={`inline-flex px-2 py-0.5 rounded text-[11px] font-semibold tabular-nums ${
                              c.rate >= 30
                                ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400'
                                : c.rate > 0
                                  ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400'
                                  : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                            }`}>
                              {c.rate}%
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

          {/* ── TAB 5: DROP & LOST REASONS ── */}
          {activeTab === 'lostReason' && (
            <div className="space-y-4">
              <div className="crm-report-grid-2">
                <ReportSectionCard
                  title="Lost Reason Breakdown"
                  subtitle="Categorized drop-off reasons"
                >
                  {lostReasons.length > 0 ? (
                    <ReportDonutChart
                      data={lostReasons}
                      nameKey="reason"
                      valueKey="count"
                      height={270}
                      centerLabel="Lost Leads"
                      centerValue={fmt(lostTotal)}
                    />
                  ) : (
                    <div className="py-12 text-center">
                      <FiCheckCircle className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
                      <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">Zero Lost Leads</h4>
                      <p className="text-xs text-slate-500 mt-1">No lost or dropped enquiries recorded in this timeframe.</p>
                    </div>
                  )}
                </ReportSectionCard>

                <ReportSectionCard
                  title="Drop-off Analysis &amp; Retention Insights"
                  subtitle="Key areas to improve pipeline conversion"
                >
                  <div className="space-y-3 pt-2">
                    <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">Pipeline Retention Rate</h4>
                      <div className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 tabular-nums mt-1">
                        {conv.total ? Math.round(((conv.total - lostTotal) / conv.total) * 100) : 100}%
                      </div>
                      <p className="text-xs text-slate-500 mt-1">Leads active or successfully converted</p>
                    </div>

                    <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">Lead Health Recommendation</h4>
                      <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                        Ensure routine follow-ups are completed on time to prevent cold drop-offs.
                      </p>
                    </div>
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
