import { useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { selectIsAuthenticated, selectUser } from '../../redux/slices/authSlice';
import { useHeartbeatMutation } from '../../features/assignment/redux/assignmentApiSlice';
import { API, API_BASE_URL } from '../../config/api';
import { STORAGE_KEYS } from '../../config/storageKeys';

const HEARTBEAT_MS = 15000;
const PRESENCE_ROLES = new Set(['counsellor', 'team_leader']);

function postGoOfflineBeacon() {
  const token = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
  if (!token) return;
  const url = `${API_BASE_URL}${API.ASSIGNMENT_GO_OFFLINE}`;
  try {
    fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: '{}',
      keepalive: true,
      credentials: 'include',
    }).catch(() => {});
  } catch {
    /* ignore unload errors */
  }
}

/**
 * Auto presence for Reception assign list:
 * Free while CRM open · With student in counselling · Offline on close / logout.
 * Always on for counsellor / team_leader (not feature-flag gated).
 */
export default function AssignmentHeartbeat() {
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const user = useSelector(selectUser);
  const [heartbeat] = useHeartbeatMutation();
  const timerRef = useRef(null);
  const isStaffPresenceRole = PRESENCE_ROLES.has(user?.role?.slug);

  useEffect(() => {
    if (!isAuthenticated || !user?.branchId || !isStaffPresenceRole) return undefined;

    const tick = () => {
      heartbeat().catch(() => {});
    };
    tick();
    timerRef.current = setInterval(tick, HEARTBEAT_MS);

    const onPageHide = (e) => {
      if (e.persisted) return;
      postGoOfflineBeacon();
    };
    window.addEventListener('pagehide', onPageHide);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      window.removeEventListener('pagehide', onPageHide);
    };
  }, [isAuthenticated, user?.branchId, heartbeat, isStaffPresenceRole]);

  return null;
}
