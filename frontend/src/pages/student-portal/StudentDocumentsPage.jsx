import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  FiExternalLink,
  FiUpload,
  FiCheckCircle,
  FiClock,
  FiAlertCircle,
  FiFolder,
  FiFileText,
  FiImage,
  FiAward,
  FiDollarSign,
  FiShield,
  FiCheck,
  FiX,
  FiTrash2,
  FiLink,
  FiPaperclip,
} from 'react-icons/fi';
import { apiGet, apiPost } from '../../api/apiClient';
import { API } from '../../config/api';
import toastService from '../../services/toast/toast.service';
import { formatDate } from './components/portalFormat';
import { PortalSkeletonPage } from '../../components/portal/PortalUi';
import './student-dashboard.theme.css';

const EMPTY_FORM = { name: '', category: 'OTHER', remarks: '', fileUrl: '' };

const CATEGORY_META = {
  PASSPORT: { label: 'Passport', icon: FiShield, color: '#3b82f6', bg: '#eff6ff' },
  ACADEMIC: { label: 'Academic', icon: FiAward, color: '#8b5cf6', bg: '#f5f3ff' },
  LANGUAGE_TEST: { label: 'Language Test', icon: FiAward, color: '#06b6d4', bg: '#ecfeff' },
  FINANCIAL: { label: 'Financial', icon: FiDollarSign, color: '#10b981', bg: '#ecfdf5' },
  PHOTO: { label: 'Photo & ID', icon: FiImage, color: '#f59e0b', bg: '#fffbeb' },
  VISA: { label: 'Visa File', icon: FiFileText, color: '#6366f1', bg: '#eef2ff' },
  OTHER: { label: 'Other', icon: FiFolder, color: '#64748b', bg: '#f8fafc' },
};

function getCategoryConfig(category) {
  const c = String(category || '').toUpperCase();
  return CATEGORY_META[c] || CATEGORY_META.OTHER;
}

