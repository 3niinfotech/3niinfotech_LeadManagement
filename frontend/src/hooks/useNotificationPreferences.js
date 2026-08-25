import { useCallback, useEffect, useState } from 'react';
import { NOTIFICATION_PREF_DEFAULTS } from '../config/notificationPreferences.config';
import { STORAGE_KEYS } from '../config/storageKeys';
import { ensureBrowserPermission } from '../services/notification/alert.service';

const EVENT = 'crm-notification-prefs';

function read() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.NOTIFICATION_PREFS);
    if (!raw) return { ...NOTIFICATION_PREF_DEFAULTS };
    return { ...NOTIFICATION_PREF_DEFAULTS, ...JSON.parse(raw) };
  } catch {
    return { ...NOTIFICATION_PREF_DEFAULTS };
  }
}

function write(next) {
  localStorage.setItem(STORAGE_KEYS.NOTIFICATION_PREFS, JSON.stringify(next));
  window.dispatchEvent(new CustomEvent(EVENT, { detail: next }));
}

export function useNotificationPreferences() {
  const [prefs, setPrefs] = useState(read);

  useEffect(() => {
    const sync = () => setPrefs(read());
    window.addEventListener('storage', sync);
    window.addEventListener(EVENT, sync);
    return () => {
      window.removeEventListener('storage', sync);
      window.removeEventListener(EVENT, sync);
    };
  }, []);

  const update = useCallback(async (patch) => {
    const current = read();
    let next = { ...current, ...patch };

    if (patch.browser === true && !current.muted) {
      const permission = await ensureBrowserPermission();
      if (permission !== 'granted') {
        next = { ...next, browser: false };
      }
    }

    if (next.muted) {
      // keep individual toggles; muted is master switch at delivery time
    }

    write(next);
    setPrefs(next);
    return next;
  }, []);

  const toggle = useCallback((key) => update({ [key]: !read()[key] }), [update]);

  const setMuted = useCallback((muted) => update({ muted: Boolean(muted) }), [update]);

  return { prefs, update, toggle, setMuted };
}
