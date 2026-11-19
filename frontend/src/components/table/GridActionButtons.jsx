import {
  FiEye,
  FiEdit2,
  FiTrash2,
  FiCheckCircle,
  FiCalendar,
  FiExternalLink,
  FiPhone,
  FiMail,
  FiXCircle,
  FiMoreVertical,
} from 'react-icons/fi';

const ACTION_STYLES = {
  view: {
    icon: FiEye,
    title: 'View Details',
    className: 'text-sky-600 hover:text-sky-700 hover:bg-sky-50 hover:border-sky-300 dark:text-sky-400 dark:hover:bg-sky-950/40 dark:hover:border-sky-700',
  },
  edit: {
    icon: FiEdit2,
    title: 'Edit',
    className: 'text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 hover:border-emerald-300 dark:text-emerald-400 dark:hover:bg-emerald-950/40 dark:hover:border-emerald-700',
  },
  attendance: {
    icon: FiCheckCircle,
    title: 'Mark Attendance',
    className: 'text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 hover:border-emerald-300 dark:text-emerald-400 dark:hover:bg-emerald-950/40 dark:hover:border-emerald-700',
  },
  schedule: {
    icon: FiCalendar,
    title: 'Schedule / Reschedule',
    className: 'text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 hover:border-indigo-300 dark:text-indigo-400 dark:hover:bg-indigo-950/40 dark:hover:border-indigo-700',
  },
  delete: {
    icon: FiTrash2,
    title: 'Delete',
    className: 'text-rose-600 hover:text-rose-700 hover:bg-rose-50 hover:border-rose-300 dark:text-rose-400 dark:hover:bg-rose-950/40 dark:hover:border-rose-700',
  },
  cancel: {
    icon: FiXCircle,
    title: 'Cancel',
    className: 'text-rose-500 hover:text-rose-600 hover:bg-rose-50 hover:border-rose-300 dark:text-rose-400 dark:hover:bg-rose-950/40 dark:hover:border-rose-700',
  },
  external: {
    icon: FiExternalLink,
    title: 'Open in Workspace',
    className: 'text-purple-600 hover:text-purple-700 hover:bg-purple-50 hover:border-purple-300 dark:text-purple-400 dark:hover:bg-purple-950/40 dark:hover:border-purple-700',
  },
};

export function GridActionButton({
  action, // 'view' | 'edit' | 'attendance' | 'schedule' | 'delete' | 'cancel' | 'external'
  icon: CustomIcon,
  title,
  onClick,
  disabled = false,
  className = '',
}) {
  const preset = ACTION_STYLES[action] || ACTION_STYLES.view;
  const Icon = CustomIcon || preset.icon;
  const tooltip = title || preset.title;

  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        if (!disabled) onClick?.(e);
      }}
      disabled={disabled}
      title={tooltip}
      aria-label={tooltip}
      className={`inline-flex items-center justify-center w-7 h-7 shrink-0 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-2xs transition-colors duration-150 disabled:opacity-40 disabled:pointer-events-none ${preset.className} ${className}`}
    >
      <Icon className="w-3.5 h-3.5 shrink-0 stroke-[2]" />
    </button>
  );
}

export function GridActionGroup({ children, className = '' }) {
  return (
    <div
      className={`inline-flex items-center justify-center gap-1.5 ${className}`}
      onClick={(e) => e.stopPropagation()}
    >
      {children}
    </div>
  );
}

export default {
  GridActionButton,
  GridActionGroup,
};
