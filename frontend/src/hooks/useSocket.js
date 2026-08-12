import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { io } from 'socket.io-client';
import { STORAGE_KEYS } from '../config/storageKeys';
import { addNotification, fetchNotifications } from '../modules/notification/redux/notificationSlice';
import { selectIsAuthenticated } from '../redux/slices/authSlice';

export function useSocket() {
  const dispatch = useDispatch();
  const isAuthenticated = useSelector(selectIsAuthenticated);

  useEffect(() => {
    if (!isAuthenticated) return;

    const token = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
    const socket = io('/', { auth: { token }, transports: ['websocket'] });

    socket.on('notification', (notification) => {
      dispatch(addNotification(notification));
    });

    socket.on('assignment', () => {
      // Counsellor queue pages poll; socket nudges optional refetch via notification
    });

    dispatch(fetchNotifications());

    return () => socket.disconnect();
  }, [isAuthenticated, dispatch]);
}
