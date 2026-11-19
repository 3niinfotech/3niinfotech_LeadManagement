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
  FiGrid,
  FiList,
} from 'react-icons/fi';
import Button from '../../../components/ui/Button';
import Badge from '../../../components/ui/Badge';
import ContentLoader from '../../../components/ui/ContentLoader';
import EmptyState from '../../../components/ui/EmptyState';
import Modal from '../../../components/ui/Modal';
import DeleteConfirmModal from '../../../components/ui/DeleteConfirmModal';
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
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'table'

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
      {/* ── Search & Filter Toolbar ── */}
      <div className="crm-tacademic-toolbar">
        <div className="crm-tacademic-search">
          <FiSearch className="text-slate-400" />
          <input
            type="search"
            placeholder="Search resources by title, category, or batch…"
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
            All ({rows.length})
          </button>
          <button
            type="button"
            className={`crm-tacademic-pill ${typeFilter === 'DOCUMENT' ? 'is-active' : ''}`}
            onClick={() => setTypeFilter('DOCUMENT')}
          >
            Documents ({kpis.docs})
          </button>
          <button
            type="button"
            className={`crm-tacademic-pill ${typeFilter === 'VIDEO' ? 'is-active' : ''}`}
            onClick={() => setTypeFilter('VIDEO')}
          >
            Videos ({kpis.videos})
          </button>
          <button
            type="button"
            className={`crm-tacademic-pill ${typeFilter === 'LINK' ? 'is-active' : ''}`}
            onClick={() => setTypeFilter('LINK')}
          >
            Links ({kpis.links})
          </button>

          {batchOptions.length > 1 && (
            <div className="w-36">
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

          <div className="crm-tacademic-view-switch">
            <button
              type="button"
              className={`crm-tacademic-view-btn ${viewMode === 'grid' ? 'is-active' : ''}`}
              onClick={() => setViewMode('grid')}
              title="Card Grid View"
            >
              <FiGrid />
            </button>
            <button
              type="button"
              className={`crm-tacademic-view-btn ${viewMode === 'table' ? 'is-active' : ''}`}
              onClick={() => setViewMode('table')}
              title="Data Table View"
            >
              <FiList />
            </button>
          </div>

          {canManage && (
            <Button
              size="sm"
              icon={FiPlus}
              onClick={openCreate}
              disabled={batchesLoading || !batchOptions.length}
              className="shadow-xs font-semibold shrink-0 ml-auto"
            >
              Add Resource
            </Button>
          )}
        </div>
      </div>

      {/* ── Content View ── */}
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
      ) : viewMode === 'grid' ? (
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
                  <div className="crm-tacademic-card__head">
                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-text-muted">
                      {isVideo ? <FiVideo size={13} className="text-rose-500" /> : isLink ? <FiLink size={13} className="text-purple-500" /> : <FiFileText size={13} className="text-brand" />}
                      <span className="uppercase tracking-wider text-[11px]">{row.category || row.materialType || 'RESOURCE'}</span>
                    </span>
                    <span className={`inline-flex items-center gap-1 text-[11px] font-medium ${
                      isPublished ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${isPublished ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                      {isPublished ? 'Published' : 'Draft'}
                    </span>
                  </div>

                  <h3
                    className="crm-tacademic-card__title hover:text-brand cursor-pointer transition-colors truncate"
                    title={row.title}
                    onClick={() => {
                      if (resourceUrl) window.open(resourceUrl, '_blank', 'noopener,noreferrer');
                    }}
                  >
                    {row.title}
                  </h3>

                  <div className="crm-tacademic-card__meta-row">
                    <span className="text-text-muted font-medium truncate">
                      {row.batch?.name || 'Class Batch'}
                    </span>
                    <span>•</span>
                    <span className="text-text-muted shrink-0">
                      {row.createdAt ? new Date(row.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) : 'Recent'}
                    </span>
                  </div>
                </div>

                <div className="crm-tacademic-card__foot">
                  {resourceUrl ? (
                    <Button
                      size="xs"
                      variant="outline"
                      className="text-xs font-medium"
                      onClick={() => window.open(resourceUrl, '_blank', 'noopener,noreferrer')}
                    >
                      {isDoc ? <FiDownload size={12} /> : <FiExternalLink size={12} />}
                      <span>{isDoc ? 'View Document' : 'Open Link'}</span>
                    </Button>
                  ) : (
                    <span className="text-xs text-text-muted italic">No link attached</span>
                  )}

                  {canManage && (
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => openEdit(row)}
                        title="Edit Resource"
                        className="p-1 rounded hover:bg-bg-page text-text-muted hover:text-text transition-colors cursor-pointer"
                      >
                        <FiEdit2 size={13} />
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleteTarget(row)}
                        title="Delete Resource"
                        className="p-1 rounded hover:bg-rose-50 text-text-muted hover:text-rose-600 transition-colors cursor-pointer"
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
      ) : (
        <div className="crm-tacademic-table-wrap">
          <table className="crm-tacademic-table">
            <thead>
              <tr>
                <th>Resource Title</th>
                <th>Type</th>
                <th>Category</th>
                <th>Batch</th>
                <th>Added Date</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredRows.map((row) => {
                const isDoc = row.materialType === 'DOCUMENT' || Boolean(row.fileUrl);
                const isVideo = row.materialType === 'VIDEO';
                const isLink = row.materialType === 'LINK';
                const resourceUrl = row.fileUrl || row.externalUrl;
                const isPublished = row.status === 'PUBLISHED';

                return (
                  <tr key={row.id}>
                    <td>
                      <span
                        className="font-semibold text-text hover:text-brand cursor-pointer block truncate max-w-xs"
                        onClick={() => {
                          if (resourceUrl) window.open(resourceUrl, '_blank', 'noopener,noreferrer');
                        }}
                      >
                        {row.title}
                      </span>
                    </td>
                    <td>
                      <span className="inline-flex items-center gap-1 text-xs">
                        {isVideo ? <FiVideo size={12} className="text-rose-500" /> : isLink ? <FiLink size={12} className="text-purple-500" /> : <FiFileText size={12} className="text-brand" />}
                        <span className="capitalize">{row.materialType?.toLowerCase() || 'document'}</span>
                      </span>
                    </td>
                    <td>
                      <span className="text-xs text-text-muted">{row.category || '—'}</span>
                    </td>
                    <td>
                      <span className="text-xs text-text-muted">{row.batch?.name || '—'}</span>
                    </td>
                    <td>
                      <span className="text-xs">
                        {row.createdAt ? new Date(row.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) : '—'}
                      </span>
                    </td>
                    <td>
                      <span className={`inline-flex items-center gap-1 text-xs font-medium ${
                        isPublished ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${isPublished ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                        {isPublished ? 'Published' : 'Draft'}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div className="inline-flex items-center gap-1.5">
                        {resourceUrl && (
                          <Button
                            size="xs"
                            variant="outline"
                            onClick={() => window.open(resourceUrl, '_blank', 'noopener,noreferrer')}
                          >
                            {isDoc ? 'View Document' : 'Open Link'}
                          </Button>
                        )}
                        {canManage && (
                          <>
                            <button
                              type="button"
                              onClick={() => openEdit(row)}
                              title="Edit"
                              className="p-1 rounded hover:bg-bg-page text-text-muted hover:text-text cursor-pointer"
                            >
                              <FiEdit2 size={13} />
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeleteTarget(row)}
                              title="Delete"
                              className="p-1 rounded hover:bg-rose-50 text-text-muted hover:text-rose-600 cursor-pointer"
                            >
                              <FiTrash2 size={13} />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
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
