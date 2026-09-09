import { useEffect, useMemo, useRef, useState } from 'react';
import {
  FiUpload, FiFileText, FiImage, FiAward, FiBookOpen, FiEdit3, FiMail, FiFolder, FiEye, FiTrash2,
} from 'react-icons/fi';
import Button from '../../../../../components/ui/Button';
import FormSection from '../../../../../components/ui/FormSection';
import DocumentPreviewModal from '../../../../enquiry/components/EnquiryDrawer/DocumentPreviewModal';
import {
  DOCUMENT_CATEGORIES,
  getDocumentCategoryLabel,
  formatFileSize,
  isPreviewable,
  getDocumentUrl,
} from '../../../../enquiry/config/enquiryDocument.config';
import { studentService } from '../../../../../modules/student/services/student.service';
import { enquiryService } from '../../../../enquiry/services/enquiryService';
import toastService from '../../../../../services/toast/toast.service';

const ICONS = {
  passport: FiFileText,
  certificate: FiAward,
  graduation: FiBookOpen,
  file: FiFileText,
  test: FiAward,
  edit: FiEdit3,
  mail: FiMail,
  image: FiImage,
  folder: FiFolder,
};

function normalizeCategory(value) {
  const raw = String(value || 'OTHERS').toUpperCase();
  return DOCUMENT_CATEGORIES.some((c) => c.value === raw) ? raw : 'OTHERS';
}

