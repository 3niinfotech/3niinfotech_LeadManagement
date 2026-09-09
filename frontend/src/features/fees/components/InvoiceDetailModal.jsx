import { useEffect, useMemo, useState } from 'react';
import Modal from '../../../components/ui/Modal';
import Button from '../../../components/ui/Button';
import Badge from '../../../components/ui/Badge';
import Select from '../../../components/ui/Select';
import Input from '../../../components/ui/Input';
import ContentLoader from '../../../components/ui/ContentLoader';
import PermissionGate from '../../../components/common/PermissionGate';
import MasterManageLink from '../../master/components/MasterManageLink';
import { PERMISSIONS } from '../../../config/permissions';
import { useRelationalMasterOptions } from '../../master/hooks/useRelationalMasterOptions';
import {
  useGetInvoiceQuery,
  useUpdateInvoiceMutation,
  useDeleteInvoiceMutation,
} from '../redux/feesApiSlice';
import {
  calcTaxAmount,
  displayInvoiceStatus,
  formatMoney,
  getInvoiceStatusTone,
  INVOICE_STATUS_OPTIONS,
} from '../config/feesConstants';
import toastService from '../../../services/toast/toast.service';
import alertService from '../../../services/alert/alert.service';
import '../styles/fees.theme.css';

function studentName(s) {
  if (!s) return '—';
  return `${s.firstName || ''} ${s.lastName || ''}`.trim() || s.studentCode || '—';
}

