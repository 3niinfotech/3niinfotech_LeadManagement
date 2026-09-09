import { apiGet } from '../../../api/apiClient';
import { API } from '../../../config/api';

export const reminderApi = {
  getFeed: (params) => apiGet(API.REMINDERS, params),
  getSummary: (params) => apiGet(API.REMINDERS_SUMMARY, params),
};
