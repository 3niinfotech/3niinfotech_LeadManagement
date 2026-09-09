import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { authenticate, authorize } from '../../middleware/auth.middleware.js';
import { PERMISSIONS } from '../../config/permissions.js';
import * as organizationController from './organization.controller.js';

const router = Router();
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const brandingDir = path.join(__dirname, '..', '..', '..', 'uploads', 'company');
fs.mkdirSync(brandingDir, { recursive: true });

const brandingUpload = multer({
  storage: multer.diskStorage({
    destination: (req, _file, cb) => {
      const companyId = req.user?.companyId;
      if (!companyId) return cb(new Error('Company context required'));
      const dir = path.join(brandingDir, companyId);
      fs.mkdirSync(dir, { recursive: true });
      cb(null, dir);
    },
    filename: (req, file, cb) => {
      const kind = req.query.kind === 'favicon' ? 'favicon' : 'logo';
      const ext = path.extname(file.originalname || '').toLowerCase() || '.png';
      cb(null, `${kind}${ext}`);
    },
  }),
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const ok = /^image\/(png|jpe?g|webp|gif|svg\+xml|x-icon|vnd.microsoft.icon)$/i.test(file.mimetype)
      || /\.(png|jpe?g|webp|gif|svg|ico)$/i.test(file.originalname || '');
    if (!ok) return cb(new Error('Use PNG, JPG, WEBP, SVG, or ICO'));
    cb(null, true);
  },
});

const view = authorize(
  PERMISSIONS.SETTINGS_VIEW,
  PERMISSIONS.MASTERS_VIEW,
  PERMISSIONS.ENQUIRIES_VIEW,
);
const manage = authorize(PERMISSIONS.SETTINGS_UPDATE, PERMISSIONS.MASTERS_MANAGE);

router.use(authenticate);

router.get('/company', view, organizationController.getCompany);
router.put('/company', manage, organizationController.updateCompany);
router.post('/company/branding', manage, brandingUpload.single('file'), organizationController.uploadBranding);
router.get('/branches', view, organizationController.listBranches);
router.post('/branches', manage, organizationController.createBranch);
router.put('/branches/:id', manage, organizationController.updateBranch);
router.patch('/branches/:id/status', manage, organizationController.updateBranchStatus);
router.delete('/branches/:id', manage, organizationController.deleteBranch);
router.get('/viewing-branch', view, organizationController.getViewingBranch);
router.patch('/viewing-branch', view, organizationController.setViewingBranch);

export default router;
