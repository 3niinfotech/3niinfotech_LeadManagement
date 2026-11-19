import React, { useState, useEffect } from 'react';
import { FiPlus, FiCheck, FiX, FiDollarSign } from 'react-icons/fi';
import Button from '../../../components/ui/Button';
import Modal from '../../../components/ui/Modal';
import Input from '../../../components/ui/Input';
import Avatar from '../../../components/ui/Avatar';
import GlobalLoader from '../../../components/ui/GlobalLoader';
import EmptyState from '../../../components/ui/EmptyState';
import { apiGet, apiPost } from '../../../api/apiClient';
import toastService from '../../../services/toast/toast.service';
import alertService from '../../../services/alert/alert.service';
import { formatMoney } from '../config/feesConstants';

export default function RefundsTab() {
  const [refunds, setRefunds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [createOpen, setCreateOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form states
  const [students, setStudents] = useState([]);
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [studentInvoices, setStudentInvoices] = useState([]);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState('');
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');
  const [refundMethod, setRefundMethod] = useState('BANK_TRANSFER');

  const loadRefunds = async () => {
    try {
      setLoading(true);
      const res = await apiGet('/refunds', {
        status: statusFilter !== 'ALL' ? statusFilter : undefined,
      });
      setRefunds(res?.data || []);
    } catch {
      setRefunds([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRefunds();
  }, [statusFilter]);

  // Load students for modal
  useEffect(() => {
    if (createOpen) {
      apiGet('/students', { limit: 100 })
        .then((res) => setStudents(res?.data || []))
        .catch(() => setStudents([]));
    }
  }, [createOpen]);

  // When student selected, load invoices
  useEffect(() => {
    if (selectedStudentId) {
      apiGet('/invoices', { studentId: selectedStudentId, limit: 50 })
        .then((res) => {
          const invs = res?.data || [];
          setStudentInvoices(invs);
          if (invs.length > 0) setSelectedInvoiceId(invs[0].id);
        })
        .catch(() => setStudentInvoices([]));
    } else {
      setStudentInvoices([]);
      setSelectedInvoiceId('');
    }
  }, [selectedStudentId]);

  const handleRequestRefund = async (e) => {
    e.preventDefault();
    if (!selectedStudentId) {
      toastService.warning('Please select a student');
      return;
    }
    const numAmount = Number(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      toastService.warning('Enter a valid refund amount');
      return;
    }
    if (!reason.trim()) {
      toastService.warning('Please provide a reason for the refund');
      return;
    }

    try {
      setSubmitting(true);
      await apiPost('/refunds', {
        studentId: selectedStudentId,
        invoiceId: selectedInvoiceId || undefined,
        amount: numAmount,
        reason: reason.trim(),
        refundMethod,
      });
      toastService.success('Refund requested successfully');
      setCreateOpen(false);
      setSelectedStudentId('');
      setAmount('');
      setReason('');
      loadRefunds();
    } catch (err) {
      toastService.error(err?.response?.data?.message || err?.message || 'Failed to submit refund');
    } finally {
      setSubmitting(false);
    }
  };

  const handleApprove = async (refund) => {
    const ok = await alertService.confirm({
      title: 'Approve Refund Request',
      text: `Approve refund of ${formatMoney(refund.amount, refund.invoice?.currency)} for ${refund.student?.firstName} ${refund.student?.lastName}?`,
      confirmButtonText: 'Yes, Approve',
    });
    if (!ok) return;

    try {
      await apiPost(`/refunds/${refund.id}/approve`, {});
      toastService.success('Refund approved. Ready for disbursement.');
      loadRefunds();
    } catch (err) {
      toastService.error(err?.response?.data?.message || err?.message || 'Approval failed');
    }
  };

  const handleDisburse = async (refund) => {
    const txRef = prompt('Enter Bank Transaction / Cheque / UTR Reference for this disbursement:');
    if (!txRef || !txRef.trim()) return;

    try {
      await apiPost(`/refunds/${refund.id}/disburse`, {
        refundTxRef: txRef.trim(),
        refundMethod: refund.refundMethod || 'BANK_TRANSFER',
      });
      toastService.success('Refund disbursed and posted as debit to the ledger');
      loadRefunds();
    } catch (err) {
      toastService.error(err?.response?.data?.message || err?.message || 'Disbursement failed');
    }
  };

  if (loading && refunds.length === 0) return <GlobalLoader />;

  return (
    <div className="space-y-4">
      {/* Top Bar */}
      <div className="p-3 bg-card rounded-xl border border-border flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h3 className="font-bold text-text text-sm">Refund Management</h3>
          <p className="text-text-muted text-xs">Authorize, review, and disburse student fee refunds</p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1">
            {['ALL', 'PENDING', 'APPROVED', 'PAID', 'REJECTED'].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-2 py-1 rounded-md text-xs font-semibold cursor-pointer transition-colors ${
                  statusFilter === st
                    ? 'bg-primary-50 text-primary-700 dark:bg-primary-950/40 dark:text-primary-300 font-bold'
                    : 'text-text-muted hover:text-text'
                }`}
              >
                {st}
              </button>
            ))}
          </div>

          <Button
            size="sm"
            variant="primary"
            icon={FiPlus}
            onClick={() => setCreateOpen(true)}
          >
            Request Refund
          </Button>
        </div>
      </div>

      {refunds.length === 0 ? (
        <div className="bg-card rounded-xl border border-border p-8 text-center max-w-md mx-auto">
          <EmptyState
            title="No refund records"
            description="Fee refund requests and settlements will appear here."
            actionLabel="+ Request Refund"
            onAction={() => setCreateOpen(true)}
          />
        </div>
      ) : (
        <div className="bg-card rounded-xl border border-border overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50/75 dark:bg-slate-900/60 text-text-muted uppercase text-[10px] font-bold tracking-wider border-b border-border">
                  <th className="py-2.5 px-3">Refund No</th>
                  <th className="py-2.5 px-3">Student</th>
                  <th className="py-2.5 px-3">Invoice</th>
                  <th className="py-2.5 px-3">Amount</th>
                  <th className="py-2.5 px-3">Reason</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {refunds.map((r) => {
                  const sName = [r.student?.firstName, r.student?.lastName].filter(Boolean).join(' ') || 'Student';
                  return (
                    <tr key={r.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="py-2.5 px-3 font-mono font-bold text-text">
                        {r.refundNo}
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="flex items-center gap-2">
                          <Avatar name={sName} size="xs" />
                          <div>
                            <span className="font-bold text-text block">{sName}</span>
                            <span className="font-mono text-[10px] text-text-muted">{r.student?.studentCode || 'N/A'}</span>
                          </div>
                        </div>
                      </td>
                      <td className="py-2.5 px-3 font-mono text-text-muted">
                        {r.invoice?.invoiceNo || 'General'}
                      </td>
                      <td className="py-2.5 px-3 font-bold text-rose-600 dark:text-rose-400 tabular-nums">
                        {formatMoney(r.amount, r.invoice?.currency)}
                      </td>
                      <td className="py-2.5 px-3 max-w-xs truncate text-text-muted" title={r.reason}>
                        {r.reason}
                      </td>
                      <td className="py-2.5 px-3">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                          r.status === 'PAID'
                            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-200'
                            : r.status === 'APPROVED'
                            ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 border-blue-200'
                            : r.status === 'REJECTED'
                            ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border-rose-200'
                            : 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border-amber-200'
                        }`}>
                          {r.status}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        {r.status === 'PENDING' && (
                          <Button
                            size="xs"
                            variant="primary"
                            icon={FiCheck}
                            onClick={() => handleApprove(r)}
                          >
                            Approve
                          </Button>
                        )}
                        {r.status === 'APPROVED' && (
                          <Button
                            size="xs"
                            variant="primary"
                            icon={FiDollarSign}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white"
                            onClick={() => handleDisburse(r)}
                          >
                            Disburse
                          </Button>
                        )}
                        {r.status === 'PAID' && (
                          <span className="font-mono text-[10px] text-emerald-600 dark:text-emerald-400">
                            Ref: {r.refundTxRef || 'Settled'}
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

      {/* Request Refund Modal */}
      <Modal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Request Fee Refund"
        size="md"
        footer={(
          <div className="flex items-center justify-between w-full">
            <Button variant="ghost" size="sm" onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button variant="primary" size="sm" onClick={handleRequestRefund} loading={submitting}>
              Submit Refund Request
            </Button>
          </div>
        )}
      >
        <form onSubmit={handleRequestRefund} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Select Student *
            </label>
            <select
              value={selectedStudentId}
              onChange={(e) => setSelectedStudentId(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-white text-xs focus:ring-1 focus:ring-blue-500"
              required
            >
              <option value="">-- Choose Candidate --</option>
              {students.map((st) => (
                <option key={st.id} value={st.id}>
                  {st.firstName} {st.lastName} ({st.studentCode || 'STU'})
                </option>
              ))}
            </select>
          </div>

          {studentInvoices.length > 0 && (
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Link to Invoice (Optional)
              </label>
              <select
                value={selectedInvoiceId}
                onChange={(e) => setSelectedInvoiceId(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-white text-xs focus:ring-1 focus:ring-blue-500"
              >
                <option value="">-- General / Non-Invoiced --</option>
                {studentInvoices.map((inv) => (
                  <option key={inv.id} value={inv.id}>
                    {inv.invoiceNo} (Paid: {formatMoney(inv.amountPaid, inv.currency)})
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Refund Amount *
            </label>
            <Input
              type="number"
              step="0.01"
              min="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              required
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Refund Method *
            </label>
            <select
              value={refundMethod}
              onChange={(e) => setRefundMethod(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-white text-xs"
            >
              <option value="BANK_TRANSFER">Direct Bank Transfer</option>
              <option value="CHEQUE">Cheque / Demand Draft</option>
              <option value="CASH">Cash Settlement</option>
              <option value="ORIGINAL_PAYMENT">Reverse to Original Gateway</option>
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Reason for Refund *
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              placeholder="e.g. Visa rejection fee waiver or course withdrawal"
              className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-white text-xs focus:ring-1 focus:ring-blue-500"
              required
            />
          </div>
        </form>
      </Modal>
    </div>
  );
}

