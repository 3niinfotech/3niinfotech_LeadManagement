import { useMemo, useRef, useState } from 'react';
import { useDispatch } from 'react-redux';
import {
  FiUpload, FiFileText, FiImage, FiAward, FiBookOpen, FiEdit3, FiMail, FiFolder, FiEye, FiTrash2,
  FiDownload,
} from 'react-icons/fi';
import Button from '../../../../components/ui/Button';
import Badge from '../../../../components/ui/Badge';
import FormSection from '../../../../components/ui/FormSection';
import DocumentPreviewModal from './DocumentPreviewModal';
import {
  DOCUMENT_CATEGORIES,
  getDocumentCategoryLabel,
  formatFileSize,
  isPreviewable,
  getDocumentUrl,
} from '../../config/enquiryDocument.config';
import { enquiryService } from '../../services/enquiryService';
import { studentService } from '../../../../modules/student/services/student.service';
import { enquiryApi } from '../../redux/enquiryApiSlice';
import toastService from '../../../../services/toast/toast.service';

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

function DocCard({ doc, onPreview, onRemove, compact = false }) {
  const previewType = isPreviewable(doc.mimeType, doc.name || doc.fileName);
  const docUrl = getDocumentUrl(doc.filePath || doc.fileUrl);
  const thumb = previewType === 'image' ? docUrl : null;
  const meta = (doc.metadata && typeof doc.metadata === 'object') ? doc.metadata : {};
  const docStatus = meta.status || doc.status;

  return (
    <article className={`crm-doc-card ${compact ? 'crm-doc-card--compact' : 'crm-doc-card--row'}`}>
      {!compact && (
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 flex-wrap">
            <p className="text-sm font-semibold text-text truncate">{doc.name || doc.fileName}</p>
            {docStatus === 'VERIFIED' && <Badge color="success" size="xs">Verified</Badge>}
            {docStatus === 'REJECTED' && <Badge color="danger" size="xs">Rejected</Badge>}
            {['UNDER_REVIEW', 'UPLOADED'].includes(docStatus) && <Badge color="warning" size="xs">Pending Review</Badge>}
            {doc.source === 'student' && <Badge color="brand" size="xs">Student Portal</Badge>}
          </div>
          <p className="text-[11px] text-text-muted mt-0.5 tabular-nums">
            {formatFileSize(doc.fileSize)}
            {' · '}
            {doc.createdAt ? new Date(doc.createdAt).toLocaleString('en-IN') : '—'}
          </p>
        </div>
      )}
      {compact && (
        <>
          <div className="crm-doc-card__icon" aria-hidden>
            {thumb ? (
              <img src={thumb} alt="" className="crm-doc-card__thumb" />
            ) : (
              <FiFileText className="w-4 h-4" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 flex-wrap">
              <p className="text-sm font-semibold text-text truncate">{doc.name || doc.fileName}</p>
              {docStatus === 'VERIFIED' && <Badge color="success" size="xs">Verified</Badge>}
              {docStatus === 'REJECTED' && <Badge color="danger" size="xs">Rejected</Badge>}
              {doc.source === 'student' && <Badge color="brand" size="xs">Student Portal</Badge>}
            </div>
            <p className="text-[11px] text-text-muted mt-0.5">
              {getDocumentCategoryLabel(doc.category)}
              {' · '}
              {formatFileSize(doc.fileSize)}
            </p>
            <p className="text-[10px] text-text-muted mt-0.5 tabular-nums">
              {doc.createdAt ? new Date(doc.createdAt).toLocaleString('en-IN') : '—'}
            </p>
          </div>
        </>
      )}
      <div className="flex items-center gap-0.5 shrink-0 self-center">
        {previewType && !compact && (
          <button
            type="button"
            className="crm-doc-card__preview"
            onClick={() => onPreview(doc)}
          >
            Preview
          </button>
        )}
        {previewType && (
          <Button variant="ghost" size="sm" icon={FiEye} onClick={() => onPreview(doc)} aria-label="Preview" title="Preview" />
        )}
        {docUrl && (
          <Button
            variant="ghost"
            size="sm"
            icon={FiDownload}
            onClick={() => {
              const link = document.createElement('a');
              link.href = docUrl;
              link.download = doc.name || doc.fileName || 'document';
              link.target = '_blank';
              link.rel = 'noopener noreferrer';
              link.click();
            }}
            aria-label="Download"
            title="Download"
          />
        )}
        <Button variant="ghost" size="sm" icon={FiTrash2} onClick={() => onRemove(doc)} aria-label="Delete" title="Delete" />
      </div>
    </article>
  );
}

export default function DocumentsTab({ enquiryId, documents = [], onRefresh }) {
  const dispatch = useDispatch();
  const inputRef = useRef(null);
  const [category, setCategory] = useState('PASSPORT');
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [previewDoc, setPreviewDoc] = useState(null);

  const refreshAfterDocChange = () => {
    onRefresh?.();
    dispatch(enquiryApi.util.invalidateTags(['EnquiryList', { type: 'EnquiryDetail', id: enquiryId }]));
  };

  const grouped = useMemo(() => {
    const map = new Map(DOCUMENT_CATEGORIES.map((c) => [c.value, []]));
    documents.forEach((doc) => {
      const key = normalizeCategory(doc.category);
      map.get(key).push(doc);
    });
    return map;
  }, [documents]);

  const categoryDocs = grouped.get(category) || [];
  const uploadedCount = documents.length;
  const filledCategories = DOCUMENT_CATEGORIES.filter((c) => (grouped.get(c.value) || []).length > 0).length;

  const uploadFile = async (file) => {
    if (!file || !enquiryId) return;
    setUploading(true);
    try {
      await enquiryService.uploadDocument(enquiryId, file, category);
      toastService.success(`${getDocumentCategoryLabel(category)} uploaded`);
      refreshAfterDocChange();
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
    const file = e.dataTransfer.files?.[0];
    await uploadFile(file);
  };

  const remove = async (doc) => {
    try {
      if (doc?.source === 'student') {
        await studentService.deleteDocument(doc.studentId || doc.entityId, doc.id);
      } else {
        await enquiryService.deleteDocument(enquiryId, doc?.id || doc);
      }
      toastService.success('Document removed');
      refreshAfterDocChange();
    } catch (e) {
      toastService.error(e?.response?.data?.message || 'Failed to delete');
    }
  };

  return (
    <div className="space-y-4">
      <FormSection
        title="Documents"
        description={`${uploadedCount} file${uploadedCount === 1 ? '' : 's'} uploaded · ${filledCategories}/${DOCUMENT_CATEGORIES.length} categories`}
      >
        <div className="space-y-3">
          <div className="crm-doc-categories" role="group" aria-label="Document category">
            {DOCUMENT_CATEGORIES.map((item) => {
              const Icon = ICONS[item.icon] || FiFileText;
              const count = (grouped.get(item.value) || []).length;
              const active = category === item.value;
              return (
                <button
                  key={item.value}
                  type="button"
                  onClick={() => setCategory(item.value)}
                  className={`crm-doc-category ${active ? 'crm-doc-category--active' : ''}`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{item.label}</span>
                  {count > 0 && (
                    <span className="crm-doc-category__count">{count}</span>
                  )}
                </button>
              );
            })}
          </div>

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
            <FiUpload className="w-5 h-5 text-text-muted mx-auto mb-1.5" />
            <p className="text-sm font-medium text-text">
              Upload {getDocumentCategoryLabel(category)}
            </p>
            <p className="text-[12px] text-text-muted mt-0.5">
              Drag & drop or click · PDF, images, Word, Excel
            </p>
            {uploading && (
              <p className="text-[12px] text-brand mt-1.5">Uploading...</p>
            )}
            <input ref={inputRef} type="file" className="hidden" onChange={onFilePick} />
          </div>
        </div>
      </FormSection>

      <div className="pt-1 border-t border-border space-y-2">
        <p className="text-[11px] font-semibold text-text-muted uppercase tracking-wide">
          {getDocumentCategoryLabel(category)} files
        </p>

        {categoryDocs.length === 0 ? (
          <p className="text-sm text-text-muted text-center py-6 border border-dashed border-border rounded-xl bg-page/30">
            No {getDocumentCategoryLabel(category).toLowerCase()} documents yet.
          </p>
        ) : (
          <div className="space-y-2">
            {categoryDocs.map((doc) => (
              <DocCard key={doc.id} doc={doc} onPreview={setPreviewDoc} onRemove={remove} />
            ))}
          </div>
        )}
      </div>

      {documents.length > 0 && (
        <div className="pt-1 border-t border-border space-y-2">
          <p className="text-[11px] font-semibold text-text-muted uppercase tracking-wide">
            All documents
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-2">
            {documents.map((doc) => (
              <DocCard key={doc.id} doc={doc} onPreview={setPreviewDoc} onRemove={remove} compact />
            ))}
          </div>
        </div>
      )}

      <DocumentPreviewModal
        doc={previewDoc}
        open={Boolean(previewDoc)}
        onClose={() => setPreviewDoc(null)}
      />
    </div>
  );
}
