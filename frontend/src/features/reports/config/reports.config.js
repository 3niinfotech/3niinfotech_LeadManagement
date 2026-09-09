import {
  FiBarChart2,
  FiTrendingUp,
  FiLink,
  FiGlobe,
  FiUser,
  FiAward,
  FiPhone,
  FiMonitor,
  FiCheckCircle,
  FiXCircle,
  FiDownload,
  FiUsers,
  FiFileText,
  FiDollarSign,
  FiTarget,
  FiActivity,
  FiBookOpen,
} from 'react-icons/fi';
import { ROUTES } from '../../../config/routes';
import { PERMISSIONS } from '../../../config/permissions';

/** Report center — section pages (not one mega-dashboard). */
export const REPORT_ROUTES = {
  OVERVIEW: ROUTES.REPORTS,
  LEADS: `${ROUTES.REPORTS}/leads`,
  OPERATIONS: `${ROUTES.REPORTS}/operations`,
  ACADEMIC: `${ROUTES.REPORTS}/academic`,
  APPLICATION_VISA: `${ROUTES.REPORTS}/application-visa`,
  FINANCE: `${ROUTES.REPORTS}/finance`,
  TARGETS: `${ROUTES.REPORTS}/targets`,
  EXPORT: `${ROUTES.REPORTS}/export`,
};

export const REPORT_DATE_PRESETS = [
  { id: 'today', label: 'Today' },
  { id: 'yesterday', label: 'Yesterday' },
  { id: 'this_week', label: 'This Week' },
  { id: 'this_month', label: 'This Month' },
  { id: 'last_month', label: 'Last Month' },
  { id: 'this_quarter', label: 'This Quarter' },
  { id: 'this_year', label: 'This Year' },
  { id: 'custom', label: 'Custom' },
];

export const LEAD_REPORT_VIEWS = [
  { id: 'conversion', label: 'Conversion', icon: FiTrendingUp },
  { id: 'source', label: 'Source', icon: FiLink },
  { id: 'country', label: 'Country', icon: FiGlobe },
  { id: 'counsellor', label: 'Counsellor', icon: FiUser },
  { id: 'performance', label: 'Performance', icon: FiAward },
  { id: 'lostReason', label: 'Lost Reason', icon: FiXCircle },
];

export const OPERATIONS_REPORT_VIEWS = [
  { id: 'followup', label: 'Follow-up', icon: FiPhone },
  { id: 'demo', label: 'Demo', icon: FiMonitor },
  { id: 'attendance', label: 'Attendance', icon: FiCheckCircle },
];

