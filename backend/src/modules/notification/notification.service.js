import prisma from '../../config/database.js';
import { pushNotificationCount } from './notification.push.js';

export const notificationService = {
  getUserNotifications: async (userId, { page = 1, limit = 20, unreadOnly = false, category = null } = {}) => {
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10) || 20));
    const skip = (pageNum - 1) * limitNum;
    const where = {
      userId,
      ...((unreadOnly === true || unreadOnly === 'true') ? { isRead: false } : {}),
      ...(category && category !== 'ALL' ? { category: String(category).toUpperCase() } : {}),
    };

    const [data, total, unreadCount] = await Promise.all([
      prisma.notification.findMany({ where, skip, take: limitNum, orderBy: { createdAt: 'desc' } }),
      prisma.notification.count({ where }),
      prisma.notification.count({ where: { userId, isRead: false } }),
    ]);

    return { data, total, unreadCount, page: pageNum, limit: limitNum };
  },

  getUnreadCount: async (userId) => {
    return prisma.notification.count({
      where: { userId, isRead: false },
    });
  },

  markAsRead: async (userId, notificationId) => {
    await prisma.notification.updateMany({
      where: { id: notificationId, userId },
      data: { isRead: true, readAt: new Date() },
    });
    const unread = await prisma.notification.count({ where: { userId, isRead: false } });
    pushNotificationCount(userId, unread);
    return { unreadCount: unread };
  },

  markAllAsRead: async (userId) => {
    await prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true, readAt: new Date() },
    });
    pushNotificationCount(userId, 0);
    return { unreadCount: 0 };
  },

  deleteNotification: async (userId, notificationId) => {
    await prisma.notification.deleteMany({
      where: { id: notificationId, userId },
    });
    const unread = await prisma.notification.count({ where: { userId, isRead: false } });
    pushNotificationCount(userId, unread);
    return { unreadCount: unread };
  },

  clearAll: async (userId) => {
    await prisma.notification.deleteMany({
      where: { userId },
    });
    pushNotificationCount(userId, 0);
    return { unreadCount: 0 };
  },

  create: async (data) => {
    const notification = await prisma.notification.create({ data });
    if (data.userId) {
      prisma.notification.count({ where: { userId: data.userId, isRead: false } })
        .then((count) => pushNotificationCount(data.userId, count))
        .catch(() => {});
    }
    return notification;
  },
};
