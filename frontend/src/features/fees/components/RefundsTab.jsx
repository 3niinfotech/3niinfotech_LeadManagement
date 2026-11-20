import React, { useState, useEffect, useMemo } from 'react';
import {
  FiPlus,
  FiCheck,
  FiX,
  FiDollarSign,
  FiRotateCcw,
  FiClock,
  FiRefreshCw,
  FiCheckCircle,
} from 'react-icons/fi';
import Button from '../../../components/ui/Button';
import Modal from '../../../components/ui/Modal';
import Input from '../../../components/ui/Input';
import Avatar from '../../../components/ui/Avatar';
import GlobalLoader from '../../../components/ui/GlobalLoader';
import EmptyState from '../../../components/ui/EmptyState';
import SummaryStatBar from '../../../components/ui/SummaryStatBar';
import SearchInput from '../../../components/ui/SearchInput';
import { apiGet, apiPost } from '../../../api/apiClient';
import toastService from '../../../services/toast/toast.service';
import alertService from '../../../services/alert/alert.service';
import { formatMoney } from '../config/feesConstants';

export default function RefundsTab() {
  const [refunds, setRefunds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
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

  // Filter refunds by search query client-side
  const filteredRefunds = useMemo(() => {
    if (!searchQuery.trim()) return refunds;
    const q = searchQuery.toLowerCase().trim();
    return refunds.filter((r) => {
      const sName = `${r.student?.firstName || ''} ${r.student?.lastName || ''}`.toLowerCase();
      const sCode = (r.student?.studentCode || '').toLowerCase();
      const refNo = (r.refundNo || '').toLowerCase();
      const invNo = (r.invoice?.invoiceNo || '').toLowerCase();
      const reasonText = (r.reason || '').toLowerCase();
      return (
        sName.includes(q) ||
        sCode.includes(q) ||
        refNo.includes(q) ||
        invNo.includes(q) ||
        reasonText.includes(q)
      );
    });
  }, [refunds, searchQuery]);

  // Statistics calculation
  const totalCount = refunds.length;
  const pendingCount = refunds.filter((r) => r.status === 'PENDING').length;
  const approvedCount = refunds.filter((r) => r.status === 'APPROVED').length;
  const paidCount = refunds.filter((r) => r.status === 'PAID').length;
  const rejectedCount = refunds.filter((r) => r.status === 'REJECTED').length;
  const paidAmount = refunds
    .filter((r) => r.status === 'PAID')
    .reduce((sum, r) => sum + Number(r.amount || 0), 0);

  const statItems = useMemo(
    () => [
      {
        id: 'ALL',
        label: 'Total Requests',
        value: totalCount,
        icon: FiRotateCcw,
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
        label: 'Approved (Ready)',
        value: approvedCount,
        icon: FiCheckCircle,
        tone: 'info',
      },
      {
        id: 'PAID',
        label: 'Paid & Disbursed',
        value: paidCount,
        icon: FiDollarSign,
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
        id: 'PAID_METRIC',
        label: 'Total Disbursed',
        value: formatMoney(paidAmount),
        icon: FiDollarSign,
        tone: 'primary',
        share: false,
        subtext: 'Debited from Ledger',
      },
    ],
    [totalCount, pendingCount, approvedCount, paidCount, rejectedCount, paidAmount]
  );

  return (
    <div className="space-y-4">
      {/* ── KPI Stat Summary Bar ── */}
      <SummaryStatBar
        items={statItems}
        activeFilter={statusFilter}
        onSelect={(id) => {
          if (id === 'PAID_METRIC') {
            setStatusFilter('PAID');
          } else {
            setStatusFilter(id);
          }
        }}
        loading={loading && refunds.length === 0}
        ariaLabel="Refund status filters"
      />

      {/* ── Search & Filter Toolbar ── */}
      <div className="p-3 bg-card rounded-xl border border-border shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="flex-1 max-w-md">
          <SearchInput
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search student, refund no, or reason..."
            size="sm"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap justify-between md:justify-end">
          <div className="flex items-center gap-1 bg-slate-100/80 dark:bg-slate-900/60 p-1 rounded-lg border border-border">
            {[
              { id: 'ALL', label: 'All', count: totalCount },
              { id: 'PENDING', label: 'Pending', count: pendingCount },
              { id: 'APPROVED', label: 'Approved', count: approvedCount },
              { id: 'PAID', label: 'Paid', count: paidCount },
              { id: 'REJECTED', label: 'Rejected', count: rejectedCount },
            ].map(({ id, label, count }) => (
              <button
                key={id}
                type="button"
                onClick={() => setStatusFilter(id)}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold cursor-pointer transition-all ${
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
            onClick={loadRefunds}
            loading={loading}
            className="shrink-0"
          >
            Refresh
          </Button>

          <Button
            size="sm"
            variant="primary"
            icon={FiPlus}
            onClick={() => setCreateOpen(true)}
            className="shrink-0"
          >
            Request Refund
          </Button>
        </div>
      </div>

      {/* ── Enterprise Data Table / Card ── */}
      <div className="bg-card rounded-xl border border-border overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50/90 dark:bg-slate-900/70 text-text-muted uppercase text-[10px] font-bold tracking-wider border-b border-border">
                <th className="py-3 px-4">Refund No</th>
                <th className="py-3 px-3">Student / Candidate</th>
                <th className="py-3 px-3">Invoice Link</th>
                <th className="py-3 px-3">Refund Amount</th>
                <th className="py-3 px-3">Reason &amp; Method</th>
                <th className="py-3 px-3">Request Date</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredRefunds.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-16 px-4 text-center">
                    <EmptyState
                      icon={FiRotateCcw}
                      title={
                        searchQuery
                          ? 'No matching refund requests found'
                          : statusFilter !== 'ALL'
                          ? `No ${statusFilter.toLowerCase()} refunds`
                          : 'No refund records found'
                      }
                      description={
                        searchQuery
                          ? 'Try refining your search terms or clearing filters.'
                          : 'Fee refund requests and settlements will appear here.'
                      }
                      actionLabel="+ Request Refund"
                      onAction={() => setCreateOpen(true)}
                    />
                  </td>
                </tr>
              ) : (
                filteredRefunds.map((r) => {
                  const sName =
                    [r.student?.firstName, r.student?.lastName].filter(Boolean).join(' ') ||
                    'Student';
                  return (
                    <tr
                      key={r.id}
                      className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="py-3 px-4 font-mono font-bold text-text">
                        <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-[11px] font-bold">
                          {r.refundNo}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2.5">
                          <Avatar name={sName} size="xs" />
                          <div>
                            <span className="font-bold text-text block leading-tight">
                              {sName}
                            </span>
                            <span className="font-mono text-[10px] text-text-muted">
                              {r.student?.studentCode || 'N/A'}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-3 font-mono text-text-muted">
                        {r.invoice?.invoiceNo ? (
                          <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-[11px] font-medium text-text">
                            {r.invoice.invoiceNo}
                          </span>
                        ) : (
                          <span className="text-[11px] italic text-text-muted">General Refund</span>
                        )}
                      </td>
                      <td className="py-3 px-3 font-bold text-rose-600 dark:text-rose-400 tabular-nums text-sm">
                        -{formatMoney(r.amount, r.invoice?.currency)}
                      </td>
                      <td className="py-3 px-3 max-w-xs">
                        <span className="font-medium text-text block truncate" title={r.reason}>
                          {r.reason}
                        </span>
                        <span className="text-[10px] text-text-muted block">
                          Method: {r.refundMethod?.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-text-muted">
                        <span className="block font-medium text-text">
                          {new Date(r.createdAt).toLocaleDateString('en-IN', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                            r.status === 'PAID'
                              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/60'
                              : r.status === 'APPROVED'
                              ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300 border-blue-200 dark:border-blue-800/60'
                              : r.status === 'REJECTED'
                              ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300 border-rose-200 dark:border-rose-800/60'
                              : 'bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300 border-amber-200 dark:border-amber-800/60'
                          }`}
                        >
                          {r.status === 'PENDING' && <FiClock className="w-3 h-3" />}
                          {r.status === 'APPROVED' && <FiCheck className="w-3 h-3" />}
                          {r.status === 'PAID' && <FiDollarSign className="w-3 h-3" />}
                          {r.status === 'REJECTED' && <FiX className="w-3 h-3" />}
                          {r.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
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
                          <span className="font-mono text-[10px] text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800">
                            Txn: {r.refundTxRef || 'Settled'}
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

      {/* ── Request Refund Modal ── */}
      <Modal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Request Fee Refund"
        size="md"
        footer={
          <div className="flex items-center justify-between w-full">
            <Button variant="ghost" size="sm" onClick={() => setCreateOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleRequestRefund}
              loading={submitting}
            >
              Submit Refund Request
            </Button>
          </div>
        }
      >
        <form onSubmit={handleRequestRefund} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Select Student *
            </label>
            <select
              value={selectedStudentId}
              onChange={(e) => setSelectedStudentId(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-white text-xs focus:ring-1 focus:ring-primary-500"
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
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-white text-xs focus:ring-1 focus:ring-primary-500"
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
              Refund Amount (INR) *
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
              className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-white text-xs focus:ring-1 focus:ring-primary-500"
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
              className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-white text-xs focus:ring-1 focus:ring-primary-500"
              required
            />
          </div>
        </form>
      </Modal>
    </div>
  );
}
