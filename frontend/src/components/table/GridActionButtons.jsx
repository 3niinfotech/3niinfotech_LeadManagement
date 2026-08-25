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
    className: 'text-sky-600 hover:text-sky-700 hover:bg-sky-50 dark:text-sky-400 dark:hover:bg-sky-950/40',
  },
  edit: {
    icon: FiEdit2,
    title: 'Edit',
    className: 'text-amber-600 hover:text-amber-700 hover:bg-amber-50 dark:text-amber-400 dark:hover:bg-amber-950/40',
  },
  attendance: {
    icon: FiCheckCircle,
    title: 'Mark Attendance',
    className: 'text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-950/40',
  },
  schedule: {
    icon: FiCalendar,
    title: 'Schedule / Reschedule',
    className: 'text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 dark:text-indigo-400 dark:hover:bg-indigo-950/40',
  },
  delete: {
    icon: FiTrash2,
    title: 'Delete',
    className: 'text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/40',
  },
  cancel: {
    icon: FiXCircle,
    title: 'Cancel',
    className: 'text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/40',
  },
  external: {
    icon: FiExternalLink,
    title: 'Open in Workspace',
    className: 'text-purple-600 hover:text-purple-700 hover:bg-purple-50 dark:text-purple-400 dark:hover:bg-purple-950/40',
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
      className={`inline-flex items-center justify-center p-1.5 rounded-lg transition-all duration-150 active:scale-95 disabled:opacity-40 disabled:pointer-events-none ${preset.className} ${className}`}
    >
      <Icon className="w-4 h-4 shrink-0 stroke-[2.2]" />
    </button>
  );
}

export function GridActionGroup({ children, className = '' }) {
  return (
    <div
      className={`inline-flex items-center justify-center gap-1 ${className}`}
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
