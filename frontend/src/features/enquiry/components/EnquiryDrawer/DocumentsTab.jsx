import { useMemo, useRef, useState } from 'react';
import { useDispatch } from 'react-redux';
import {
  FiUpload, FiFileText, FiImage, FiAward, FiBookOpen, FiEdit3, FiMail, FiFolder, FiEye, FiTrash2,
} from 'react-icons/fi';
import Button from '../../../../components/ui/Button';
import Badge from '../../../../components/ui/Badge';
import FormSection from '../../../../components/ui/FormSection';
import ScrollArea from '../../../../components/ui/ScrollArea';
import DocumentPreviewModal from './DocumentPreviewModal';
import {
  DOCUMENT_CATEGORIES,
  getDocumentCategoryLabel,
  formatFileSize,
  isPreviewable,
} from '../../config/enquiryDocument.config';
import { enquiryService } from '../../services/enquiryService';
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

export default function DocumentsTab({ enquiryId, documents = [], onRefresh }) {
  const dispatch = useDispatch();
  const inputRef = useRef(null);
  const [category, setCategory] = useState('PASSPORT');
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [previewDoc, setPreviewDoc] = useState(null);

  const refreshAfterDocChange = () => {
    onRefresh?.();
    dispatch(enquiryApi.util.invalidateTags(['EnquiryList']));
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

  const remove = async (docId) => {
    try {
      await enquiryService.deleteDocument(enquiryId, docId);
      toastService.success('Document removed');
      refreshAfterDocChange();
    } catch (e) {
      toastService.error(e?.response?.data?.message || 'Failed to delete');
    }
  };

  return (
    <div className="space-y-5">
      <FormSection
        title="Documents"
        description={`${uploadedCount} file${uploadedCount === 1 ? '' : 's'} uploaded · ${filledCategories}/${DOCUMENT_CATEGORIES.length} categories`}
      >
        <div className="space-y-4">
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
            <FiUpload className="w-6 h-6 text-text-muted mx-auto mb-2" />
            <p className="text-sm font-medium text-text">
              Upload {getDocumentCategoryLabel(category)}
            </p>
            <p className="text-[12px] text-text-muted mt-1">
              Drag & drop or click · PDF, images, Word, Excel
            </p>
            {uploading && (
              <p className="text-[12px] text-brand mt-2">Uploading...</p>
            )}
            <input ref={inputRef} type="file" className="hidden" onChange={onFilePick} />
          </div>
        </div>
      </FormSection>

      <div className="pt-1 border-t border-border">
        <p className="text-[11px] font-semibold text-text-muted uppercase tracking-wide mb-3">
          {getDocumentCategoryLabel(category)} files
        </p>

        {categoryDocs.length === 0 ? (
          <p className="text-sm text-text-muted text-center py-8 border border-dashed border-border rounded-lg">
            No {getDocumentCategoryLabel(category).toLowerCase()} documents yet.
          </p>
        ) : (
          <div className="space-y-2">
            {categoryDocs.map((doc) => {
              const canPreview = Boolean(isPreviewable(doc.mimeType, doc.name || doc.fileName));
              return (
                <div key={doc.id} className="crm-doc-item">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-text truncate">{doc.name}</p>
                    <p className="text-[11px] text-text-muted mt-0.5">
                      {formatFileSize(doc.fileSize)}
                      {' · '}
                      {new Date(doc.createdAt).toLocaleString('en-IN')}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {canPreview && (
                      <Badge color="info" className="text-[10px] hidden sm:inline-flex">Preview</Badge>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      icon={FiEye}
                      onClick={() => setPreviewDoc(doc)}
                      aria-label="Preview"
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      icon={FiTrash2}
                      onClick={() => remove(doc.id)}
                      aria-label="Delete"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {documents.length > 0 && (
        <div className="pt-1 border-t border-border">
          <p className="text-[11px] font-semibold text-text-muted uppercase tracking-wide mb-3">
            All documents
          </p>
          <ScrollArea axis="x" className="rounded-lg border border-border">
            <table className="w-full text-[12px]">
              <thead className="bg-row-hover text-left text-text-secondary">
                <tr>
                  <th className="px-3 py-2 font-semibold">Name</th>
                  <th className="px-3 py-2 font-semibold">Category</th>
                  <th className="px-3 py-2 font-semibold">Size</th>
                  <th className="px-3 py-2 font-semibold">Uploaded</th>
                  <th className="px-3 py-2 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {documents.map((doc) => (
                  <tr key={doc.id} className="border-t border-border">
                    <td className="px-3 py-2 max-w-[180px] truncate">{doc.name}</td>
                    <td className="px-3 py-2">{getDocumentCategoryLabel(doc.category)}</td>
                    <td className="px-3 py-2 whitespace-nowrap">{formatFileSize(doc.fileSize)}</td>
                    <td className="px-3 py-2 whitespace-nowrap tabular-nums">
                      {new Date(doc.createdAt).toLocaleDateString('en-IN')}
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="sm" icon={FiEye} onClick={() => setPreviewDoc(doc)} />
                        <Button variant="ghost" size="sm" icon={FiTrash2} onClick={() => remove(doc.id)} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </ScrollArea>
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
