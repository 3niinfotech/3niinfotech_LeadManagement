import { useEffect, useMemo, useState } from 'react';
import { FiSearch } from 'react-icons/fi';
import Modal from '../../../components/ui/Modal';
import Button from '../../../components/ui/Button';
import Select from '../../../components/ui/Select';
import Input from '../../../components/ui/Input';
import { apiGet } from '../../../api/apiClient';
import { API } from '../../../config/api';
import { useRelationalMasterOptions } from '../../master/hooks/useRelationalMasterOptions';
import { organizationApi } from '../../master/services/organizationApi.service';
import MasterManageLink from '../../master/components/MasterManageLink';
import { useCreateInvoiceMutation } from '../redux/feesApiSlice';
import { INVOICE_STATUS_OPTIONS, calcTaxAmount } from '../config/feesConstants';
import toastService from '../../../services/toast/toast.service';

const EMPTY_FORM = {
  studentId: '',
  invoiceNo: '',
  amount: '',
  taxId: '',
  currency: '',
  status: 'DRAFT',
  dueDate: '',
  notes: '',
};

const FORM_ID = 'fees-create-form';

function studentLabel(s) {
  if (!s) return '';
  return `${s.firstName || ''} ${s.lastName || ''}`.trim() || s.studentCode || 'Student';
}

