import { motion } from 'framer-motion';
import {
  FiPhone,
  FiUsers,
  FiMail,
  FiMessageSquare,
  FiBell,
  FiVideo,
  FiMic,
} from 'react-icons/fi';
import { FaWhatsapp } from 'react-icons/fa';

const ICONS = {
  phone: FiPhone,
  users: FiUsers,
  messageSquare: FaWhatsapp,
  mail: FiMail,
  message: FiMessageSquare,
  bell: FiBell,
  video: FiVideo,
  mic: FiMic,
};

const COLOR_MODIFIER = {
  primary: 'text-primary dark:text-primary-light',
  success: 'text-emerald-600 dark:text-emerald-400',
  info: 'text-sky-600 dark:text-sky-400',
  warning: 'text-amber-600 dark:text-amber-400',
  secondary: 'text-text',
};

const INDICATOR_SPRING = { type: 'spring', stiffness: 420, damping: 34, mass: 0.78 };

/**
 * Channel / follow-up action picker — clean segmented channel buttons
 */
export default function FollowupActionTabs({
  actions = [],
  value,
  onChange,
  disabled = false,
  ariaLabel = 'Follow-up action type',
  layoutId = 'crm-followup-channel-indicator',
}) {
  return (
    <nav
      className="w-full p-1 rounded-xl bg-surface-hover/70 border border-border"
      aria-label={ariaLabel}
    >
      <div className="flex items-center gap-1 overflow-x-auto no-scrollbar" role="group">
        {actions.map((action) => {
          const Icon = ICONS[action.icon] || FiPhone;
          const active = value === action.value;
          const colorMod = COLOR_MODIFIER[action.color] || 'text-primary';

          return (
            <button
              key={action.value}
              type="button"
              disabled={disabled}
              onClick={() => onChange(action.value)}
              aria-pressed={active}
              className={`relative flex-1 min-w-[76px] sm:min-w-0 inline-flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg text-xs font-semibold transition-colors duration-150 select-none ${
                active
                  ? `${colorMod} font-bold shadow-xs`
                  : 'text-text-muted hover:text-text hover:bg-surface/50'
              }`}
            >
              {active && (
                <motion.span
                  layoutId={layoutId}
                  className="absolute inset-0 rounded-lg bg-surface border border-border shadow-xs z-0"
                  transition={INDICATOR_SPRING}
                />
              )}
              <Icon className="w-3.5 h-3.5 shrink-0 relative z-10" aria-hidden />
              <span className="relative z-10 truncate">{action.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
