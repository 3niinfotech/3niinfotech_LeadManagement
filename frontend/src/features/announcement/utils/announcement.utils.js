import apiClient from '../../../api/axios';

const STORAGE_PREFIX = 'crm-announcement-read';
export const MAX_ANNOUNCEMENT_ATTACHMENTS = 5;

function storageKey(userId) {
  return `${STORAGE_PREFIX}:${userId || 'anon'}`;
}

export function getReadAnnouncementMap(userId) {
  try {
    const raw = localStorage.getItem(storageKey(userId));
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

export function isAnnouncementUnread(userId, item) {
  if (!item?.id) return false;
  const map = getReadAnnouncementMap(userId);
  const seenAt = map[item.id];
  if (!seenAt) return true;
  const updated = item.updatedAt || item.publishedAt;
  if (!updated) return false;
  return new Date(updated).getTime() > new Date(seenAt).getTime();
}

export function markAnnouncementsRead(userId, items = []) {
  if (!userId || !items.length) return;
  const map = getReadAnnouncementMap(userId);
  const now = new Date().toISOString();
  items.forEach((item) => {
    if (item?.id) map[item.id] = now;
  });
  try {
    localStorage.setItem(storageKey(userId), JSON.stringify(map));
  } catch {
    /* quota */
  }
}

/** Server + local read tracking when user opens an announcement */
export async function trackAnnouncementView(userId, item) {
  if (!item?.id) return;
  markAnnouncementsRead(userId, [item]);
  try {
    const { announcementApi } = await import('../services/announcementApi.service');
    await announcementApi.recordView(item.id);
    window.dispatchEvent(new CustomEvent('crm-announcement-viewed', { detail: { id: item.id } }));
    window.dispatchEvent(new Event('crm-announcements-seen'));
  } catch {
    /* offline or permission — local read state still applies */
  }
}

export function countUnreadAnnouncements(userId, items = []) {
  return items.filter((item) => isAnnouncementUnread(userId, item)).length;
}

export const ANNOUNCEMENT_AUDIENCE_OPTIONS = [
  { value: 'student_portal', label: 'Students only' },
  { value: 'counsellor', label: 'Counsellors' },
  { value: 'reception', label: 'Reception' },
  { value: 'all_staff', label: 'All staff' },
  { value: 'everyone', label: 'Everyone (staff + students)' },
];

export function parseAnnouncementVariables(raw) {
  if (!raw) return {};
  if (typeof raw === 'object' && !Array.isArray(raw)) return raw;
  if (Array.isArray(raw)) {
    const imageUrl = raw.find((v) => typeof v === 'string' && (/^https?:\/\//i.test(v) || v.startsWith('/uploads/')));
    return imageUrl ? { imageUrl } : {};
  }
  if (typeof raw === 'string') {
    const trimmed = raw.trim();
    if (!trimmed) return {};
    try {
      const parsed = JSON.parse(trimmed);
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) return parsed;
    } catch {
      /* ignore */
    }
  }
  return {};
}

export function normalizeAttachmentsFromVars(vars = {}) {
  const list = Array.isArray(vars.attachments) ? vars.attachments : [];
  const cleaned = list
    .filter((item) => item && (item.url || item.path))
    .map((item) => ({
      url: String(item.url || item.path).trim(),
      name: String(item.name || 'Attachment').trim(),
      mimeType: item.mimeType || item.type || null,
      size: Number(item.size) || 0,
      kind: item.kind === 'image' || String(item.mimeType || '').startsWith('image/') ? 'image' : 'file',
    }));

  const legacyImage = vars.imageUrl || vars.image;
  if (legacyImage && !cleaned.some((a) => a.url === legacyImage)) {
    cleaned.unshift({
      url: String(legacyImage).trim(),
      name: 'Image',
      mimeType: 'image/*',
      size: 0,
      kind: 'image',
    });
  }

  return cleaned;
}

export function buildAnnouncementPayload(values, existingRecord = null) {
  const payload = { ...values };
  const audience = values.eventType || 'all_staff';
  const attachments = Array.isArray(values.attachments) ? values.attachments : [];
  const firstImage = attachments.find((a) => a.kind === 'image');
  const existingVars = parseAnnouncementVariables(existingRecord?.variables);

  payload.eventType = audience;
  payload.channel = 'ANNOUNCEMENT';
  payload.variables = {
    ...existingVars,
    audience,
    attachments,
    ...(firstImage?.url ? { imageUrl: firstImage.url } : {}),
  };

  delete payload.attachments;
  delete payload.announcementImageUrl;
  return payload;
}

export function mapAnnouncementFormRecord(record) {
  if (!record) return record;
  const vars = parseAnnouncementVariables(record.variables);
  const attachments = normalizeAttachmentsFromVars(vars);
  return {
    ...record,
    eventType: record.eventType || vars.audience || 'all_staff',
    attachments,
  };
}

export function resolveUploadSrc(url) {
  if (!url) return null;
  if (/^https?:\/\//i.test(url)) return url;
  if (url.startsWith('/uploads/')) {
    const base = import.meta.env.VITE_API_URL?.replace(/\/api\/?$/, '') || '';
    return `${base}${url}`;
  }
  return url;
}

export function resolveImageSrc(url) {
  return resolveUploadSrc(url);
}

export function formatFileSize(bytes) {
  const size = Number(bytes) || 0;
  if (!size) return '';
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

export function fileIconKind(attachment) {
  const mime = String(attachment?.mimeType || '').toLowerCase();
  const name = String(attachment?.name || '').toLowerCase();
  if (attachment?.kind === 'image' || mime.startsWith('image/')) return 'image';
  if (mime.includes('pdf') || name.endsWith('.pdf')) return 'pdf';
  if (mime.includes('sheet') || mime.includes('excel') || name.endsWith('.xls') || name.endsWith('.xlsx')) return 'sheet';
  if (mime.includes('word') || name.endsWith('.doc') || name.endsWith('.docx')) return 'doc';
  if (mime.includes('zip')) return 'zip';
  return 'file';
}

export function getAnnouncementHeroImage(item) {
  const attachments = item?.attachments || [];
  const image = attachments.find((a) => a.kind === 'image');
  return image?.url || item?.imageUrl || null;
}
