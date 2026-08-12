import { Fragment } from 'react';
import { motion } from 'framer-motion';
import {
  FiLayout, FiClock, FiEdit3, FiCheckSquare, FiPhoneCall, FiCalendar,
  FiFileText, FiMessageSquare, FiMonitor, FiDollarSign, FiBriefcase,
  FiGlobe, FiActivity, FiShield, FiTrendingUp, FiRotateCcw, FiBookOpen,
} from 'react-icons/fi';
import ScrollArea from './ScrollArea';

const ICONS = {
  layout: FiLayout,
  clock: FiClock,
  edit: FiEdit3,
  checkSquare: FiCheckSquare,
  phone: FiPhoneCall,
  calendar: FiCalendar,
  file: FiFileText,
  message: FiMessageSquare,
  monitor: FiMonitor,
  dollar: FiDollarSign,
  briefcase: FiBriefcase,
  globe: FiGlobe,
  activity: FiActivity,
  shield: FiShield,
  trending: FiTrendingUp,
  history: FiRotateCcw,
  book: FiBookOpen,
};

/**
 * Scrollable profile tabs — grouped sections, optional compact (icon-only inactive).
 */
export default function ProfileTabs({
  tabs,
  activeTab,
  onChange,
  tabErrors = {},
  layoutId = 'crm-profile-tab-pill',
  compact = false,
  className = '',
}) {
  return (
    <nav
      className={`crm-profile-tabs${compact ? ' crm-profile-tabs--compact' : ''} ${className}`.trim()}
      aria-label="Profile sections"
    >
      <ScrollArea axis="x" className="crm-profile-tabs__scroll">
        <div className="crm-profile-tabs__track" role="tablist">
          {tabs.map((tab, index) => {
            const Icon = ICONS[tab.icon] || FiLayout;
            const active = activeTab === tab.id;
            const hasError = Boolean(tabErrors[tab.id]);
            const prevGroup = tabs[index - 1]?.group;
            const showDivider = index > 0 && tab.group && tab.group !== prevGroup;
            const showLabel = !compact || active;

            return (
              <Fragment key={tab.id}>
                {showDivider && <span className="crm-profile-tabs__divider" aria-hidden />}
                <button
                  type="button"
                  role="tab"
                  aria-selected={active}
                  aria-label={tab.label}
                  title={tab.label}
                  onClick={() => onChange(tab.id)}
                  className={`crm-profile-tabs__tab ${active ? 'crm-profile-tabs__tab--active' : ''}`}
                >
                  {active && (
                    <motion.span
                      layoutId={layoutId}
                      className="crm-profile-tabs__indicator"
                      transition={{ type: 'spring', stiffness: 400, damping: 36, mass: 0.75 }}
                    />
                  )}
                  <Icon className="crm-profile-tabs__icon" aria-hidden />
                  {showLabel && <span className="crm-profile-tabs__label">{tab.label}</span>}
                  {hasError && <span className="crm-profile-tabs__error-dot" aria-label="Has errors" />}
                </button>
              </Fragment>
            );
          })}
        </div>
      </ScrollArea>
    </nav>
  );
}
