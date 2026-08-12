import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { notificationService } from '../services/notification.service';

export const fetchNotifications = createAsyncThunk('notification/fetch', async (params) => {
  return notificationService.getAll(params);
});

const notificationSlice = createSlice({
  name: 'notification',
  initialState: { list: [], unreadCount: 0, loading: false },
  reducers: {
    addNotification: (state, action) => {
      state.list.unshift(action.payload);
      state.unreadCount += 1;
    },
    markRead: (state, action) => {
      const n = state.list.find((item) => item.id === action.payload);
      if (n && !n.isRead) {
        n.isRead = true;
        state.unreadCount = Math.max(0, state.unreadCount - 1);
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchNotifications.fulfilled, (state, action) => {
        state.list = action.payload.data;
        state.unreadCount = action.payload.unreadCount;
      });
  },
});

export const { addNotification, markRead } = notificationSlice.actions;
export default notificationSlice.reducer;

export const selectNotifications = (state) => state.notification.list;
export const selectUnreadCount = (state) => state.notification.unreadCount;
