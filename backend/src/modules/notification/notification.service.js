import prisma from '../../config/database.js';

export const notificationService = {
  getUserNotifications: async (userId, { page = 1, limit = 20, unreadOnly = false } = {}) => {
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10) || 20));
    const skip = (pageNum - 1) * limitNum;
    const where = {
      userId,
      ...((unreadOnly === true || unreadOnly === 'true') ? { isRead: false } : {}),
    };

    const [data, total, unreadCount] = await Promise.all([
      prisma.notification.findMany({ where, skip, take: limitNum, orderBy: { createdAt: 'desc' } }),
      prisma.notification.count({ where }),
      prisma.notification.count({ where: { userId, isRead: false } }),
    ]);

    return { data, total, unreadCount, page: pageNum, limit: limitNum };
  },

  markAsRead: async (userId, notificationId) =>
    prisma.notification.updateMany({
      where: { id: notificationId, userId },
      data: { isRead: true, readAt: new Date() },
    }),

  markAllAsRead: async (userId) =>
    prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true, readAt: new Date() },
    }),

  create: async (data) => prisma.notification.create({ data }),
};
