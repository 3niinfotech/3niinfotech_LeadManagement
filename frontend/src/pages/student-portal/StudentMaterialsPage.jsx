import { useCallback, useEffect, useMemo, useState } from 'react';
import { FiDownload, FiExternalLink, FiFilter, FiBookOpen } from 'react-icons/fi';
import { apiGet } from '../../api/apiClient';
import { API } from '../../config/api';
import toastService from '../../services/toast/toast.service';
import {
  PortalPage,
  PortalSkeletonPage,
  PortalEmpty,
} from '../../components/portal/PortalUi';

const MATERIAL_TYPES = ['PDF', 'DOCUMENT', 'PPT', 'IMAGE', 'VIDEO', 'AUDIO', 'LINK', 'OTHER'];

function typeLabel(type) {
  return (type || 'DOCUMENT').replace(/_/g, ' ');
}

function materialLink(row) {
  return row.externalUrl || row.fileUrl || null;
}

export default function StudentMaterialsPage() {
  const [materials, setMaterials] = useState([]);
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [batchId, setBatchId] = useState('');
  const [category, setCategory] = useState('');
  const [materialType, setMaterialType] = useState('');

  const loadBatches = useCallback(async () => {
    try {
      const res = await apiGet(API.ACADEMIC_BATCHES, { limit: 50 });
      setBatches(res.data || []);
    } catch {
      setBatches([]);
    }
  }, []);

  const loadMaterials = useCallback(async () => {
    setLoading(true);
    try {
      const params = { limit: 100 };
      if (batchId) params.batchId = batchId;
      if (category) params.category = category;
      if (materialType) params.materialType = materialType;
      const res = await apiGet(API.ACADEMIC_MATERIALS, params);
      setMaterials(res.data || []);
    } catch (err) {
      toastService.error(err?.response?.data?.message || 'Failed to load materials');
      setMaterials([]);
    } finally {
      setLoading(false);
    }
  }, [batchId, category, materialType]);

  useEffect(() => { loadBatches(); }, [loadBatches]);
  useEffect(() => { loadMaterials(); }, [loadMaterials]);

  const categories = useMemo(() => {
    const set = new Set(materials.map((m) => m.category).filter(Boolean));
    return [...set].sort();
  }, [materials]);

  const clearFilters = () => {
    setBatchId('');
    setCategory('');
    setMaterialType('');
  };

  const hasFilters = batchId || category || materialType;

  if (loading && !materials.length && !hasFilters) return <PortalSkeletonPage />;

  return (
    <PortalPage>
      <div className="crm-portal-filters">
        <div className="crm-portal-filters__label">
          <FiFilter size={14} /> Filters
        </div>
        <div className="crm-portal-filters__grid">
          <select
            value={batchId}
            onChange={(e) => setBatchId(e.target.value)}
            className="crm-portal-filters__select"
          >
            <option value="">All courses</option>
            {batches.map((b) => (
              <option key={b.id} value={b.id}>
                {b.courseName || b.name}
              </option>
            ))}
          </select>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="crm-portal-filters__select"
          >
            <option value="">All categories</option>
            {categories.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <select
            value={materialType}
            onChange={(e) => setMaterialType(e.target.value)}
            className="crm-portal-filters__select"
          >
            <option value="">All types</option>
            {MATERIAL_TYPES.map((t) => (
              <option key={t} value={t}>{typeLabel(t)}</option>
            ))}
          </select>
        </div>
        {hasFilters && (
          <button
            type="button"
            onClick={clearFilters}
            className="crm-portal-filters__clear"
          >
            Clear filters
          </button>
        )}
      </div>

      {loading ? (
        <p className="crm-portal-empty crm-portal-empty--panel text-text-secondary">Loading materials…</p>
      ) : !materials.length ? (
        <PortalEmpty
          title="No study materials match your filters"
          description="Try clearing filters or check back when teachers upload notes."
          icon={FiBookOpen}
          className="crm-portal-empty--inline"
        />
      ) : (
        <div className="crm-portal-material-grid">
          {materials.map((row) => {
            const link = materialLink(row);
            return (
              <div key={row.id} className="crm-portal-material-card">
                <span className="crm-portal-material-card__icon">
                  <FiBookOpen />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="crm-portal-material-card__eyebrow">
                    {row.batch?.courseName || row.batch?.name} · {typeLabel(row.materialType)}
                    {row.category ? ` · ${row.category}` : ''}
                  </p>
                  <h3 className="crm-portal-material-card__title">{row.title}</h3>
                  {row.description && (
                    <p className="crm-portal-material-card__desc">{row.description}</p>
                  )}
                  <p className="crm-portal-material-card__meta">
                    Added {row.createdAt ? new Date(row.createdAt).toLocaleDateString('en-IN') : '—'}
                  </p>
                  {link ? (
                    <a
                      href={link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="crm-portal-material-card__link"
                    >
                      {row.externalUrl ? (
                        <><FiExternalLink size={14} /> Open link</>
                      ) : (
                        <><FiDownload size={14} /> Open / download</>
                      )}
                    </a>
                  ) : (
                    <p className="crm-portal-material-card__meta">No file attached</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </PortalPage>
  );
}
