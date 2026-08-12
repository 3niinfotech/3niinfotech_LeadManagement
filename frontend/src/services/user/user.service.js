import { API } from '../../config/api';
import { apiGet, apiPatch } from '../../api/apiClient';

export const userService = {
  getAll: async (params) => {
    const response = await apiGet(API.USERS, params);
    return { data: response.data, pagination: response.pagination };
  },

  getById: async (id) => {
    const response = await apiGet(API.USER_BY_ID(id));
    return response.data;
  },

  getRoles: async () => {
    const response = await apiGet(API.USER_ROLES);
    return response.data;
  },

  getTeamSummary: async () => {
    const response = await apiGet(API.USER_TEAM_SUMMARY);
    return response.data;
  },
};
