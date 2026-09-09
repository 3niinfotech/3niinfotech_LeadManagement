import { API } from '../../config/api';
import {
  apiDelete, apiGet, apiPost, apiPatch,
} from '../../api/apiClient';
import apiClient from '../../api/axios';
import { STORAGE_KEYS } from '../../config/storageKeys';

function withRefreshHeader(config = {}) {
  const token = localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
  return {
    ...config,
    headers: {
      ...(config.headers || {}),
      ...(token ? { 'x-refresh-token': token } : {}),
    },
  };
}

export const authService = {
  login: async ({ email, password, portal }) => {
    const response = await apiPost(API.LOGIN, { email, password, portal });
    const { user, accessToken, refreshToken, portal: resolvedPortal, defaultRoute } = response.data;
    localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, accessToken);
    localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refreshToken);
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
    if (resolvedPortal) localStorage.setItem(STORAGE_KEYS.PORTAL, resolvedPortal);
    if (defaultRoute) localStorage.setItem(STORAGE_KEYS.DEFAULT_ROUTE, defaultRoute);
    return { user, accessToken, refreshToken, portal: resolvedPortal, defaultRoute };
  },

  logout: async () => {
    try {
      await apiPost(API.LOGOUT);
    } finally {
      localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
      localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
      localStorage.removeItem(STORAGE_KEYS.USER);
      localStorage.removeItem(STORAGE_KEYS.PORTAL);
      localStorage.removeItem(STORAGE_KEYS.DEFAULT_ROUTE);
    }
  },

  getRegistrationBranches: async (companyCode) => {
    const response = await apiGet(API.REGISTER_BRANCHES, { companyCode });
    return response.data;
  },

  registerStudent: async (payload) => {
    const response = await apiPost(API.REGISTER_STUDENT, payload);
    return response.data;
  },

  registerAgent: async (payload) => {
    const response = await apiPost(API.REGISTER_AGENT, payload);
    return response.data;
  },

  getProfile: async () => {
    const response = await apiGet(API.PROFILE);
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(response.data));
    return response.data;
  },

  updatePreferences: async (preferences) => {
    const response = await apiPatch(API.PREFERENCES, preferences);
    return response.data;
  },

  updateProfile: async (payload) => {
    const response = await apiPatch(API.PROFILE_UPDATE, payload);
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(response.data));
    return response.data;
  },

  uploadAvatar: async (file) => {
    const form = new FormData();
    form.append('file', file);
    const response = await apiPost(API.PROFILE_AVATAR, form);
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(response.data));
    return response.data;
  },

  removeAvatar: async () => {
    const response = await apiDelete(API.PROFILE_AVATAR);
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(response.data));
    return response.data;
  },

  changePassword: async (payload) => {
    const response = await apiPost(API.CHANGE_PASSWORD, payload);
    return response.data;
  },

  forgotPassword: async (payload) => {
    const response = await apiPost(API.FORGOT_PASSWORD, payload);
    return response.data;
  },

  getSecurityOverview: async () => {
    const response = await apiGet(API.SECURITY_OVERVIEW);
    return response.data;
  },

  listSessions: async () => {
    const response = await apiClient.get(API.SESSIONS, withRefreshHeader());
    return response.data?.data ?? response.data;
  },

  revokeSession: async (id) => {
    const response = await apiClient.delete(API.SESSION_BY_ID(id), withRefreshHeader());
    return response.data?.data ?? response.data;
  },

  revokeOtherSessions: async () => {
    const response = await apiClient.post(API.SESSIONS_REVOKE_OTHERS, {}, withRefreshHeader());
    return response.data?.data ?? response.data;
  },

  listActivity: async (limit = 20) => {
    const response = await apiGet(API.ACCOUNT_ACTIVITY, { limit });
    return response.data;
  },

  listLoginHistory: async (limit = 20) => {
    const response = await apiGet(API.LOGIN_HISTORY, { limit });
    return response.data;
  },

  listApiTokens: async () => {
    const response = await apiGet(API.API_TOKENS);
    return response.data;
  },

  createApiToken: async (payload) => {
    const response = await apiPost(API.API_TOKENS, payload);
    return response.data;
  },

  revokeApiToken: async (id) => {
    const response = await apiDelete(API.API_TOKEN_BY_ID(id));
    return response.data;
  },
};
