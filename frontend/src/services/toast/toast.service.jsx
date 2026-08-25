import toast from 'react-hot-toast';
import ThemedToast from '../../components/ui/ThemedToast';
import { toastTheme } from '../../theme/feedback';

let silentMode = false;
let reloadMode = false;

const shouldSuppress = (options = {}) => {
  if (options.force) return false;
  if (options.silent) return true;
  if (silentMode && !options.showOnReload) return true;
  if (reloadMode && !options.force) return true;
  return false;
};

/** Normalize string | { title, description } payloads */
function normalizePayload(message, options = {}) {
  if (message && typeof message === 'object' && !Array.isArray(message)) {
    return {
      title: message.title || message.message || '',
      description: message.description || message.body || undefined,
      label: message.label || options.label,
    };
  }
  return {
    title: message,
    description: options.description,
    label: options.label,
  };
}

const emit = (message, type, options = {}) => {
  if (shouldSuppress(options)) return null;
  const payload = normalizePayload(message, options);
  const duration = options.duration ?? toastTheme.duration[type] ?? toastTheme.duration.info ?? 4000;
  return toast.custom(
    (t) => (
      <ThemedToast
        t={t}
        type={type}
        title={payload.title}
        description={payload.description}
        label={payload.label}
        duration={duration}
      />
    ),
    { id: options.id, duration },
  );
};

export const toastService = {
  isSilent: () => silentMode || reloadMode,

  setSilentMode: (value) => { silentMode = value; },

  setReloadMode: (value) => { reloadMode = value; },

  runSilent: async (fn) => {
    silentMode = true;
    try {
      return await fn();
    } finally {
      silentMode = false;
    }
  },

  runReload: async (fn) => {
    reloadMode = true;
    try {
      return await fn();
    } finally {
      reloadMode = false;
    }
  },

  success: (message, options) => emit(message, 'success', options),

  /** Green “created / registered” tone */
  create: (message, options) => emit(message, 'create', { label: 'Created', ...options }),

  error: (message, options) => emit(message, 'error', options),

  warning: (message, options) => emit(message, 'warning', options),

  info: (message, options) => emit(message, 'info', options),

  /** Map CRM notification record → typed toast */
  fromNotification: (notification, options = {}) => {
    if (!notification?.title && !notification?.message) return null;

    // Registrar already got a local action toast — inbox only, no second popup
    const audience = notification.metadata?.audience;
    if (audience === 'ACTOR') return null;

    const raw = String(notification.type || 'INFO').toUpperCase();
    let type = 'info';
    let label = 'Alert';
    if (raw === 'SUCCESS') { type = 'success'; label = 'Update'; }
    else if (raw === 'WARNING') { type = 'warning'; label = 'Warning'; }
    else if (raw === 'ERROR' || raw === 'DANGER') { type = 'error'; label = 'Error'; }
    else if (raw === 'REMINDER') { type = 'warning'; label = 'Reminder'; }
    else if (raw === 'INFO') { type = 'info'; label = 'Info'; }

    const event = notification.metadata?.event;
    if (event === 'VISITOR_REGISTERED') {
      type = 'create';
      label = 'Registered';
    } else if (audience === 'ASSIGNEE' || event === 'ASSIGNEE') {
      type = 'info';
      label = 'Assignment';
    }

    return emit(
      {
        title: notification.title,
        description: notification.message || notification.body,
      },
      type,
      {
        label,
        id: options.id || (notification.id ? `notif-${notification.id}` : undefined),
        ...options,
      },
    );
  },

  action: {
    success: (message, options) => emit(message, 'success', { ...options, force: true }),
    error: (message, options) => emit(message, 'error', { ...options, force: true }),
    saved: (message = 'Saved successfully', options) => emit(message, 'success', { label: 'Saved', ...options, force: true }),
    deleted: (message = 'Deleted successfully', options) => emit(message, 'deleted', { label: 'Deleted', ...options, force: true }),
    created: (message = 'Created successfully', options) => emit(message, 'create', { label: 'Created', ...options, force: true }),
  },

  dismiss: (id) => toast.dismiss(id),
  dismissAll: () => toast.dismiss(),
};

export default toastService;
