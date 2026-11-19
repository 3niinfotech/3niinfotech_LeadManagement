import { API } from '../../../config/api';
import { apiGet, apiPatch, apiDelete } from '../../../api/apiClient';

export const notificationService = {
  getAll: async (params) => {
    const response = await apiGet(API.NOTIFICATIONS, params);
    return response.data;
  },

  getUnreadCount: async () => {
    const response = await apiGet('/notifications/unread-count');
    return response.data?.unreadCount || 0;
  },

  markAsRead: async (id) => apiPatch(API.NOTIFICATION_READ(id)),

  markAllAsRead: async () => apiPatch(API.NOTIFICATIONS_READ_ALL),

  deleteNotification: async (id) => apiDelete(`/notifications/${id}`),

  clearAll: async () => apiDelete('/notifications/clear-all'),
};
