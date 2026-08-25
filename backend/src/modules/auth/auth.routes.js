import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { authenticate } from '../../middleware/auth.middleware.js';
import { authLimiter } from '../../middleware/rateLimit.middleware.js';
import * as authController from './auth.controller.js';

const router = Router();
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadsRoot = path.join(__dirname, '..', '..', '..', 'uploads');

const avatarUpload = multer({
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
      cb(null, `${req.user.id}-${Date.now()}${extByMime[file.mimetype] || '.jpg'}`);
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

router.post('/login', authLimiter, authController.login);
router.post('/refresh', authController.refresh);
router.post('/logout', authenticate, authController.logout);
router.get('/profile', authenticate, authController.getProfile);
router.patch('/profile', authenticate, authController.updateProfile);
router.post('/profile/avatar', authenticate, avatarUpload.single('file'), authController.uploadAvatar);
router.delete('/profile/avatar', authenticate, authController.removeAvatar);
router.post('/change-password', authenticate, authLimiter, authController.changePassword);
router.patch('/preferences', authenticate, authController.updatePreferences);

router.get('/register/branches', authLimiter, authController.getRegistrationBranches);
router.post('/register/student', authLimiter, authController.registerStudent);
router.post('/register/agent', authLimiter, authController.registerAgent);

export default router;
