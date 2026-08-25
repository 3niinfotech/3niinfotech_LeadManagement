import { apiGet, apiPost, apiPut, apiPatch } from '../../../api/apiClient';
import apiClient from '../../../api/axios';
import { API } from '../../../config/api';

export function getOrgApiErrorMessage(err, fallback = 'Request failed') {
  return err?.response?.data?.message || err?.message || fallback;
}

function unwrap(res) {
  return res?.data ?? res;
}

export const organizationApi = {
  getCompany: async () => unwrap(await apiGet(API.ORGANIZATION_COMPANY)),

  updateCompany: async (payload) => unwrap(await apiPut(API.ORGANIZATION_COMPANY, payload)),

  uploadBranding: async (file, kind) => {
    const form = new FormData();
    form.append('file', file);
    const { data } = await apiClient.post(API.ORGANIZATION_COMPANY_BRANDING, form, {
      params: { kind },
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return unwrap(data);
  },

  listBranches: async (params = {}) => unwrap(await apiGet(API.ORGANIZATION_BRANCHES, params)),

  createBranch: async (payload) => unwrap(await apiPost(API.ORGANIZATION_BRANCHES, payload)),

  updateBranch: async (id, payload) => unwrap(await apiPut(API.ORGANIZATION_BRANCH(id), payload)),

  updateBranchStatus: async (id, isActive) =>
    unwrap(await apiPatch(API.ORGANIZATION_BRANCH_STATUS(id), { isActive })),
};

export default organizationApi;
