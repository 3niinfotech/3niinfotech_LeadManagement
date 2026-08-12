import { useEffect, useMemo, useState } from 'react';
import { FiGlobe, FiPlus } from 'react-icons/fi';
import PageShell from '../../../components/layout/PageShell';
import PageHeader from '../../../components/layout/PageHeader';
import Button from '../../../components/ui/Button';
import Badge from '../../../components/ui/Badge';
import { apiGet, apiPost, apiPut, apiDelete } from '../../../api/apiClient';
import { API } from '../../../config/api';
import { PERMISSIONS } from '../../../config/permissions';
import PermissionGate from '../../../components/common/PermissionGate';
import toastService from '../../../services/toast/toast.service';
import alertService from '../../../services/alert/alert.service';

export default function VisasPage() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ studentId: '', country: '', visaType: '', status: 'NOT_STARTED', applicationNo: '' });

  const load = async () => {
    setLoading(true);
    try {
      const response = await apiGet(API.VISAS);
      setRecords(response?.data || []);
    } catch {
      setRecords([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const stats = useMemo(() => ({
    total: records.length,
    pending: records.filter((r) => ['NOT_STARTED', 'DOCUMENTS_COLLECTED'].includes(r.status)).length,
    approved: records.filter((r) => r.status === 'APPROVED').length,
  }), [records]);

  const submitCreate = async (event) => {
    event.preventDefault();
    try {
      await apiPost(API.VISAS, form);
      toastService.success('Visa case created');
      setForm({ studentId: '', country: '', visaType: '', status: 'NOT_STARTED', applicationNo: '' });
      load();
    } catch (err) {
      toastService.error(err?.message || 'Unable to create visa case');
    }
  };

  const remove = async (id) => {
    const ok = await alertService.deleteConfirm({ title: 'Delete visa case', text: 'This will remove the visa case.' });
    if (!ok) return;
    try {
      await apiDelete(`${API.VISAS}/${id}`);
      toastService.success('Visa case removed');
      load();
    } catch (err) {
      toastService.error(err?.message || 'Delete failed');
    }
  };

  return (
    <PageShell>
      <PageHeader title="Visa Processing" subtitle="Manage visa filings, submissions, and approvals" icon={FiGlobe} iconColor="primary" />
      <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-2xl border border-card-border bg-card-bg p-4 shadow-card">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-text">Visa Cases</h3>
              <p className="text-sm text-text-muted">Track visa stages and embassy updates.</p>
            </div>
            <PermissionGate permission={PERMISSIONS.VISAS_CREATE}>
              <Button size="sm" icon={FiPlus}>New Visa</Button>
            </PermissionGate>
          </div>
          <div className="mb-4 grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-card-border bg-surface p-3"><div className="text-sm text-text-muted">Total</div><div className="text-2xl font-semibold text-text">{stats.total}</div></div>
            <div className="rounded-xl border border-card-border bg-surface p-3"><div className="text-sm text-text-muted">Pending</div><div className="text-2xl font-semibold text-text">{stats.pending}</div></div>
            <div className="rounded-xl border border-card-border bg-surface p-3"><div className="text-sm text-text-muted">Approved</div><div className="text-2xl font-semibold text-text">{stats.approved}</div></div>
          </div>
          {loading ? <div className="text-sm text-text-muted">Loading visa cases…</div> : (
            <div className="space-y-3">
              {records.map((record) => (
                <div key={record.id} className="rounded-xl border border-card-border p-3">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <div className="font-semibold text-text">{record.country} · {record.visaType || 'Visa'}</div>
                      <div className="text-sm text-text-muted">{record.student?.firstName} {record.student?.lastName} · {record.applicationNo}</div>
                    </div>
                    <Badge color={record.status === 'APPROVED' ? 'success' : record.status === 'REJECTED' ? 'danger' : 'warning'}>{record.status}</Badge>
                  </div>
                  <div className="mt-3">
                    <Button size="sm" variant="outline" onClick={() => { const nextStatus = record.status === 'APPROVED' ? 'NOT_STARTED' : 'APPROVED'; apiPut(`${API.VISAS}/${record.id}`, { ...record, status: nextStatus }).then(() => { toastService.success('Status updated'); load(); }).catch(() => toastService.error('Update failed')); }}>Advance Status</Button>
                    <Button size="sm" variant="danger" className="ml-2" onClick={() => remove(record.id)}>Delete</Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="rounded-2xl border border-card-border bg-card-bg p-4 shadow-card">
          <h3 className="text-lg font-semibold text-text">Create Visa Case</h3>
          <form className="mt-4 space-y-3" onSubmit={submitCreate}>
            <input className="w-full rounded-lg border border-card-border bg-surface px-3 py-2" placeholder="Student ID" value={form.studentId} onChange={(e) => setForm({ ...form, studentId: e.target.value })} required />
            <input className="w-full rounded-lg border border-card-border bg-surface px-3 py-2" placeholder="Country" value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} required />
            <input className="w-full rounded-lg border border-card-border bg-surface px-3 py-2" placeholder="Visa Type" value={form.visaType} onChange={(e) => setForm({ ...form, visaType: e.target.value })} />
            <input className="w-full rounded-lg border border-card-border bg-surface px-3 py-2" placeholder="Application No" value={form.applicationNo} onChange={(e) => setForm({ ...form, applicationNo: e.target.value })} />
            <select className="w-full rounded-lg border border-card-border bg-surface px-3 py-2" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
              <option value="NOT_STARTED">Not Started</option>
              <option value="DOCUMENTS_COLLECTED">Documents Collected</option>
              <option value="APPLICATION_SUBMITTED">Application Submitted</option>
              <option value="BIOMETRICS_DONE">Biometrics Done</option>
              <option value="INTERVIEW_SCHEDULED">Interview Scheduled</option>
              <option value="APPROVED">Approved</option>
            </select>
            <Button type="submit" className="w-full">Save Visa Case</Button>
          </form>
        </div>
      </div>
    </PageShell>
  );
}
