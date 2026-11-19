import { asyncHandler, sendSuccess } from '../../utils/response.util.js';
import { notificationService } from './notification.service.js';

export const getNotifications = asyncHandler(async (req, res) => {
  const result = await notificationService.getUserNotifications(req.user.id, req.query);
  sendSuccess(res, result);
});

export const getUnreadCount = asyncHandler(async (req, res) => {
  const unreadCount = await notificationService.getUnreadCount(req.user.id);
  sendSuccess(res, { unreadCount });
});

export const markAsRead = asyncHandler(async (req, res) => {
  const data = await notificationService.markAsRead(req.user.id, req.params.id);
  sendSuccess(res, data, 'Notification marked as read');
});

export const markAllAsRead = asyncHandler(async (req, res) => {
  const data = await notificationService.markAllAsRead(req.user.id);
  sendSuccess(res, data, 'All notifications marked as read');
});

export const deleteNotification = asyncHandler(async (req, res) => {
  const data = await notificationService.deleteNotification(req.user.id, req.params.id);
  sendSuccess(res, data, 'Notification deleted');
});

export const clearAll = asyncHandler(async (req, res) => {
  const data = await notificationService.clearAll(req.user.id);
  sendSuccess(res, data, 'All notifications cleared');
});
