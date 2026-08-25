import { API } from '../../../config/api';
import { apiGet, apiPost, apiPut, apiPatch } from '../../../api/apiClient';

export function getPartnerApiError(err, fallback = 'Request failed') {
  return err?.response?.data?.message || err?.message || fallback;
}

function unwrap(res) {
  return res?.data ?? res;
}

export const partnerApi = {
  list: async (params = {}) => {
    const res = await apiGet(API.PARTNERS, { limit: 50, ...params });
    return {
      data: res?.data ?? res ?? [],
      pagination: res?.pagination,
    };
  },
  create: async (payload) => unwrap(await apiPost(API.PARTNERS, payload)),
  update: async (id, payload) => unwrap(await apiPut(API.PARTNER_BY_ID(id), payload)),
  updateStatus: async (id, isActive) => unwrap(await apiPatch(API.PARTNER_STATUS(id), { isActive })),
};

export default partnerApi;
