import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { authService } from '../../services/auth/auth.service';
import { STORAGE_KEYS } from '../../config/storageKeys';

export const loginUser = createAsyncThunk('auth/login', async (credentials, { rejectWithValue }) => {
  try {
    return await authService.login(credentials);
  } catch (err) {
    const data = err.response?.data;
    return rejectWithValue({
      message: data?.message || 'Login failed',
      suggestedLoginPath: data?.errors?.suggestedLoginPath || null,
    });
  }
});

export const fetchProfile = createAsyncThunk('auth/profile', async (_, { rejectWithValue }) => {
  try {
    return await authService.getProfile();
  } catch (err) {
    return rejectWithValue(err.response?.data?.message);
  }
});

export const updateProfile = createAsyncThunk('auth/updateProfile', async (payload, { rejectWithValue }) => {
  try {
    return await authService.updateProfile(payload);
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Update failed');
  }
});

export const uploadProfileAvatar = createAsyncThunk('auth/uploadAvatar', async (file, { rejectWithValue }) => {
  try {
    return await authService.uploadAvatar(file);
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Photo upload failed');
  }
});

export const removeProfileAvatar = createAsyncThunk('auth/removeAvatar', async (_, { rejectWithValue }) => {
  try {
    return await authService.removeAvatar();
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Photo removal failed');
  }
});

export const logoutUser = createAsyncThunk('auth/logout', async () => {
  await authService.logout();
});

const storedUser = JSON.parse(localStorage.getItem(STORAGE_KEYS.USER) || 'null');

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user: storedUser,
    isAuthenticated: !!localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN),
    loading: false,
    error: null,
  },
  reducers: {
    clearAuthError: (state) => { state.error = null; },
    updateUserPreferences: (state, action) => {
      if (state.user) state.user.preferences = action.payload;
    },
    patchAuthUser: (state, action) => {
      const patch = action.payload;
      if (!patch?.id || !state.user || state.user.id !== patch.id) return;
      state.user = {
        ...state.user,
        ...patch,
        role: patch.role ?? state.user.role,
        branch: patch.branch ?? state.user.branch,
        company: patch.company ?? state.user.company,
      };
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(state.user));
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loginUser.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false;
        state.isAuthenticated = true;
        state.user = action.payload.user;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || action.payload || 'Login failed';
      })
      .addCase(fetchProfile.fulfilled, (state, action) => {
        if (action.payload) {
          state.user = { ...state.user, ...action.payload };
          localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(state.user));
        }
      })
      .addCase(updateProfile.fulfilled, (state, action) => {
        if (action.payload) {
          state.user = { ...state.user, ...action.payload };
          localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(state.user));
        }
      })
      .addCase(uploadProfileAvatar.fulfilled, (state, action) => {
        if (action.payload) {
          state.user = { ...state.user, ...action.payload };
          localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(state.user));
        }
      })
      .addCase(removeProfileAvatar.fulfilled, (state, action) => {
        if (action.payload) {
          state.user = { ...state.user, ...action.payload, avatar: null };
          localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(state.user));
        }
      })
      .addCase(logoutUser.fulfilled, (state) => {
        state.user = null;
        state.isAuthenticated = false;
      });
  },
});

export const { clearAuthError, updateUserPreferences, patchAuthUser } = authSlice.actions;
export default authSlice.reducer;

export const selectUser = (state) => state.auth.user;
export const selectIsAuthenticated = (state) => state.auth.isAuthenticated;
export const selectAuthLoading = (state) => state.auth.loading;
export const selectAuthError = (state) => state.auth.error;
export const selectPermissions = (state) =>
  state.auth.user?.permissions || state.auth.user?.role?.permissions || [];
