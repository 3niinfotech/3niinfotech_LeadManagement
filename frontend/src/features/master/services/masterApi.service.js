/**
 * Generic Master API client — W1 relational master engine.
 */
import { apiGet, apiPost, apiPut, apiPatch, apiDelete } from '../../../api/apiClient';
import { API } from '../../../config/api';

function masterPath(entity, suffix = '') {
  return `/masters/${entity}${suffix}`;
}

export function getApiErrorMessage(err, fallback = 'Request failed') {
  return err?.response?.data?.message || err?.message || fallback;
}

export const masterApi = {
  list: (entity, params = {}) => apiGet(masterPath(entity), params),

  get: (entity, id) => apiGet(masterPath(entity, `/${id}`)),

  create: (entity, payload) => apiPost(masterPath(entity), payload),

  update: (entity, id, payload) => apiPut(masterPath(entity, `/${id}`), payload),

  updateStatus: (entity, id, isActive) =>
    apiPatch(masterPath(entity, `/${id}/status`), { isActive }),

  remove: (entity, id) => apiDelete(masterPath(entity, `/${id}`)),

  /**
   * Relational options — always passes source=relational for FK-safe values.
   * Do not use this for legacy MasterItem consumers (use useMasterOptions).
   */
  options: (entity, params = {}) =>
    apiGet(API.MASTER_OPTIONS(entity), { source: 'relational', ...params }),

  summary: () => apiGet(API.MASTERS_HUB_SUMMARY),
};

export default masterApi;
