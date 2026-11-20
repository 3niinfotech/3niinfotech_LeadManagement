import React, { useState, useEffect, useMemo } from 'react';
import {
  FiCheck,
  FiX,
  FiExternalLink,
  FiClock,
  FiFileText,
  FiCheckSquare,
  FiDollarSign,
  FiRefreshCw,
  FiSearch,
} from 'react-icons/fi';
import Button from '../../../components/ui/Button';
import Avatar from '../../../components/ui/Avatar';
import GlobalLoader from '../../../components/ui/GlobalLoader';
import EmptyState from '../../../components/ui/EmptyState';
import SummaryStatBar from '../../../components/ui/SummaryStatBar';
import SearchInput from '../../../components/ui/SearchInput';
import { apiGet, apiPost } from '../../../api/apiClient';
import toastService from '../../../services/toast/toast.service';
import alertService from '../../../services/alert/alert.service';
import { formatMoney } from '../config/feesConstants';

export default function PaymentProofsTab({ onPaymentProcessed }) {
  const [proofs, setProofs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [reviewingId, setReviewingId] = useState(null);

  const loadProofs = async () => {
    try {
      setLoading(true);
      const res = await apiGet('/payment-proofs', {
        status: statusFilter !== 'ALL' ? statusFilter : undefined,
      });
      setProofs(res?.data || []);
    } catch (err) {
      toastService.error('Failed to load payment proofs');
      setProofs([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProofs();
  }, [statusFilter]);

  const handleApprove = async (proof) => {
    const ok = await alertService.confirm({
      title: 'Approve Payment Proof',
      text: `Confirm receipt of ${formatMoney(proof.amount, proof.invoice?.currency)} for student ${proof.student?.firstName} ${proof.student?.lastName}? This will record the payment and post a credit to the ledger.`,
      confirmButtonText: 'Yes, Approve & Record',
    });
    if (!ok) return;

    try {
      setReviewingId(proof.id);
      const res = await apiPost(`/payment-proofs/${proof.id}/review`, {
        status: 'APPROVED',
        reviewNotes: 'Verified bank transfer proof',
      });
      toastService.success('Payment proof approved and receipt generated');
      onPaymentProcessed?.(res?.data?.receipt);
      loadProofs();
    } catch (err) {
      toastService.error(err?.response?.data?.message || err?.message || 'Approval failed');
    } finally {
      setReviewingId(null);
    }
  };

  const handleReject = async (proof) => {
    const reason = prompt('Please enter the reason for rejecting this payment proof:');
    if (!reason || !reason.trim()) return;

    try {
      setReviewingId(proof.id);
      await apiPost(`/payment-proofs/${proof.id}/review`, {
        status: 'REJECTED',
        reviewNotes: reason.trim(),
      });
      toastService.info('Payment proof marked as rejected');
      loadProofs();
    } catch (err) {
      toastService.error(err?.response?.data?.message || err?.message || 'Rejection failed');
    } finally {
      setReviewingId(null);
    }
  };

  // Filter proofs by search query client-side
  const filteredProofs = useMemo(() => {
    if (!searchQuery.trim()) return proofs;
    const q = searchQuery.toLowerCase().trim();
    return proofs.filter((p) => {
      const sName = `${p.student?.firstName || ''} ${p.student?.lastName || ''}`.toLowerCase();
      const sCode = (p.student?.studentCode || '').toLowerCase();
      const invNo = (p.invoice?.invoiceNo || '').toLowerCase();
      const txnRef = (p.transactionRef || '').toLowerCase();
      const mode = (p.paymentMode || '').toLowerCase();
      return (
        sName.includes(q) ||
        sCode.includes(q) ||
        invNo.includes(q) ||
        txnRef.includes(q) ||
        mode.includes(q)
      );
    });
  }, [proofs, searchQuery]);

  // Summary Metrics calculations
  const totalCount = proofs.length;
  const pendingCount = proofs.filter((p) => p.status === 'PENDING').length;
  const approvedCount = proofs.filter((p) => p.status === 'APPROVED').length;
  const rejectedCount = proofs.filter((p) => p.status === 'REJECTED').length;
  const approvedAmount = proofs
    .filter((p) => p.status === 'APPROVED')
    .reduce((sum, p) => sum + Number(p.amount || 0), 0);

  const statItems = useMemo(
    () => [
      {
        id: 'ALL',
        label: 'Total Uploaded',
        value: totalCount,
        icon: FiFileText,
        tone: 'neutral',
      },
      {
        id: 'PENDING',
        label: 'Pending Review',
        value: pendingCount,
        icon: FiClock,
        tone: 'warning',
      },
      {
        id: 'APPROVED',
        label: 'Approved & Settled',
        value: approvedCount,
        icon: FiCheck,
        tone: 'success',
      },
      {
        id: 'REJECTED',
        label: 'Rejected',
        value: rejectedCount,
        icon: FiX,
        tone: 'danger',
      },
      {
        id: 'APPROVED_AMOUNT',
        label: 'Verified Inflow',
        value: formatMoney(approvedAmount),
        icon: FiDollarSign,
        tone: 'primary',
        share: false,
        subtext: 'Credited to Ledger',
      },
    ],
    [totalCount, pendingCount, approvedCount, rejectedCount, approvedAmount]
  );

  return (
    <div className="space-y-4">
      {/* ── KPI Stat Summary Bar ── */}
      <SummaryStatBar
        items={statItems}
        activeFilter={statusFilter}
        onSelect={(id) => {
          if (id === 'APPROVED_AMOUNT') {
            setStatusFilter('APPROVED');
          } else {
            setStatusFilter(id);
          }
        }}
        loading={loading && proofs.length === 0}
        ariaLabel="Payment proof status filters"
      />

      {/* ── Search & Filter Toolbar ── */}
      <div className="p-3 bg-card rounded-xl border border-border shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="flex-1 max-w-md">
          <SearchInput
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by student, invoice no, or UTR..."
            size="sm"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap justify-between md:justify-end">
          <div className="flex items-center gap-1 bg-slate-100/80 dark:bg-slate-900/60 p-1 rounded-lg border border-border">
            {[
              { id: 'ALL', label: 'All', count: totalCount },
              { id: 'PENDING', label: 'Pending', count: pendingCount },
              { id: 'APPROVED', label: 'Approved', count: approvedCount },
              { id: 'REJECTED', label: 'Rejected', count: rejectedCount },
            ].map(({ id, label, count }) => (
              <button
                key={id}
                type="button"
                onClick={() => setStatusFilter(id)}
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-semibold cursor-pointer transition-all ${
                  statusFilter === id
                    ? 'bg-white dark:bg-slate-800 text-primary-600 dark:text-primary-300 shadow-xs font-bold'
                    : 'text-text-muted hover:text-text'
                }`}
              >
                <span>{label}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                    statusFilter === id
                      ? 'bg-primary-50 dark:bg-primary-950/60 text-primary-700 dark:text-primary-300'
                      : 'bg-slate-200 dark:bg-slate-800 text-text-muted'
                  }`}
                >
                  {count}
                </span>
              </button>
            ))}
          </div>

          <Button
            size="sm"
            variant="outline"
            icon={FiRefreshCw}
            onClick={loadProofs}
            loading={loading}
            className="shrink-0"
          >
            Refresh
          </Button>
        </div>
      </div>

      {/* ── Enterprise Data Table / Card ── */}
      <div className="bg-card rounded-xl border border-border overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50/90 dark:bg-slate-900/70 text-text-muted uppercase text-[10px] font-bold tracking-wider border-b border-border">
                <th className="py-3 px-4">Student</th>
                <th className="py-3 px-3">Invoice Ref</th>
                <th className="py-3 px-3">Amount</th>
                <th className="py-3 px-3">Payment Mode &amp; UTR</th>
                <th className="py-3 px-3">Proof Document</th>
                <th className="py-3 px-3">Submitted At</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredProofs.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-16 px-4 text-center">
                    <EmptyState
                      icon={FiCheckSquare}
                      title={
                        searchQuery
                          ? 'No matching payment proofs found'
                          : statusFilter !== 'ALL'
                          ? `No ${statusFilter.toLowerCase()} payment proofs`
                          : 'No payment proofs in this queue'
                      }
                      description={
                        searchQuery
                          ? 'Try refining your search terms or clearing filters.'
                          : 'Offline payment slips uploaded by students or staff will appear here for verification.'
                      }
                      actionLabel={searchQuery ? 'Clear Search' : undefined}
                      onAction={searchQuery ? () => setSearchQuery('') : undefined}
                    />
                  </td>
                </tr>
              ) : (
                filteredProofs.map((p) => {
                  const sName =
                    [p.student?.firstName, p.student?.lastName].filter(Boolean).join(' ') ||
                    'Student';
                  return (
                    <tr
                      key={p.id}
                      className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          <Avatar name={sName} size="xs" />
                          <div>
                            <span className="font-bold text-text block leading-tight">
                              {sName}
                            </span>
                            <span className="font-mono text-[10px] text-text-muted">
                              {p.student?.studentCode || 'N/A'}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-3 font-mono font-medium text-text">
                        {p.invoice?.invoiceNo ? (
                          <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-[11px] font-semibold text-text">
                            {p.invoice.invoiceNo}
                          </span>
                        ) : (
                          <span className="text-text-muted text-[11px] italic">Direct Payment</span>
                        )}
                      </td>
                      <td className="py-3 px-3 font-bold text-text tabular-nums text-sm">
                        {formatMoney(p.amount, p.invoice?.currency)}
                      </td>
                      <td className="py-3 px-3">
                        <span className="font-semibold text-text block">{p.paymentMode}</span>
                        <span className="font-mono text-[11px] text-text-muted block">
                          {p.transactionRef}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <a
                          href={p.proofDocumentUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 font-semibold text-primary-600 dark:text-primary-400 hover:underline bg-primary-50/70 dark:bg-primary-950/40 px-2.5 py-1 rounded-md text-[11px]"
                        >
                          <FiFileText /> View Slip <FiExternalLink className="w-3 h-3" />
                        </a>
                      </td>
                      <td className="py-3 px-3 text-text-muted">
                        <span className="block font-medium text-text">
                          {new Date(p.createdAt).toLocaleDateString('en-IN', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </span>
                        <span className="block text-[10px] text-text-muted">
                          {new Date(p.createdAt).toLocaleTimeString('en-IN', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                            p.status === 'APPROVED'
                              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/60'
                              : p.status === 'REJECTED'
                              ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300 border-rose-200 dark:border-rose-800/60'
                              : 'bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300 border-amber-200 dark:border-amber-800/60'
                          }`}
                        >
                          {p.status === 'PENDING' && <FiClock className="w-3 h-3" />}
                          {p.status === 'APPROVED' && <FiCheck className="w-3 h-3" />}
                          {p.status === 'REJECTED' && <FiX className="w-3 h-3" />}
                          {p.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        {p.status === 'PENDING' ? (
                          <div className="flex items-center justify-end gap-1.5">
                            <Button
                              size="xs"
                              variant="outline"
                              className="text-rose-600 border-rose-200 dark:border-rose-800 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                              onClick={() => handleReject(p)}
                              disabled={reviewingId === p.id}
                            >
                              <FiX /> Reject
                            </Button>
                            <Button
                              size="xs"
                              variant="primary"
                              onClick={() => handleApprove(p)}
                              loading={reviewingId === p.id}
                            >
                              <FiCheck /> Approve
                            </Button>
                          </div>
                        ) : (
                          <span className="text-text-muted text-[11px] font-mono">
                            Reviewed by {p.reviewedBy?.firstName || 'Staff'}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
