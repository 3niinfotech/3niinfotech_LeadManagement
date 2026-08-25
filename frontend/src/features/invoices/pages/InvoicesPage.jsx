import { useEffect, useMemo, useState } from 'react';
import { FiDollarSign, FiPlus } from 'react-icons/fi';
import PageShell from '../../../components/layout/PageShell';
import PageHeader from '../../../components/layout/PageHeader';
import Button from '../../../components/ui/Button';
import Badge from '../../../components/ui/Badge';
import { apiGet, apiPost, apiDelete } from '../../../api/apiClient';
import { API } from '../../../config/api';
import { PERMISSIONS } from '../../../config/permissions';
import PermissionGate from '../../../components/common/PermissionGate';
import toastService from '../../../services/toast/toast.service';
import alertService from '../../../services/alert/alert.service';
import { useRelationalMasterOptions } from '../../master/hooks/useRelationalMasterOptions';
import MasterManageLink from '../../master/components/MasterManageLink';
import { organizationApi } from '../../master/services/organizationApi.service';

export default function InvoicesPage() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [company, setCompany] = useState(null);
  const [form, setForm] = useState({ studentId: '', invoiceNo: '', amount: '0', tax: '0', total: '0', currency: '', status: 'DRAFT', notes: '' });
  const { options: currencyOptions } = useRelationalMasterOptions('currency');

  const load = async () => {
    setLoading(true);
    try {
      const [invoiceRes, companyData] = await Promise.all([
        apiGet(API.INVOICES),
        organizationApi.getCompany().catch(() => null),
      ]);
      setRecords(invoiceRes?.data || []);
      setCompany(companyData);
      const defaultCurrency = companyData?.settings?.defaultCurrencyCode;
      if (defaultCurrency) {
        setForm((prev) => (prev.currency ? prev : { ...prev, currency: defaultCurrency }));
      }
    } catch {
      setRecords([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const stats = useMemo(() => ({ total: records.length, overdue: records.filter((r) => r.status === 'OVERDUE').length, paid: records.filter((r) => r.status === 'PAID').length }), [records]);

  const submitCreate = async (event) => {
    event.preventDefault();
    try {
      await apiPost(API.INVOICES, { ...form, amount: Number(form.amount), tax: Number(form.tax), total: Number(form.total) });
      toastService.success('Invoice created');
      setForm({ studentId: '', invoiceNo: '', amount: '0', tax: '0', total: '0', currency: form.currency, status: 'DRAFT', notes: '' });
      load();
    } catch (err) {
      toastService.error(err?.message || 'Unable to create invoice');
    }
  };

  const remove = async (id) => {
    const ok = await alertService.deleteConfirm({ title: 'Delete invoice', text: 'This will remove the invoice.' });
    if (!ok) return;
    try {
      await apiDelete(`${API.INVOICES}/${id}`);
      toastService.success('Invoice removed');
      load();
    } catch (err) {
      toastService.error(err?.message || 'Delete failed');
    }
  };

  return (
    <PageShell>
      <PageHeader
        title="Invoices"
        subtitle="Create fee invoices, track payments, and manage dues"
        icon={FiDollarSign}
        iconColor="primary"
        actions={<MasterManageLink to="/admin/master/currency">Manage Currency</MasterManageLink>}
      />
      {company && (
        <div className="mb-4 rounded-xl border border-card-border bg-card-bg p-4 text-sm">
          <p className="font-semibold text-text">{company.name}</p>
          <p className="text-text-muted">
            {[company.taxNumber && `Tax: ${company.taxNumber}`, company.email, company.phone].filter(Boolean).join(' · ')}
          </p>
          {company.settings?.invoiceTerms && (
            <p className="text-text-muted mt-1">{company.settings.invoiceTerms}</p>
          )}
        </div>
      )}
      <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-2xl border border-card-border bg-card-bg p-4 shadow-card">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-text">Invoice Ledger</h3>
              <p className="text-sm text-text-muted">Billing and outstanding balance tracking.</p>
            </div>
            <PermissionGate permission={PERMISSIONS.INVOICES_CREATE}>
              <Button size="sm" icon={FiPlus}>New Invoice</Button>
            </PermissionGate>
          </div>
          <div className="mb-4 grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-card-border bg-surface p-3"><div className="text-sm text-text-muted">Total</div><div className="text-2xl font-semibold text-text">{stats.total}</div></div>
            <div className="rounded-xl border border-card-border bg-surface p-3"><div className="text-sm text-text-muted">Overdue</div><div className="text-2xl font-semibold text-text">{stats.overdue}</div></div>
            <div className="rounded-xl border border-card-border bg-surface p-3"><div className="text-sm text-text-muted">Paid</div><div className="text-2xl font-semibold text-text">{stats.paid}</div></div>
          </div>
          {loading ? <div className="text-sm text-text-muted">Loading invoices…</div> : (
            <div className="space-y-3">
              {records.map((record) => (
                <div key={record.id} className="rounded-xl border border-card-border p-3">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <div className="font-semibold text-text">{record.invoiceNo}</div>
                      <div className="text-sm text-text-muted">{record.student?.firstName} {record.student?.lastName} · {record.currency} {record.total}</div>
                    </div>
                    <Badge color={record.status === 'PAID' ? 'success' : record.status === 'OVERDUE' ? 'danger' : 'warning'}>{record.status}</Badge>
                  </div>
                  <div className="mt-3">
                    <Button size="sm" variant="danger" onClick={() => remove(record.id)}>Delete</Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="rounded-2xl border border-card-border bg-card-bg p-4 shadow-card">
          <h3 className="text-lg font-semibold text-text">Create Invoice</h3>
          <form className="mt-4 space-y-3" onSubmit={submitCreate}>
            <input className="w-full rounded-lg border border-card-border bg-surface px-3 py-2" placeholder="Student ID" value={form.studentId} onChange={(e) => setForm({ ...form, studentId: e.target.value })} />
            <input className="w-full rounded-lg border border-card-border bg-surface px-3 py-2" placeholder="Invoice No" value={form.invoiceNo} onChange={(e) => setForm({ ...form, invoiceNo: e.target.value })} required />
            <input className="w-full rounded-lg border border-card-border bg-surface px-3 py-2" placeholder="Amount" type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} required />
            <input className="w-full rounded-lg border border-card-border bg-surface px-3 py-2" placeholder="Tax" type="number" value={form.tax} onChange={(e) => setForm({ ...form, tax: e.target.value })} />
            <input className="w-full rounded-lg border border-card-border bg-surface px-3 py-2" placeholder="Total" type="number" value={form.total} onChange={(e) => setForm({ ...form, total: e.target.value })} required />
            <select className="w-full rounded-lg border border-card-border bg-surface px-3 py-2" value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })}>
              <option value="">Select currency</option>
              {currencyOptions.map((opt) => (
                <option key={opt.value} value={opt.code || opt.label}>
                  {(opt.code ? `${opt.code} — ` : '') + opt.label}
                </option>
              ))}
            </select>
            <select className="w-full rounded-lg border border-card-border bg-surface px-3 py-2" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
              <option value="DRAFT">Draft</option>
              <option value="SENT">Sent</option>
              <option value="PAID">Paid</option>
              <option value="PARTIAL">Partial</option>
              <option value="OVERDUE">Overdue</option>
            </select>
            <textarea className="w-full rounded-lg border border-card-border bg-surface px-3 py-2" placeholder="Notes" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
            <Button type="submit" className="w-full">Save Invoice</Button>
          </form>
        </div>
      </div>
    </PageShell>
  );
}
