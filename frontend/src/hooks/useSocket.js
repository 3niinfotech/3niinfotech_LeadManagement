import { useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { io } from 'socket.io-client';
import { STORAGE_KEYS } from '../config/storageKeys';
import { addNotification, fetchNotifications } from '../modules/notification/redux/notificationSlice';
import {
  fetchReminderSummary,
  setLiveReminderAlert,
} from '../modules/reminder/redux/reminderSlice';
import { selectIsAuthenticated } from '../redux/slices/authSlice';
import toastService from '../services/toast/toast.service';
import {
  deliverNotificationAlert,
  getNotificationPrefs,
  unlockNotificationAudio,
} from '../services/notification/alert.service';

function isReminderNotification(notification) {
  const type = String(notification?.type || '').toUpperCase();
  const meta = typeof notification?.metadata === 'string'
    ? (() => { try { return JSON.parse(notification.metadata); } catch { return {}; } })()
    : (notification?.metadata || {});
  const event = meta.event;
  return type === 'REMINDER'
    || event === 'SMART_REMINDER'
    || meta.urgent === true
    || meta.source === 'smart_reminder';
}

function isAnnouncementNotification(notification) {
  const meta = typeof notification?.metadata === 'string'
    ? (() => { try { return JSON.parse(notification.metadata); } catch { return {}; } })()
    : (notification?.metadata || {});
  return meta.event === 'ANNOUNCEMENT_PUBLISHED';
}

export function useSocket() {
  const dispatch = useDispatch();
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const socketRef = useRef(null);

  useEffect(() => {
    const unlock = () => unlockNotificationAudio();
    window.addEventListener('pointerdown', unlock, { once: true });
    return () => window.removeEventListener('pointerdown', unlock);
  }, []);

  useEffect(() => {
    if (!isAuthenticated) {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      return undefined;
    }

    const token = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
    if (!token) return undefined;

    const socket = io('/', {
      auth: { token },
      transports: ['polling', 'websocket'],
      reconnection: true,
      reconnectionDelay: 2000,
      reconnectionAttempts: 8,
    });
    socketRef.current = socket;

    socket.on('connect_error', () => {
      /* Backend may be offline during local dev — avoid breaking the app */
    });

    socket.on('notification', (notification) => {
      if (!notification?.id) return;
      dispatch(addNotification(notification));

      if (isAnnouncementNotification(notification)) {
        window.dispatchEvent(new Event('crm-announcements-new'));
      }

      const prefs = getNotificationPrefs();
      deliverNotificationAlert(notification, prefs);

      if (!prefs.muted && prefs.toast && notification.title) {
        toastService.fromNotification(notification, {
          duration: isReminderNotification(notification) ? 10000 : undefined,
        });
      }

      if (!prefs.muted && isReminderNotification(notification)) {
        if (prefs.reminderPopup !== false) {
          dispatch(setLiveReminderAlert({
            id: notification.id,
            title: notification.title,
            message: notification.message,
            link: notification.link,
          }));
        }
        dispatch(fetchReminderSummary());
      }
    });

    socket.on('assignment', () => {
      dispatch(fetchNotifications({ limit: 30 }));
      dispatch(fetchReminderSummary());
    });

    socket.on('announcement:published', () => {
      window.dispatchEvent(new Event('crm-announcements-new'));
      dispatch(fetchNotifications({ limit: 30 }));
    });

    dispatch(fetchNotifications({ limit: 30 }));
    dispatch(fetchReminderSummary());

    const poll = setInterval(() => {
      dispatch(fetchNotifications({ limit: 30 }));
      dispatch(fetchReminderSummary());
    }, 12000);

    return () => {
      clearInterval(poll);
      socket.disconnect();
      socketRef.current = null;
    };
  }, [isAuthenticated, dispatch]);
}
