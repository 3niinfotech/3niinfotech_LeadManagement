import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { uploadsRoot } from '../utils/avatar.util.js';

export function createAvatarUpload({ userIdFromReq }) {
  return multer({
    storage: multer.diskStorage({
      destination: (req, _file, cb) => {
        const relativeDir = req.user?.companyId
          ? path.join('company', req.user.companyId, 'avatars')
          : path.join('platform', 'avatars');
        if (!req.user?.companyId && req.user?.role?.slug !== 'super_admin') {
          return cb(new Error('Company context required'));
        }
        req.avatarRelativeDir = relativeDir.replace(/\\/g, '/');
        const dir = path.join(uploadsRoot, relativeDir);
        fs.mkdirSync(dir, { recursive: true });
        return cb(null, dir);
      },
      filename: (req, file, cb) => {
        const extByMime = {
          'image/jpeg': '.jpg',
          'image/png': '.png',
          'image/webp': '.webp',
        };
        const uid = userIdFromReq(req);
        cb(null, `${uid}-${Date.now()}${extByMime[file.mimetype] || '.jpg'}`);
      },
    }),
    limits: { fileSize: 3 * 1024 * 1024 },
    fileFilter: (_req, file, cb) => {
      if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.mimetype)) {
        return cb(new Error('Use JPG, PNG, or WEBP'));
      }
      return cb(null, true);
    },
  });
}

export const selfAvatarUpload = createAvatarUpload({ userIdFromReq: (req) => req.user.id });
export const staffAvatarUpload = createAvatarUpload({ userIdFromReq: (req) => req.params.id });
