import apiClient from '../../../api/axios';
import { apiGet, apiPost } from '../../../api/apiClient';

export const announcementApi = {
  list: (params = {}) => apiGet('/announcements', params),
  count: () => apiGet('/announcements/count'),
  recordView: (id) => apiPost(`/announcements/${id}/view`, {}),
  getManageStats: () => apiGet('/announcements/manage/stats'),
  getViewers: (id) => apiGet(`/announcements/${id}/viewers`),
  resendNotifications: (id) => apiPost(`/announcements/${id}/notify`, {}),
  uploadFile: (file, onProgress) => {
    const form = new FormData();
    form.append('file', file);
    return apiClient.post('/announcements/upload', form, {
      onUploadProgress: onProgress
        ? (event) => {
          const pct = event.total ? Math.round((event.loaded * 100) / event.total) : 0;
          onProgress(pct);
        }
        : undefined,
    }).then((res) => res.data);
  },
};
