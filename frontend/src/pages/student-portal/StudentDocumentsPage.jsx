import { useCallback, useEffect, useMemo, useState } from 'react';
import { FiExternalLink, FiUpload } from 'react-icons/fi';
import { apiGet, apiPost } from '../../api/apiClient';
import { API } from '../../config/api';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import toastService from '../../services/toast/toast.service';
import { formatDate } from './components/portalFormat';
import { docStatusTone } from './components/studentPortal.utils';
import {
  PortalPage,
  PortalPanel,
  PortalEmpty,
  PortalSkeletonPage,
  PortalBadge,
  PortalStatStrip,
  PortalStat,
  PortalTabs,
} from '../../components/portal/PortalUi';

const EMPTY_FORM = { name: '', category: 'OTHER', fileUrl: '', remarks: '' };

export default function StudentDocumentsPage() {
  const [categories, setCategories] = useState([]);
  const [rows, setRows] = useState([]);
  const [filterCategory, setFilterCategory] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [replaceId, setReplaceId] = useState(null);

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
      .catch(() => { if (!cancelled) setRows([]); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [loadDocuments]);

  const summary = useMemo(() => ({
    verified: rows.filter((r) => r.status === 'VERIFIED').length,
    pending: rows.filter((r) => ['UNDER_REVIEW', 'UPLOADED', 'PENDING'].includes(r.status)).length,
    rejected: rows.filter((r) => r.status === 'REJECTED').length,
  }), [rows]);

  const needsAction = rows.some((r) => r.status === 'REJECTED');

  const startReplace = (doc) => {
    setReplaceId(doc.id);
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
    if (!form.name.trim() || !form.fileUrl.trim()) {
      toastService.error('Document name and file link are required');
      return;
    }
    setSubmitting(true);
    try {
      await apiPost(API.PORTAL_STUDENT_DOCUMENTS, {
        name: form.name.trim(),
        category: form.category,
        fileUrl: form.fileUrl.trim(),
        remarks: form.remarks.trim() || undefined,
        ...(replaceId ? { replaceId } : {}),
      });
      toastService.success(replaceId ? 'Document re-submitted for review' : 'Document submitted for review');
      setForm(EMPTY_FORM);
      setReplaceId(null);
      setShowUpload(false);
      await loadDocuments();
    } catch (err) {
      toastService.error(err?.response?.data?.message || 'Upload failed');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <PortalSkeletonPage />;

  const categoryTabs = [
    { id: '', label: 'All' },
    ...(categories.length ? categories : ['OTHER']).map((c) => ({
      id: c,
      label: c.replace(/_/g, ' '),
    })),
  ];

  return (
    <PortalPage>
      <div className="crm-portal-page-toolbar">
        <Button
          size="sm"
          icon={FiUpload}
          variant={showUpload ? 'outline' : 'primary'}
          onClick={() => {
            setShowUpload((v) => !v);
            if (showUpload) {
              setReplaceId(null);
              setForm(EMPTY_FORM);
            }
          }}
        >
          {showUpload ? 'Close upload' : 'Submit document'}
        </Button>
      </div>

      <PortalStatStrip>
        <PortalStat label="Verified" value={summary.verified} />
        <PortalStat label="Under review" value={summary.pending} />
        <PortalStat label="Needs resubmit" value={summary.rejected} />
        <PortalStat label="Total" value={rows.length} />
      </PortalStatStrip>

      {needsAction && (
        <div className="crm-portal-alert" role="status">
          Some documents were rejected. Open the document and use <strong>Re-submit</strong> to send a revised file.
        </div>
      )}

      {showUpload && (
        <PortalPanel title={replaceId ? 'Re-submit document' : 'Submit new document'} padded>
          <form onSubmit={handleSubmit} className="crm-student-form">
            <div className="crm-student-form__grid">
              <Input
                label="Document name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
              <label className="crm-student-form__select-wrap">
                <span className="crm-student-form__label">Category</span>
                <select
                  className="crm-student-form__select"
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                >
                  {(categories.length ? categories : ['OTHER']).map((cat) => (
                    <option key={cat} value={cat}>{cat.replace(/_/g, ' ')}</option>
                  ))}
                </select>
              </label>
              <div className="crm-student-form__full">
                <Input
                  label="File link or path"
                  value={form.fileUrl}
                  onChange={(e) => setForm({ ...form, fileUrl: e.target.value })}
                  placeholder="Paste file URL or upload path provided by institute"
                  required
                />
              </div>
              <div className="crm-student-form__full">
                <label className="crm-student-form__label">Note for reviewer (optional)</label>
                <textarea
                  className="crm-student-form__textarea"
                  value={form.remarks}
                  onChange={(e) => setForm({ ...form, remarks: e.target.value })}
                  rows={3}
                />
              </div>
            </div>
            <div className="crm-student-form__actions">
              <Button type="submit" loading={submitting}>
                {replaceId ? 'Re-submit for review' : 'Submit for review'}
              </Button>
              {replaceId && (
                <Button type="button" variant="ghost" onClick={() => { setReplaceId(null); setForm(EMPTY_FORM); }}>
                  Cancel
                </Button>
              )}
            </div>
          </form>
        </PortalPanel>
      )}

      <PortalPanel
        title="Document list"
        description="Read-only — status updates automatically after counsellor review"
      >
        <div className="crm-student-doc-filters">
          <PortalTabs
            tabs={categoryTabs}
            active={filterCategory}
            onChange={setFilterCategory}
          />
        </div>

        {rows.length === 0 ? (
          <PortalEmpty title="No documents yet" description="Submit documents when your counsellor requests them." />
        ) : (
          <ul className="crm-student-doc-list">
            {rows.map((row) => (
              <li key={row.id} className="crm-student-doc-card">
                <div className="crm-student-doc-card__main">
                  <div className="crm-student-doc-card__head">
                    <h3 className="crm-student-doc-card__title">{row.name}</h3>
                    <PortalBadge tone={docStatusTone(row.status)}>{row.status?.replace(/_/g, ' ') || 'Pending'}</PortalBadge>
                  </div>
                  <p className="crm-student-doc-card__meta">
                    {(row.category || 'OTHER').replace(/_/g, ' ')} · Updated {formatDate(row.updatedAt, true)}
                  </p>
                  {row.rejectionReason && (
                    <p className="crm-student-doc-card__reject">Reason: {row.rejectionReason}</p>
                  )}
                </div>
                <div className="crm-student-doc-card__actions">
                  {row.filePath && (
                    <a href={row.filePath} target="_blank" rel="noreferrer" className="crm-student-doc-card__link">
                      <FiExternalLink aria-hidden /> View
                    </a>
                  )}
                  {row.status === 'REJECTED' && (
                    <Button size="sm" variant="outline" onClick={() => startReplace(row)}>Re-submit</Button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </PortalPanel>
    </PortalPage>
  );
}
