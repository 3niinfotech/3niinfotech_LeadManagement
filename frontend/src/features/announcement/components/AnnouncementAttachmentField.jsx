import { useRef, useState } from 'react';
import {
  FiFile, FiFileText, FiImage, FiPaperclip, FiTrash2, FiUploadCloud,
} from 'react-icons/fi';
import { announcementApi } from '../services/announcementApi.service';
import {
  formatFileSize,
  fileIconKind,
  MAX_ANNOUNCEMENT_ATTACHMENTS,
  resolveUploadSrc,
} from '../utils/announcement.utils';
import '../styles/announcement-attachments.theme.css';

function FileKindIcon({ kind }) {
  if (kind === 'image') return <FiImage className="w-4 h-4" />;
  if (kind === 'pdf' || kind === 'doc') return <FiFileText className="w-4 h-4" />;
  return <FiFile className="w-4 h-4" />;
}

export default function AnnouncementAttachmentField({
  value = [],
  onChange,
  disabled = false,
  error,
}) {
  const inputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [uploadError, setUploadError] = useState('');

  const items = Array.isArray(value) ? value : [];
  const atLimit = items.length >= MAX_ANNOUNCEMENT_ATTACHMENTS;

  const uploadFiles = async (fileList) => {
    const files = Array.from(fileList || []);
    if (!files.length || disabled) return;

    const remaining = MAX_ANNOUNCEMENT_ATTACHMENTS - items.length;
    if (remaining <= 0) {
      setUploadError(`Maximum ${MAX_ANNOUNCEMENT_ATTACHMENTS} files allowed`);
      return;
    }

    const batch = files.slice(0, remaining);
    setUploading(true);
    setUploadError('');

    try {
      const uploaded = [];
      for (const file of batch) {
        const res = await announcementApi.uploadFile(file);
        if (res?.data) uploaded.push(res.data);
      }
      onChange?.([...items, ...uploaded]);
    } catch (err) {
      setUploadError(err?.response?.data?.message || err?.message || 'Upload failed');
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const removeAt = (index) => {
    if (disabled) return;
    onChange?.(items.filter((_, i) => i !== index));
  };

  const onDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    uploadFiles(e.dataTransfer?.files);
  };

  return (
    <div className="crm-ann-upload">
      <div className="crm-ann-upload__label-row">
        <label className="crm-ann-upload__label">
          <FiPaperclip className="w-3.5 h-3.5" />
          Images & files
        </label>
        <span className="crm-ann-upload__hint">
          {items.length}/{MAX_ANNOUNCEMENT_ATTACHMENTS} · JPG, PNG, PDF, Office, ZIP (max 15 MB each)
        </span>
      </div>

      {!disabled && !atLimit && (
        <button
          type="button"
          className={`crm-ann-upload__drop ${dragOver ? 'crm-ann-upload__drop--active' : ''}`}
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={onDrop}
          disabled={uploading}
        >
          <FiUploadCloud className="w-6 h-6" />
          <span className="crm-ann-upload__drop-title">
            {uploading ? 'Uploading…' : 'Click or drag files here'}
          </span>
          <span className="crm-ann-upload__drop-sub">
            Share images, PDFs, documents, or ZIP files with your announcement
          </span>
          <input
            ref={inputRef}
            type="file"
            multiple
            className="sr-only"
            accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.zip"
            onChange={(e) => uploadFiles(e.target.files)}
          />
        </button>
      )}

      {(uploadError || error) && (
        <p className="crm-ann-upload__error" role="alert">{uploadError || error}</p>
      )}

      {items.length > 0 && (
        <ul className="crm-ann-upload__list">
          {items.map((item, index) => {
            const kind = fileIconKind(item);
            const src = kind === 'image' ? resolveUploadSrc(item.url) : null;
            return (
              <li key={`${item.url}-${index}`} className="crm-ann-upload__item">
                <div className="crm-ann-upload__preview">
                  {src ? (
                    <img src={src} alt="" />
                  ) : (
                    <span className="crm-ann-upload__icon"><FileKindIcon kind={kind} /></span>
                  )}
                </div>
                <div className="crm-ann-upload__meta">
                  <p className="crm-ann-upload__name" title={item.name}>{item.name}</p>
                  <p className="crm-ann-upload__size">
                    {item.kind === 'image' ? 'Image' : 'File'}
                    {item.size ? ` · ${formatFileSize(item.size)}` : ''}
                  </p>
                </div>
                {!disabled && (
                  <button
                    type="button"
                    className="crm-ann-upload__remove"
                    onClick={() => removeAt(index)}
                    title="Remove file"
                  >
                    <FiTrash2 className="w-4 h-4" />
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
