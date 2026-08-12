import { useSelector } from 'react-redux';
import { selectTheme } from '../../redux/slices/uiSlice';
import { motion } from 'framer-motion';
import { FiCheck, FiX, FiAlertCircle, FiInfo, FiAlertTriangle } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { getToastTheme } from '../../theme/feedback';
import { iconSize } from '../../theme/icons';

const ICONS = { success: FiCheck, error: FiAlertCircle, warning: FiAlertTriangle, info: FiInfo };

export default function ThemedToast({ t, message, type = 'info' }) {
  const theme = useSelector(selectTheme);
  const toastTheme = getToastTheme(theme);
  const typeTheme = toastTheme.types[type] || toastTheme.types.info;
  const Icon = ICONS[type] || FiInfo;

  return (
    <motion.div
      initial={{ opacity: 0, x: 40, scale: 0.96 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 40, scale: 0.96 }}
      className="pointer-events-auto flex items-start gap-3 min-w-[300px] max-w-[420px] p-4 rounded-xl border shadow-lg"
      style={{
        borderLeftWidth: 4,
        borderLeftColor: typeTheme.border,
        backgroundColor: toastTheme.shell.bg,
        borderColor: toastTheme.shell.border,
      }}
    >
      <div className="shrink-0 w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: typeTheme.iconBg, color: typeTheme.icon }}>
        <Icon className={iconSize.sm} />
      </div>
      <p className="flex-1 text-sm font-medium leading-snug pt-1 text-text">{message}</p>
      <button type="button" onClick={() => toast.dismiss(t.id)} className="shrink-0 p-1 rounded-md text-text-muted hover:bg-row-hover transition-colors">
        <FiX className={iconSize.sm} />
      </button>
    </motion.div>
  );
}
