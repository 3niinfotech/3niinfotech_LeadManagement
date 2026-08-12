import { motion } from 'framer-motion';
import {
  FiPhone, FiUsers, FiMail, FiMessageSquare, FiBell, FiVideo, FiMic,
} from 'react-icons/fi';
import { FaWhatsapp } from 'react-icons/fa';
import ScrollArea from '../../../../components/ui/ScrollArea';

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
  primary: 'crm-followup-channel-tabs__tab--primary',
  success: 'crm-followup-channel-tabs__tab--success',
  info: 'crm-followup-channel-tabs__tab--info',
  warning: 'crm-followup-channel-tabs__tab--warning',
  secondary: 'crm-followup-channel-tabs__tab--secondary',
};

const INDICATOR_SPRING = { type: 'spring', stiffness: 420, damping: 34, mass: 0.78 };

/**
 * Channel / follow-up action picker — horizontal row or vertical sidebar rail.
 */
export default function FollowupActionTabs({
  actions,
  value,
  onChange,
  disabled = false,
  ariaLabel = 'Follow-up action type',
  layoutId = 'crm-followup-channel-indicator',
  orientation = 'horizontal',
  edgeFade = true,
  variant = 'default',
}) {
  const isVertical = orientation === 'vertical';
  const isInline = variant === 'inline';
  const fadeEdges = edgeFade && !isVertical && !isInline;

  return (
    <nav
      className={[
        'crm-followup-channel-tabs',
        isVertical && 'crm-followup-channel-tabs--vertical',
        isInline && 'crm-followup-channel-tabs--inline',
        !fadeEdges && 'crm-followup-channel-tabs--no-fade',
      ].filter(Boolean).join(' ')}
      aria-label={ariaLabel}
    >
      <ScrollArea
        axis={isVertical ? 'y' : 'x'}
        className="crm-followup-channel-tabs__scroll"
        hideBar
      >
        <div className="crm-followup-channel-tabs__track" role="group">
          {actions.map((action) => {
            const Icon = ICONS[action.icon] || FiPhone;
            const active = value === action.value;
            const colorMod = COLOR_MODIFIER[action.color] || '';

            return (
              <button
                key={action.value}
                type="button"
                disabled={disabled}
                onClick={() => onChange(action.value)}
                aria-pressed={active}
                className={[
                  'crm-followup-channel-tabs__tab',
                  colorMod,
                  active && 'is-active',
                ].filter(Boolean).join(' ')}
              >
                {active && (
                  <motion.span
                    layoutId={layoutId}
                    className="crm-followup-channel-tabs__indicator"
                    transition={INDICATOR_SPRING}
                  />
                )}
                <Icon className="crm-followup-channel-tabs__icon" aria-hidden />
                <span className="crm-followup-channel-tabs__label">{action.label}</span>
              </button>
            );
          })}
        </div>
      </ScrollArea>
    </nav>
  );
}
