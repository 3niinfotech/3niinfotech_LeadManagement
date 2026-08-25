import { useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { io } from 'socket.io-client';
import { STORAGE_KEYS } from '../config/storageKeys';
import { addNotification, fetchNotifications } from '../modules/notification/redux/notificationSlice';
import { selectIsAuthenticated } from '../redux/slices/authSlice';
import toastService from '../services/toast/toast.service';
import {
  deliverNotificationAlert,
  getNotificationPrefs,
  unlockNotificationAudio,
} from '../services/notification/alert.service';

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

      const prefs = getNotificationPrefs();
      deliverNotificationAlert(notification, prefs);

      if (!prefs.muted && prefs.toast && notification.title) {
        toastService.fromNotification(notification);
      }
    });

    socket.on('assignment', () => {
      dispatch(fetchNotifications({ limit: 30 }));
    });

    dispatch(fetchNotifications({ limit: 30 }));
    const poll = setInterval(() => {
      dispatch(fetchNotifications({ limit: 30 }));
    }, 12000);

    return () => {
      clearInterval(poll);
      socket.disconnect();
      socketRef.current = null;
    };
  }, [isAuthenticated, dispatch]);
}
