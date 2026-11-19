import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FiBarChart2,
  FiDownload,
  FiSearch,
  FiRefreshCw,
} from 'react-icons/fi';
import { apiGet } from '../../api/apiClient';
import { API } from '../../config/api';
import { ROUTES } from '../../config/routes';
import Button from '../../components/ui/Button';
import Avatar from '../../components/ui/Avatar';
import GlobalLoader from '../../components/ui/GlobalLoader';
import EmptyState from '../../components/ui/EmptyState';
import ModulePageCard from '../../components/layout/ModulePageLayout';
import toastService from '../../services/toast/toast.service';

export default function AgentReportsPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [enquiries, setEnquiries] = useState([]);
  const [students, setStudents] = useState([]);
  const [visas, setVisas] = useState([]);

  const [search, setSearch] = useState('');
  const [countryFilter, setCountryFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const loadReportData = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    else setLoading(true);

    try {
      const [enqRes, stuRes, visaRes] = await Promise.all([
        apiGet(API.ENQUIRIES, { limit: 200 }).catch(() => ({ data: [] })),
        apiGet(API.STUDENTS, { limit: 200 }).catch(() => ({ data: [] })),
        apiGet(API.VISAS, { limit: 200 }).catch(() => ({ data: [] })),
      ]);

      setEnquiries(enqRes?.data || []);
      setStudents(stuRes?.data || []);
      setVisas(visaRes?.data || []);
    } catch {
      toastService.error('Failed to load performance report data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadReportData();
  }, []);

  const filteredReferrals = useMemo(() => {
    return enquiries.filter((item) => {
      const q = search.trim().toLowerCase();
      const matchSearch =
        !q ||
        (item.firstName && item.firstName.toLowerCase().includes(q)) ||
        (item.lastName && item.lastName.toLowerCase().includes(q)) ||
        (item.email && item.email.toLowerCase().includes(q)) ||
        (item.mobile && item.mobile.includes(q)) ||
        (item.enquiryCode && item.enquiryCode.toLowerCase().includes(q));

      const matchCountry = countryFilter === 'ALL' || item.interestedCountry === countryFilter;
      const matchStatus = statusFilter === 'ALL' || (item.status || '').toUpperCase() === statusFilter;

      return matchSearch && matchCountry && matchStatus;
    });
  }, [enquiries, search, countryFilter, statusFilter]);

  const countries = useMemo(() => {
    const set = new Set();
    enquiries.forEach((e) => {
      if (e.interestedCountry) set.add(e.interestedCountry);
    });
    return ['ALL', ...Array.from(set)];
  }, [enquiries]);

  const statuses = useMemo(() => {
    const set = new Set();
    enquiries.forEach((e) => {
      if (e.status) set.add(e.status.toUpperCase());
    });
    return ['ALL', ...Array.from(set)];
  }, [enquiries]);

  const totalReferrals = enquiries.length;
  const enrolledCount = students.length;
  const approvedVisas = visas.filter((v) =>
    (v.status || '').toUpperCase().includes('APPROV') || (v.status || '').toUpperCase().includes('GRANT')
  ).length;
  const conversionRate = totalReferrals > 0 ? Math.round((enrolledCount / totalReferrals) * 100) : 0;

  const handleExportCSV = () => {
    if (!filteredReferrals.length) {
      toastService.warning('No records to export');
      return;
    }
    const headers = ['Enquiry Code', 'Candidate Name', 'Country', 'Course', 'Status', 'Date'];
    const rows = filteredReferrals.map((item) => [
      `"${item.enquiryCode || 'ENQ'}"`,
      `"${[item.firstName, item.lastName].filter(Boolean).join(' ').replace(/"/g, '""')}"`,
      `"${(item.interestedCountry || 'N/A').replace(/"/g, '""')}"`,
      `"${(item.interestedCourse || 'N/A').replace(/"/g, '""')}"`,
      `"${item.status || 'Active'}"`,
      `"${item.createdAt ? new Date(item.createdAt).toLocaleDateString('en-IN') : ''}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encoded = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encoded);
    link.setAttribute('download', `Referral_Performance_Report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toastService.success('Report downloaded');
  };

  if (loading) return <GlobalLoader />;

  return (
    <ModulePageCard
      title="Referrals & Performance Report"
      subtitle="Audit conversion ratios, candidate application pipelines, and destination country breakdown"
      icon={FiBarChart2}
      iconColor="primary"
      scroll="contain"
      breadcrumbs={[
        { label: 'Dashboard', path: ROUTES.AGENT_DASHBOARD },
        { label: 'Reports' },
      ]}
      actions={
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            className="flex items-center gap-1.5 shadow-xs font-semibold text-xs"
            onClick={() => loadReportData(true)}
            disabled={refreshing}
          >
            <FiRefreshCw className={refreshing ? 'animate-spin' : ''} /> Refresh
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="flex items-center gap-1.5 shadow-xs font-semibold text-xs"
            onClick={handleExportCSV}
          >
            <FiDownload /> Export CSV
          </Button>
        </div>
      }
    >
      {/* ── Top Performance KPI Cards ── */}
      <ModulePageCard.Stats>
        <div className="p-3 border-b border-border bg-card grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="p-3 rounded-lg border border-border bg-background">
            <span className="text-[10px] uppercase font-bold text-text-muted">Total Lodged</span>
            <div className="text-xl font-bold text-text-primary mt-0.5">{totalReferrals}</div>
            <span className="text-[10px] text-text-muted font-medium">Candidate referrals</span>
          </div>
          <div className="p-3 rounded-lg border border-border bg-background">
            <span className="text-[10px] uppercase font-bold text-text-muted">Conversion Ratio</span>
            <div className="text-xl font-bold text-emerald-600 mt-0.5">{conversionRate}%</div>
            <span className="text-[10px] text-text-muted font-medium">{enrolledCount} enrolled students</span>
          </div>
          <div className="p-3 rounded-lg border border-border bg-background">
            <span className="text-[10px] uppercase font-bold text-text-muted">Visa Approvals</span>
            <div className="text-xl font-bold text-blue-600 mt-0.5">{approvedVisas}</div>
            <span className="text-[10px] text-text-muted font-medium">Out of {visas.length} applications</span>
          </div>
          <div className="p-3 rounded-lg border border-border bg-background">
            <span className="text-[10px] uppercase font-bold text-text-muted">Top Destination</span>
            <div className="text-xl font-bold text-text-primary mt-0.5">Canada</div>
            <span className="text-[10px] text-text-muted font-medium">Majority applicant volume</span>
          </div>
        </div>
      </ModulePageCard.Stats>

      {/* ── Search & Filter Controls ── */}
      <ModulePageCard.Toolbar>
        <div className="p-3 border-b border-border bg-card flex flex-wrap items-center justify-between gap-3">
          <div className="relative flex-1 min-w-[220px] max-w-sm">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted text-xs" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search candidate, email, mobile..."
              className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-border bg-background focus:outline-none focus:ring-1 focus:ring-brand text-text-primary"
            />
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <select
              value={countryFilter}
              onChange={(e) => setCountryFilter(e.target.value)}
              className="px-2.5 py-1 text-xs rounded-lg border border-border bg-background text-text-primary focus:outline-none"
            >
              {countries.map((c) => (
                <option key={c} value={c}>
                  {c === 'ALL' ? 'All Countries' : c}
                </option>
              ))}
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-2.5 py-1 text-xs rounded-lg border border-border bg-background text-text-primary focus:outline-none"
            >
              {statuses.map((s) => (
                <option key={s} value={s}>
                  {s === 'ALL' ? 'All Statuses' : s}
                </option>
              ))}
            </select>
          </div>
        </div>
      </ModulePageCard.Toolbar>

      {/* ── Table Content ── */}
      <ModulePageCard.Table>
        {filteredReferrals.length === 0 ? (
          <div className="flex-1 flex items-center justify-center p-12">
            <EmptyState
              title="No matching referral records found"
              description="Adjust your search filters to view candidate logs and conversion metrics."
            />
          </div>
        ) : (
          <div className="overflow-x-auto flex-1 min-h-0">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-card border-b border-border text-text-muted uppercase text-[10px] tracking-wider sticky top-0 z-10">
                <tr>
                  <th className="py-2.5 px-3">Candidate</th>
                  <th className="py-2.5 px-3">Contact</th>
                  <th className="py-2.5 px-3">Destination & Course</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3 text-right">Lodged Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredReferrals.map((r) => {
                  const cName = [r.firstName, r.lastName].filter(Boolean).join(' ') || 'Candidate';
                  return (
                    <tr key={r.id} className="hover:bg-card/60 transition-colors">
                      <td className="py-2.5 px-3">
                        <div className="flex items-center gap-2">
                          <Avatar name={cName} size="xs" />
                          <div>
                            <span className="font-semibold text-text-primary block">{cName}</span>
                            <span className="font-mono text-[10px] text-text-muted">{r.enquiryCode || 'ENQ'}</span>
                          </div>
                        </div>
                      </td>
                      <td className="py-2.5 px-3 text-text-muted text-[11px]">
                        <div>{r.email || 'N/A'}</div>
                        <div>{r.mobile || ''}</div>
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="text-text-primary font-medium">{r.interestedCountry || 'Not Specified'}</span>
                        <span className="block text-[11px] text-text-muted">{r.interestedCourse || 'Program of Interest'}</span>
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 border border-blue-200/50">
                          ● {r.status || 'Active'}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right text-text-muted">
                        {r.createdAt ? new Date(r.createdAt).toLocaleDateString('en-IN') : 'Recent'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </ModulePageCard.Table>
    </ModulePageCard>
  );
}
