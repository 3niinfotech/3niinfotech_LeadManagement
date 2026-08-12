import { useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { selectIsAuthenticated, selectUser } from '../../redux/slices/authSlice';
import { useHeartbeatMutation } from '../../features/assignment/redux/assignmentApiSlice';
import { useFeature } from '../../hooks/useFeature';

const HEARTBEAT_MS = 90000;

/** Keeps counsellor presence alive while app is open */
export default function AssignmentHeartbeat() {
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const user = useSelector(selectUser);
  const { enabled: presenceEnabled } = useFeature('reception.counsellor_availability');
  const [heartbeat] = useHeartbeatMutation();
  const timerRef = useRef(null);

  useEffect(() => {
    if (!isAuthenticated || !user?.branchId || !presenceEnabled) return undefined;

    const tick = () => {
      heartbeat().catch(() => {});
    };
    tick();
    timerRef.current = setInterval(tick, HEARTBEAT_MS);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isAuthenticated, user?.branchId, presenceEnabled, heartbeat]);

  return null;
}
