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
 * @param {'stretch'|'fit'} density stretch = equal full-width tabs; fit = content-sized (not full width)
 */
export default function FollowupActionTabs({
  actions = [],
  value,
  onChange,
  disabled = false,
  ariaLabel = 'Follow-up action type',
  layoutId = 'crm-followup-channel-indicator',
  density = 'stretch',
}) {
  const fit = density === 'fit';

  return (
    <nav
      className={`crm-channel-tabs ${fit ? 'crm-channel-tabs--fit' : 'crm-channel-tabs--stretch'} p-0.5 rounded-lg bg-surface-hover/70 border border-border`}
      aria-label={ariaLabel}
    >
      <div className={`flex items-center gap-0.5 ${fit ? '' : 'w-full'} overflow-x-auto no-scrollbar`} role="group">
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
              className={`relative inline-flex items-center justify-center gap-1 py-1.5 px-2.5 rounded-md text-[11px] font-semibold transition-colors duration-150 select-none whitespace-nowrap ${
                fit ? 'shrink-0' : 'flex-1 min-w-[4.5rem]'
              } ${
                active
                  ? `${colorMod} font-bold shadow-xs`
                  : 'text-text-muted hover:text-text hover:bg-surface/50'
              }`}
            >
              {active && (
                <motion.span
                  layoutId={layoutId}
                  className="absolute inset-0 rounded-md bg-surface border border-border shadow-xs z-0"
                  transition={INDICATOR_SPRING}
                />
              )}
              <Icon className="w-3.5 h-3.5 shrink-0 relative z-10" aria-hidden />
              <span className="relative z-10">{action.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}

