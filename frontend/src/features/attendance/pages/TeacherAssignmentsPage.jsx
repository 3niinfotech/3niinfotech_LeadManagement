import { useCallback, useEffect, useState } from 'react';
import { FiClipboard, FiEdit2, FiPlus, FiTrash2 } from 'react-icons/fi';
import PageShell from '../../../components/layout/PageShell';
import PageHeader from '../../../components/layout/PageHeader';
import Button from '../../../components/ui/Button';
import Badge from '../../../components/ui/Badge';
import ContentLoader from '../../../components/ui/ContentLoader';
import EmptyState from '../../../components/ui/EmptyState';
import Modal from '../../../components/ui/Modal';
import Input from '../../../components/ui/Input';
import Textarea from '../../../components/ui/Textarea';
import Select from '../../../components/ui/Select';
import { apiDelete, apiGet, apiPost, apiPut } from '../../../api/apiClient';
import { API } from '../../../config/api';
import { usePermissions } from '../../../hooks/usePermissions';
import { PERMISSIONS } from '../../../config/permissions';
import toastService from '../../../services/toast/toast.service';
import { useTeacherBatches } from '../hooks/useTeacherBatches';
import { formatDate, Panel, statusColor } from '../components/teacherWorkspaceUi';

const EMPTY_FORM = {
  title: '',
  description: '',
  batchId: '',
  startDate: '',
  dueDate: '',
  maxMarks: 100,
  attachmentUrl: '',
  status: 'DRAFT',
};

