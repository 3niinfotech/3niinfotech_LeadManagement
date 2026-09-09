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

  getUsage: (entity, id) => apiGet(masterPath(entity, `/${id}/usage`)),

  bulkStatus: (entity, ids, isActive) =>
    apiPost(masterPath(entity, '/bulk/status'), { ids, isActive }),

  bulkRemove: (entity, ids) =>
    apiPost(masterPath(entity, '/bulk/delete'), { ids }),

  exportList: (entity, params = {}) =>
    apiGet(masterPath(entity, '/export'), params),

  options: (entity, params = {}) =>
    apiGet(API.MASTER_OPTIONS(entity), { source: 'relational', ...params }),

  summary: () => apiGet(API.MASTERS_HUB_SUMMARY),

  applicationStatusCountrySummary: () => apiGet(API.APPLICATION_STATUS_COUNTRY_SUMMARY),

  applicationStatusWorkflow: (countryId) =>
    apiGet(API.APPLICATION_STATUS_WORKFLOW, { countryId }),

  applicationChecklistByCountry: (countryId) =>
    apiGet(API.APPLICATION_CHECKLIST_BY_COUNTRY, { countryId }),

  bulkCreateChecklist: (payload) => apiPost(API.APPLICATION_CHECKLIST_BULK, payload),

  leadStatusWorkflow: () => apiGet(API.LEAD_STATUS_WORKFLOW),

  visaStatusCountrySummary: () => apiGet(API.VISA_STATUS_COUNTRY_SUMMARY),

  visaStatusWorkflow: (countryId) =>
    apiGet(API.VISA_STATUS_WORKFLOW, { countryId }),

  visaChecklistByCountry: (countryId) =>
    apiGet(API.VISA_CHECKLIST_BY_COUNTRY, { countryId }),

  bulkCreateVisaChecklist: (payload) => apiPost(API.VISA_CHECKLIST_BULK, payload),

  studentStatusWorkflow: () => apiGet(API.STUDENT_STATUS_WORKFLOW),

  listMasterItems: (category, params = {}) => apiGet(API.MASTER_ITEMS(category), params),

  updateMasterItem: (category, id, payload) =>
    apiPut(API.MASTER_ITEM_BY_ID(category, id), payload),

  updateMasterItemStatus: (category, id, isActive) =>
    apiPatch(API.MASTER_ITEM_STATUS(category, id), { isActive }),

  removeMasterItem: (category, id) => apiDelete(API.MASTER_ITEM_BY_ID(category, id)),
};

export default masterApi;
