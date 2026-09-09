import { useCallback, useEffect, useState } from 'react';
import { FiBookOpen, FiEdit2, FiPlus, FiTrash2 } from 'react-icons/fi';
import PageShell from '../../../components/layout/PageShell';
import PageHeader from '../../../components/layout/PageHeader';
import Button from '../../../components/ui/Button';
import Badge from '../../../components/ui/Badge';
import ContentLoader from '../../../components/ui/ContentLoader';
import EmptyState from '../../../components/ui/EmptyState';
import Modal from '../../../components/ui/Modal';
import Input from '../../../components/ui/Input';
import Select from '../../../components/ui/Select';
import { apiDelete, apiGet, apiPost, apiPut } from '../../../api/apiClient';
import { API } from '../../../config/api';
import { usePermissions } from '../../../hooks/usePermissions';
import { PERMISSIONS } from '../../../config/permissions';
import toastService from '../../../services/toast/toast.service';
import { useTeacherBatches } from '../hooks/useTeacherBatches';
import { Panel, statusColor } from '../components/teacherWorkspaceUi';

const EMPTY_FORM = {
  title: '',
  batchId: '',
  category: '',
  materialType: 'DOCUMENT',
  fileUrl: '',
  externalUrl: '',
  status: 'DRAFT',
};

export default function TeacherMaterialsPage() {
  const { can } = usePermissions();
  const canManage = can(PERMISSIONS.ATTENDANCE_MARK);
  const { batchOptions, loading: batchesLoading } = useTeacherBatches();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiGet(API.ACADEMIC_MATERIALS, { limit: 50 });
      setRows(res?.data || []);
    } catch (err) {
      toastService.error(err?.response?.data?.message || 'Unable to load materials');
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => {
    setEditing(null);
    setForm({ ...EMPTY_FORM, batchId: batchOptions[0]?.value || '' });
    setFormOpen(true);
  };

  const openEdit = (row) => {
    setEditing(row);
    setForm({
      title: row.title || '',
      batchId: row.batchId || '',
      category: row.category || '',
      materialType: row.materialType || 'DOCUMENT',
      fileUrl: row.fileUrl || '',
      externalUrl: row.externalUrl || '',
      status: row.status || 'DRAFT',
    });
    setFormOpen(true);
  };

  const save = async () => {
    if (!form.title.trim() || !form.batchId) {
      toastService.error('Title and batch are required');
      return;
    }
    setSaving(true);
    try {
      const body = {
        ...form,
        fileUrl: form.fileUrl || null,
        externalUrl: form.externalUrl || null,
        category: form.category || null,
      };
      if (editing) {
        await apiPut(API.ACADEMIC_MATERIAL(editing.id), body);
        toastService.success('Material updated');
      } else {
        await apiPost(API.ACADEMIC_MATERIALS, body);
        toastService.success('Material created');
      }
      setFormOpen(false);
      load();
    } catch (err) {
      toastService.error(err?.response?.data?.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const remove = async (row) => {
    if (!window.confirm(`Remove "${row.title}"?`)) return;
    try {
      await apiDelete(API.ACADEMIC_MATERIAL(row.id));
      toastService.success('Material removed');
      load();
    } catch (err) {
      toastService.error(err?.response?.data?.message || 'Delete failed');
    }
  };

  if (loading && !rows.length) return <ContentLoader variant="dashboard" />;

  return (
    <PageShell className="!space-y-3">
      <PageHeader
        title="Study materials"
        subtitle="Share documents and links with your classes"
        icon={FiBookOpen}
        iconColor="primary"
        actions={canManage && (
          <Button size="sm" icon={FiPlus} onClick={openCreate} disabled={batchesLoading || !batchOptions.length}>
            Add material
          </Button>
        )}
      />

      <Panel title={`All materials (${rows.length})`}>
        {!rows.length ? (
          <EmptyState title="No materials yet" description="Upload or link study resources for students." />
        ) : (
          <div className="divide-y divide-border">
            {rows.map((row) => (
              <div key={row.id} className="flex flex-wrap items-center gap-3 px-3.5 py-2.5">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-semibold text-text">{row.title}</p>
                  <p className="truncate text-[11px] text-text-muted">
                    {row.batch?.name || '—'} · {row.category || row.materialType}
                  </p>
                </div>
                <Badge color={statusColor(row.status)}>{row.status}</Badge>
                <div className="flex gap-1.5">
                  {(row.fileUrl || row.externalUrl) && (
                    <a
                      href={row.fileUrl || row.externalUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs font-medium text-brand hover:underline"
                    >
                      Open
                    </a>
                  )}
                  {canManage && (
                    <>
                      <Button size="sm" variant="ghost" icon={FiEdit2} onClick={() => openEdit(row)} />
                      <Button size="sm" variant="ghost" icon={FiTrash2} onClick={() => remove(row)} />
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </Panel>

      <Modal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title={editing ? 'Edit material' : 'New material'}
        variant="form"
        size="lg"
        footer={(
          <>
            <Button variant="outline" onClick={() => setFormOpen(false)}>Cancel</Button>
            <Button onClick={save} loading={saving}>{editing ? 'Save' : 'Create'}</Button>
          </>
        )}
      >
        <div className="grid gap-3">
          <Input label="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
          <Select label="Batch" value={form.batchId} onChange={(v) => setForm({ ...form, batchId: v })} options={batchOptions} />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Category" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder="e.g. Notes" />
            <Select
              label="Type"
              value={form.materialType}
              onChange={(v) => setForm({ ...form, materialType: v })}
              options={[
                { value: 'DOCUMENT', label: 'Document' },
                { value: 'VIDEO', label: 'Video' },
                { value: 'LINK', label: 'Link' },
                { value: 'OTHER', label: 'Other' },
              ]}
            />
          </div>
          <Input label="File URL" value={form.fileUrl} onChange={(e) => setForm({ ...form, fileUrl: e.target.value })} placeholder="https://…" />
          <Input label="External URL" value={form.externalUrl} onChange={(e) => setForm({ ...form, externalUrl: e.target.value })} placeholder="https://…" />
          <Select
            label="Status"
            value={form.status}
            onChange={(v) => setForm({ ...form, status: v })}
            options={[{ value: 'DRAFT', label: 'Draft' }, { value: 'PUBLISHED', label: 'Published' }]}
          />
        </div>
      </Modal>
    </PageShell>
  );
}
