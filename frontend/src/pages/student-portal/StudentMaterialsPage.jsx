import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  FiBookOpen,
  FiDownload,
  FiExternalLink,
  FiFileText,
  FiHeadphones,
  FiSearch,
  FiShare2,
  FiEye,
  FiX,
  FiUser,
  FiCalendar,
  FiShield,
  FiCheckCircle,
  FiFolder,
  FiLayers,
} from 'react-icons/fi';
import { apiGet } from '../../api/apiClient';
import { API } from '../../config/api';
import toastService from '../../services/toast/toast.service';
import {
  PortalSkeletonPage,
  PortalEmpty,
} from '../../components/portal/PortalUi';
import './student-dashboard.theme.css';

export default function StudentMaterialsPage() {
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [previewMaterial, setPreviewMaterial] = useState(null);

  const loadMaterials = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiGet(API.ACADEMIC_MATERIALS, { limit: 100 });
      setMaterials(res.data || []);
    } catch (err) {
      toastService.error(err?.response?.data?.message || 'Failed to load study materials');
      setMaterials([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMaterials();
  }, [loadMaterials]);

  const categories = useMemo(() => {
    const counts = { ALL: materials.length };
    materials.forEach((m) => {
      const cat = (m.category || 'OTHER').toUpperCase();
      counts[cat] = (counts[cat] || 0) + 1;
    });
    return counts;
  }, [materials]);

  const filteredMaterials = useMemo(() => {
    return materials.filter((row) => {
      const matchesCat =
        selectedCategory === 'ALL' ||
        (row.category || '').toUpperCase() === selectedCategory;

      if (!matchesCat) return false;

      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase().trim();
      const title = (row.title || '').toLowerCase();
      const desc = (row.description || '').toLowerCase();
      const cat = (row.category || '').toLowerCase();
      return title.includes(q) || desc.includes(q) || cat.includes(q);
    });
  }, [materials, selectedCategory, searchQuery]);

  const handleCopyLink = (row) => {
    const link = row.externalUrl || row.fileUrl || window.location.href;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(link);
      toastService.success('Resource link copied to clipboard!');
    } else {
      toastService.info(`Resource: ${row.title}`);
    }
  };

  if (loading) return <PortalSkeletonPage />;

  return (
    <div className="crm-stu-page-container">
      {/* ── Top 4 KPI Metric Cards ── */}
      <div className="crm-stu-att-kpi-grid">
        <div className="crm-stu-att-kpi-card crm-stu-att-kpi-card--primary">
          <div className="crm-stu-att-kpi-card__header">
            <span className="crm-stu-att-kpi-card__label">Total Study Assets</span>
            <FiFolder className="crm-stu-att-kpi-card__icon" />
          </div>
          <div className="crm-stu-att-kpi-card__body">
            <span className="crm-stu-att-kpi-card__value">{materials.length}</span>
            <span className="crm-stu-chip crm-stu-chip--success">100% Downloadable</span>
          </div>
          <div className="crm-stu-course-progress-card__sub" style={{ marginTop: '0.45rem' }}>
            All curriculum files synchronized
          </div>
        </div>

        <div className="crm-stu-att-kpi-card">
          <div className="crm-stu-att-kpi-card__header">
            <span className="crm-stu-att-kpi-card__label">Writing & Essays</span>
            <FiFileText className="crm-stu-att-kpi-card__icon--green" />
          </div>
          <div className="crm-stu-att-kpi-card__body">
            <span className="crm-stu-att-kpi-card__value">1 Guide</span>
            <span className="crm-stu-chip crm-stu-chip--brand">Band 9 Samples</span>
          </div>
          <div className="crm-stu-course-progress-card__sub" style={{ marginTop: '0.45rem' }}>
            Writing Task 1 & 2 model answers
          </div>
        </div>

        <div className="crm-stu-att-kpi-card">
          <div className="crm-stu-att-kpi-card__header">
            <span className="crm-stu-att-kpi-card__label">Audio Practice Tracks</span>
            <FiHeadphones className="crm-stu-att-kpi-card__icon" />
          </div>
          <div className="crm-stu-att-kpi-card__body">
            <span className="crm-stu-att-kpi-card__value">1 Audio</span>
            <span className="crm-stu-chip crm-stu-chip--amber">Sections 1–4</span>
          </div>
          <div className="crm-stu-course-progress-card__sub" style={{ marginTop: '0.45rem' }}>
            MP3 practice with transcripts
          </div>
        </div>

        <div className="crm-stu-att-kpi-card">
          <div className="crm-stu-att-kpi-card__header">
            <span className="crm-stu-att-kpi-card__label">Vocabulary & Lexis</span>
            <FiCheckCircle className="crm-stu-att-kpi-card__icon--green" />
          </div>
          <div className="crm-stu-att-kpi-card__body">
            <span className="crm-stu-att-kpi-card__value">1 Masterpack</span>
            <span className="crm-stu-chip crm-stu-chip--success">Academic Collocations</span>
          </div>
          <div className="crm-stu-course-progress-card__sub" style={{ marginTop: '0.45rem' }}>
            High-band academic phrase bank
          </div>
        </div>
      </div>

      {/* ── Category Tabs & Search Bar ── */}
      <div className="crm-stu-assign-filter-bar">
        <div className="crm-stu-assign-tabs">
          {Object.entries(categories).map(([cat, count]) => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`crm-stu-tab-btn${selectedCategory === cat ? ' crm-stu-tab-btn--active' : ''}`}
            >
              {cat === 'ALL' ? 'All Modules' : cat}
              <span className="crm-stu-tab-count">{count}</span>
            </button>
          ))}
        </div>

        <div className="crm-stu-search-wrap" style={{ position: 'relative', minWidth: 260 }}>
          <input
            type="text"
            className="crm-stu-search-input"
            placeholder="Search study materials by keyword..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* ── Materials Grid ── */}
      {!filteredMaterials.length ? (
        <PortalEmpty
          title="No study materials match your search"
          description="Try selecting 'All Modules' or clearing your search term to explore available notes."
          icon={FiBookOpen}
          className="crm-portal-empty--inline"
        />
      ) : (
        <div className="crm-stu-mat-grid">
          {filteredMaterials.map((row) => {
            const isAudio = (row.materialType || '').toUpperCase() === 'AUDIO';
            const isPdf = (row.materialType || '').toUpperCase() === 'PDF';
            const link = row.externalUrl || row.fileUrl || null;

            return (
              <div key={row.id} className="crm-stu-mat-card">
                <div>
                  <div className="crm-stu-mat-card__top">
                    <div
                      className={`crm-stu-mat-icon ${
                        isAudio
                          ? 'crm-stu-mat-icon--audio'
                          : isPdf
                          ? 'crm-stu-mat-icon--pdf'
                          : 'crm-stu-mat-icon--doc'
                      }`}
                    >
                      {isAudio ? <FiHeadphones /> : isPdf ? <FiFileText /> : <FiBookOpen />}
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div className="crm-stu-mat-card__eyebrow">
                        <span className="crm-stu-chip crm-stu-chip--brand">
                          {row.category || 'General'}
                        </span>
                        <span className="crm-stu-chip crm-stu-chip--neutral">
                          {isAudio ? 'Audio MP3' : isPdf ? 'PDF Document' : 'Document'}
                        </span>
                      </div>
                      <h3 className="crm-stu-mat-card__title">{row.title}</h3>
                    </div>
                  </div>

                  <p className="crm-stu-mat-card__desc">
                    {row.description ||
                      'Official curated reference material designed to elevate your IELTS preparation and practice test scores.'}
                  </p>
                </div>

                <div>
                  <div className="crm-stu-mat-card__meta-bar">
                    <span>Added {row.publishedAt ? new Date(row.publishedAt).toLocaleDateString('en-GB') : 'Recent'}</span>
                    <span>Instructor: Rakesh Iyer</span>
                  </div>

                  <div className="crm-stu-mat-card__actions">
                    {link ? (
                      <a
                        href={link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="crm-stu-mat-btn crm-stu-mat-btn--primary"
                      >
                        <FiDownload /> Download
                      </a>
                    ) : (
                      <button
                        type="button"
                        className="crm-stu-mat-btn crm-stu-mat-btn--primary"
                        onClick={() => toastService.info(`Downloading ${row.title}...`)}
                      >
                        <FiDownload /> Download
                      </button>
                    )}

                    <button
                      type="button"
                      className="crm-stu-mat-btn crm-stu-mat-btn--secondary"
                      onClick={() => setPreviewMaterial(row)}
                    >
                      <FiEye /> Preview
                    </button>

                    <button
                      type="button"
                      className="crm-stu-mat-btn crm-stu-mat-btn--secondary"
                      style={{ flex: 'none', padding: '0.5rem 0.65rem' }}
                      title="Copy Link"
                      onClick={() => handleCopyLink(row)}
                    >
                      <FiShare2 />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Interactive In-App Material Preview Modal ── */}
      {previewMaterial && (
        <div className="crm-stu-modal-backdrop" onClick={() => setPreviewMaterial(null)}>
          <div className="crm-stu-modal" onClick={(e) => e.stopPropagation()}>
            <div className="crm-stu-modal__head">
              <div>
                <span className="crm-stu-chip crm-stu-chip--brand" style={{ marginBottom: '0.35rem' }}>
                  {previewMaterial.category || 'Curriculum Material'}
                </span>
                <h3 className="crm-stu-modal__title">{previewMaterial.title}</h3>
              </div>
              <button
                type="button"
                className="crm-stu-modal__close"
                onClick={() => setPreviewMaterial(null)}
              >
                <FiX />
              </button>
            </div>

            <div className="crm-stu-modal__body">
              <div
                style={{
                  padding: '1.25rem',
                  borderRadius: '12px',
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  marginBottom: '1rem',
                }}
              >
                <h4 style={{ margin: '0 0 0.5rem', fontSize: '0.875rem', fontWeight: 700, color: '#0f172a' }}>
                  Resource Overview & Learning Objectives
                </h4>
                <p style={{ margin: 0, fontSize: '0.8125rem', color: '#475569', lineHeight: 1.5 }}>
                  This material is designated for enrolled students in <strong>IELTS Batch A</strong>.
                  Review the structural principles, high-band vocabulary, and model solutions carefully before attempting
                  the next scheduled mock exam.
                </p>
              </div>

              <div
                style={{
                  height: 220,
                  borderRadius: '10px',
                  border: '2px dashed #cbd5e1',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.65rem',
                  color: '#64748b',
                  background: '#ffffff',
                }}
              >
                <FiBookOpen style={{ fontSize: '2.5rem', color: '#3b82f6' }} />
                <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>In-Browser Document Reader Preview</span>
                <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                  {previewMaterial.fileUrl || '/uploads/materials/preview-document.pdf'}
                </span>
              </div>
            </div>

            <div className="crm-stu-modal__foot">
              <button
                type="button"
                className="crm-stu-mat-btn crm-stu-mat-btn--secondary"
                onClick={() => setPreviewMaterial(null)}
              >
                Close Preview
              </button>
              <a
                href={previewMaterial.externalUrl || previewMaterial.fileUrl || '#'}
                target="_blank"
                rel="noopener noreferrer"
                className="crm-stu-mat-btn crm-stu-mat-btn--primary"
              >
                <FiDownload /> Download Full Asset
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
