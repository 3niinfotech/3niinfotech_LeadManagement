import { Router } from 'express';
import { authenticate, authorize } from '../../middleware/auth.middleware.js';
import { PERMISSIONS } from '../../config/permissions.js';
import { announcementUpload } from '../../middleware/announcement-upload.middleware.js';
import {
  listAnnouncements,
  announcementCount,
  uploadAnnouncementFile,
  recordAnnouncementView,
  announcementManageStats,
  announcementViewers,
  resendAnnouncementNotifications,
} from './announcement.controller.js';

const router = Router();
const manage = authorize(PERMISSIONS.MASTERS_VIEW, PERMISSIONS.MASTERS_MANAGE);

router.use(authenticate);

router.get('/', listAnnouncements);
router.get('/count', announcementCount);
router.get('/manage/stats', manage, announcementManageStats);
router.post('/:id/notify', manage, resendAnnouncementNotifications);
router.post(
  '/upload',
  authorize(PERMISSIONS.MASTERS_MANAGE),
  announcementUpload.single('file'),
  uploadAnnouncementFile,
);
router.get('/:id/viewers', manage, announcementViewers);
router.post('/:id/view', recordAnnouncementView);

export default router;