export default function InvoiceCreateModal({ open, onClose, onSuccess }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [studentSearch, setStudentSearch] = useState('');
  const [studentResults, setStudentResults] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [searching, setSearching] = useState(false);
  const [createInvoice, { isLoading: saving }] = useCreateInvoiceMutation();

  const { options: currencyOptions } = useRelationalMasterOptions('currency', {}, { enabled: Boolean(open) });
  const { options: taxOptions } = useRelationalMasterOptions('tax', {}, { enabled: Boolean(open) });

  useEffect(() => {
    if (!open) return undefined;
    let cancelled = false;
    organizationApi.getCompany().then((company) => {
      if (cancelled) return;
      const code = company?.settings?.defaultCurrencyCode;
      if (code) {
        setForm((prev) => (prev.currency ? prev : { ...prev, currency: code }));
      }
    }).catch(() => {});
    return () => { cancelled = true; };
  }, [open]);

  useEffect(() => {
    if (!open) {
      setForm(EMPTY_FORM);
      setStudentSearch('');
      setStudentResults([]);
      setSelectedStudent(null);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return undefined;
    const q = studentSearch.trim();
    if (q.length < 2) {
      setStudentResults([]);
      return undefined;
    }
    let cancelled = false;
    const t = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await apiGet(API.STUDENTS, { search: q, limit: 8, page: 1 });
        if (!cancelled) setStudentResults(res?.data || []);
      } catch {
        if (!cancelled) setStudentResults([]);
      } finally {
        if (!cancelled) setSearching(false);
      }
    }, 280);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [studentSearch, open]);

  const selectedTax = useMemo(
    () => (taxOptions || []).find((t) => t.value === form.taxId) || null,
    [taxOptions, form.taxId],
  );

  const amountNum = Number(form.amount || 0);
  const taxAmount = calcTaxAmount(amountNum, selectedTax?.taxPercentage);
  const totalPreview = amountNum + taxAmount;

  const setField = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const pickStudent = (s) => {
    setSelectedStudent(s);
    setField('studentId', s.id);
    setStudentSearch(studentLabel(s));
    setStudentResults([]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.studentId) {
      toastService.error('Select a student');
      return;
    }
    if (form.amount === '' || Number.isNaN(amountNum)) {
      toastService.error('Amount is required');
      return;
    }
    try {
      await createInvoice({
        studentId: form.studentId,
        invoiceNo: form.invoiceNo || undefined,
        amount: amountNum,
        tax: taxAmount,
        total: totalPreview,
        currency: form.currency || undefined,
        status: form.status || 'DRAFT',
        dueDate: form.dueDate || null,
        notes: form.notes || null,
        metadata: selectedTax
          ? {
              taxId: selectedTax.value,
              taxName: selectedTax.label,
              taxCode: selectedTax.code || null,
              taxPercentage: selectedTax.taxPercentage ?? 0,
            }
          : { taxId: null, taxPercentage: 0 },
      }).unwrap();
      toastService.success('Invoice created');
      onSuccess?.();
      onClose?.();
    } catch (err) {
      toastService.error(err?.data?.message || 'Unable to create invoice');
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="New invoice"
      size="md"
      footer={(
        <>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button type="submit" form={FORM_ID} loading={saving}>
            Create invoice
          </Button>
        </>
      )}
    >
      <form id={FORM_ID} className="space-y-3" onSubmit={handleSubmit}>
        <div className="relative">
          <Input
            label="Student"
            value={studentSearch}
            onChange={(e) => {
              setStudentSearch(e.target.value);
              if (selectedStudent) {
                setSelectedStudent(null);
                setField('studentId', '');
              }
            }}
            placeholder="Search by name or student code"
            icon={FiSearch}
            required
          />
          {(searching || studentResults.length > 0) && !selectedStudent && studentSearch.trim().length >= 2 && (
            <div className="absolute z-20 mt-1 w-full rounded-lg border border-border bg-card-bg shadow-md max-h-48 overflow-auto">
              {searching && <p className="px-3 py-2 text-xs text-text-muted">Searching…</p>}
              {!searching && studentResults.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  className="w-full text-left px-3 py-2 text-sm hover:bg-row-hover border-b border-border last:border-0"
                  onClick={() => pickStudent(s)}
                >
                  <span className="font-medium text-text">{studentLabel(s)}</span>
                  <span className="ml-2 font-mono text-[11px] text-text-muted">{s.studentCode}</span>
                </button>
              ))}
              {!searching && studentResults.length === 0 && (
                <p className="px-3 py-2 text-xs text-text-muted">No students found</p>
              )}
            </div>
          )}
        </div>

        <Input
          label="Invoice no"
          value={form.invoiceNo}
          onChange={(e) => setField('invoiceNo', e.target.value)}
          placeholder="Auto-generated if empty"
        />

        <Input
          label="Amount"
          type="number"
          min="0"
          step="0.01"
          value={form.amount}
          onChange={(e) => setField('amount', e.target.value)}
          required
        />

        <div className="flex items-end gap-2">
          <div className="flex-1 min-w-0">
            <Select
              label="Tax (from master)"
              value={form.taxId}
              onChange={(e) => setField('taxId', e.target.value)}
              size="sm"
            >
              <option value="">No tax (0%)</option>
              {(taxOptions || []).map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                  {t.taxPercentage != null ? ` — ${t.taxPercentage}%` : ''}
                  {t.code ? ` (${t.code})` : ''}
                </option>
              ))}
            </Select>
          </div>
          <MasterManageLink to="/admin/master/tax">
            Manage
          </MasterManageLink>
        </div>

        <div className="fees-create-totals">
          <div>
            <span>Tax amount</span>
            <strong>{taxAmount.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</strong>
          </div>
          <div>
            <span>Total</span>
            <strong>{totalPreview.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</strong>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="flex items-end gap-2">
            <div className="flex-1 min-w-0">
              <Select
                label="Currency"
                value={form.currency}
                onChange={(e) => setField('currency', e.target.value)}
                size="sm"
              >
                <option value="">Select currency</option>
                {(currencyOptions || []).map((c) => (
                  <option key={c.value} value={c.code || c.label}>
                    {(c.code ? `${c.code} — ` : '') + c.label}
                  </option>
                ))}
              </Select>
            </div>
          </div>

          <Select
            label="Status"
            value={form.status}
            onChange={(e) => setField('status', e.target.value)}
            size="sm"
          >
            {INVOICE_STATUS_OPTIONS.filter((s) => s.value !== 'CANCELLED').map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </Select>
        </div>

        <Input
          label="Due date"
          type="date"
          value={form.dueDate}
          onChange={(e) => setField('dueDate', e.target.value)}
        />

        <Input
          label="Notes"
          value={form.notes}
          onChange={(e) => setField('notes', e.target.value)}
          placeholder="Optional notes"
        />
      </form>
    </Modal>
  );
}
