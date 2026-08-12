import { API } from '../../config/api';
import { apiGet, apiPost, apiPatch } from '../../api/apiClient';
import { STORAGE_KEYS } from '../../config/storageKeys';

export const authService = {
  login: async ({ email, password }) => {
    const response = await apiPost(API.LOGIN, { email, password });
    const { user, accessToken, refreshToken } = response.data;
    localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, accessToken);
    localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refreshToken);
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
    return { user, accessToken, refreshToken };
  },

  logout: async () => {
    try {
      await apiPost(API.LOGOUT);
    } finally {
      localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
      localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
      localStorage.removeItem(STORAGE_KEYS.USER);
    }
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
