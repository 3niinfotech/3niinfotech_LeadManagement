import { API } from '../../../config/api';
import { apiGet, apiPost, apiPut, apiPatch } from '../../../api/apiClient';

export function getUserApiError(err, fallback = 'Request failed') {
  return err?.response?.data?.message || err?.message || fallback;
}

function unwrap(res) {
  return res?.data ?? res;
}

export const staffApi = {
  list: async (params = {}) => {
    const res = await apiGet(API.USERS, { limit: 100, ...params });
    return {
      data: res?.data ?? res ?? [],
      pagination: res?.pagination,
    };
  },

  getRoles: async () => unwrap(await apiGet(API.USER_ROLES)),

  create: async (payload) => unwrap(await apiPost(API.USERS, payload)),

  update: async (id, payload) => unwrap(await apiPut(API.USER_BY_ID(id), payload)),

  updateStatus: async (id, status) => unwrap(await apiPatch(API.USER_STATUS(id), { status })),
};

export default staffApi;
