import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  FiBookOpen,
  FiEdit2,
  FiPlus,
  FiTrash2,
  FiFileText,
  FiVideo,
  FiLink,
  FiFolder,
  FiSearch,
  FiDownload,
  FiExternalLink,
  FiUploadCloud,
} from 'react-icons/fi';
import Button from '../../../components/ui/Button';
import Badge from '../../../components/ui/Badge';
import ContentLoader from '../../../components/ui/ContentLoader';
import EmptyState from '../../../components/ui/EmptyState';
import Modal from '../../../components/ui/Modal';
import DeleteConfirmModal from '../../../components/ui/DeleteConfirmModal';
import SummaryStatBar from '../../../components/ui/SummaryStatBar';
import Input from '../../../components/ui/Input';
import Select from '../../../components/ui/Select';
import { apiDelete, apiGet, apiPost, apiPut } from '../../../api/apiClient';
import { API } from '../../../config/api';
import { usePermissions } from '../../../hooks/usePermissions';
import { PERMISSIONS } from '../../../config/permissions';
import toastService from '../../../services/toast/toast.service';
import { useTeacherBatches } from '../hooks/useTeacherBatches';
import { statusColor } from '../components/teacherWorkspaceUi';
import '../styles/teacher-academic.css';

const EMPTY_FORM = {
  title: '',
  batchId: '',
  category: '',
  materialType: 'DOCUMENT',
  fileUrl: '',
  externalUrl: '',
  status: 'PUBLISHED',
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
  const [selectedFile, setSelectedFile] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [batchFilter, setBatchFilter] = useState('ALL');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiGet(API.ACADEMIC_MATERIALS, { limit: 100 });
      setRows(res?.data || []);
    } catch (err) {
      toastService.error(err?.response?.data?.message || 'Unable to load study materials');
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
    setForm({ ...EMPTY_FORM, batchId: batchOptions[0]?.value || '' });
    setFormOpen(true);
  };

  const openEdit = (row) => {
    setEditing(row);
    setSelectedFile(null);
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
      if (selectedFile) {
        const formData = new FormData();
        formData.append('title', form.title.trim());
        formData.append('batchId', form.batchId);
        if (form.category) formData.append('category', form.category);
        if (form.materialType) formData.append('materialType', form.materialType);
        if (form.externalUrl) formData.append('externalUrl', form.externalUrl);
        if (form.status) formData.append('status', form.status);
        formData.append('file', selectedFile);

        if (editing) {
          await apiPut(API.ACADEMIC_MATERIAL(editing.id), formData);
          toastService.success('Material updated successfully');
        } else {
          await apiPost(API.ACADEMIC_MATERIALS, formData);
          toastService.success('Material added successfully');
        }
      } else {
        const body = {
          ...form,
          fileUrl: form.fileUrl || null,
          externalUrl: form.externalUrl || null,
          category: form.category || null,
        };
        if (editing) {
          await apiPut(API.ACADEMIC_MATERIAL(editing.id), body);
          toastService.success('Material updated successfully');
        } else {
          await apiPost(API.ACADEMIC_MATERIALS, body);
          toastService.success('Material added successfully');
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
      await apiDelete(API.ACADEMIC_MATERIAL(deleteTarget.id));
      toastService.success('Material removed successfully');
      setDeleteTarget(null);
      load();
    } catch (err) {
      toastService.error(err?.response?.data?.message || 'Delete failed');
    } finally {
      setDeleting(false);
    }
  };

  // KPIs & Summary Stat Items
  const kpis = useMemo(() => {
    const total = rows.length;
    const docs = rows.filter((r) => r.materialType === 'DOCUMENT' || r.fileUrl).length;
    const media = rows.filter((r) => r.materialType === 'VIDEO' || r.materialType === 'LINK' || r.externalUrl).length;
    const published = rows.filter((r) => r.status === 'PUBLISHED').length;
    return { total, docs, media, published };
  }, [rows]);

  const summaryItems = useMemo(() => [
    {
      key: 'total',
      label: 'Total Materials',
      value: kpis.total,
      icon: FiFolder,
      tone: 'neutral',
      filterValue: 'ALL',
      badge: 'All Assets',
      badgeTone: 'bg-slate-100 text-slate-700',
    },
    {
      key: 'docs',
      label: 'Documents & PDFs',
      value: kpis.docs,
      icon: FiFileText,
      tone: 'primary',
      filterValue: 'DOCUMENT',
      badge: 'Worksheets',
      badgeTone: 'bg-blue-50 text-blue-700',
    },
    {
      key: 'media',
      label: 'Links & Videos',
      value: kpis.media,
      icon: FiVideo,
      tone: 'info',
      filterValue: 'VIDEO',
      badge: 'Recordings',
      badgeTone: 'bg-cyan-50 text-cyan-700',
    },
    {
      key: 'published',
      label: 'Published Live',
      value: kpis.published,
      icon: FiBookOpen,
      tone: 'success',
      filterValue: 'PUBLISHED',
      badge: 'Active',
      badgeTone: 'bg-emerald-50 text-emerald-700',
    },
  ], [kpis]);

  // Filtered rows
  const filteredRows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((r) => {
      if (typeFilter === 'DOCUMENT' && !(r.materialType === 'DOCUMENT' || r.fileUrl)) return false;
      if (typeFilter === 'VIDEO' && !(r.materialType === 'VIDEO' || r.materialType === 'LINK' || r.externalUrl)) return false;
      if (typeFilter === 'PUBLISHED' && r.status !== 'PUBLISHED') return false;
      if (batchFilter !== 'ALL' && String(r.batchId) !== String(batchFilter)) return false;
      if (!q) return true;
      const title = (r.title || '').toLowerCase();
      const cat = (r.category || '').toLowerCase();
      const bname = (r.batch?.name || '').toLowerCase();
      return title.includes(q) || cat.includes(q) || bname.includes(q);
    });
  }, [rows, search, typeFilter, batchFilter]);

  if (loading && !rows.length) return <ContentLoader variant="dashboard" />;

  return (
    <div className="crm-tacademic">
      {/* ── Summary KPI Strip (Standard CRM UI) ── */}
      <div className="rounded-xl border border-border bg-card-bg shadow-xs overflow-hidden">
        <SummaryStatBar
          items={summaryItems}
          activeFilter={typeFilter}
          onSelect={(val) => setTypeFilter(val || 'ALL')}
          layout="grid"
          ariaLabel="Material Statistics"
        />
      </div>

      {/* ── Search & Filter Toolbar ── */}
      <div className="crm-tacademic-toolbar">
        <div className="crm-tacademic-search">
          <FiSearch className="text-slate-400" />
          <input
            type="search"
            placeholder="Search material title, category, or batch…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="crm-tacademic-filters">
          <button
            type="button"
            className={`crm-tacademic-pill ${typeFilter === 'ALL' ? 'is-active' : ''}`}
            onClick={() => setTypeFilter('ALL')}
          >
            All Types
          </button>
          <button
            type="button"
            className={`crm-tacademic-pill ${typeFilter === 'DOCUMENT' ? 'is-active' : ''}`}
            onClick={() => setTypeFilter('DOCUMENT')}
          >
            Documents
          </button>
          <button
            type="button"
            className={`crm-tacademic-pill ${typeFilter === 'VIDEO' ? 'is-active' : ''}`}
            onClick={() => setTypeFilter('VIDEO')}
          >
            Videos
          </button>
          <button
            type="button"
            className={`crm-tacademic-pill ${typeFilter === 'LINK' ? 'is-active' : ''}`}
            onClick={() => setTypeFilter('LINK')}
          >
            Links
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
              Add New Resource
            </Button>
          )}
        </div>
      </div>

      {/* ── Content Grid ── */}
      {!filteredRows.length ? (
        <EmptyState
          title="No materials found"
          description={search ? "No study resources match your search." : "Upload or link your first study material above."}
          action={canManage && (
            <Button size="sm" icon={FiPlus} onClick={openCreate}>
              Upload Material
            </Button>
          )}
        />
      ) : (
        <div className="crm-tacademic-grid">
          {filteredRows.map((row) => {
            const isDoc = row.materialType === 'DOCUMENT' || Boolean(row.fileUrl);
            const isVideo = row.materialType === 'VIDEO';
            const isLink = row.materialType === 'LINK';
            const resourceUrl = row.fileUrl || row.externalUrl;
            const isPublished = row.status === 'PUBLISHED';

            return (
              <div key={row.id} className="crm-tacademic-card">
                <div className="crm-tacademic-card__top">
                  <div className="crm-tacademic-card__header">
                    <div className="flex items-center gap-2">
                      <span
                        className={`p-2 rounded-xl shrink-0 ${
                          isVideo
                            ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                            : isLink
                              ? 'bg-purple-500/10 text-purple-600 dark:text-purple-400'
                              : 'bg-blue-500/10 text-blue-600 dark:text-blue-400'
                        }`}
                      >
                        {isVideo ? <FiVideo size={16} /> : isLink ? <FiLink size={16} /> : <FiFileText size={16} />}
                      </span>
                      <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-lg uppercase tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700">
                        {row.category || row.materialType || 'RESOURCE'}
                      </span>
                    </div>
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
                    onClick={() => {
                      if (resourceUrl) window.open(resourceUrl, '_blank', 'noopener,noreferrer');
                    }}
                  >
                    {row.title}
                  </h3>

                  <div className="crm-tacademic-card__meta-bar">
                    <span className="font-semibold text-brand">
                      {row.batch?.name || 'Class Batch'}
                    </span>
                    <span className="text-slate-300 dark:text-slate-600">•</span>
                    <span className="flex items-center gap-1 text-slate-500 dark:text-slate-400">
                      {row.createdAt ? new Date(row.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Recent'}
                    </span>
                  </div>

                  {resourceUrl && (
                    <div className="mt-3">
                      <a
                        href={resourceUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 hover:border-brand/40 hover:bg-white dark:hover:bg-slate-800 text-xs font-semibold text-brand transition-all group"
                      >
                        <span className="flex items-center gap-2 truncate">
                          {isDoc ? <FiDownload className="shrink-0 text-blue-500" /> : <FiExternalLink className="shrink-0 text-purple-500" />}
                          <span className="truncate">{isDoc ? 'Download / View File' : 'Open Resource Link'}</span>
                        </span>
                        <span className="text-[11px] text-slate-400 group-hover:text-brand transition-colors shrink-0 font-bold">
                          →
                        </span>
                      </a>
                    </div>
                  )}
                </div>

                <div className="crm-tacademic-card__foot">
                  <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                    {isDoc ? 'Document File' : isVideo ? 'Video Lecture' : 'Web Link'}
                  </span>

                  {canManage && (
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => openEdit(row)}
                        title="Edit Resource"
                        className="w-7 h-7 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
                      >
                        <FiEdit2 size={13} />
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleteTarget(row)}
                        title="Delete Resource"
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

      {/* ── Add / Edit Modal ── */}
      <Modal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title={editing ? 'Edit Study Material' : 'Add New Study Material'}
        size="md"
        compact
        footer={(
          <>
            <Button variant="outline" onClick={() => setFormOpen(false)}>
              Cancel
            </Button>
            <Button onClick={save} loading={saving}>
              {editing ? 'Update Resource' : 'Publish Resource'}
            </Button>
          </>
        )}
      >
        <div className="grid gap-3.5">
          <Input
            label="Material Title"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder="e.g. IELTS Writing Task 2 Vocabulary & Connectors"
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
              label="Category / Tag"
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              placeholder="e.g. Notes, Formula Sheet, Essay Bank"
            />
            <Select
              label="Resource Type"
              value={form.materialType}
              onChange={(v) => setForm({ ...form, materialType: v })}
              allowClear={false}
              options={[
                { value: 'DOCUMENT', label: 'Document (PDF / DOC)' },
                { value: 'VIDEO', label: 'Video (MP4 / Stream)' },
                { value: 'LINK', label: 'External Web Link' },
                { value: 'OTHER', label: 'Other Reference' },
              ]}
            />
          </div>

          <div className="p-3 border border-dashed border-slate-300 rounded-xl bg-slate-50/50">
            <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
              <FiUploadCloud className="text-blue-600" /> Upload Document / File (PDF, DOC, PPT, Images)
            </label>
            <input
              type="file"
              accept=".pdf,.png,.jpg,.jpeg,.doc,.docx,.ppt,.pptx"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  setSelectedFile(file);
                  if (!form.title.trim()) {
                    setForm((prev) => ({
                      ...prev,
                      title: file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' '),
                    }));
                  }
                }
              }}
              className="text-xs text-slate-600 file:mr-2 file:py-1.5 file:px-3 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700 cursor-pointer block w-full p-1.5 border border-slate-200 rounded-lg bg-white"
            />
            {selectedFile && (
              <span className="block text-xs font-semibold text-emerald-600 mt-1.5">
                ✓ {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB) attached
              </span>
            )}
          </div>

          <Input
            label="External Resource URL (Optional)"
            value={form.externalUrl}
            onChange={(e) => setForm({ ...form, externalUrl: e.target.value })}
            placeholder="https://drive.google.com/… or https://youtube.com/…"
          />

          <Select
            label="Publish Status"
            value={form.status}
            onChange={(v) => setForm({ ...form, status: v })}
            allowClear={false}
            options={[
              { value: 'PUBLISHED', label: 'Published (Visible to Students)' },
              { value: 'DRAFT', label: 'Draft (Teacher Only)' },
            ]}
          />
        </div>
      </Modal>

      <DeleteConfirmModal
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
        title="Remove Study Material?"
        itemType="Study Material"
        itemName={deleteTarget?.title}
        itemDetails={
          deleteTarget
            ? `${deleteTarget.batch?.name || ''} · ${deleteTarget.materialType || 'DOCUMENT'}`
            : ''
        }
        loading={deleting}
        confirmText="Remove Material"
      />
    </div>
  );
}