export default function TeacherAssignmentsPage() {
  const { can } = usePermissions();
  const canManage = can(PERMISSIONS.ATTENDANCE_MARK);
  const { batchOptions, loading: batchesLoading } = useTeacherBatches();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [detail, setDetail] = useState(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [reviewDraft, setReviewDraft] = useState({});

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiGet(API.ACADEMIC_ASSIGNMENTS, { limit: 50 });
      setRows(res?.data || []);
    } catch (err) {
      toastService.error(err?.response?.data?.message || 'Unable to load assignments');
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
      description: row.description || '',
      batchId: row.batchId || '',
      startDate: row.startDate ? row.startDate.slice(0, 10) : '',
      dueDate: row.dueDate ? row.dueDate.slice(0, 10) : '',
      maxMarks: row.maxMarks ?? 100,
      attachmentUrl: row.attachmentUrl || '',
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
        maxMarks: Number(form.maxMarks) || 100,
        startDate: form.startDate || null,
        dueDate: form.dueDate || null,
        attachmentUrl: form.attachmentUrl || null,
      };
      if (editing) {
        await apiPut(API.ACADEMIC_ASSIGNMENT(editing.id), body);
        toastService.success('Assignment updated');
      } else {
        await apiPost(API.ACADEMIC_ASSIGNMENTS, body);
        toastService.success('Assignment created');
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
    if (!window.confirm(`Delete "${row.title}"?`)) return;
    try {
      await apiDelete(API.ACADEMIC_ASSIGNMENT(row.id));
      toastService.success('Assignment removed');
      load();
    } catch (err) {
      toastService.error(err?.response?.data?.message || 'Delete failed');
    }
  };

  const openDetail = async (row) => {
    try {
      const res = await apiGet(API.ACADEMIC_ASSIGNMENT(row.id));
      setDetail(res?.data || res);
      setReviewDraft({});
      setDetailOpen(true);
    } catch (err) {
      toastService.error(err?.response?.data?.message || 'Unable to load submissions');
    }
  };

  const review = async (submissionId) => {
    const draft = reviewDraft[submissionId] || {};
    try {
      await apiPut(
        API.ACADEMIC_ASSIGNMENT_REVIEW(detail.id, submissionId),
        { marks: draft.marks != null ? Number(draft.marks) : null, feedback: draft.feedback || null },
      );
      toastService.success('Submission reviewed');
      openDetail({ id: detail.id });
    } catch (err) {
      toastService.error(err?.response?.data?.message || 'Review failed');
    }
  };

  if (loading && !rows.length) return <ContentLoader variant="dashboard" />;

  return (
    <PageShell className="!space-y-3">
      <PageHeader
        title="Assignments"
        subtitle="Create, publish, and review student submissions"
        icon={FiClipboard}
        iconColor="primary"
        actions={canManage && (
          <Button size="sm" icon={FiPlus} onClick={openCreate} disabled={batchesLoading || !batchOptions.length}>
            New assignment
          </Button>
        )}
      />

      <Panel title={`All assignments (${rows.length})`}>
        {!rows.length ? (
          <EmptyState title="No assignments yet" description="Create your first assignment for a class." />
        ) : (
          <div className="divide-y divide-border">
            {rows.map((row) => (
              <div key={row.id} className="flex flex-wrap items-center gap-3 px-3.5 py-2.5">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-semibold text-text">{row.title}</p>
                  <p className="truncate text-[11px] text-text-muted">
                    {row.batch?.name || '—'} · Due {formatDate(row.dueDate)} · {row._count?.submissions ?? 0} submissions
                  </p>
                </div>
                <Badge color={statusColor(row.status)}>{row.status}</Badge>
                <div className="flex gap-1.5">
                  <Button size="sm" variant="outline" onClick={() => openDetail(row)}>Submissions</Button>
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
        title={editing ? 'Edit assignment' : 'New assignment'}
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
          <Textarea label="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} />
          <Select label="Batch" value={form.batchId} onChange={(v) => setForm({ ...form, batchId: v })} options={batchOptions} />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Start date" type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} />
            <Input label="Due date" type="date" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Max marks" type="number" value={form.maxMarks} onChange={(e) => setForm({ ...form, maxMarks: e.target.value })} />
            <Select
              label="Status"
              value={form.status}
              onChange={(v) => setForm({ ...form, status: v })}
              options={[{ value: 'DRAFT', label: 'Draft' }, { value: 'PUBLISHED', label: 'Published' }]}
            />
          </div>
          <Input label="Attachment URL" value={form.attachmentUrl} onChange={(e) => setForm({ ...form, attachmentUrl: e.target.value })} placeholder="https://…" />
        </div>
      </Modal>

      <Modal
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
        title={detail?.title || 'Submissions'}
        subtitle={detail?.batch?.name}
        size="lg"
      >
        {!detail?.submissions?.length ? (
          <EmptyState title="No submissions yet" description="Students will appear here after they submit." />
        ) : (
          <div className="space-y-3">
            {detail.submissions.map((sub) => {
              const draft = reviewDraft[sub.id] || {
                marks: sub.marks ?? '',
                feedback: sub.feedback ?? '',
              };
              return (
                <div key={sub.id} className="rounded-lg border border-border p-3">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold text-text">
                        {sub.student?.firstName} {sub.student?.lastName}
                      </p>
                      <p className="text-[11px] text-text-muted">{sub.student?.studentCode} · {sub.status}</p>
                    </div>
                    {sub.fileUrl && (
                      <a href={sub.fileUrl} target="_blank" rel="noreferrer" className="text-xs text-brand hover:underline">View file</a>
                    )}
                  </div>
                  {sub.content && <p className="mt-2 text-sm text-text-secondary">{sub.content}</p>}
                  {canManage && (
                    <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-[120px_1fr_auto]">
                      <Input
                        size="sm"
                        label="Marks"
                        type="number"
                        value={draft.marks}
                        onChange={(e) => setReviewDraft({ ...reviewDraft, [sub.id]: { ...draft, marks: e.target.value } })}
                      />
                      <Input
                        size="sm"
                        label="Feedback"
                        value={draft.feedback}
                        onChange={(e) => setReviewDraft({ ...reviewDraft, [sub.id]: { ...draft, feedback: e.target.value } })}
                      />
                      <Button size="sm" className="self-end" onClick={() => review(sub.id)}>Save review</Button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </Modal>
    </PageShell>
  );
}
