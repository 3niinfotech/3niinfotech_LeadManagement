import { useCallback, useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { announcementApi } from '../features/announcement/services/announcementApi.service';
import { selectUser } from '../redux/slices/authSlice';

/** Unread announcement count for navbar megaphone badge — server-side truth. */
export function useAnnouncementCount() {
  const user = useSelector(selectUser);
  const [count, setCount] = useState(0);

  const refresh = useCallback(async () => {
    if (!user?.id) {
      setCount(0);
      return;
    }
    try {
      const res = await announcementApi.count();
      const unread = res?.data?.unread ?? res?.data?.count ?? 0;
      setCount(Number(unread) || 0);
    } catch {
      setCount(0);
    }
  }, [user?.id]);

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, 15000);
    const onUpdate = () => refresh();
    window.addEventListener('crm-announcements-seen', onUpdate);
    window.addEventListener('crm-announcements-new', onUpdate);
    window.addEventListener('crm-announcement-viewed', onUpdate);
    return () => {
      clearInterval(interval);
      window.removeEventListener('crm-announcements-seen', onUpdate);
      window.removeEventListener('crm-announcements-new', onUpdate);
      window.removeEventListener('crm-announcement-viewed', onUpdate);
    };
  }, [refresh]);

  return count;
}
