import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  FiClipboard,
  FiEdit2,
  FiPlus,
  FiTrash2,
  FiCheckCircle,
  FiClock,
  FiSearch,
  FiUsers,
  FiAward,
  FiFileText,
  FiPaperclip,
  FiUploadCloud,
  FiX,
  FiExternalLink,
} from 'react-icons/fi';
import Button from '../../../components/ui/Button';
import Badge from '../../../components/ui/Badge';
import ContentLoader from '../../../components/ui/ContentLoader';
import EmptyState from '../../../components/ui/EmptyState';
import Modal from '../../../components/ui/Modal';
import DeleteConfirmModal from '../../../components/ui/DeleteConfirmModal';
import SummaryStatBar from '../../../components/ui/SummaryStatBar';
import Input from '../../../components/ui/Input';
import Textarea from '../../../components/ui/Textarea';
import Select from '../../../components/ui/Select';
import { apiDelete, apiGet, apiPost, apiPut } from '../../../api/apiClient';
import { API } from '../../../config/api';
import { usePermissions } from '../../../hooks/usePermissions';
import { PERMISSIONS } from '../../../config/permissions';
import toastService from '../../../services/toast/toast.service';
import { useTeacherBatches } from '../hooks/useTeacherBatches';
import { formatDate, statusColor } from '../components/teacherWorkspaceUi';
import '../styles/teacher-academic.css';

