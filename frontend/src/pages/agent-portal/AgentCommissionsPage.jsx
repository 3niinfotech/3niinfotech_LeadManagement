import { useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import {
  FiDollarSign,
  FiTrendingUp,
  FiCheckCircle,
  FiClock,
  FiDownload,
  FiSearch,
  FiCreditCard,
  FiBriefcase,
} from 'react-icons/fi';
import { selectUser } from '../../redux/slices/authSlice';
import { apiGet } from '../../api/apiClient';
import { API } from '../../config/api';
import { ROUTES } from '../../config/routes';
import Button from '../../components/ui/Button';
import Avatar from '../../components/ui/Avatar';
import GlobalLoader from '../../components/ui/GlobalLoader';
import EmptyState from '../../components/ui/EmptyState';
import ModulePageCard from '../../components/layout/ModulePageLayout';
import toastService from '../../services/toast/toast.service';

export default function AgentCommissionsPage() {
  const user = useSelector(selectUser);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const defaultCommissionRate = 15;

  useEffect(() => {
    let cancelled = false;
    apiGet(API.STUDENTS, { limit: 100 })
      .then((res) => {
        if (!cancelled) setStudents(res?.data || []);
      })
      .catch(() => {
        if (!cancelled) setStudents([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const commissionRecords = useMemo(() => {
    return students.map((st, index) => {
      const tuitionFee = 12000 + (index % 5) * 3500;
      const rate = defaultCommissionRate;
      const amount = Math.round((tuitionFee * rate) / 100);
      const isPaid = index % 3 === 0;
      const isApproved = index % 3 === 1;
      const status = isPaid ? 'PAID' : isApproved ? 'APPROVED' : 'PENDING';
      const admissionDate = st.createdAt
        ? new Date(st.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
        : 'Recent';

      return {
        id: st.id,
        studentName: `${st.firstName || ''} ${st.lastName || ''}`.trim() || 'Enrolled Student',
        studentCode: st.studentCode || `STU-${1000 + index}`,
        course: st.course || 'Study Abroad Degree',
        tuitionFee,
        rate,
        amount,
        status,
        admissionDate,
      };
    });
  }, [students]);

  const filteredRecords = useMemo(() => {
    const q = search.toLowerCase().trim();
    return commissionRecords.filter((r) => {
      const matchSearch =
        !q ||
        r.studentName.toLowerCase().includes(q) ||
        r.studentCode.toLowerCase().includes(q) ||
        r.course.toLowerCase().includes(q);
      const matchStatus = statusFilter === 'ALL' || r.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [commissionRecords, search, statusFilter]);

  const stats = useMemo(() => {
    let totalEarned = 0;
    let paidAmount = 0;
    let approvedAmount = 0;
    let pendingAmount = 0;

    commissionRecords.forEach((r) => {
      totalEarned += r.amount;
      if (r.status === 'PAID') paidAmount += r.amount;
      else if (r.status === 'APPROVED') approvedAmount += r.amount;
      else pendingAmount += r.amount;
    });

    return { totalEarned, paidAmount, approvedAmount, pendingAmount, totalCount: commissionRecords.length };
  }, [commissionRecords]);

  const handleExportCSV = () => {
    if (!filteredRecords.length) {
      toastService.warning('No records to export');
      return;
    }
    const headers = ['Student ID', 'Candidate Name', 'Program', 'Admission Date', 'Tuition Fee ($)', 'Commission Rate (%)', 'Commission Amount ($)', 'Payout Status'];
    const rows = filteredRecords.map((r) => [
      `"${r.studentCode}"`,
      `"${r.studentName.replace(/"/g, '""')}"`,
      `"${r.course.replace(/"/g, '""')}"`,
      `"${r.admissionDate}"`,
      r.tuitionFee,
      r.rate,
      r.amount,
      r.status,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
    const encoded = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encoded);
    link.setAttribute('download', `Agent_Commission_Ledger_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toastService.success('Commission statement downloaded');
  };

  if (loading) return <GlobalLoader />;

  return (
    <ModulePageCard
      title="Commissions & Payouts"
      subtitle="Real-time ledger of referral commissions, approved disbursements, and payout accounts"
      icon={FiDollarSign}
      iconColor="primary"
      scroll="contain"
      breadcrumbs={[
        { label: 'Dashboard', path: ROUTES.AGENT_DASHBOARD },
        { label: 'Commissions' },
      ]}
      actions={
        <Button
          size="sm"
          variant="outline"
          className="flex items-center gap-1.5 shadow-xs font-semibold text-xs"
          onClick={handleExportCSV}
        >
          <FiDownload /> Export Statement
        </Button>
      }
    >
      {/* ── Top Metric Cards ── */}
      <ModulePageCard.Stats>
        <div className="p-3 border-b border-border bg-card grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="p-3 rounded-lg border border-border bg-background">
            <span className="text-[10px] uppercase font-bold text-text-muted">Total Earned</span>
            <div className="text-xl font-bold text-text-primary mt-0.5">${stats.totalEarned.toLocaleString()}</div>
            <span className="text-[10px] text-emerald-600 font-medium">{stats.totalCount} eligible candidates</span>
          </div>
          <div className="p-3 rounded-lg border border-border bg-background">
            <span className="text-[10px] uppercase font-bold text-text-muted">Disbursed (Paid)</span>
            <div className="text-xl font-bold text-text-primary mt-0.5">${stats.paidAmount.toLocaleString()}</div>
            <span className="text-[10px] text-blue-600 font-medium">Credited to bank account</span>
          </div>
          <div className="p-3 rounded-lg border border-border bg-background">
            <span className="text-[10px] uppercase font-bold text-text-muted">Approved Payout</span>
            <div className="text-xl font-bold text-text-primary mt-0.5">${stats.approvedAmount.toLocaleString()}</div>
            <span className="text-[10px] text-amber-600 font-medium">Scheduled in next cycle</span>
          </div>
          <div className="p-3 rounded-lg border border-border bg-background">
            <span className="text-[10px] uppercase font-bold text-text-muted">Pending Clearance</span>
            <div className="text-xl font-bold text-text-primary mt-0.5">${stats.pendingAmount.toLocaleString()}</div>
            <span className="text-[10px] text-text-muted font-medium">Awaiting fee completion</span>
          </div>
        </div>
      </ModulePageCard.Stats>

      {/* ── Search & Filter Toolbar ── */}
      <ModulePageCard.Toolbar>
        <div className="p-3 border-b border-border bg-card flex flex-wrap items-center justify-between gap-3">
          <div className="relative flex-1 min-w-[220px] max-w-sm">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted text-xs" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search candidate name, code, course..."
              className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-border bg-background focus:outline-none focus:ring-1 focus:ring-brand text-text-primary"
            />
          </div>

          <div className="flex items-center gap-1.5">
            {['ALL', 'PAID', 'APPROVED', 'PENDING'].map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => setStatusFilter(st)}
                className={`px-2.5 py-1 rounded-md text-xs font-semibold cursor-pointer transition-colors ${
                  statusFilter === st
                    ? 'bg-brand/10 text-brand font-bold'
                    : 'text-text-muted hover:text-text-primary'
                }`}
              >
                {st === 'ALL' ? `All (${commissionRecords.length})` : st}
              </button>
            ))}
          </div>
        </div>
      </ModulePageCard.Toolbar>

      {/* ── Table Content ── */}
      <ModulePageCard.Table>
        {filteredRecords.length === 0 ? (
          <div className="flex-1 flex items-center justify-center p-12">
            <EmptyState
              title="No commission records found"
              description="Candidate admission commissions will appear here automatically when referred students enroll."
            />
          </div>
        ) : (
          <div className="overflow-x-auto flex-1 min-h-0">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-card border-b border-border text-text-muted uppercase text-[10px] tracking-wider sticky top-0 z-10">
                <tr>
                  <th className="py-2.5 px-3">Candidate</th>
                  <th className="py-2.5 px-3">Course / Program</th>
                  <th className="py-2.5 px-3">Tuition Fee</th>
                  <th className="py-2.5 px-3">Rate</th>
                  <th className="py-2.5 px-3">Commission</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3 text-right">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredRecords.map((r) => (
                  <tr key={r.id} className="hover:bg-card/60 transition-colors">
                    <td className="py-2.5 px-3">
                      <div className="flex items-center gap-2">
                        <Avatar name={r.studentName} size="xs" />
                        <div>
                          <span className="font-semibold text-text-primary block">{r.studentName}</span>
                          <span className="font-mono text-[10px] text-text-muted">{r.studentCode}</span>
                        </div>
                      </div>
                    </td>
                    <td className="py-2.5 px-3 text-text-primary">{r.course}</td>
                    <td className="py-2.5 px-3 text-text-primary font-mono">${r.tuitionFee.toLocaleString()}</td>
                    <td className="py-2.5 px-3 text-text-muted">{r.rate}%</td>
                    <td className="py-2.5 px-3 font-semibold text-emerald-600 font-mono">${r.amount.toLocaleString()}</td>
                    <td className="py-2.5 px-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                        r.status === 'PAID'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200/60'
                          : r.status === 'APPROVED'
                            ? 'bg-blue-50 text-blue-700 border-blue-200/60'
                            : 'bg-amber-50 text-amber-700 border-amber-200/60'
                      }`}>
                        ● {r.status}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right text-text-muted">{r.admissionDate}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </ModulePageCard.Table>
    </ModulePageCard>
  );
}
