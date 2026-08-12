import { motion } from 'framer-motion';
import {
  FiUser, FiBookOpen, FiPhoneCall, FiCalendar, FiFileText, FiMessageSquare, FiClock, FiUpload,
} from 'react-icons/fi';

const ICONS = {
  user: FiUser,
  book: FiBookOpen,
  phone: FiPhoneCall,
  calendar: FiCalendar,
  file: FiFileText,
  message: FiMessageSquare,
  clock: FiClock,
  upload: FiUpload,
};

export default function FormStepTabs({ tabs, activeTab, onChange, tabErrors = {}, layoutId = 'crm-form-tab-pill' }) {
  return (
    <nav className="crm-form-tabs" aria-label="Form sections">
      <div className="crm-form-tabs__track" role="tablist">
        {tabs.map((tab) => {
          const Icon = ICONS[tab.icon] || FiUser;
          const active = activeTab === tab.id;
          const hasError = Boolean(tabErrors[tab.id]);

          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => onChange(tab.id)}
              className={`crm-form-tabs__tab ${active ? 'crm-form-tabs__tab--active' : ''}`}
            >
              {active && (
                <motion.span
                  layoutId={layoutId}
                  className="crm-form-tabs__indicator"
                  transition={{ type: 'spring', stiffness: 380, damping: 38, mass: 0.8 }}
                />
              )}
              <Icon className="crm-form-tabs__icon" aria-hidden />
              <span>{tab.label}</span>
              {hasError && <span className="crm-form-tabs__error-dot" aria-label="Has errors" />}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
