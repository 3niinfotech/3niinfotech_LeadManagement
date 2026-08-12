import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import GlobalLoader from '../ui/GlobalLoader';
import { fetchProfile, selectIsAuthenticated } from '../../redux/slices/authSlice';

const AUTH_BOOT_TIMEOUT_MS = 12000;

/**
 * Validates session once on startup so protected routes don't fire many
 * parallel API calls against an expired token (which can leave the UI loading).
 */
export default function AuthInitGate({ children }) {
  const dispatch = useDispatch();
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const [ready, setReady] = useState(!isAuthenticated);

  useEffect(() => {
    if (!isAuthenticated) {
      setReady(true);
      return undefined;
    }

    let cancelled = false;
    const timeout = setTimeout(() => {
      if (!cancelled) setReady(true);
    }, AUTH_BOOT_TIMEOUT_MS);

    dispatch(fetchProfile())
      .finally(() => {
        if (!cancelled) setReady(true);
      });

    return () => {
      cancelled = true;
      clearTimeout(timeout);
    };
  }, [dispatch, isAuthenticated]);

  if (!ready) return <GlobalLoader />;
  return children;
}
