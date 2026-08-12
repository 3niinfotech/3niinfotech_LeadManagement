import { API } from '../../config/api';
import { apiGet, apiPost, apiPatch, apiDelete } from '../../api/apiClient';

export const rbacService = {
  getRoles: async (params) => {
    const res = await apiGet(API.RBAC_ROLES, params);
    return { data: res.data, pagination: res.pagination };
  },
  getRole: (id) => apiGet(API.RBAC_ROLE(id)).then((r) => r.data),
  createRole: (payload) => apiPost(API.RBAC_ROLES, payload).then((r) => r.data),
  updateRole: (id, payload) => apiPatch(API.RBAC_ROLE(id), payload).then((r) => r.data),
  deleteRole: (id) => apiDelete(API.RBAC_ROLE(id)),
  toggleStatus: (id, isActive) => apiPatch(API.RBAC_ROLE_STATUS(id), { isActive }).then((r) => r.data),
  cloneRole: (id, payload) => apiPost(API.RBAC_ROLE_CLONE(id), payload).then((r) => r.data),
  copyPermissions: (id, sourceRoleId) =>
    apiPost(API.RBAC_ROLE_COPY_PERMISSIONS(id), { sourceRoleId }).then((r) => r.data),
  assignUsers: (id, userIds) =>
    apiPost(API.RBAC_ROLE_ASSIGN(id), { userIds }).then((r) => r.data),
  getHistory: (id) => apiGet(API.RBAC_ROLE_HISTORY(id)).then((r) => r.data),
  exportRoles: (params) => apiGet(API.RBAC_EXPORT, params).then((r) => r.data),
  getPermissions: () => apiGet(API.RBAC_PERMISSIONS).then((r) => r.data),
  getMenu: () => apiGet(API.RBAC_MENU).then((r) => r.data),
  getMyAccess: () => apiGet(API.RBAC_ACCESS_ME).then((r) => r.data),
};
