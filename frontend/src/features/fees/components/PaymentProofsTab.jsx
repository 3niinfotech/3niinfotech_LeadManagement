import React, { useState, useEffect } from 'react';
import { FiCheck, FiX, FiExternalLink, FiClock, FiFileText } from 'react-icons/fi';
import Button from '../../../components/ui/Button';
import Avatar from '../../../components/ui/Avatar';
import GlobalLoader from '../../../components/ui/GlobalLoader';
import EmptyState from '../../../components/ui/EmptyState';
import { apiGet, apiPost } from '../../../api/apiClient';
import toastService from '../../../services/toast/toast.service';
import alertService from '../../../services/alert/alert.service';
import { formatMoney } from '../config/feesConstants';

export default function PaymentProofsTab({ onPaymentProcessed }) {
  const [proofs, setProofs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');
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

  if (loading && proofs.length === 0) return <GlobalLoader />;

  return (
    <div className="space-y-4">
      {/* Header & Status Filter Bar */}
      <div className="p-3 bg-card rounded-xl border border-border flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h3 className="font-bold text-text text-sm">Offline Payment Proofs Queue</h3>
          <p className="text-text-muted text-xs">Verify student bank deposits, IMPS/NEFT slips, and UPI confirmations</p>
        </div>

        <div className="flex items-center gap-1.5">
          {['ALL', 'PENDING', 'APPROVED', 'REJECTED'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-2.5 py-1 rounded-md text-xs font-semibold cursor-pointer transition-colors ${
                statusFilter === st
                  ? 'bg-primary-50 text-primary-700 dark:bg-primary-950/40 dark:text-primary-300 font-bold'
                  : 'text-text-muted hover:text-text'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {proofs.length === 0 ? (
        <div className="bg-card rounded-xl border border-border p-8 text-center max-w-md mx-auto">
          <EmptyState
            title="No payment proofs in this queue"
            description="Offline payment slips uploaded by candidates or front-desk staff will appear here for verification."
          />
        </div>
      ) : (
        <div className="bg-card rounded-xl border border-border overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50/75 dark:bg-slate-900/60 text-text-muted uppercase text-[10px] font-bold tracking-wider border-b border-border">
                  <th className="py-2.5 px-3">Student</th>
                  <th className="py-2.5 px-3">Invoice</th>
                  <th className="py-2.5 px-3">Amount</th>
                  <th className="py-2.5 px-3">Mode & UTR / Ref</th>
                  <th className="py-2.5 px-3">Proof Document</th>
                  <th className="py-2.5 px-3">Submitted At</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {proofs.map((p) => {
                  const sName = [p.student?.firstName, p.student?.lastName].filter(Boolean).join(' ') || 'Student';
                  return (
                    <tr key={p.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="py-2.5 px-3">
                        <div className="flex items-center gap-2">
                          <Avatar name={sName} size="xs" />
                          <div>
                            <span className="font-bold text-text block">{sName}</span>
                            <span className="font-mono text-[10px] text-text-muted">{p.student?.studentCode || 'N/A'}</span>
                          </div>
                        </div>
                      </td>
                      <td className="py-2.5 px-3 font-mono font-medium text-text">
                        {p.invoice?.invoiceNo || 'Direct Payment'}
                      </td>
                      <td className="py-2.5 px-3 font-bold text-text tabular-nums">
                        {formatMoney(p.amount, p.invoice?.currency)}
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="font-semibold block">{p.paymentMode}</span>
                        <span className="font-mono text-[10px] text-text-muted block">{p.transactionRef}</span>
                      </td>
                      <td className="py-2.5 px-3">
                        <a
                          href={p.proofDocumentUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 font-semibold text-primary-600 hover:underline"
                        >
                          <FiFileText /> View Document <FiExternalLink className="w-3 h-3" />
                        </a>
                      </td>
                      <td className="py-2.5 px-3 text-text-muted">
                        {new Date(p.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                      </td>
                      <td className="py-2.5 px-3">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                          p.status === 'APPROVED'
                            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-200'
                            : p.status === 'REJECTED'
                            ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border-rose-200'
                            : 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border-amber-200'
                        }`}>
                          {p.status}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        {p.status === 'PENDING' ? (
                          <div className="flex items-center justify-end gap-1.5">
                            <Button
                              size="xs"
                              variant="outline"
                              className="text-rose-600 border-rose-200 hover:bg-rose-50"
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
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