/** Main sidebar Reports tree */
export function buildReportsSidebarChildren() {
  return [
    {
      id: 'reports-overview',
      label: 'Overview',
      description: 'Executive summary',
      icon: FiBarChart2,
      path: REPORT_ROUTES.OVERVIEW,
      permission: PERMISSIONS.REPORTS_VIEW,
    },
    {
      id: 'reports-leads-group',
      label: 'Lead & Conversion',
      description: 'Enquiry funnel analytics',
      icon: FiTrendingUp,
      permission: PERMISSIONS.REPORTS_VIEW,
      children: [
        {
          id: 'reports-leads',
          label: 'Conversion',
          path: `${REPORT_ROUTES.LEADS}/conversion`,
          icon: FiTrendingUp,
          permission: PERMISSIONS.REPORTS_VIEW,
        },
        {
          id: 'reports-source',
          label: 'Lead Source',
          path: `${REPORT_ROUTES.LEADS}/source`,
          icon: FiLink,
          permission: PERMISSIONS.REPORTS_VIEW,
        },
        {
          id: 'reports-country',
          label: 'Country',
          path: `${REPORT_ROUTES.LEADS}/country`,
          icon: FiGlobe,
          permission: PERMISSIONS.REPORTS_VIEW,
        },
        {
          id: 'reports-counsellor',
          label: 'Counsellor',
          path: `${REPORT_ROUTES.LEADS}/counsellor`,
          icon: FiUser,
          permission: PERMISSIONS.REPORTS_VIEW,
        },
        {
          id: 'reports-lead-performance',
          label: 'Performance',
          path: `${REPORT_ROUTES.LEADS}/performance`,
          icon: FiAward,
          permission: PERMISSIONS.REPORTS_VIEW,
        },
        {
          id: 'reports-lost',
          label: 'Lost Reason',
          path: `${REPORT_ROUTES.LEADS}/lostReason`,
          icon: FiXCircle,
          permission: PERMISSIONS.REPORTS_VIEW,
        },
      ],
    },
    {
      id: 'reports-ops-group',
      label: 'Operations',
      description: 'Follow-ups, demos, attendance',
      icon: FiActivity,
      permission: PERMISSIONS.REPORTS_VIEW,
      children: [
        {
          id: 'reports-followup',
          label: 'Follow-ups',
          path: `${REPORT_ROUTES.OPERATIONS}/followup`,
          icon: FiPhone,
          permission: PERMISSIONS.REPORTS_VIEW,
        },
        {
          id: 'reports-demo',
          label: 'Demo',
          path: `${REPORT_ROUTES.OPERATIONS}/demo`,
          icon: FiMonitor,
          permission: PERMISSIONS.REPORTS_VIEW,
        },
        {
          id: 'reports-attendance',
          label: 'Attendance',
          path: `${REPORT_ROUTES.OPERATIONS}/attendance`,
          icon: FiCheckCircle,
          permission: PERMISSIONS.REPORTS_VIEW,
        },
      ],
    },
    {
      id: 'reports-academic-group',
      label: 'Student & Academic',
      icon: FiBookOpen,
      permission: PERMISSIONS.REPORTS_VIEW,
      children: [
        {
          id: 'reports-students',
          label: 'Students',
          path: `${REPORT_ROUTES.ACADEMIC}/students`,
          icon: FiUsers,
          permission: PERMISSIONS.REPORTS_VIEW,
        },
        {
          id: 'reports-performance',
          label: 'Performance',
          path: `${REPORT_ROUTES.ACADEMIC}/performance`,
          icon: FiAward,
          permission: PERMISSIONS.REPORTS_VIEW,
        },
      ],
    },
    {
      id: 'reports-appvisa-group',
      label: 'Application & Visa',
      icon: FiFileText,
      permission: PERMISSIONS.REPORTS_VIEW,
      children: [
        {
          id: 'reports-applications',
          label: 'Applications',
          path: `${REPORT_ROUTES.APPLICATION_VISA}/applications`,
          icon: FiFileText,
          permission: PERMISSIONS.REPORTS_VIEW,
        },
        {
          id: 'reports-visa',
          label: 'Visa',
          path: `${REPORT_ROUTES.APPLICATION_VISA}/visa`,
          icon: FiGlobe,
          permission: PERMISSIONS.REPORTS_VIEW,
        },
      ],
    },
    {
      id: 'reports-finance-group',
      label: 'Finance',
      icon: FiDollarSign,
      permission: PERMISSIONS.REPORTS_VIEW,
      children: [
        {
          id: 'reports-fees',
          label: 'Fees & Collection',
          path: `${REPORT_ROUTES.FINANCE}/collection`,
          icon: FiDollarSign,
          permission: PERMISSIONS.REPORTS_VIEW,
        },
        {
          id: 'reports-outstanding',
          label: 'Outstanding',
          path: `${REPORT_ROUTES.FINANCE}/outstanding`,
          icon: FiDollarSign,
          permission: PERMISSIONS.REPORTS_VIEW,
        },
      ],
    },
    {
      id: 'reports-targets',
      label: 'Target vs Achievement',
      path: REPORT_ROUTES.TARGETS,
      icon: FiTarget,
      permission: PERMISSIONS.REPORTS_VIEW,
    },
    {
      id: 'reports-export',
      label: 'Backup / Export',
      path: REPORT_ROUTES.EXPORT,
      icon: FiDownload,
      permission: PERMISSIONS.REPORTS_VIEW,
    },
  ];
}

/** Date preset → { from, to } ISO date strings (yyyy-mm-dd) */
export function resolveReportDateRange(preset, custom = {}) {
  const now = new Date();
  const startOfDay = (d) => {
    const x = new Date(d);
    x.setHours(0, 0, 0, 0);
    return x;
  };
  const endOfDay = (d) => {
    const x = new Date(d);
    x.setHours(23, 59, 59, 999);
    return x;
  };
  const fmt = (d) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  let from;
  let to = endOfDay(now);

  switch (preset) {
    case 'today':
      from = startOfDay(now);
      break;
    case 'yesterday': {
      const y = new Date(now);
      y.setDate(y.getDate() - 1);
      from = startOfDay(y);
      to = endOfDay(y);
      break;
    }
    case 'this_week': {
      const d = startOfDay(now);
      const day = d.getDay();
      const diff = day === 0 ? 6 : day - 1;
      d.setDate(d.getDate() - diff);
      from = d;
      break;
    }
    case 'last_month': {
      from = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      to = endOfDay(new Date(now.getFullYear(), now.getMonth(), 0));
      break;
    }
    case 'this_quarter': {
      const q = Math.floor(now.getMonth() / 3) * 3;
      from = new Date(now.getFullYear(), q, 1);
      break;
    }
    case 'this_year':
      from = new Date(now.getFullYear(), 0, 1);
      break;
    case 'custom':
      return {
        from: custom.from || undefined,
        to: custom.to || undefined,
      };
    case 'this_month':
    default:
      from = new Date(now.getFullYear(), now.getMonth(), 1);
      break;
  }

  return { from: fmt(from), to: fmt(to) };
}
