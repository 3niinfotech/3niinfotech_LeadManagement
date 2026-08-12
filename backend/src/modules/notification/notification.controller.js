import { asyncHandler, sendSuccess } from '../../utils/response.util.js';
import { notificationService } from './notification.service.js';

export const getNotifications = asyncHandler(async (req, res) => {
  const result = await notificationService.getUserNotifications(req.user.id, req.query);
  sendSuccess(res, result);
});

export const markAsRead = asyncHandler(async (req, res) => {
  await notificationService.markAsRead(req.user.id, req.params.id);
  sendSuccess(res, null, 'Notification marked as read');
});

export const markAllAsRead = asyncHandler(async (req, res) => {
  await notificationService.markAllAsRead(req.user.id);
  sendSuccess(res, null, 'All notifications marked as read');
});
