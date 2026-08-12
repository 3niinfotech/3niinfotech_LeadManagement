export const DOCUMENT_CATEGORIES = [
  { value: 'PASSPORT', label: 'Passport', icon: 'passport' },
  { value: 'TENTH', label: '10th', icon: 'certificate' },
  { value: 'TWELFTH', label: '12th', icon: 'certificate' },
  { value: 'DEGREE', label: 'Degree', icon: 'graduation' },
  { value: 'RESUME', label: 'Resume', icon: 'file' },
  { value: 'IELTS', label: 'IELTS', icon: 'test' },
  { value: 'PTE', label: 'PTE', icon: 'test' },
  { value: 'SOP', label: 'SOP', icon: 'edit' },
  { value: 'LOR', label: 'LOR', icon: 'mail' },
  { value: 'PHOTO', label: 'Photo', icon: 'image' },
  { value: 'OTHERS', label: 'Others', icon: 'folder' },
];

export function getDocumentCategoryLabel(value) {
  return DOCUMENT_CATEGORIES.find((c) => c.value === value)?.label ?? value ?? 'Others';
}

export function getDocumentCategoryMeta(value) {
  return DOCUMENT_CATEGORIES.find((c) => c.value === value)
    || { value: 'OTHERS', label: 'Others', icon: 'folder' };
}

export function getDocumentUrl(filePath) {
  if (!filePath) return null;
  if (filePath.startsWith('http')) return filePath;
  const normalized = filePath.replace(/\\/g, '/');
  let relative = normalized;
  if (normalized.includes('uploads/')) {
    relative = normalized.slice(normalized.indexOf('uploads/'));
  } else if (!normalized.startsWith('uploads/')) {
    relative = `uploads/${normalized}`;
  }
  return `/${relative}`;
}

export function formatFileSize(bytes) {
  if (!bytes && bytes !== 0) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function isPreviewable(mimeType, fileName) {
  const mime = (mimeType || '').toLowerCase();
  const name = (fileName || '').toLowerCase();
  if (mime.startsWith('image/')) return 'image';
  if (mime === 'application/pdf' || name.endsWith('.pdf')) return 'pdf';
  return null;
}
