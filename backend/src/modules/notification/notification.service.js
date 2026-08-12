import prisma from '../../config/database.js';

export const notificationService = {
  getUserNotifications: async (userId, { page = 1, limit = 20, unreadOnly = false }) => {
    const skip = (page - 1) * limit;
    const where = { userId, ...(unreadOnly && { isRead: false }) };

    const [data, total, unreadCount] = await Promise.all([
      prisma.notification.findMany({ where, skip, take: limit, orderBy: { createdAt: 'desc' } }),
      prisma.notification.count({ where }),
      prisma.notification.count({ where: { userId, isRead: false } }),
    ]);

    return { data, total, unreadCount, page, limit };
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
