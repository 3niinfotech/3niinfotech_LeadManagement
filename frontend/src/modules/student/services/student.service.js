import { API } from '../../../config/api';
import { apiGet, apiPost, apiPut, apiDelete } from '../../../api/apiClient';

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

  delete: async (id) => apiDelete(API.STUDENT_BY_ID(id)),

  bulkDelete: async (ids) => apiPost(API.STUDENTS_BULK_DELETE, { ids }),

  bulkAssign: async (ids, assignedToId) =>
    apiPost(API.STUDENTS_BULK_ASSIGN, { ids, assignedToId }),
};
