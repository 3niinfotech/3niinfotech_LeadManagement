import {
  FiTrendingUp, FiLink, FiGlobe, FiUser, FiAward, FiPhone, FiMonitor, FiXCircle,
} from 'react-icons/fi';
import { ENQUIRY_REPORT_TABS } from '../config/reports.config';

const ICONS = {
  trendingUp: FiTrendingUp,
  link: FiLink,
  globe: FiGlobe,
  user: FiUser,
  award: FiAward,
  phone: FiPhone,
  monitor: FiMonitor,
  xCircle: FiXCircle,
};

export default function ReportsNav({ activeTab, onChange }) {
  return (
    <nav className="crm-reports-nav" aria-label="Report sections">
      {ENQUIRY_REPORT_TABS.map((tab) => {
        const Icon = ICONS[tab.icon];
        const active = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            className="crm-reports-nav__item"
            data-active={active ? 'true' : 'false'}
            onClick={() => onChange(tab.id)}
          >
            {Icon && <Icon className="w-4 h-4 shrink-0" />}
            <span>{tab.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