function fmtDate(value) {
  if (!value) return '—';
  return new Date(value).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export default function InvoiceDetailModal({
  invoiceId,
  open,
  onClose,
  onUpdated,
  onDeleted,
}) {
  const { data: invoice, isLoading, isFetching } = useGetInvoiceQuery(invoiceId, {
    skip: !open || !invoiceId,
  });
  const [updateInvoice, { isLoading: saving }] = useUpdateInvoiceMutation();
  const [deleteInvoice, { isLoading: deleting }] = useDeleteInvoiceMutation();
  const { options: taxOptions } = useRelationalMasterOptions('tax', {}, { enabled: Boolean(open) });
  const { options: currencyOptions } = useRelationalMasterOptions('currency', {}, { enabled: Boolean(open) });
  const { options: paymentModeOptions } = useRelationalMasterOptions('payment-mode', {}, { enabled: Boolean(open) });

  const [status, setStatus] = useState('');
  const [notes, setNotes] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [amount, setAmount] = useState('');
  const [taxId, setTaxId] = useState('');
  const [currency, setCurrency] = useState('');
  const [paymentModeId, setPaymentModeId] = useState('');

  useEffect(() => {
    if (!invoice) return;
    setStatus(invoice.status || 'DRAFT');
    setNotes(invoice.notes || '');
    setDueDate(invoice.dueDate ? String(invoice.dueDate).slice(0, 10) : '');
    setAmount(String(invoice.amount ?? ''));
    setTaxId(invoice.metadata?.taxId || '');
    setCurrency(invoice.currency || '');
    setPaymentModeId(invoice.metadata?.paymentModeId || '');
  }, [invoice]);

  const selectedTax = useMemo(
    () => (taxOptions || []).find((t) => t.value === taxId) || null,
    [taxOptions, taxId],
  );

  const amountNum = Number(amount || 0);
  const effectiveTax = taxId
    ? calcTaxAmount(amountNum, selectedTax?.taxPercentage)
    : 0;
  const totalPreview = amountNum + effectiveTax;

  const dirty = useMemo(() => {
    if (!invoice) return false;
    const due = invoice.dueDate ? String(invoice.dueDate).slice(0, 10) : '';
    return status !== invoice.status
      || notes !== (invoice.notes || '')
      || dueDate !== due
      || Number(amount) !== Number(invoice.amount)
      || (taxId || '') !== (invoice.metadata?.taxId || '')
      || (currency || '') !== (invoice.currency || '')
      || (paymentModeId || '') !== (invoice.metadata?.paymentModeId || '');
  }, [invoice, status, notes, dueDate, amount, taxId, currency, paymentModeId]);

  const buildMeta = () => {
    const paymentMode = (paymentModeOptions || []).find((p) => p.value === paymentModeId);
    return {
      taxId: selectedTax?.value || null,
      taxName: selectedTax?.label || null,
      taxCode: selectedTax?.code || null,
      taxPercentage: selectedTax?.taxPercentage ?? 0,
      paymentModeId: paymentMode?.value || null,
      paymentModeName: paymentMode?.label || null,
    };
  };

  const handleSave = async () => {
    try {
      const payload = {
        id: invoiceId,
        status,
        notes: notes || null,
        dueDate: dueDate || null,
        amount: amountNum,
        tax: effectiveTax,
        total: totalPreview,
        currency: currency || null,
        metadata: buildMeta(),
      };
      if (status === 'PAID' && !invoice?.paidAt) {
        payload.paidAt = new Date().toISOString();
      }
      await updateInvoice(payload).unwrap();
      toastService.success('Invoice updated');
      onUpdated?.();
    } catch (err) {
      toastService.error(err?.data?.message || 'Update failed');
    }
  };

  const handleMarkPaid = async () => {
    try {
      await updateInvoice({
        id: invoiceId,
        status: 'PAID',
        paidAt: new Date().toISOString(),
        metadata: buildMeta(),
      }).unwrap();
      toastService.success('Marked as paid');
      onUpdated?.();
    } catch (err) {
      toastService.error(err?.data?.message || 'Update failed');
    }
  };

  const handleDelete = async () => {
    const ok = await alertService.deleteConfirm({
      title: 'Delete invoice',
      text: 'This will remove the invoice from the ledger.',
    });
    if (!ok) return;
    try {
      await deleteInvoice(invoiceId).unwrap();
      toastService.success('Invoice removed');
      onDeleted?.();
      onClose?.();
    } catch (err) {
      toastService.error(err?.data?.message || 'Delete failed');
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Invoice details"
      size="lg"
      footer={(
        <div className="flex flex-wrap items-center justify-between gap-2 w-full">
          <PermissionGate permission={PERMISSIONS.INVOICES_DELETE}>
            <Button variant="outline-danger" loading={deleting} onClick={handleDelete}>
              Delete
            </Button>
          </PermissionGate>
          <div className="flex gap-2 ml-auto">
            <Button variant="outline" onClick={onClose}>Close</Button>
            <PermissionGate permission={PERMISSIONS.INVOICES_UPDATE}>
              <Button loading={saving} disabled={!dirty} onClick={handleSave}>
                Save changes
              </Button>
            </PermissionGate>
          </div>
        </div>
      )}
    >
      {(isLoading || (!invoice && isFetching)) && <ContentLoader variant="center" />}

      {invoice && (
        <div className="fees-detail">
          <div className="fees-detail__hero">
            <div className="fees-detail__hero-body">
              <div className="fees-detail__hero-top">
                <h3 className="fees-detail__hero-name">{invoice.invoiceNo}</h3>
                <Badge color={getInvoiceStatusTone(invoice.status)} size="sm">
                  {displayInvoiceStatus(invoice.status)}
                </Badge>
              </div>
              <p className="fees-detail__hero-student">{studentName(invoice.student)}</p>
              <div className="fees-detail__hero-meta">
                {invoice.student?.branch?.name && <span>{invoice.student.branch.name}</span>}
                <span>Created {fmtDate(invoice.createdAt)}</span>
                {invoice.paidAt && <span>Paid {fmtDate(invoice.paidAt)}</span>}
              </div>
            </div>
            <div className="fees-detail__amount-block">
              <span>Total</span>
              <strong>{formatMoney(totalPreview || invoice.total, currency || invoice.currency)}</strong>
            </div>
          </div>

          <PermissionGate permission={PERMISSIONS.INVOICES_UPDATE}>
            <section className="fees-detail__section">
              <div className="fees-detail__section-head">
                <h4>Billing</h4>
                <MasterManageLink to="/admin/master/tax">Tax master</MasterManageLink>
              </div>
              <div className="fees-detail__form-grid">
                <Input
                  label="Amount"
                  type="number"
                  min="0"
                  step="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
                <Select
                  label="Tax"
                  value={taxId}
                  onChange={(e) => setTaxId(e.target.value)}
                  size="sm"
                >
                  <option value="">No tax (0%)</option>
                  {(taxOptions || []).map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                      {t.taxPercentage != null ? ` — ${t.taxPercentage}%` : ''}
                    </option>
                  ))}
                </Select>
                <Select
                  label="Currency"
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  size="sm"
                >
                  <option value="">Select currency</option>
                  {(currencyOptions || []).map((c) => (
                    <option key={c.value} value={c.code || c.label}>
                      {(c.code ? `${c.code} — ` : '') + c.label}
                    </option>
                  ))}
                </Select>
                <div className="fees-detail__calc">
                  <div>
                    <span>Tax amount</span>
                    <strong>{formatMoney(effectiveTax, currency || invoice.currency)}</strong>
                  </div>
                  <div>
                    <span>Invoice total</span>
                    <strong>{formatMoney(totalPreview, currency || invoice.currency)}</strong>
                  </div>
                </div>
              </div>
            </section>

            <section className="fees-detail__section">
              <div className="fees-detail__section-head">
                <h4>Collection</h4>
                <MasterManageLink to="/admin/master/payment-mode">Payment modes</MasterManageLink>
              </div>
              <div className="fees-detail__form-grid">
                <Select
                  label="Status"
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  size="sm"
                >
                  {INVOICE_STATUS_OPTIONS.map((s) => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                </Select>
                <Input
                  label="Due date"
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                />
                <Select
                  label="Payment mode"
                  value={paymentModeId}
                  onChange={(e) => setPaymentModeId(e.target.value)}
                  size="sm"
                >
                  <option value="">Select mode</option>
                  {(paymentModeOptions || []).map((p) => (
                    <option key={p.value} value={p.value}>{p.label}</option>
                  ))}
                </Select>
                <Input
                  label="Notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>
              {invoice.status !== 'PAID' && invoice.status !== 'CANCELLED' && (
                <Button
                  className="mt-2"
                  variant="outline-success"
                  size="sm"
                  onClick={handleMarkPaid}
                  loading={saving}
                >
                  Mark as paid
                </Button>
              )}
            </section>
          </PermissionGate>
        </div>
      )}
    </Modal>
  );
}
