import { API } from '../../../config/api';
import { apiGet, apiPatch } from '../../../api/apiClient';

export const notificationService = {
  getAll: async (params) => {
    const response = await apiGet(API.NOTIFICATIONS, params);
    return response.data;
  },

  markAsRead: async (id) => apiPatch(API.NOTIFICATION_READ(id)),

  markAllAsRead: async () => apiPatch(API.NOTIFICATIONS_READ_ALL),
};
