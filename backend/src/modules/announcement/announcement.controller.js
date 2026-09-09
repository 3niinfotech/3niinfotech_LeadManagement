import { asyncHandler } from '../../utils/response.util.js';
import { AppError } from '../../utils/response.util.js';
import { announcementService } from './announcement.service.js';
import { mapUploadedAnnouncementFile } from '../../middleware/announcement-upload.middleware.js';

export const listAnnouncements = asyncHandler(async (req, res) => {
  const result = await announcementService.listForUser(req.user, {
    page: req.query.page,
    pageSize: req.query.pageSize,
  });
  res.json({ success: true, ...result });
});

export const announcementCount = asyncHandler(async (req, res) => {
  const counts = await announcementService.countForUser(req.user);
  res.json({ success: true, data: counts });
});

export const uploadAnnouncementFile = asyncHandler(async (req, res) => {
  if (!req.file) throw new AppError('No file uploaded', 400);
  const data = mapUploadedAnnouncementFile(req, req.file);
  res.json({ success: true, data });
});

export const recordAnnouncementView = asyncHandler(async (req, res) => {
  const data = await announcementService.recordView(req.params.id, req.user);
  res.json({ success: true, data });
});

export const announcementManageStats = asyncHandler(async (req, res) => {
  const data = await announcementService.getManageStats(req.user);
  res.json({ success: true, data });
});

export const announcementViewers = asyncHandler(async (req, res) => {
  const data = await announcementService.getViewers(req.params.id, req.user);
  res.json({ success: true, data });
});

export const resendAnnouncementNotifications = asyncHandler(async (req, res) => {
  const data = await announcementService.resendNotifications(req.params.id, req.user);
  res.json({ success: true, data });
});
