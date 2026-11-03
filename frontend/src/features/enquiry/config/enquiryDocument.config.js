import { STORAGE_KEYS } from '../../../config/storageKeys';

export const DOCUMENT_CATEGORIES = [
  { value: 'PASSPORT', label: 'Passport', icon: 'passport' },
  { value: 'ACADEMIC', label: 'Academic', icon: 'certificate' },
  { value: 'TENTH', label: '10th', icon: 'certificate' },
  { value: 'TWELFTH', label: '12th', icon: 'certificate' },
  { value: 'DEGREE', label: 'Degree', icon: 'graduation' },
  { value: 'LANGUAGE_TEST', label: 'Language Test', icon: 'test' },
  { value: 'IELTS', label: 'IELTS', icon: 'test' },
  { value: 'PTE', label: 'PTE', icon: 'test' },
  { value: 'FINANCIAL', label: 'Financial', icon: 'certificate' },
  { value: 'RESUME', label: 'Resume', icon: 'file' },
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

function needsAuthForUpload(relativePath) {
  const rel = String(relativePath || '').replace(/^\/+/, '');
  if (rel.startsWith('company/') || rel.startsWith('public/')) return false;
  return true;
}

function withAccessToken(url) {
  if (!url || url.startsWith('blob:') || url.startsWith('data:') || url.startsWith('http')) {
    return url;
  }
  try {
    const token = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
    if (!token) return url;
    const sep = url.includes('?') ? '&' : '?';
    return `${url}${sep}access_token=${encodeURIComponent(token)}`;
  } catch {
    return url;
  }
}

export function getDocumentUrl(filePath) {
  if (!filePath) return null;
  if (filePath.startsWith('http') || filePath.startsWith('blob:') || filePath.startsWith('data:')) {
    return filePath;
  }
  const normalized = String(filePath).replace(/\\/g, '/').replace(/^\/+/, '');
  let relative = normalized;
  if (normalized.includes('uploads/')) {
    relative = normalized.slice(normalized.indexOf('uploads/') + 'uploads/'.length);
  }
  // Encode each segment so filenames with spaces (e.g. "Supported GST.png") load in <img>
  const encoded = relative
    .split('/')
    .filter(Boolean)
    .map((seg) => encodeURIComponent(seg))
    .join('/');
  const url = `/uploads/${encoded}`;
  return needsAuthForUpload(relative) ? withAccessToken(url) : url;
}

function isImageDocument(doc) {
  if (!doc) return false;
  if (String(doc.mimeType || '').startsWith('image/')) return true;
  return /\.(jpe?g|png|gif|webp|bmp|svg)$/i.test(doc.fileName || doc.name || doc.filePath || '');
}

/** Prefer photoUrl, else latest PHOTO document (any image file in Photo category). */
export function resolveEnquiryPhotoUrl(enquiry) {
  if (!enquiry) return null;
  const direct = getDocumentUrl(enquiry.photoUrl);
  if (direct) {
    const stamp = enquiry.updatedAt || enquiry.id || '';
    return `${direct}${direct.includes('?') ? '&' : '?'}v=${encodeURIComponent(String(stamp))}`;
  }

  const docs = Array.isArray(enquiry.documents) ? enquiry.documents : [];
  const photos = docs.filter((d) => String(d.category || '').toUpperCase() === 'PHOTO');
  const photo = photos.find(isImageDocument) || photos[0];
  const url = getDocumentUrl(photo?.filePath || photo?.url || null);
  if (!url) return null;
  const stamp = photo?.updatedAt || photo?.createdAt || photo?.id || '';
  return `${url}${url.includes('?') ? '&' : '?'}v=${encodeURIComponent(String(stamp))}`;
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
