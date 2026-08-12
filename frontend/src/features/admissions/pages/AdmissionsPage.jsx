import { useEffect, useMemo, useState } from 'react';
import { FiClipboard, FiPlus, FiCheckCircle, FiClock } from 'react-icons/fi';
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

export default function AdmissionsPage() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ studentId: '', university: '', course: '', status: 'DRAFT', applicationNo: '', intake: '' });

  const load = async () => {
    setLoading(true);
    try {
      const response = await apiGet(API.APPLICATIONS);
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
    submitted: records.filter((r) => r.status === 'SUBMITTED' || r.status === 'UNDER_REVIEW').length,
    approved: records.filter((r) => r.status === 'CONDITIONAL_OFFER' || r.status === 'UNCONDITIONAL_OFFER').length,
  }), [records]);

  const submitCreate = async (event) => {
    event.preventDefault();
    try {
      await apiPost(API.APPLICATIONS, form);
      toastService.success('Application created');
      setForm({ studentId: '', university: '', course: '', status: 'DRAFT', applicationNo: '', intake: '' });
      load();
    } catch (err) {
      toastService.error(err?.message || 'Unable to create application');
    }
  };

  const toggleStatus = async (record) => {
    const nextStatus = record.status === 'SUBMITTED' ? 'UNDER_REVIEW' : 'SUBMITTED';
    try {
      await apiPut(`${API.APPLICATIONS}/${record.id}`, { ...record, status: nextStatus });
      toastService.success('Application status updated');
      load();
    } catch (err) {
      toastService.error(err?.message || 'Update failed');
    }
  };

  const remove = async (id) => {
    const ok = await alertService.deleteConfirm({ title: 'Delete application', text: 'This will remove the application record.' });
    if (!ok) return;
    try {
      await apiDelete(`${API.APPLICATIONS}/${id}`);
      toastService.success('Application removed');
      load();
    } catch (err) {
      toastService.error(err?.message || 'Delete failed');
    }
  };

  return (
    <PageShell>
      <PageHeader title="Admissions" subtitle="Track applications, approvals, and student readiness" icon={FiClipboard} iconColor="primary" />

      <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-2xl border border-card-border bg-card-bg p-4 shadow-card">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-text">Applications</h3>
              <p className="text-sm text-text-muted">Operational admission workflow for university applications.</p>
            </div>
            <PermissionGate permission={PERMISSIONS.APPLICATIONS_CREATE}>
              <Button size="sm" icon={FiPlus}>New Application</Button>
            </PermissionGate>
          </div>

          <div className="mb-4 grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-card-border bg-surface p-3">
              <div className="text-sm text-text-muted">Total</div>
              <div className="text-2xl font-semibold text-text">{stats.total}</div>
            </div>
            <div className="rounded-xl border border-card-border bg-surface p-3">
              <div className="text-sm text-text-muted">In Review</div>
              <div className="text-2xl font-semibold text-text">{stats.submitted}</div>
            </div>
            <div className="rounded-xl border border-card-border bg-surface p-3">
              <div className="text-sm text-text-muted">Approved</div>
              <div className="text-2xl font-semibold text-text">{stats.approved}</div>
            </div>
          </div>

          {loading ? <div className="text-sm text-text-muted">Loading applications…</div> : (
            <div className="space-y-3">
              {records.map((record) => (
                <div key={record.id} className="rounded-xl border border-card-border p-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <div className="font-semibold text-text">{record.university} · {record.course}</div>
                      <div className="text-sm text-text-muted">{record.student?.firstName} {record.student?.lastName} · {record.applicationNo}</div>
                    </div>
                    <Badge color={record.status === 'UNCONDITIONAL_OFFER' || record.status === 'CONDITIONAL_OFFER' ? 'success' : record.status === 'REJECTED' ? 'danger' : 'warning'}>{record.status}</Badge>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Button size="sm" variant="outline" icon={FiCheckCircle} onClick={() => toggleStatus(record)}>Advance Status</Button>
                    <Button size="sm" variant="danger" onClick={() => remove(record.id)}>Delete</Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-card-border bg-card-bg p-4 shadow-card">
          <h3 className="text-lg font-semibold text-text">Create Admission</h3>
          <p className="mb-4 text-sm text-text-muted">Capture an admission application after demo and counselling readiness.</p>
          <form className="space-y-3" onSubmit={submitCreate}>
            <input className="w-full rounded-lg border border-card-border bg-surface px-3 py-2" placeholder="Student ID" value={form.studentId} onChange={(e) => setForm({ ...form, studentId: e.target.value })} required />
            <input className="w-full rounded-lg border border-card-border bg-surface px-3 py-2" placeholder="University" value={form.university} onChange={(e) => setForm({ ...form, university: e.target.value })} required />
            <input className="w-full rounded-lg border border-card-border bg-surface px-3 py-2" placeholder="Course" value={form.course} onChange={(e) => setForm({ ...form, course: e.target.value })} required />
            <input className="w-full rounded-lg border border-card-border bg-surface px-3 py-2" placeholder="Intake" value={form.intake} onChange={(e) => setForm({ ...form, intake: e.target.value })} />
            <input className="w-full rounded-lg border border-card-border bg-surface px-3 py-2" placeholder="Application No" value={form.applicationNo} onChange={(e) => setForm({ ...form, applicationNo: e.target.value })} />
            <select className="w-full rounded-lg border border-card-border bg-surface px-3 py-2" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
              <option value="DRAFT">Draft</option>
              <option value="SUBMITTED">Submitted</option>
              <option value="UNDER_REVIEW">Under Review</option>
              <option value="CONDITIONAL_OFFER">Conditional Offer</option>
              <option value="UNCONDITIONAL_OFFER">Unconditional Offer</option>
            </select>
            <Button type="submit" className="w-full">Save Admission</Button>
          </form>
        </div>
      </div>
    </PageShell>
  );
}
