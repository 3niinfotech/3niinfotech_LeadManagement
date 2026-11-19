import React, { useState, useEffect } from 'react';
import Modal from '../../../components/ui/Modal';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import Select from '../../../components/ui/Select';
import { apiPost } from '../../../api/apiClient';
import toastService from '../../../services/toast/toast.service';
import { formatMoney } from '../config/feesConstants';

const PAYMENT_MODES = [
  { value: 'BANK_TRANSFER', label: 'Bank Transfer / NEFT / IMPS' },
  { value: 'UPI', label: 'UPI / QR Code' },
  { value: 'CASH', label: 'Cash in Office' },
  { value: 'CHEQUE', label: 'Cheque / Demand Draft' },
  { value: 'CARD', label: 'Credit / Debit Card (POS)' },
  { value: 'ONLINE_PORTAL', label: 'Online Gateway' },
];

export default function CollectPaymentModal({
  open,
  onClose,
  invoice,
  onSuccess,
}) {
  const [amount, setAmount] = useState('');
  const [mode, setMode] = useState('BANK_TRANSFER');
  const [referenceNo, setReferenceNo] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const total = Number(invoice?.total || 0);
  const paid = Number(invoice?.amountPaid || 0);
  const remaining = Math.max(0, Math.round((total - paid) * 100) / 100);

  useEffect(() => {
    if (invoice) {
      setAmount(remaining > 0 ? String(remaining) : '');
      setMode('BANK_TRANSFER');
      setReferenceNo('');
      setNotes('');
    }
  }, [invoice, remaining]);

  if (!invoice) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    const numAmount = Number(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      toastService.warning('Please enter a valid payment amount');
      return;
    }
    if (numAmount > remaining) {
      toastService.error(`Amount cannot exceed outstanding balance (${formatMoney(remaining, invoice.currency)})`);
      return;
    }

    try {
      setSubmitting(true);
      const res = await apiPost(`/invoices/${invoice.id}/payments`, {
        amount: numAmount,
        mode,
        referenceNo: referenceNo.trim() || undefined,
        notes: notes.trim() || undefined,
        idempotencyKey: `PAY-${invoice.id}-${Date.now()}`,
      });

      toastService.success('Payment collected and receipt generated');
      onSuccess?.(res?.data?.receipt);
      onClose();
    } catch (err) {
      toastService.error(err?.response?.data?.message || err?.message || 'Payment collection failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Collect Payment — ${invoice.invoiceNo}`}
      size="md"
      footer={(
        <div className="flex items-center justify-between w-full">
          <Button variant="ghost" size="sm" onClick={onClose} disabled={submitting}>Cancel</Button>
          <Button variant="primary" size="sm" onClick={handleSubmit} loading={submitting}>
            Record Payment & Generate Receipt
          </Button>
        </div>
      )}
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        {/* Outstanding Banner */}
        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
          <div>
            <span className="text-[11px] text-slate-500 block">Total Invoiced</span>
            <span className="font-bold text-slate-900 dark:text-white">{formatMoney(total, invoice.currency)}</span>
          </div>
          <div className="text-right">
            <span className="text-[11px] text-slate-500 block">Remaining Due</span>
            <span className="font-bold text-emerald-600 dark:text-emerald-400">{formatMoney(remaining, invoice.currency)}</span>
          </div>
        </div>

        <div>
          <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Collection Amount ({invoice.currency || 'USD'}) *
          </label>
          <Input
            type="number"
            step="0.01"
            min="0.01"
            max={remaining}
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            required
          />
        </div>

        <div>
          <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Payment Mode *
          </label>
          <Select
            options={PAYMENT_MODES}
            value={mode}
            onChange={setMode}
          />
        </div>

        <div>
          <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Reference / Transaction / UTR No
          </label>
          <Input
            type="text"
            value={referenceNo}
            onChange={(e) => setReferenceNo(e.target.value)}
            placeholder="e.g. UTR12345678 or Cheque #8821"
          />
        </div>

        <div>
          <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Accountant Notes (Optional)
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
            placeholder="Internal remarks for the receipt..."
          />
        </div>
      </form>
    </Modal>
  );
}