function formatUploadedAt(value) {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function StudentDocumentsTab({
  studentId,
  enquiryId,
  documents = [],
  canEdit = false,
  onRefresh,
}) {
  const inputRef = useRef(null);
  const [category, setCategory] = useState('PASSPORT');
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [previewDoc, setPreviewDoc] = useState(null);

  const grouped = useMemo(() => {
    const map = new Map();
    DOCUMENT_CATEGORIES.forEach((c) => map.set(c.value, []));
    documents.forEach((doc) => {
      const key = normalizeCategory(doc.category || doc.type);
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(doc);
    });
    return map;
  }, [documents]);

  const firstWithFiles = useMemo(
    () => DOCUMENT_CATEGORIES.find((c) => (grouped.get(c.value) || []).length > 0)?.value || 'PASSPORT',
    [grouped],
  );

  useEffect(() => {
    setCategory(firstWithFiles);
  }, [firstWithFiles]);

  const categoryDocs = grouped.get(category) || [];
  const uploadedCount = documents.length;
  const filledCategories = DOCUMENT_CATEGORIES.filter((c) => (grouped.get(c.value) || []).length > 0).length;

  const uploadFile = async (file) => {
    if (!file || !studentId || !canEdit) return;
    setUploading(true);
    try {
      await studentService.uploadDocument(studentId, file, category);
      toastService.success(`${getDocumentCategoryLabel(category)} uploaded`);
      onRefresh?.();
    } catch (e) {
      toastService.error(e?.response?.data?.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const onFilePick = async (e) => {
    const file = e.target.files?.[0];
    await uploadFile(file);
    e.target.value = '';
  };

  const onDrop = async (e) => {
    e.preventDefault();
    setDragOver(false);
    await uploadFile(e.dataTransfer.files?.[0]);
  };

  const remove = async (doc) => {
    if (!canEdit) return;
    try {
      if (doc.source === 'enquiry' && enquiryId) {
        await enquiryService.deleteDocument(enquiryId, doc.id);
      } else if (studentId) {
        await studentService.deleteDocument(studentId, doc.id);
      }
      toastService.success('Document removed');
      onRefresh?.();
    } catch (e) {
      toastService.error(e?.response?.data?.message || 'Failed to delete');
    }
  };

  return (
    <>
      <FormSection
        title="Documents"
        description={
          canEdit
            ? `${uploadedCount} file${uploadedCount === 1 ? '' : 's'} · upload anytime by category`
            : `${uploadedCount} file${uploadedCount === 1 ? '' : 's'} · ${filledCategories} categories`
        }
      >
        <div className="crm-student-doc-panel">
          <div className="crm-doc-categories crm-student-doc-panel__tabs" role="tablist" aria-label="Document category">
            {DOCUMENT_CATEGORIES.map((item) => {
              const Icon = ICONS[item.icon] || FiFileText;
              const count = (grouped.get(item.value) || []).length;
              const active = category === item.value;
              return (
                <button
                  key={item.value}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => setCategory(item.value)}
                  className={`crm-doc-category ${active ? 'crm-doc-category--active' : ''}`}
                >
                  <Icon className="w-3.5 h-3.5" aria-hidden />
                  <span>{item.label}</span>
                  {count > 0 && <span className="crm-doc-category__count">{count}</span>}
                </button>
              );
            })}
          </div>

          {canEdit && (
            <div
              className={`crm-doc-upload ${dragOver ? 'crm-doc-upload--drag' : ''}`}
              onClick={() => inputRef.current?.click()}
              onKeyDown={(e) => e.key === 'Enter' && inputRef.current?.click()}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={onDrop}
              role="button"
              tabIndex={0}
            >
              <FiUpload className="w-5 h-5 text-text-muted mx-auto mb-1.5" aria-hidden />
              <p className="text-sm font-medium text-text">
                Upload {getDocumentCategoryLabel(category)}
              </p>
              <p className="text-[12px] text-text-muted mt-0.5">
                Drag & drop or click · PDF, images, Word, Excel
              </p>
              {uploading && <p className="text-[12px] text-brand mt-1.5">Uploading…</p>}
              <input ref={inputRef} type="file" className="hidden" onChange={onFilePick} />
            </div>
          )}

          <div className="crm-student-doc-panel__body">
            <div className="crm-student-doc-panel__head">
              <h3 className="crm-student-doc-panel__title">{getDocumentCategoryLabel(category)}</h3>
              <span className="crm-student-doc-panel__count">
                {categoryDocs.length} file{categoryDocs.length === 1 ? '' : 's'}
              </span>
            </div>

            {categoryDocs.length === 0 ? (
              <div className="crm-student-doc-panel__empty">
                {canEdit
                  ? `No ${getDocumentCategoryLabel(category).toLowerCase()} yet — use upload above.`
                  : `No ${getDocumentCategoryLabel(category).toLowerCase()} documents.`}
              </div>
            ) : (
              <ul className="crm-student-doc-grid">
                {categoryDocs.map((doc) => {
                  const Icon = ICONS[DOCUMENT_CATEGORIES.find((c) => c.value === category)?.icon] || FiFileText;
                  const previewType = isPreviewable(doc.mimeType, doc.name || doc.fileName);
                  return (
                    <li key={`${doc.source || 'student'}-${doc.id}`} className="crm-student-doc-tile">
                      <div className="crm-student-doc-tile__icon" aria-hidden>
                        <Icon />
                      </div>
                      <div className="crm-student-doc-tile__body">
                        <p className="crm-student-doc-tile__name" title={doc.name || doc.fileName}>
                          {doc.name || doc.fileName || 'Document'}
                        </p>
                        <p className="crm-student-doc-tile__meta">
                          {doc.fileSize != null ? formatFileSize(doc.fileSize) : '—'}
                          {doc.createdAt ? ` · ${formatUploadedAt(doc.createdAt)}` : ''}
                        </p>
                        {doc.source === 'enquiry' && (
                          <span className="crm-student-doc-tile__badge">From enquiry</span>
                        )}
                      </div>
                      <div className="crm-student-doc-tile__actions">
                        {previewType && (
                          <Button
                            variant="ghost"
                            size="sm"
                            icon={FiEye}
                            onClick={() => setPreviewDoc(doc)}
                            aria-label="Preview"
                          />
                        )}
                        {canEdit && (
                          <Button
                            variant="ghost"
                            size="sm"
                            icon={FiTrash2}
                            onClick={() => remove(doc)}
                            aria-label="Delete"
                          />
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      </FormSection>

      <DocumentPreviewModal
        doc={previewDoc}
        open={Boolean(previewDoc)}
        onClose={() => setPreviewDoc(null)}
      />
    </>
  );
}
