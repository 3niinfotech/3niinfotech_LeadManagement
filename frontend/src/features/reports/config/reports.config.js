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
  { id: 'all_time', label: 'All Time' },
  { id: 'this_month', label: 'This Month' },
  { id: 'last_month', label: 'Last Month' },
  { id: 'this_quarter', label: 'This Quarter' },
  { id: 'this_year', label: 'This Year' },
  { id: 'today', label: 'Today' },
  { id: 'yesterday', label: 'Yesterday' },
  { id: 'this_week', label: 'This Week' },
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

/** Main sidebar Reports tree - Clean & Unified, No Duplicate Subpages */
export function buildReportsSidebarChildren() {
  return [
    {
      id: 'reports-overview',
      label: 'Executive Overview',
      description: 'Business pulse & KPI telemetry',
      icon: FiBarChart2,
      path: REPORT_ROUTES.OVERVIEW,
      permission: PERMISSIONS.REPORTS_VIEW,
    },
    {
      id: 'reports-leads',
      label: 'Leads & Funnel',
      description: 'Enquiry conversion & acquisition',
      icon: FiTrendingUp,
      path: REPORT_ROUTES.LEADS,
      permission: PERMISSIONS.REPORTS_VIEW,
    },
    {
      id: 'reports-academic-appvisa',
      label: 'Admissions & Visas',
      description: 'Enrollments, applications & visas',
      icon: FiFileText,
      path: REPORT_ROUTES.APPLICATION_VISA,
      permission: PERMISSIONS.REPORTS_VIEW,
    },
    {
      id: 'reports-finance',
      label: 'Finance & Collections',
      description: 'Revenue, billing & receivables',
      icon: FiDollarSign,
      path: REPORT_ROUTES.FINANCE,
      permission: PERMISSIONS.REPORTS_VIEW,
    },
    {
      id: 'reports-export',
      label: 'Export Center',
      description: 'Download CSV datasets',
      icon: FiDownload,
      path: REPORT_ROUTES.EXPORT,
      permission: PERMISSIONS.REPORTS_VIEW,
    },
  ];
}

/** Unified In-Page Tab Navigation Sections */
export const REPORT_NAV_TABS = [
  { id: 'overview', label: 'Overview', path: REPORT_ROUTES.OVERVIEW, icon: FiBarChart2 },
  { id: 'leads', label: 'Leads & Funnel', path: REPORT_ROUTES.LEADS, icon: FiTrendingUp },
  { id: 'applications', label: 'Admissions & Visas', path: REPORT_ROUTES.APPLICATION_VISA, icon: FiFileText },
  { id: 'finance', label: 'Finance & Revenue', path: REPORT_ROUTES.FINANCE, icon: FiDollarSign },
  { id: 'export', label: 'Export Center', path: REPORT_ROUTES.EXPORT, icon: FiDownload },
];

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
    case 'all_time':
      return { from: undefined, to: undefined };
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
