import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { notificationService } from '../services/notification.service';

export const fetchNotifications = createAsyncThunk('notification/fetch', async (params) => {
  return notificationService.getAll(params);
});

export const markNotificationRead = createAsyncThunk('notification/markRead', async (id) => {
  await notificationService.markAsRead(id);
  return id;
});

export const markAllNotificationsRead = createAsyncThunk('notification/markAllRead', async () => {
  await notificationService.markAllAsRead();
  return true;
});

const notificationSlice = createSlice({
  name: 'notification',
  initialState: { list: [], unreadCount: 0, loading: false },
  reducers: {
    addNotification: (state, action) => {
      const incoming = action.payload;
      if (!incoming?.id) return;
      if (state.list.some((n) => n.id === incoming.id)) return;
      state.list.unshift(incoming);
      if (!incoming.isRead) state.unreadCount += 1;
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
      .addCase(fetchNotifications.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchNotifications.fulfilled, (state, action) => {
        state.loading = false;
        state.list = action.payload?.data || [];
        state.unreadCount = action.payload?.unreadCount || 0;
      })
      .addCase(fetchNotifications.rejected, (state) => {
        state.loading = false;
      })
      .addCase(markNotificationRead.fulfilled, (state, action) => {
        const n = state.list.find((item) => item.id === action.payload);
        if (n && !n.isRead) {
          n.isRead = true;
          state.unreadCount = Math.max(0, state.unreadCount - 1);
        }
      })
      .addCase(markAllNotificationsRead.fulfilled, (state) => {
        state.list.forEach((n) => {
          n.isRead = true;
        });
        state.unreadCount = 0;
      });
  },
});

export const { addNotification, markRead } = notificationSlice.actions;
export default notificationSlice.reducer;

export const selectNotifications = (state) => state.notification.list;
export const selectUnreadCount = (state) => state.notification.unreadCount;
export const selectNotificationsLoading = (state) => state.notification.loading;
