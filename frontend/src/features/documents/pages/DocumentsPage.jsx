import { useEffect, useMemo, useState } from 'react';
import { FiFolder, FiUpload } from 'react-icons/fi';
import PageShell from '../../../components/layout/PageShell';
import PageHeader from '../../../components/layout/PageHeader';
import Button from '../../../components/ui/Button';
import { apiGet, apiPost, apiDelete } from '../../../api/apiClient';
import { API } from '../../../config/api';
import { PERMISSIONS } from '../../../config/permissions';
import PermissionGate from '../../../components/common/PermissionGate';
import toastService from '../../../services/toast/toast.service';
import alertService from '../../../services/alert/alert.service';

export default function DocumentsPage() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ studentId: '', name: '', fileName: '', filePath: '', category: '', mimeType: 'application/pdf' });

  const load = async () => {
    setLoading(true);
    try {
      const response = await apiGet(API.DOCUMENTS);
      setRecords(response?.data || []);
    } catch {
      setRecords([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const stats = useMemo(() => ({ total: records.length, pendingReview: records.filter((r) => !r.category).length }), [records]);

  const submitCreate = async (event) => {
    event.preventDefault();
    try {
      await apiPost(API.DOCUMENTS, form);
      toastService.success('Document uploaded');
      setForm({ studentId: '', name: '', fileName: '', filePath: '', category: '', mimeType: 'application/pdf' });
      load();
    } catch (err) {
      toastService.error(err?.message || 'Unable to upload document');
    }
  };

  const remove = async (id) => {
    const ok = await alertService.deleteConfirm({ title: 'Delete document', text: 'This will remove the document record.' });
    if (!ok) return;
    try {
      await apiDelete(`${API.DOCUMENTS}/${id}`);
      toastService.success('Document removed');
      load();
    } catch (err) {
      toastService.error(err?.message || 'Delete failed');
    }
  };

  return (
    <PageShell>
      <PageHeader title="Documents" subtitle="Upload, verify, and track student document readiness" icon={FiFolder} iconColor="primary" />
      <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-2xl border border-card-border bg-card-bg p-4 shadow-card">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-text">Document Queue</h3>
              <p className="text-sm text-text-muted">Keep missing documents and version history visible.</p>
            </div>
            <PermissionGate permission={PERMISSIONS.DOCUMENTS_UPLOAD}>
              <Button size="sm" icon={FiUpload}>Upload</Button>
            </PermissionGate>
          </div>
          <div className="mb-4 grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-card-border bg-surface p-3"><div className="text-sm text-text-muted">Total Docs</div><div className="text-2xl font-semibold text-text">{stats.total}</div></div>
            <div className="rounded-xl border border-card-border bg-surface p-3"><div className="text-sm text-text-muted">Pending Review</div><div className="text-2xl font-semibold text-text">{stats.pendingReview}</div></div>
          </div>
          {loading ? <div className="text-sm text-text-muted">Loading documents…</div> : (
            <div className="space-y-3">
              {records.map((record) => (
                <div key={record.id} className="rounded-xl border border-card-border p-3">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <div className="font-semibold text-text">{record.name}</div>
                      <div className="text-sm text-text-muted">{record.fileName} · {record.category || 'Uncategorized'}</div>
                    </div>
                    <Button size="sm" variant="danger" onClick={() => remove(record.id)}>Delete</Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="rounded-2xl border border-card-border bg-card-bg p-4 shadow-card">
          <h3 className="text-lg font-semibold text-text">Upload Document</h3>
          <form className="mt-4 space-y-3" onSubmit={submitCreate}>
            <input className="w-full rounded-lg border border-card-border bg-surface px-3 py-2" placeholder="Student ID" value={form.studentId} onChange={(e) => setForm({ ...form, studentId: e.target.value })} />
            <input className="w-full rounded-lg border border-card-border bg-surface px-3 py-2" placeholder="Document Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            <input className="w-full rounded-lg border border-card-border bg-surface px-3 py-2" placeholder="File Name" value={form.fileName} onChange={(e) => setForm({ ...form, fileName: e.target.value })} required />
            <input className="w-full rounded-lg border border-card-border bg-surface px-3 py-2" placeholder="File Path" value={form.filePath} onChange={(e) => setForm({ ...form, filePath: e.target.value })} required />
            <input className="w-full rounded-lg border border-card-border bg-surface px-3 py-2" placeholder="Category" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} />
            <input className="w-full rounded-lg border border-card-border bg-surface px-3 py-2" placeholder="Mime Type" value={form.mimeType} onChange={(e) => setForm({ ...form, mimeType: e.target.value })} />
            <Button type="submit" className="w-full">Upload Document</Button>
          </form>
        </div>
      </div>
    </PageShell>
  );
}
