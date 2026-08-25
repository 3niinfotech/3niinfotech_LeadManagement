import { useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import {
  FiCheck, FiX, FiAlertCircle, FiInfo, FiAlertTriangle, FiUserPlus, FiTrash2,
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import { selectTheme } from '../../redux/slices/uiSlice';
import { getToastTheme } from '../../theme/feedback';

const ICONS = {
  success: FiCheck,
  create: FiUserPlus,
  deleted: FiTrash2,
  error: FiAlertCircle,
  warning: FiAlertTriangle,
  info: FiInfo,
};

const DEFAULT_LABELS = {
  success: 'Success',
  create: 'Created',
  deleted: 'Deleted',
  error: 'Error',
  warning: 'Warning',
  info: 'Info',
};

const PALETTE_KEY = {
  success: 'success',
  create: 'success',
  deleted: 'error',
  error: 'error',
  warning: 'warning',
  info: 'info',
};

export default function ThemedToast({
  t,
  message,
  title,
  description,
  type = 'info',
  label,
  duration = 4000,
}) {
  const theme = useSelector(selectTheme);
  const toastTheme = getToastTheme(theme);
  const paletteKey = PALETTE_KEY[type] || 'info';
  const typeTheme = toastTheme.types[paletteKey] || toastTheme.types.info;
  const Icon = ICONS[type] || ICONS[paletteKey] || FiInfo;
  const typeLabel = label || DEFAULT_LABELS[type] || DEFAULT_LABELS.info;

  const displayTitle = title || message || '';
  const displayDesc = description || (title && message && title !== message ? message : null);

  return (
    <motion.div
      initial={{ opacity: 0, y: -10, scale: 0.98 }}
      animate={{ opacity: t.visible ? 1 : 0, y: t.visible ? 0 : -6, scale: t.visible ? 1 : 0.98 }}
      transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
      className="crm-toast pointer-events-auto relative w-[min(380px,calc(100vw-24px))] overflow-hidden rounded-2xl"
      style={{
        backgroundColor: typeTheme.softBg,
        boxShadow: toastTheme.shell.shadow,
        border: `1px solid ${typeTheme.borderSoft}`,
      }}
      role="status"
    >
      <div className="flex items-start gap-3 px-3.5 py-3">
        <div
          className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full"
          style={{
            backgroundColor: toastTheme.shell.bg,
            color: typeTheme.icon,
            boxShadow: `0 0 0 1px ${typeTheme.borderSoft}, 0 1px 2px rgba(15,23,42,0.06)`,
          }}
        >
          <Icon className="h-4 w-4" strokeWidth={2.4} />
        </div>

        <div className="min-w-0 flex-1 pt-0.5">
          <div className="flex items-center gap-2">
            <span
              className="inline-flex h-5 items-center rounded-md px-1.5 text-[10px] font-bold uppercase tracking-wide"
              style={{
                backgroundColor: typeTheme.iconBg,
                color: typeTheme.icon,
              }}
            >
              {typeLabel}
            </span>
          </div>
          <p className="mt-1 text-[13px] font-semibold leading-snug text-text">
            {displayTitle}
          </p>
          {displayDesc ? (
            <p className="mt-0.5 text-[12px] leading-snug text-text-secondary line-clamp-2">
              {displayDesc}
            </p>
          ) : null}
        </div>

        <button
          type="button"
          onClick={() => toast.dismiss(t.id)}
          className="shrink-0 -mr-0.5 -mt-0.5 flex h-7 w-7 items-center justify-center rounded-lg text-text-muted transition-colors hover:bg-black/5 hover:text-text dark:hover:bg-white/10"
          aria-label="Dismiss"
        >
          <FiX className="h-3.5 w-3.5" />
        </button>
      </div>

      <div
        className="h-[3px] w-full"
        style={{ backgroundColor: typeTheme.progressTrack }}
        aria-hidden
      >
        <div
          className="crm-toast-progress h-full origin-left"
          style={{
            backgroundColor: typeTheme.border,
            animationDuration: `${Math.max(duration, 800)}ms`,
          }}
        />
      </div>
    </motion.div>
  );
}
