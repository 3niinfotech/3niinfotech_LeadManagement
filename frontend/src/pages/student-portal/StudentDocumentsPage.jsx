import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  FiExternalLink,
  FiDownload,
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
  FiGrid,
  FiList,
  FiSearch,
} from 'react-icons/fi';
import { apiGet, apiPost } from '../../api/apiClient';
import { API } from '../../config/api';
import toastService from '../../services/toast/toast.service';
import { formatDate } from './components/portalFormat';
import { PortalSkeletonPage } from '../../components/portal/PortalUi';
import Pagination from '../../components/ui/Pagination';
import { getDocumentUrl } from '../../features/enquiry/config/enquiryDocument.config';
import './student-dashboard.theme.css';

const EMPTY_FORM = { name: '', category: 'OTHER', remarks: '', fileUrl: '' };

const CATEGORY_MAP = {
  // Academic
  ACADEMIC: 'ACADEMIC',
  TENTH: 'ACADEMIC',
  TWELFTH: 'ACADEMIC',
  DEGREE: 'ACADEMIC',
  TRANSCRIPT: 'ACADEMIC',
  DIPLOMA: 'ACADEMIC',
  CERTIFICATE: 'ACADEMIC',
  MARKSHEET: 'ACADEMIC',

  // Language Test
  LANGUAGE_TEST: 'LANGUAGE_TEST',
  IELTS: 'LANGUAGE_TEST',
  PTE: 'LANGUAGE_TEST',
  TOEFL: 'LANGUAGE_TEST',
  DUOLINGO: 'LANGUAGE_TEST',

  // Passport
  PASSPORT: 'PASSPORT',

  // Photo & ID
  PHOTO: 'PHOTO',
  SIGNATURE: 'PHOTO',
  ID: 'PHOTO',
  AADHAR: 'PHOTO',
  PAN: 'PHOTO',

  // Visa & SOP
  VISA: 'VISA',
  SOP: 'VISA',
  LOR: 'VISA',
  RESUME: 'VISA',
  CV: 'VISA',
  EXPERIENCE: 'VISA',

  // Financial
  FINANCIAL: 'FINANCIAL',
  BANK: 'FINANCIAL',
  ITR: 'FINANCIAL',
  AFFIDAVIT: 'FINANCIAL',
  LOAN: 'FINANCIAL',
};

export function normalizeCategory(category) {
  const c = String(category || '').toUpperCase();
  return CATEGORY_MAP[c] || 'OTHER';
}

const CATEGORY_META = {
  ACADEMIC: { label: 'Academic', icon: FiAward, color: '#8b5cf6', bg: '#f5f3ff' },
  LANGUAGE_TEST: { label: 'Language Test', icon: FiFileText, color: '#06b6d4', bg: '#ecfeff' },
  PASSPORT: { label: 'Passport', icon: FiShield, color: '#3b82f6', bg: '#eff6ff' },
  PHOTO: { label: 'Photo & ID', icon: FiImage, color: '#f59e0b', bg: '#fffbeb' },
  VISA: { label: 'Visa & SOP', icon: FiFileText, color: '#6366f1', bg: '#eef2ff' },
  FINANCIAL: { label: 'Financial', icon: FiDollarSign, color: '#10b981', bg: '#ecfdf5' },
  OTHER: { label: 'Other', icon: FiFolder, color: '#64748b', bg: '#f8fafc' },
};

function getCategoryConfig(category) {
  const norm = normalizeCategory(category);
  return CATEGORY_META[norm] || CATEGORY_META.OTHER;
}

function cleanRawFileName(rawName) {
  return String(rawName || '').replace(/^\d{10,14}-/, '');
}