function formatFileSize(bytes) {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

function guessCategory(filename) {
  const f = String(filename || '').toLowerCase();
  if (/passport/i.test(f)) return 'PASSPORT';
  if (/ielts|pte|toefl|duolingo|gre|gmat/i.test(f)) return 'LANGUAGE_TEST';
  if (/marksheet|degree|diploma|transcript|10th|12th|academic|result|cbse|gseb/i.test(f)) return 'ACADEMIC';
  if (/bank|solvency|statement|financial|itr|tax|affidavit|loan/i.test(f)) return 'FINANCIAL';
  if (/photo|signature|sign|avatar|image|selfie|id_card|aadhar|pan/i.test(f)) return 'PHOTO';
  if (/visa|offer|cas|i20|coe|sop|lor/i.test(f)) return 'VISA';
  return null;
}

function cleanFileName(filename) {
  return String(filename || '')
    .replace(/\.[^/.]+$/, '')
    .replace(/[_-]+/g, ' ')
    .trim()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function StudentDocumentsPage() {
  const [categories, setCategories] = useState([]);
  const [rows, setRows] = useState([]);
  const [filterCategory, setFilterCategory] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [replaceId, setReplaceId] = useState(null);

  // Advanced File Upload States
  const [uploadMode, setUploadMode] = useState('file'); // 'file' | 'url'
  const [selectedFile, setSelectedFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

  const resetUploadState = useCallback(() => {
    setForm(EMPTY_FORM);
    setReplaceId(null);
    setSelectedFile(null);
    if (filePreview) {
      URL.revokeObjectURL(filePreview);
      setFilePreview(null);
    }
    setIsDragging(false);
    setUploadMode('file');
    if (fileInputRef.current) fileInputRef.current.value = '';
    setShowUpload(false);
  }, [filePreview]);

  const handleFileChosen = useCallback((file) => {
    if (!file) return;
    if (file.size > 30 * 1024 * 1024) {
      toastService.error('File size exceeds 30MB limit');
      return;
    }
    setSelectedFile(file);
    if (filePreview) {
      URL.revokeObjectURL(filePreview);
    }
    if (file.type && file.type.startsWith('image/')) {
      setFilePreview(URL.createObjectURL(file));
    } else {
      setFilePreview(null);
    }

    setForm((prev) => {
      const next = { ...prev };
      if (!next.name.trim()) {
        next.name = cleanFileName(file.name || 'Uploaded Document');
      }
      if (next.category === 'OTHER' || !next.category) {
        const guessed = guessCategory(file.name);
        if (guessed) next.category = guessed;
      }
      return next;
    });
  }, [filePreview]);

  // Clipboard Paste Support (Ctrl+V) when upload modal/panel is open
  useEffect(() => {
    if (!showUpload) return;
    const handlePaste = (e) => {
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target?.tagName)) return;
      const items = e.clipboardData?.items;
      if (!items) return;
      for (const item of items) {
        if (item.kind === 'file') {
          const file = item.getAsFile();
          if (file) {
            e.preventDefault();
            handleFileChosen(file);
            toastService.success(`Pasted file from clipboard: "${file.name || 'document'}"`);
            break;
          }
        }
      }
    };
    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [showUpload, handleFileChosen]);

  const loadDocuments = useCallback(() => {
    const params = filterCategory ? { category: filterCategory } : {};
    return apiGet(API.PORTAL_STUDENT_DOCUMENTS, params).then((res) => {
      const payload = res.data || {};
      setRows(payload.data || []);
      setCategories(payload.categories || []);
    });
  }, [filterCategory]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    loadDocuments()
      .catch(() => {
        if (!cancelled) setRows([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [loadDocuments]);

  const summary = useMemo(() => ({
    verified: rows.filter((r) => r.status === 'VERIFIED').length,
    pending: rows.filter((r) => ['UNDER_REVIEW', 'UPLOADED', 'PENDING'].includes(r.status)).length,
    rejected: rows.filter((r) => r.status === 'REJECTED').length,
    total: rows.length,
  }), [rows]);

  const categoryCounts = useMemo(() => {
    const map = {};
    rows.forEach((r) => {
      const cat = r.category || 'OTHER';
      map[cat] = (map[cat] || 0) + 1;
    });
    return map;
  }, [rows]);

  const startReplace = (doc) => {
    setReplaceId(doc.id);
    setSelectedFile(null);
    setFilePreview(null);
    setUploadMode('file');
    setShowUpload(true);
    setForm({
      name: doc.name,
      category: doc.category || 'OTHER',
      fileUrl: '',
      remarks: doc.studentRemarks || '',
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toastService.error('Document title is required');
      return;
    }

    if (uploadMode === 'file' && !selectedFile) {
      toastService.error('Please select, drag & drop, or paste a document file');
      return;
    }

    if (uploadMode === 'url' && !form.fileUrl.trim()) {
      toastService.error('Please enter a valid file or cloud link URL');
      return;
    }

    setSubmitting(true);
    try {
      if (uploadMode === 'file' && selectedFile) {
        const formData = new FormData();
        formData.append('file', selectedFile);
        formData.append('name', form.name.trim());
        formData.append('category', form.category);
        if (form.remarks.trim()) {
          formData.append('remarks', form.remarks.trim());
        }
        if (replaceId) {
          formData.append('replaceId', replaceId);
        }
        await apiPost(API.PORTAL_STUDENT_DOCUMENTS, formData);
      } else {
        await apiPost(API.PORTAL_STUDENT_DOCUMENTS, {
          name: form.name.trim(),
          category: form.category,
          fileUrl: form.fileUrl.trim(),
          remarks: form.remarks.trim() || undefined,
          ...(replaceId ? { replaceId } : {}),
        });
      }

      toastService.success(replaceId ? 'Document re-submitted for review' : 'Document successfully submitted for review');
      resetUploadState();
      await loadDocuments();
    } catch (err) {
      toastService.error(err?.response?.data?.message || err?.message || 'Upload failed');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <PortalSkeletonPage />;

  const displayList = filterCategory
    ? rows.filter((r) => (r.category || 'OTHER') === filterCategory)
    : rows;

  return (
    <div className="crm-stu-page-container">
      {/* ── 4 Top KPI Stat Cards ── */}
      <div className="crm-stu-att-kpi-grid">
        <div className="crm-stu-att-kpi-card crm-stu-att-kpi-card--primary">
          <div className="crm-stu-att-kpi-card__header">
            <span className="crm-stu-att-kpi-card__label">Verified Documents</span>
            <FiCheckCircle className="crm-stu-att-kpi-card__icon--green" />
          </div>
          <div className="crm-stu-att-kpi-card__body">
            <span className="crm-stu-att-kpi-card__value">{summary.verified}</span>
            <span className="crm-stu-chip crm-stu-chip--success">Verified Standing</span>
          </div>
          <div className="crm-stu-progress-track" style={{ marginTop: '0.65rem' }}>
            <div
              className="crm-stu-progress-fill--ok"
              style={{ width: `${summary.total ? Math.round((summary.verified / summary.total) * 100) : 0}%` }}
            />
          </div>
        </div>

        <div className="crm-stu-att-kpi-card">
          <div className="crm-stu-att-kpi-card__header">
            <span className="crm-stu-att-kpi-card__label">Under Review</span>
            <FiClock className="crm-stu-att-kpi-card__icon--amber" />
          </div>
          <div className="crm-stu-att-kpi-card__body">
            <span className="crm-stu-att-kpi-card__value">{summary.pending}</span>
            <span className="crm-stu-chip crm-stu-chip--amber">Counsellor Review</span>
          </div>
          <div className="crm-stu-course-progress-card__sub" style={{ marginTop: '0.45rem' }}>
            Verification in progress with branch admissions
          </div>
        </div>

        <div className="crm-stu-att-kpi-card">
          <div className="crm-stu-att-kpi-card__header">
            <span className="crm-stu-att-kpi-card__label">Action Required</span>
            <FiAlertCircle className="crm-stu-att-kpi-card__icon" />
          </div>
          <div className="crm-stu-att-kpi-card__body">
            <span className="crm-stu-att-kpi-card__value">{summary.rejected}</span>
            <span className="crm-stu-chip crm-stu-chip--brand">
              {summary.rejected === 0 ? 'All Up to Date' : 'Resubmit Needed'}
            </span>
          </div>
          <div className="crm-stu-course-progress-card__sub" style={{ marginTop: '0.45rem' }}>
            {summary.rejected === 0 ? 'Zero rejected documents' : 'Revise files with counsellor notes'}
          </div>
        </div>

        <div className="crm-stu-att-kpi-card">
          <div className="crm-stu-att-kpi-card__header">
            <span className="crm-stu-att-kpi-card__label">Total Portfolio</span>
            <FiFolder className="crm-stu-att-kpi-card__icon" />
          </div>
          <div className="crm-stu-att-kpi-card__body">
            <span className="crm-stu-att-kpi-card__value">{summary.total}</span>
            <span className="crm-stu-chip crm-stu-chip--neutral">Active Files</span>
          </div>
          <div className="crm-stu-course-progress-card__sub" style={{ marginTop: '0.45rem' }}>
            Complete compliance checklist uploaded
          </div>
        </div>
      </div>

      {/* ── Document Portfolio Main Card ── */}
      <div className="crm-stu-card">
        {/* Header & Submit Button */}
        <div className="crm-stu-section-head" style={{ marginBottom: '0.65rem' }}>
          <div>
            <h2 className="crm-stu-section-title">Official Document Portfolio</h2>
            <p className="crm-stu-section-desc">
              Scanned credentials, identity verification, and financial proofs for university & visa processing
            </p>
          </div>
          <button
            type="button"
            className={`crm-stu-btn ${showUpload ? 'crm-stu-btn--secondary' : 'crm-stu-btn--primary'}`}
            style={{ fontSize: '0.8125rem', padding: '0.45rem 1rem', display: 'inline-flex', alignItems: 'center', gap: '0.45rem' }}
            onClick={() => {
              if (showUpload) {
                resetUploadState();
              } else {
                setShowUpload(true);
              }
            }}
          >
            {showUpload ? <FiX /> : <FiUpload />}
            {showUpload ? 'Close Upload' : 'Submit New Document'}
          </button>
        </div>

        {/* ── Upload Form Panel (When Expanded) ── */}
        {showUpload && (
          <div
            style={{
              padding: '1.15rem 1.25rem',
              borderRadius: 14,
              background: '#f8fafc',
              border: '1px solid #cbd5e1',
              marginBottom: '1.25rem',
              boxShadow: '0 4px 12px rgba(15, 23, 42, 0.04)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.85rem' }}>
              <div>
                <strong style={{ fontSize: '0.9375rem', color: '#0f172a', display: 'block' }}>
                  {replaceId ? 'Re-submit Revised Document' : 'Submit Document for Review'}
                </strong>
                <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                  Upload verified scanned certificates, passports, tests, or academic transcripts
                </span>
              </div>
              <span className="crm-stu-chip crm-stu-chip--brand" style={{ padding: '0.2rem 0.6rem' }}>
                Secure Upload
              </span>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              {/* Hidden File Input for Native Picker */}
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.png,.jpg,.jpeg,.doc,.docx,.webp"
                style={{ display: 'none' }}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFileChosen(file);
                }}
              />

              {/* ── Dropzone & Upload Mode Selector ── */}
              {uploadMode === 'file' ? (
                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '0.35rem' }}>
                    Document File * <span style={{ fontWeight: 400, color: '#64748b' }}>(Click to browse, drag &amp; drop, or paste with Ctrl+V)</span>
                  </label>

                  {!selectedFile ? (
                    <div
                      onDragOver={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setIsDragging(true);
                      }}
                      onDragEnter={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setIsDragging(true);
                      }}
                      onDragLeave={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setIsDragging(false);
                      }}
                      onDrop={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setIsDragging(false);
                        const file = e.dataTransfer?.files?.[0];
                        if (file) handleFileChosen(file);
                      }}
                      onClick={() => fileInputRef.current?.click()}
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          fileInputRef.current?.click();
                        }
                      }}
                      style={{
                        border: isDragging ? '2px dashed #2563eb' : '2px dashed #cbd5e1',
                        background: isDragging ? '#eff6ff' : '#ffffff',
                        borderRadius: 12,
                        padding: '1.75rem 1rem',
                        textAlign: 'center',
                        cursor: 'pointer',
                        transition: 'all 0.18s ease',
                        outline: 'none',
                      }}
                    >
                      <div
                        style={{
                          width: 48,
                          height: 48,
                          borderRadius: '50%',
                          background: isDragging ? '#dbeafe' : '#f1f5f9',
                          color: '#2563eb',
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '1.4rem',
                          marginBottom: '0.55rem',
                          transition: 'all 0.18s ease',
                        }}
                      >
                        <FiUpload />
                      </div>

                      <div style={{ fontSize: '0.875rem', fontWeight: 700, color: '#0f172a' }}>
                        {isDragging ? 'Drop file here to upload' : 'Click to upload or drag & drop file here'}
                      </div>

                      <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem' }}>
                        Supports PDF, JPG, PNG, DOCX up to 30MB · <span style={{ color: '#2563eb', fontWeight: 600 }}>Ctrl+V</span> to paste clipboard image/file
                      </div>
                    </div>
                  ) : (
                    <div
                      style={{
                        border: '1.5px solid #bfdbfe',
                        background: '#f8faff',
                        borderRadius: 12,
                        padding: '0.85rem 1.15rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '0.85rem',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', minWidth: 0 }}>
                        {filePreview ? (
                          <img
                            src={filePreview}
                            alt="Preview"
                            style={{
                              width: 46,
                              height: 46,
                              borderRadius: 8,
                              objectFit: 'cover',
                              border: '1px solid #cbd5e1',
                              flexShrink: 0,
                            }}
                          />
                        ) : (
                          <div
                            style={{
                              width: 46,
                              height: 46,
                              borderRadius: 8,
                              background: '#dbeafe',
                              color: '#2563eb',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '1.35rem',
                              flexShrink: 0,
                            }}
                          >
                            <FiFileText />
                          </div>
                        )}

                        <div style={{ minWidth: 0 }}>
                          <div
                            style={{
                              fontSize: '0.875rem',
                              fontWeight: 700,
                              color: '#0f172a',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}
                            title={selectedFile.name}
                          >
                            {selectedFile.name}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.15rem' }}>
                            <span>{formatFileSize(selectedFile.size)}</span>
                            <span>•</span>
                            <span className="crm-stu-chip crm-stu-chip--success" style={{ padding: '0.1rem 0.45rem', fontSize: '0.6875rem' }}>
                              ✓ File selected &amp; ready
                            </span>
                          </div>
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', flexShrink: 0 }}>
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="crm-stu-btn crm-stu-btn--secondary"
                          style={{ fontSize: '0.75rem', padding: '0.35rem 0.75rem' }}
                        >
                          Change File
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedFile(null);
                            if (filePreview) URL.revokeObjectURL(filePreview);
                            setFilePreview(null);
                            if (fileInputRef.current) fileInputRef.current.value = '';
                          }}
                          className="crm-stu-btn crm-stu-btn--secondary"
                          style={{ fontSize: '0.75rem', padding: '0.35rem 0.55rem', color: '#ef4444' }}
                          title="Remove File"
                        >
                          <FiTrash2 />
                        </button>
                      </div>
                    </div>
                  )}

                  <div style={{ marginTop: '0.35rem', display: 'flex', justifyContent: 'flex-end' }}>
                    <button
                      type="button"
                      onClick={() => setUploadMode('url')}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#2563eb',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        padding: 0,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.3rem',
                      }}
                    >
                      <FiLink size={12} /> Have an external cloud URL or Drive link instead?
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                    <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#334155' }}>
                      File Link or Cloud URL *
                    </label>
                    <button
                      type="button"
                      onClick={() => setUploadMode('file')}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#2563eb',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        padding: 0,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.3rem',
                      }}
                    >
                      <FiUpload size={12} /> Switch back to Click &amp; Drag-and-Drop Upload
                    </button>
                  </div>
                  <input
                    type="text"
                    value={form.fileUrl}
                    onChange={(e) => setForm({ ...form, fileUrl: e.target.value })}
                    placeholder="Paste secure link or file path (e.g. https://drive.google.com/... or /uploads/...)"
                    required={uploadMode === 'url'}
                    style={{
                      width: '100%',
                      padding: '0.55rem 0.75rem',
                      borderRadius: 8,
                      border: '1px solid #cbd5e1',
                      fontSize: '0.8125rem',
                      background: '#ffffff',
                    }}
                  />
                </div>
              )}

              {/* Title & Category Fields */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '0.65rem' }}>
                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '0.25rem' }}>
                    Document Title *
                  </label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="e.g. 12th Standard Marksheet / Statement of Purpose"
                    required
                    style={{
                      width: '100%',
                      padding: '0.55rem 0.75rem',
                      borderRadius: 8,
                      border: '1px solid #cbd5e1',
                      fontSize: '0.8125rem',
                      background: '#ffffff',
                    }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '0.25rem' }}>
                    Document Category *
                  </label>
                  <select
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '0.55rem 0.75rem',
                      borderRadius: 8,
                      border: '1px solid #cbd5e1',
                      fontSize: '0.8125rem',
                      background: '#ffffff',
                    }}
                  >
                    <option value="PASSPORT">Passport</option>
                    <option value="ACADEMIC">Academic</option>
                    <option value="LANGUAGE_TEST">Language Test</option>
                    <option value="FINANCIAL">Financial</option>
                    <option value="PHOTO">Photo & Signature</option>
                    <option value="VISA">Visa File</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '0.25rem' }}>
                  Student Remarks / Notes (Optional)
                </label>
                <input
                  type="text"
                  value={form.remarks}
                  onChange={(e) => setForm({ ...form, remarks: e.target.value })}
                  placeholder="Add note for your assigned counsellor"
                  style={{
                    width: '100%',
                    padding: '0.55rem 0.75rem',
                    borderRadius: 8,
                    border: '1px solid #cbd5e1',
                    fontSize: '0.8125rem',
                    background: '#ffffff',
                  }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.35rem' }}>
                <button
                  type="button"
                  className="crm-stu-btn crm-stu-btn--secondary"
                  style={{ fontSize: '0.8125rem', padding: '0.45rem 1rem' }}
                  onClick={resetUploadState}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="crm-stu-btn crm-stu-btn--primary"
                  style={{ fontSize: '0.8125rem', padding: '0.45rem 1.25rem', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
                >
                  {submitting ? (
                    'Uploading...'
                  ) : (
                    <>
                      <FiUpload />
                      {replaceId ? 'Submit Revised File' : 'Upload Document'}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}




        {/* ── Category Pill Filter Tabs with Dynamic Counts ── */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            overflowX: 'auto',
            paddingBottom: '0.35rem',
            marginBottom: '0.85rem',
            borderBottom: '1px solid #f1f5f9',
          }}
        >
          <button
            type="button"
            onClick={() => setFilterCategory('')}
            style={{
              padding: '0.35rem 0.75rem',
              borderRadius: 20,
              fontSize: '0.75rem',
              fontWeight: 700,
              border: filterCategory === '' ? '1px solid #2563eb' : '1px solid #e2e8f0',
              background: filterCategory === '' ? '#2563eb' : '#ffffff',
              color: filterCategory === '' ? '#ffffff' : '#475569',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem',
              transition: 'all 0.15s ease',
            }}
          >
            All
            <span
              style={{
                fontSize: '0.75rem',
                padding: '1px 5px',
                borderRadius: 10,
                background: filterCategory === '' ? 'rgba(255,255,255,0.25)' : '#f1f5f9',
                color: filterCategory === '' ? '#ffffff' : '#64748b',
              }}
            >
              {rows.length}
            </span>
          </button>

          {Object.entries(CATEGORY_META).map(([key, cfg]) => {
            const count = categoryCounts[key] || 0;
            if (count === 0 && key !== 'PASSPORT' && key !== 'ACADEMIC') return null;
            const isSelected = filterCategory === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => setFilterCategory(key)}
                style={{
                  padding: '0.35rem 0.75rem',
                  borderRadius: 20,
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  border: isSelected ? '1px solid #2563eb' : '1px solid #e2e8f0',
                  background: isSelected ? '#2563eb' : '#ffffff',
                  color: isSelected ? '#ffffff' : '#475569',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  transition: 'all 0.15s ease',
                }}
              >
                {cfg.label}
                <span
                  style={{
                    fontSize: '0.75rem',
                    padding: '1px 5px',
                    borderRadius: 10,
                    background: isSelected ? 'rgba(255,255,255,0.25)' : '#f1f5f9',
                    color: isSelected ? '#ffffff' : '#64748b',
                  }}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* ── 2-Column Responsive Document Card Grid ── */}
        {displayList.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2.5rem 1rem', color: '#64748b' }}>
            <FiFolder style={{ fontSize: '2.5rem', color: '#cbd5e1', marginBottom: '0.5rem' }} />
            <h4 style={{ fontSize: '0.9375rem', fontWeight: 700, color: '#1e293b', margin: '0 0 0.25rem' }}>
              No documents found in this category
            </h4>
            <p style={{ fontSize: '0.75rem', margin: 0 }}>
              Switch filter to "All" or upload a new file for counsellor review.
            </p>
          </div>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
              gap: '0.75rem',
            }}
          >
            {displayList.map((doc) => {
              const cfg = getCategoryConfig(doc.category);
              const Icon = cfg.icon;
              const isVerified = doc.status === 'VERIFIED';
              const isRejected = doc.status === 'REJECTED';

              return (
                <div
                  key={doc.id}
                  style={{
                    padding: '0.95rem 1.15rem',
                    borderRadius: 12,
                    background: '#ffffff',
                    border: '1px solid #e2e8f0',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    gap: '0.65rem',
                    boxShadow: '0 1px 3px rgba(15,23,42,0.03)',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {/* Card Header: Icon + Title + Status */}
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.65rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', minWidth: 0 }}>
                      <div
                        style={{
                          width: 38,
                          height: 38,
                          borderRadius: 10,
                          background: cfg.bg,
                          color: cfg.color,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '1.15rem',
                          flexShrink: 0,
                        }}
                      >
                        <Icon />
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <strong
                          style={{
                            fontSize: '0.8125rem',
                            color: '#0f172a',
                            fontWeight: 700,
                            display: 'block',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                          title={doc.name}
                        >
                          {doc.name}
                        </strong>
                        <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                          {cfg.label} · {doc.fileName || 'Scanned Document'}
                        </span>
                      </div>
                    </div>

                    <span
                      className={`crm-stu-chip crm-stu-chip--${isVerified ? 'success' : isRejected ? 'danger' : 'amber'}`}
                      style={{ flexShrink: 0 }}
                    >
                      {isVerified ? '✓ Verified' : isRejected ? '✕ Action Required' : '⏳ Under Review'}
                    </span>
                  </div>

                  {/* Card Meta & Bottom Toolbar */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      paddingTop: '0.55rem',
                      borderTop: '1px solid #f1f5f9',
                      fontSize: '0.75rem',
                      color: '#64748b',
                    }}
                  >
                    <span>
                      Updated <strong>{formatDate(doc.updatedAt || doc.createdAt, true)}</strong>
                    </span>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                      {doc.filePath && (
                        <a
                          href={doc.filePath}
                          target="_blank"
                          rel="noreferrer"
                          className="crm-stu-btn crm-stu-btn--secondary"
                          style={{
                            fontSize: '0.75rem',
                            padding: '0.3rem 0.65rem',
                            textDecoration: 'none',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.3rem',
                          }}
                        >
                          <FiExternalLink /> View File
                        </a>
                      )}

                      {isRejected && (
                        <button
                          type="button"
                          className="crm-stu-btn crm-stu-btn--primary"
                          style={{ fontSize: '0.75rem', padding: '0.3rem 0.65rem' }}
                          onClick={() => startReplace(doc)}
                        >
                          Re-submit
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
