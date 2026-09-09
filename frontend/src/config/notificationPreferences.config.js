/** Local notification alert preferences (sound / browser / mute) */

export const NOTIFICATION_PREF_DEFAULTS = {
  muted: false,
  sound: true,
  browser: true,
  toast: true,
  reminderPopup: true,
  volume: 0.55,
};

export const NOTIFICATION_PREF_LABELS = {
  muted: {
    title: 'Mute all alerts',
    description: 'Silence sound, browser alerts, and in-app toasts',
  },
  sound: {
    title: 'Notification sound',
    description: 'Play a chime when a new notification arrives',
  },
  browser: {
    title: 'Browser notifications',
    description: 'Show system alerts even when you are on another tab',
  },
  toast: {
    title: 'In-app toast',
    description: 'Show a toast banner inside the CRM window',
  },
  reminderPopup: {
    title: 'Reminder popup',
    description: 'Show a strong popup when a role-based reminder arrives',
  },
};
