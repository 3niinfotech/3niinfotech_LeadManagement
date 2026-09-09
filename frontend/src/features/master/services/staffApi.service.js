import { API } from '../../../config/api';
import { apiGet, apiPost, apiPut, apiPatch, apiDelete } from '../../../api/apiClient';

export function getUserApiError(err, fallback = 'Request failed') {
  return err?.response?.data?.message || err?.message || fallback;
}

/** Normalise { success, data } API bodies and raw axios responses. */
function unwrap(res) {
  const body = res?.status !== undefined && res?.data !== undefined ? res.data : res;
  if (body && typeof body === 'object' && body.success !== undefined && 'data' in body) {
    return body.data;
  }
  return body?.data ?? body;
}

export const staffApi = {
  list: async (params = {}) => {
    const res = await apiGet(API.USERS, { limit: 200, ...params });
    return {
      data: res?.data ?? res ?? [],
      pagination: res?.pagination,
    };
  },

  getById: async (id) => unwrap(await apiGet(API.USER_BY_ID(id))),

  getRoles: async () => unwrap(await apiGet(API.USER_ROLES)),

  getTeamSummary: async () => unwrap(await apiGet(API.USER_TEAM_SUMMARY)),

  create: async (payload) => unwrap(await apiPost(API.USERS, payload)),

  update: async (id, payload) => unwrap(await apiPut(API.USER_BY_ID(id), payload)),

  updateStatus: async (id, status) => unwrap(await apiPatch(API.USER_STATUS(id), { status })),

  uploadAvatar: async (id, file) => {
    const formData = new FormData();
    formData.append('file', file);
    return unwrap(await apiPost(API.USER_AVATAR(id), formData));
  },

  removeAvatar: async (id) => unwrap(await apiDelete(API.USER_AVATAR(id))),

  delete: async (id) => unwrap(await apiDelete(API.USER_BY_ID(id))),
};

export default staffApi;