function getFileExtension(filename) {
  const parts = String(filename || '').split('.');
  return parts.length > 1 ? parts.pop().toUpperCase() : 'DOC';
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
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState('grid');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(9);
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
    return apiGet(API.PORTAL_STUDENT_DOCUMENTS).then((res) => {
      const payload = res.data || {};
      setRows(payload.data || []);
      setCategories(payload.categories || []);
    });
  }, []);

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

  // Reset pagination on filter or search changes
  useEffect(() => {
    setPage(1);
  }, [filterCategory, searchQuery]);

  const summary = useMemo(() => ({
    verified: rows.filter((r) => r.status === 'VERIFIED').length,
    pending: rows.filter((r) => ['UNDER_REVIEW', 'UPLOADED', 'PENDING'].includes(r.status)).length,
    rejected: rows.filter((r) => r.status === 'REJECTED').length,
    total: rows.length,
  }), [rows]);

  const categoryCounts = useMemo(() => {
    const map = {};
    rows.forEach((r) => {
      const cat = normalizeCategory(r.category);
      map[cat] = (map[cat] || 0) + 1;
    });
    return map;
  }, [rows]);

  const displayList = useMemo(() => {
    let list = rows;
    if (filterCategory) {
      list = list.filter((r) => normalizeCategory(r.category) === filterCategory);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter((r) => {
        const name = (r.name || '').toLowerCase();
        const fn = cleanRawFileName(r.fileName || '').toLowerCase();
        const cat = normalizeCategory(r.category).toLowerCase();
        const remarks = (r.studentRemarks || '').toLowerCase();
        return name.includes(q) || fn.includes(q) || cat.includes(q) || remarks.includes(q);
      });
    }
    return list;
  }, [rows, filterCategory, searchQuery]);

  const paginatedList = useMemo(() => {
    const start = (page - 1) * pageSize;
    return displayList.slice(start, start + pageSize);
  }, [displayList, page, pageSize]);

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
              Scanned credentials, identity verification, and financial proofs for university &amp; visa processing
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
            {/* View Mode Switcher */}
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                background: '#f1f5f9',
                border: '1px solid #e2e8f0',
                borderRadius: 8,
                padding: '2px',
                gap: '2px',
              }}
            >
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                title="Grid View"
                aria-label="Grid View"
                style={{
                  border: 'none',
                  background: viewMode === 'grid' ? '#ffffff' : 'transparent',
                  color: viewMode === 'grid' ? '#2563eb' : '#64748b',
                  padding: '0.35rem 0.55rem',
                  borderRadius: 6,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  fontSize: '0.8125rem',
                  boxShadow: viewMode === 'grid' ? '0 1px 2px rgba(0,0,0,0.06)' : 'none',
                  transition: 'all 0.15s ease',
                }}
              >
                <FiGrid />
              </button>
              <button
                type="button"
                onClick={() => setViewMode('table')}
                title="Table View"
                aria-label="Table View"
                style={{
                  border: 'none',
                  background: viewMode === 'table' ? '#ffffff' : 'transparent',
                  color: viewMode === 'table' ? '#2563eb' : '#64748b',
                  padding: '0.35rem 0.55rem',
                  borderRadius: 6,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  fontSize: '0.8125rem',
                  boxShadow: viewMode === 'table' ? '0 1px 2px rgba(0,0,0,0.06)' : 'none',
                  transition: 'all 0.15s ease',
                }}
              >
                <FiList />
              </button>
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




        {/* ── Category Pill Filter Tabs & Real-Time Search Toolbar ── */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 mb-3.5 border-b border-slate-100 dark:border-slate-800">
          {/* Category Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
            <button
              type="button"
              onClick={() => setFilterCategory('')}
              className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                filterCategory === ''
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              All
              <span
                className={`text-[11px] px-1.5 py-0.2 rounded-full font-bold ${
                  filterCategory === ''
                    ? 'bg-white/25 text-white'
                    : 'bg-slate-200/90 dark:bg-slate-700 text-slate-500 dark:text-slate-400'
                }`}
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
                  className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                    isSelected
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  {cfg.label}
                  <span
                    className={`text-[11px] px-1.5 py-0.2 rounded-full font-bold ${
                      isSelected
                        ? 'bg-white/25 text-white'
                        : 'bg-slate-200/90 dark:bg-slate-700 text-slate-500 dark:text-slate-400'
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Search Box */}
          <div className="relative w-full md:w-64 shrink-0">
            <FiSearch className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 w-3.5 h-3.5 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search documents..."
              className="w-full pl-8 pr-7 py-1 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-800/40 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs px-1"
                aria-label="Clear search"
              >
                ×
              </button>
            )}
          </div>
        </div>

        {/* ── Document List Display (Grid View vs Table View) ── */}
        {displayList.length === 0 ? (
          <div className="text-center py-12 px-4 text-slate-500">
            <FiFolder className="text-4xl text-slate-300 dark:text-slate-600 mx-auto mb-2" />
            <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
              No documents found
            </h4>
            <p className="text-xs text-slate-400 mt-1">
              Switch category filter or upload a new file for counsellor review.
            </p>
            {(searchQuery || filterCategory) && (
              <button
                type="button"
                onClick={() => {
                  setFilterCategory('');
                  setSearchQuery('');
                }}
                className="mt-3 text-xs text-blue-600 dark:text-blue-400 font-semibold hover:underline"
              >
                Clear all filters
              </button>
            )}
          </div>
        ) : viewMode === 'grid' ? (
          /* ── Balanced, Compact 3-Column Grid ── */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {paginatedList.map((doc) => {
              const cfg = getCategoryConfig(doc.category);
              const Icon = cfg.icon;
              const isVerified = doc.status === 'VERIFIED';
              const isRejected = doc.status === 'REJECTED';
              const cleanName = cleanRawFileName(doc.fileName || doc.name);
              const ext = getFileExtension(doc.fileName || doc.name);

              return (
                <div
                  key={doc.id}
                  className="p-3.5 rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs hover:shadow-md hover:border-blue-400/50 transition-all flex flex-col justify-between gap-2.5 group"
                >
                  {/* Card Header: Icon + Title + Category + Status */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      <div
                        className="w-9 h-9 rounded-lg flex items-center justify-center text-base shrink-0 transition-transform group-hover:scale-105"
                        style={{ background: cfg.bg, color: cfg.color }}
                      >
                        <Icon />
                      </div>
                      <div className="min-w-0 flex-1">
                        <strong
                          className="text-xs font-bold text-slate-900 dark:text-slate-100 block truncate leading-snug"
                          title={doc.name}
                        >
                          {doc.name}
                        </strong>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                            {cfg.label}
                          </span>
                          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-bold uppercase tracking-wider">
                            {ext}
                          </span>
                        </div>
                      </div>
                    </div>

                    <span
                      className={`text-[10.5px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap shrink-0 border ${
                        isVerified
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800'
                          : isRejected
                          ? 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800'
                          : 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800'
                      }`}
                    >
                      {isVerified ? '✓ Verified' : isRejected ? '✕ Action Req.' : '⏳ Under Review'}
                    </span>
                  </div>

                  {/* Clean Filename Badge */}
                  <div className="text-[11px] text-slate-500 font-mono truncate bg-slate-50 dark:bg-slate-800/40 px-2 py-1 rounded border border-slate-100 dark:border-slate-800" title={cleanName}>
                    {cleanName}
                  </div>

                  {/* Card Bottom: Date + Action Buttons */}
                  <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
                    <span className="text-[11px] text-slate-400 font-medium flex items-center gap-1 shrink-0">
                      <FiClock className="w-3 h-3 text-slate-400 shrink-0" />
                      {formatDate(doc.updatedAt || doc.createdAt, true)}
                    </span>

                    <div className="flex items-center gap-1.5">
                      {(doc.filePath || doc.fileUrl) && (
                        <>
                          <a
                            href={getDocumentUrl(doc.filePath || doc.fileUrl)}
                            target="_blank"
                            rel="noreferrer"
                            className="px-2 py-1 rounded text-xs font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors flex items-center gap-1"
                            title="View File"
                          >
                            <FiExternalLink className="w-3 h-3" />
                            View
                          </a>
                          <a
                            href={getDocumentUrl(doc.filePath || doc.fileUrl)}
                            download={cleanName}
                            target="_blank"
                            rel="noreferrer"
                            className="px-2 py-1 rounded text-xs font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors flex items-center gap-1"
                            title="Download document"
                          >
                            <FiDownload className="w-3 h-3" />
                            Download
                          </a>
                        </>
                      )}

                      {isRejected && (
                        <button
                          type="button"
                          className="px-2 py-1 rounded text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 transition-colors"
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
        ) : (
          /* ── Table View Option ── */
          <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40">
                  <th className="py-2.5 px-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Document</th>
                  <th className="py-2.5 px-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Category</th>
                  <th className="py-2.5 px-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider">File Name</th>
                  <th className="py-2.5 px-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Status</th>
                  <th className="py-2.5 px-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Updated</th>
                  <th className="py-2.5 px-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {paginatedList.map((doc) => {
                  const cfg = getCategoryConfig(doc.category);
                  const Icon = cfg.icon;
                  const isVerified = doc.status === 'VERIFIED';
                  const isRejected = doc.status === 'REJECTED';
                  const cleanName = cleanRawFileName(doc.fileName || doc.name);
                  const ext = getFileExtension(doc.fileName || doc.name);

                  return (
                    <tr key={doc.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          <div
                            className="w-8 h-8 rounded-lg flex items-center justify-center text-sm shrink-0"
                            style={{ background: cfg.bg, color: cfg.color }}
                          >
                            <Icon />
                          </div>
                          <span className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate max-w-xs">
                            {doc.name}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-xs font-medium text-slate-600 dark:text-slate-300">
                          {cfg.label}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5 font-mono text-[11px] text-slate-500">
                          <span className="px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-[10px] font-bold uppercase">
                            {ext}
                          </span>
                          <span className="truncate max-w-[160px]">{cleanName}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`text-[11px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap border ${
                            isVerified
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : isRejected
                              ? 'bg-rose-50 text-rose-700 border-rose-200'
                              : 'bg-amber-50 text-amber-700 border-amber-200'
                          }`}
                        >
                          {isVerified ? '✓ Verified' : isRejected ? '✕ Action Req.' : '⏳ Under Review'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-xs text-slate-400 font-medium whitespace-nowrap">
                        {formatDate(doc.updatedAt || doc.createdAt, true)}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          {(doc.filePath || doc.fileUrl) && (
                            <>
                              <a
                                href={getDocumentUrl(doc.filePath || doc.fileUrl)}
                                target="_blank"
                                rel="noreferrer"
                                className="p-1.5 rounded text-slate-600 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                                title="View File"
                              >
                                <FiExternalLink className="w-3.5 h-3.5" />
                              </a>
                              <a
                                href={getDocumentUrl(doc.filePath || doc.fileUrl)}
                                download={cleanName}
                                target="_blank"
                                rel="noreferrer"
                                className="p-1.5 rounded text-slate-600 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                                title="Download"
                              >
                                <FiDownload className="w-3.5 h-3.5" />
                              </a>
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

        {/* Dynamic Responsive Pagination */}
        <Pagination
          page={page}
          limit={pageSize}
          total={displayList.length}
          onPageChange={setPage}
          onPageSizeChange={(newSize) => {
            setPageSize(newSize);
            setPage(1);
          }}
          pageSizeOptions={[9, 18, 36]}
          className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800"
        />
      </div>
    </div>
  );
}
