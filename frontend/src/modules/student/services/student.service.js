import { API } from '../../../config/api';
import apiClient, { apiGet, apiPost, apiPut, apiDelete } from '../../../api/apiClient';

export const studentService = {
  getAll: async (params) => {
    const response = await apiGet(API.STUDENTS, params);
    return { data: response.data, pagination: response.pagination };
  },

  getById: async (id) => {
    const response = await apiGet(API.STUDENT_BY_ID(id));
    return response.data;
  },

  create: async (data) => {
    const response = await apiPost(API.STUDENTS, data);
    return response.data;
  },

  update: async (id, data) => {
    const response = await apiPut(API.STUDENT_BY_ID(id), data);
    return response.data;
  },

  getSummary: async (params) => {
    const response = await apiGet(API.STUDENTS_SUMMARY, params);
    return response.data;
  },

  exportStudents: async (params) => {
    const res = await apiClient.post(API.STUDENTS_EXPORT, params, {
      responseType: 'blob',
    });
    const disposition = res.headers?.['content-disposition'] || '';
    const match = /filename="?([^"]+)"?/i.exec(disposition);
    const filename = match?.[1] || `CRM-Students-Export-${new Date().toISOString().slice(0, 10)}.xlsx`;
    const count = Number(res.headers?.['x-export-count'] || 0);
    const selected = res.headers?.['x-export-selected'] === '1';
    return { blob: res.data, filename, count, selected };
  },

  delete: async (id) => apiDelete(API.STUDENT_BY_ID(id)),

  bulkDelete: async (ids) => apiPost(API.STUDENTS_BULK_DELETE, { ids }),

  bulkAssign: async (ids, assignedToId) =>
    apiPost(API.STUDENTS_BULK_ASSIGN, { ids, assignedToId }),

  bulkUpdateStatus: async (ids, status) =>
    apiPost(API.STUDENTS_BULK_STATUS, { ids, status }),
};
