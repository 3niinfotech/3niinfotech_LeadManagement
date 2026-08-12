import { API } from '../../config/api';
import { apiGet, apiPost, apiPatch } from '../../api/apiClient';
import { STORAGE_KEYS } from '../../config/storageKeys';

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
};
