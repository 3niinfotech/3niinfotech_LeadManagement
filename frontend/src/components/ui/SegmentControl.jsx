import { motion } from 'framer-motion';
import './segment.theme.css';

/** Pill tab switcher — toolbar view filters with smooth sliding indicator */
export default function SegmentControl({
  items = [],
  value,
  onChange,
  className = '',
  layoutId = 'crm-segment-pill',
}) {
  return (
    <div className={`crm-segment ${className}`.trim()} role="tablist">
      <div className="crm-segment__track">
        {items.map((item) => {
          const active = value === item.id;
          return (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => onChange(item.id)}
              className={`crm-segment__tab ${active ? 'crm-segment__tab--active' : ''}`}
            >
              {active && (
                <motion.span
                  layoutId={layoutId}
                  className="crm-segment__indicator"
                  transition={{ type: 'spring', stiffness: 380, damping: 38, mass: 0.8 }}
                />
              )}
              <span className="crm-segment__label">{item.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
