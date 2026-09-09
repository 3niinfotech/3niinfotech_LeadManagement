import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { reminderApi } from '../services/reminder.service';

export const fetchReminders = createAsyncThunk('reminder/fetchFeed', async (params) => {
  const res = await reminderApi.getFeed(params);
  return res?.data || res || {};
});

export const fetchReminderSummary = createAsyncThunk('reminder/fetchSummary', async (params) => {
  const res = await reminderApi.getSummary(params);
  return res?.data || res || {};
});

const empty = {
  overdue: [],
  dueToday: [],
  upcoming: [],
  counts: { overdue: 0, dueToday: 0, upcoming: 0, badge: 0, total: 0 },
  roleSlug: null,
  scopeMode: null,
};

const reminderSlice = createSlice({
  name: 'reminder',
  initialState: {
    feed: empty,
    badge: 0,
    loading: false,
    liveAlert: null,
  },
  reducers: {
    setLiveReminderAlert: (state, action) => {
      state.liveAlert = action.payload || null;
    },
    clearLiveReminderAlert: (state) => {
      state.liveAlert = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchReminders.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchReminders.fulfilled, (state, action) => {
        state.loading = false;
        const data = action.payload || empty;
        state.feed = {
          overdue: data.overdue || [],
          dueToday: data.dueToday || [],
          upcoming: data.upcoming || [],
          counts: data.counts || empty.counts,
          roleSlug: data.roleSlug || null,
          scopeMode: data.scopeMode || null,
        };
        state.badge = data.counts?.badge ?? 0;
      })
      .addCase(fetchReminders.rejected, (state) => {
        state.loading = false;
      })
      .addCase(fetchReminderSummary.fulfilled, (state, action) => {
        const data = action.payload || {};
        state.badge = data.badge ?? 0;
        state.feed.counts = {
          ...state.feed.counts,
          overdue: data.overdue ?? state.feed.counts.overdue,
          dueToday: data.dueToday ?? state.feed.counts.dueToday,
          upcoming: data.upcoming ?? state.feed.counts.upcoming,
          badge: data.badge ?? state.feed.counts.badge,
          total: data.total ?? state.feed.counts.total,
        };
        state.feed.roleSlug = data.roleSlug ?? state.feed.roleSlug;
        state.feed.scopeMode = data.scopeMode ?? state.feed.scopeMode;
      });
  },
});

export const { setLiveReminderAlert, clearLiveReminderAlert } = reminderSlice.actions;
export default reminderSlice.reducer;

export const selectReminderFeed = (state) => state.reminder.feed;
export const selectReminderBadge = (state) => state.reminder.badge;
export const selectReminderLoading = (state) => state.reminder.loading;
export const selectLiveReminderAlert = (state) => state.reminder.liveAlert;