const EMPTY_FORM = {
  title: '',
  description: '',
  batchId: '',
  startDate: '',
  dueDate: '',
  maxMarks: 100,
  attachmentUrl: '',
  status: 'PUBLISHED',
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
  const [selectedFile, setSelectedFile] = useState(null);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const fileInputRef = useRef(null);

  const [detail, setDetail] = useState(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [reviewDraft, setReviewDraft] = useState({});

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [batchFilter, setBatchFilter] = useState('ALL');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiGet(API.ACADEMIC_ASSIGNMENTS, { limit: 100 });
      setRows(res?.data || []);
    } catch (err) {
      toastService.error(err?.response?.data?.message || 'Unable to load assignments');
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const openCreate = () => {
    setEditing(null);
    setSelectedFile(null);
    setShowUrlInput(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
    setForm({
      ...EMPTY_FORM,
      batchId: batchOptions[0]?.value || '',
      startDate: new Date().toISOString().slice(0, 10),
      dueDate: new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10),
    });
    setFormOpen(true);
  };

  const openEdit = (row) => {
    setEditing(row);
    setSelectedFile(null);
    setShowUrlInput(Boolean(row.attachmentUrl && !row.attachmentUrl.startsWith('/uploads')));
    if (fileInputRef.current) fileInputRef.current.value = '';
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
      if (selectedFile) {
        const formData = new FormData();
        formData.append('title', form.title.trim());
        formData.append('batchId', form.batchId);
        if (form.description) formData.append('description', form.description.trim());
        if (form.startDate) formData.append('startDate', form.startDate);
        if (form.dueDate) formData.append('dueDate', form.dueDate);
        if (form.maxMarks != null) formData.append('maxMarks', String(form.maxMarks));
        if (form.status) formData.append('status', form.status);
        formData.append('file', selectedFile);

        if (editing) {
          await apiPut(API.ACADEMIC_ASSIGNMENT(editing.id), formData);
          toastService.success('Assignment updated successfully');
        } else {
          await apiPost(API.ACADEMIC_ASSIGNMENTS, formData);
          toastService.success('Assignment created and published');
        }
      } else {
        const body = {
          ...form,
          maxMarks: Number(form.maxMarks) || 100,
          startDate: form.startDate || null,
          dueDate: form.dueDate || null,
          attachmentUrl: form.attachmentUrl || null,
        };
        if (editing) {
          await apiPut(API.ACADEMIC_ASSIGNMENT(editing.id), body);
          toastService.success('Assignment updated successfully');
        } else {
          await apiPost(API.ACADEMIC_ASSIGNMENTS, body);
          toastService.success('Assignment created and published');
        }
      }
      setFormOpen(false);
      load();
    } catch (err) {
      toastService.error(err?.response?.data?.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await apiDelete(API.ACADEMIC_ASSIGNMENT(deleteTarget.id));
      toastService.success('Assignment deleted successfully');
      setDeleteTarget(null);
      load();
    } catch (err) {
      toastService.error(err?.response?.data?.message || 'Delete failed');
    } finally {
      setDeleting(false);
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
      await apiPut(API.ACADEMIC_ASSIGNMENT_REVIEW(detail.id, submissionId), {
        marks: draft.marks != null ? Number(draft.marks) : null,
        feedback: draft.feedback || null,
      });
      toastService.success('Submission evaluated');
      openDetail({ id: detail.id });
    } catch (err) {
      toastService.error(err?.response?.data?.message || 'Review failed');
    }
  };

  // KPIs & Summary Stat Items
  const kpis = useMemo(() => {
    const total = rows.length;
    const published = rows.filter((r) => r.status === 'PUBLISHED').length;
    const totalSubs = rows.reduce((acc, r) => acc + (r._count?.submissions || 0), 0);
    const drafts = rows.filter((r) => r.status === 'DRAFT').length;
    return { total, published, totalSubs, drafts };
  }, [rows]);

  const summaryItems = useMemo(() => [
    {
      key: 'total',
      label: 'Total Assignments',
      value: kpis.total,
      icon: FiClipboard,
      tone: 'neutral',
      filterValue: 'ALL',
      badge: 'All Tasks',
      badgeTone: 'bg-slate-100 text-slate-700',
    },
    {
      key: 'published',
      label: 'Published Live',
      value: kpis.published,
      icon: FiCheckCircle,
      tone: 'success',
      filterValue: 'PUBLISHED',
      badge: 'Active',
      badgeTone: 'bg-emerald-50 text-emerald-700',
    },
    {
      key: 'subs',
      label: 'Submissions Done',
      value: kpis.totalSubs,
      icon: FiUsers,
      tone: 'info',
      filterValue: 'HAS_SUBS',
      badge: 'Evaluated',
      badgeTone: 'bg-cyan-50 text-cyan-700',
    },
    {
      key: 'drafts',
      label: 'Draft Tasks',
      value: kpis.drafts,
      icon: FiClock,
      tone: 'warning',
      filterValue: 'DRAFT',
      badge: kpis.drafts > 0 ? 'Pending' : 'None',
      badgeTone: 'bg-amber-50 text-amber-700',
    },
  ], [kpis]);

  // Filtered rows
  const filteredRows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((r) => {
      if (statusFilter === 'HAS_SUBS' && !(r._count?.submissions > 0)) return false;
      else if (statusFilter !== 'ALL' && statusFilter !== 'HAS_SUBS' && r.status !== statusFilter) return false;
      if (batchFilter !== 'ALL' && String(r.batchId) !== String(batchFilter)) return false;
      if (!q) return true;
      const title = (r.title || '').toLowerCase();
      const bname = (r.batch?.name || '').toLowerCase();
      return title.includes(q) || bname.includes(q);
    });
  }, [rows, search, statusFilter, batchFilter]);

  if (loading && !rows.length) return <ContentLoader variant="dashboard" />;

  return (
    <div className="crm-tacademic">
      {/* ── Summary KPI Strip (Standard CRM UI) ── */}
      <div className="rounded-xl border border-border bg-card-bg shadow-xs overflow-hidden">
        <SummaryStatBar
          items={summaryItems}
          activeFilter={statusFilter}
          onSelect={(val) => setStatusFilter(val || 'ALL')}
          layout="grid"
          ariaLabel="Assignment Statistics"
        />
      </div>

      {/* ── Search & Filter Toolbar ── */}
      <div className="crm-tacademic-toolbar">
        <div className="crm-tacademic-search">
          <FiSearch className="text-slate-400" />
          <input
            type="search"
            placeholder="Search assignment title, prompt, or batch…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="crm-tacademic-filters">
          <button
            type="button"
            className={`crm-tacademic-pill ${statusFilter === 'ALL' ? 'is-active' : ''}`}
            onClick={() => setStatusFilter('ALL')}
          >
            All Status
          </button>
          <button
            type="button"
            className={`crm-tacademic-pill ${statusFilter === 'PUBLISHED' ? 'is-active' : ''}`}
            onClick={() => setStatusFilter('PUBLISHED')}
          >
            Published
          </button>
          <button
            type="button"
            className={`crm-tacademic-pill ${statusFilter === 'DRAFT' ? 'is-active' : ''}`}
            onClick={() => setStatusFilter('DRAFT')}
          >
            Drafts
          </button>

          {batchOptions.length > 1 && (
            <div className="w-40">
              <Select
                size="sm"
                searchable={false}
                allowClear={false}
                value={batchFilter}
                onChange={(val) => setBatchFilter(typeof val === 'string' ? val : val?.target?.value || val)}
                options={[{ value: 'ALL', label: 'All Batches' }, ...batchOptions]}
              />
            </div>
          )}

          {canManage && (
            <Button
              size="sm"
              icon={FiPlus}
              onClick={openCreate}
              disabled={batchesLoading || !batchOptions.length}
              className="shadow-xs font-bold shrink-0 ml-auto"
            >
              Create Assignment
            </Button>
          )}
        </div>
      </div>

      {/* ── Content Grid ── */}
      {!filteredRows.length ? (
        <EmptyState
          title="No assignments found"
          description={search ? "No tasks match your filter criteria." : "Create your first assignment for students."}
          action={canManage && (
            <Button size="sm" icon={FiPlus} onClick={openCreate}>
              New Assignment
            </Button>
          )}
        />
      ) : (
        <div className="crm-tacademic-grid">
          {filteredRows.map((row) => {
            const subCount = row._count?.submissions ?? 0;
            const isPublished = row.status === 'PUBLISHED';

            return (
              <div key={row.id} className="crm-tacademic-card">
                <div className="crm-tacademic-card__top">
                  <div className="crm-tacademic-card__header">
                    <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-lg uppercase tracking-wider bg-brand/10 text-brand border border-brand/20">
                      {row.batch?.name || 'Class Batch'}
                    </span>
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
                        isPublished
                          ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20'
                          : 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20'
                      }`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${isPublished ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                      {row.status}
                    </span>
                  </div>

                  <h3
                    className="crm-tacademic-card__title cursor-pointer hover:text-brand transition-colors"
                    title={row.title}
                    onClick={() => openDetail(row)}
                  >
                    {row.title}
                  </h3>

                  <div className="crm-tacademic-card__meta-bar">
                    <span className="flex items-center gap-1.5 font-medium text-slate-700 dark:text-slate-300">
                      <FiClock size={13} className="text-amber-500 shrink-0" />
                      Due: <strong>{formatDate(row.dueDate)}</strong>
                    </span>
                    <span className="text-slate-300 dark:text-slate-600">•</span>
                    <span className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                      <FiAward size={13} className="text-brand shrink-0" />
                      Max: <strong>{row.maxMarks ?? 100} pts</strong>
                    </span>
                  </div>

                  <div className="crm-tacademic-card__stat-box">
                    <div className="crm-tacademic-card__stat-item">
                      <strong>{subCount}</strong>
                      <span className="text-slate-500 dark:text-slate-400 text-[11px]">Submissions</span>
                    </div>
                    <div>
                      {subCount > 0 ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-500/20">
                          ● Review Ready
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                          Awaiting submissions
                        </span>
                      )}
                    </div>
                  </div>

                  {row.attachmentUrl && (
                    <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
                      <a
                        href={row.attachmentUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand hover:underline truncate max-w-full"
                        title="Open attachment"
                      >
                        <FiPaperclip size={13} className="shrink-0 text-slate-400" />
                        <span className="truncate">{row.attachmentUrl.split('/').pop() || 'Attachment Document'}</span>
                      </a>
                    </div>
                  )}
                </div>

                <div className="crm-tacademic-card__foot">
                  <Button
                    size="xs"
                    variant="primary"
                    className="font-bold shadow-xs !py-1.5 !px-3 rounded-xl flex items-center gap-1.5"
                    onClick={() => openDetail(row)}
                  >
                    <FiFileText size={13} /> Submissions ({subCount})
                  </Button>

                  {canManage && (
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => openEdit(row)}
                        title="Edit Assignment"
                        className="w-7 h-7 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
                      >
                        <FiEdit2 size={13} />
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleteTarget(row)}
                        title="Delete Assignment"
                        className="w-7 h-7 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 hover:border-rose-200 text-rose-600 transition-colors cursor-pointer"
                      >
                        <FiTrash2 size={13} />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Create / Edit Modal ── */}
      <Modal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title={editing ? 'Edit Assignment' : 'Create New Assignment'}
        size="md"
        footer={(
          <>
            <Button variant="outline" onClick={() => setFormOpen(false)}>
              Cancel
            </Button>
            <Button onClick={save} loading={saving}>
              {editing ? 'Update Assignment' : 'Create & Publish'}
            </Button>
          </>
        )}
      >
        <div className="grid gap-3">
          <Input
            label="Assignment Title"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder="e.g. IELTS Writing Task 2 — Opinion Essay"
            required
          />

          <Select
            label="Assigned Batch"
            value={form.batchId}
            onChange={(v) => setForm({ ...form, batchId: v })}
            options={batchOptions}
            allowClear={false}
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Assigned Start Date"
              type="date"
              value={form.startDate}
              onChange={(e) => setForm({ ...form, startDate: e.target.value })}
            />
            <Input
              label="Submission Due Date"
              type="date"
              value={form.dueDate}
              onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Maximum Marks"
              type="number"
              value={form.maxMarks}
              onChange={(e) => setForm({ ...form, maxMarks: e.target.value })}
            />
            <Select
              label="Publication Status"
              value={form.status}
              onChange={(v) => setForm({ ...form, status: v })}
              allowClear={false}
              options={[
                { value: 'PUBLISHED', label: 'Published (Visible to Students)' },
                { value: 'DRAFT', label: 'Draft (Teacher Only)' },
              ]}
            />
          </div>

          <Textarea
            label="Prompt Instructions & Description"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            rows={3}
            placeholder="Write assignment instructions, guidelines, word count requirement, etc."
          />

          <div>
            <label className="block text-xs font-semibold text-text mb-1.5 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <FiPaperclip className="text-brand" /> Attachment / Resource File (Optional)
              </span>
              {!showUrlInput && (
                <button
                  type="button"
                  onClick={() => setShowUrlInput(true)}
                  className="text-[11px] text-brand hover:underline font-normal"
                >
                  Or enter link URL
                </button>
              )}
            </label>

            {selectedFile ? (
              <div className="flex items-center justify-between p-2.5 rounded-lg border border-emerald-300 bg-emerald-50 text-emerald-900">
                <div className="flex items-center gap-2 min-w-0">
                  <FiFileText className="w-4 h-4 shrink-0 text-emerald-600" />
                  <span className="text-xs font-medium truncate">{selectedFile.name}</span>
                  <span className="text-[11px] text-emerald-700 shrink-0">
                    ({(selectedFile.size / 1024).toFixed(1)} KB)
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedFile(null);
                    if (fileInputRef.current) fileInputRef.current.value = '';
                  }}
                  className="p-1 rounded hover:bg-emerald-100 text-emerald-700 transition-colors"
                  title="Remove file"
                >
                  <FiX className="w-4 h-4" />
                </button>
              </div>
            ) : form.attachmentUrl && !showUrlInput ? (
              <div className="flex items-center justify-between p-2.5 rounded-lg border border-border bg-surface/50 text-text">
                <div className="flex items-center gap-2 min-w-0">
                  <FiFileText className="w-4 h-4 shrink-0 text-brand" />
                  <span className="text-xs font-medium truncate">
                    {form.attachmentUrl.split('/').pop() || 'Existing Attachment'}
                  </span>
                  <a
                    href={form.attachmentUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[11px] text-brand hover:underline shrink-0 font-medium inline-flex items-center gap-0.5"
                  >
                    View <FiExternalLink className="w-3 h-3" />
                  </a>
                </div>
                <button
                  type="button"
                  onClick={() => setForm({ ...form, attachmentUrl: '' })}
                  className="p-1 rounded hover:bg-hover text-text-muted hover:text-text transition-colors"
                  title="Remove attachment"
                >
                  <FiX className="w-4 h-4" />
                </button>
              </div>
            ) : showUrlInput ? (
              <div className="space-y-1.5">
                <Input
                  value={form.attachmentUrl}
                  onChange={(e) => setForm({ ...form, attachmentUrl: e.target.value })}
                  placeholder="https://drive.google.com/… or cloud document URL"
                />
                <button
                  type="button"
                  onClick={() => setShowUrlInput(false)}
                  className="text-[11px] text-text-muted hover:text-text"
                >
                  Switch back to file upload
                </button>
              </div>
            ) : (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="group relative border border-dashed border-border hover:border-brand/60 rounded-xl p-3 bg-surface/40 hover:bg-surface/80 transition-all cursor-pointer flex flex-col items-center justify-center text-center gap-1"
              >
                <div className="w-8 h-8 rounded-full bg-brand-soft text-brand flex items-center justify-center group-hover:scale-105 transition-transform">
                  <FiUploadCloud className="w-4 h-4" />
                </div>
                <p className="text-xs font-medium text-text">
                  <span className="text-brand font-semibold hover:underline">Click to upload</span> or drag and drop
                </p>
                <p className="text-[11px] text-text-muted">
                  PDF, DOCX, PPT, PPTX or Image (up to 30 MB)
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  accept=".pdf,.doc,.docx,.ppt,.pptx,.txt,.png,.jpg,.jpeg"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setSelectedFile(file);
                    }
                  }}
                />
              </div>
            )}
          </div>
        </div>
      </Modal>

      {/* ── Submissions Review Drawer / Modal ── */}
      <Modal
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
        title={detail ? `Submissions: ${detail.title}` : 'Submissions'}
        size="xl"
      >
        {!detail?.submissions?.length ? (
          <EmptyState
            title="No submissions yet"
            description="Students have not submitted their solutions for this assignment yet."
          />
        ) : (
          <div className="space-y-4">
            {detail.submissions.map((sub) => {
              const draft = reviewDraft[sub.id] || { marks: sub.marks ?? '', feedback: sub.feedback || '' };
              const sName = `${sub.student?.firstName || ''} ${sub.student?.lastName || ''}`.trim() || sub.student?.studentCode || 'Student';

              return (
                <div key={sub.id} className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
                  <div className="flex items-center justify-between gap-2 mb-2 pb-2 border-b border-slate-200">
                    <div>
                      <strong className="text-slate-900 text-sm block">{sName}</strong>
                      <span className="text-[11px] text-slate-500 font-mono">{sub.student?.studentCode} • Submitted {sub.submittedAt ? new Date(sub.submittedAt).toLocaleString('en-IN') : 'Recent'}</span>
                    </div>
                    <Badge color={sub.status === 'GRADED' ? 'success' : 'primary'} size="sm">
                      {sub.status || 'SUBMITTED'}
                    </Badge>
                  </div>

                  <div className="text-xs text-slate-700 bg-white p-2.5 rounded-lg border border-slate-200 mb-3 whitespace-pre-wrap">
                    {sub.submissionText || sub.content || 'Submission content submitted via portal.'}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 items-end">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">Awarded Marks (Max {detail.maxMarks ?? 100})</label>
                      <input
                        type="number"
                        className="w-full text-xs p-1.5 border border-slate-200 rounded bg-white"
                        placeholder="Marks"
                        value={draft.marks}
                        onChange={(e) => setReviewDraft((prev) => ({ ...prev, [sub.id]: { ...draft, marks: e.target.value } }))}
                      />
                    </div>
                    <div className="md:col-span-2 flex items-end gap-2">
                      <div className="flex-1">
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">Feedback Remarks</label>
                        <input
                          type="text"
                          className="w-full text-xs p-1.5 border border-slate-200 rounded bg-white"
                          placeholder="e.g. Excellent coherence, good arguments"
                          value={draft.feedback}
                          onChange={(e) => setReviewDraft((prev) => ({ ...prev, [sub.id]: { ...draft, feedback: e.target.value } }))}
                        />
                      </div>
                      <Button size="xs" onClick={() => review(sub.id)}>
                        Save Grade
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Modal>

      <DeleteConfirmModal
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
        title="Delete Assignment?"
        itemType="Assignment"
        itemName={deleteTarget?.title}
        itemDetails={
          deleteTarget
            ? `${deleteTarget.batch?.name || ''} · ${deleteTarget.maxMarks || 100} Max Marks`
            : ''
        }
        loading={deleting}
        confirmText="Delete Assignment"
      />
    </div>
  );
}
