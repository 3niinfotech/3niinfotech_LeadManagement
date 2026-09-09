import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { uploadsRoot } from '../utils/avatar.util.js';

const MAX_FILE_SIZE = 15 * 1024 * 1024;

const ALLOWED_MIME = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'text/plain',
  'text/csv',
  'application/zip',
  'application/x-zip-compressed',
]);

function safeOriginalName(name) {
  return String(name || 'file')
    .replace(/\s+/g, '-')
    .replace(/[^\w.\-()]+/g, '')
    .slice(0, 120) || 'file';
}

function attachmentKind(mimeType) {
  return String(mimeType || '').startsWith('image/') ? 'image' : 'file';
}

export const announcementUpload = multer({
  storage: multer.diskStorage({
    destination: (req, _file, cb) => {
      if (!req.user?.companyId) {
        return cb(new Error('Company context required'));
      }
      const relativeDir = path.join('company', req.user.companyId, 'announcements');
      req.announcementRelativeDir = relativeDir.replace(/\\/g, '/');
      const dir = path.join(uploadsRoot, relativeDir);
      fs.mkdirSync(dir, { recursive: true });
      return cb(null, dir);
    },
    filename: (_req, file, cb) => {
      const safe = safeOriginalName(file.originalname);
      cb(null, `${Date.now()}-${safe}`);
    },
  }),
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter: (_req, file, cb) => {
    if (!ALLOWED_MIME.has(file.mimetype)) {
      return cb(new Error('File type not allowed. Use images, PDF, Office docs, TXT, CSV, or ZIP.'));
    }
    return cb(null, true);
  },
});

export function mapUploadedAnnouncementFile(req, file) {
  const relativeDir = req.announcementRelativeDir;
  const url = `/uploads/${relativeDir}/${file.filename}`;
  return {
    url,
    name: file.originalname || file.filename,
    mimeType: file.mimetype,
    size: file.size,
    kind: attachmentKind(file.mimetype),
  };
}
