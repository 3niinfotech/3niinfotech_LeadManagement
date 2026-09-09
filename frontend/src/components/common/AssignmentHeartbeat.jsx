import { useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { selectIsAuthenticated, selectUser } from '../../redux/slices/authSlice';
import {
  assignmentApi,
  useHeartbeatMutation,
} from '../../features/assignment/redux/assignmentApiSlice';

const HEARTBEAT_MS = 60000;
const PRESENCE_ROLES = new Set(['counsellor', 'team_leader']);

/**
 * Keeps counsellor last-seen fresh and refreshes cached availability snapshot.
 * Does not use manual presence status — availability is system-derived.
 */
export default function AssignmentHeartbeat() {
  const dispatch = useDispatch();
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const user = useSelector(selectUser);
  const [heartbeat] = useHeartbeatMutation();
  const timerRef = useRef(null);
  const isStaffPresenceRole = PRESENCE_ROLES.has(user?.role?.slug);

  useEffect(() => {
    if (!isAuthenticated || !user?.branchId || !isStaffPresenceRole) return undefined;

    const tick = () => {
      heartbeat()
        .unwrap()
        .then(() => {
          dispatch(assignmentApi.util.invalidateTags(['MyAvailability', 'Sla']));
        })
        .catch(() => {});
    };
    tick();
    timerRef.current = setInterval(tick, HEARTBEAT_MS);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isAuthenticated, user?.branchId, heartbeat, isStaffPresenceRole, dispatch]);

  return null;
}
