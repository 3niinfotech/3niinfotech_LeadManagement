import { motion } from 'framer-motion';
import {
  FiLayout, FiClock, FiEdit3, FiCheckSquare, FiPhoneCall, FiCalendar,
  FiFileText, FiMessageSquare, FiMonitor, FiDollarSign, FiBriefcase,
  FiGlobe, FiActivity, FiShield, FiTrendingUp, FiRotateCcw, FiBookOpen,
} from 'react-icons/fi';
import ScrollArea from '../../../../components/ui/ScrollArea';

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

const INDICATOR_SPRING = { type: 'spring', stiffness: 420, damping: 34, mass: 0.78 };

/** Underline tabs with sliding indicator + smooth label transitions */
export default function EnquiryWorkspaceTabs({
  tabs,
  activeTab,
  onChange,
  tabErrors = {},
}) {
  return (
    <nav className="crm-enquiry-tabs" aria-label="Enquiry sections">
      <ScrollArea axis="x" className="crm-enquiry-tabs__scroll" hideBar>
        <div className="crm-enquiry-tabs__track" role="tablist">
          {tabs.map((tab) => {
            const Icon = ICONS[tab.icon] || FiLayout;
            const active = activeTab === tab.id;
            const hasError = Boolean(tabErrors[tab.id]);
            const isConvert = tab.id === 'conversion';

            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => onChange(tab.id)}
                className={[
                  'crm-enquiry-tabs__tab',
                  active && 'crm-enquiry-tabs__tab--active',
                  isConvert && 'crm-enquiry-tabs__tab--convert',
                ].filter(Boolean).join(' ')}
              >
                {active && (
                  <motion.span
                    layoutId="crm-enquiry-tab-indicator"
                    className="crm-enquiry-tabs__indicator"
                    transition={INDICATOR_SPRING}
                  />
                )}
                <Icon className="crm-enquiry-tabs__icon" aria-hidden />
                <motion.span
                  className="crm-enquiry-tabs__label"
                  animate={{
                    opacity: active ? 1 : 0.82,
                    y: active ? 0 : 0,
                  }}
                  transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                >
                  {tab.label}
                </motion.span>
                {hasError && <span className="crm-enquiry-tabs__error-dot" aria-label="Has errors" />}
              </button>
            );
          })}
        </div>
      </ScrollArea>
    </nav>
  );
}
