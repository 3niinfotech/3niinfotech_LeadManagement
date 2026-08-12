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

const emit = (message, type, options = {}) => {
  if (shouldSuppress(options)) return null;
  const duration = options.duration ?? toastTheme.duration[type] ?? 4000;
  return toast.custom(
    (t) => <ThemedToast t={t} message={message} type={type} />,
    { id: options.id, duration }
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

  error: (message, options) => emit(message, 'error', options),

  warning: (message, options) => emit(message, 'warning', options),

  info: (message, options) => emit(message, 'info', options),

  action: {
    success: (message, options) => emit(message, 'success', { ...options, force: true }),
    error: (message, options) => emit(message, 'error', { ...options, force: true }),
    saved: (message = 'Saved successfully', options) => emit(message, 'success', { ...options, force: true }),
    deleted: (message = 'Deleted successfully', options) => emit(message, 'success', { ...options, force: true }),
  },

  dismiss: (id) => toast.dismiss(id),
  dismissAll: () => toast.dismiss(),
};

export default toastService;
