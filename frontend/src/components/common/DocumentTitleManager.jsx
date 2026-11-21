import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useCompanyRuntime } from '../../features/organization/CompanyRuntime';

const DEFAULT_BRAND = '3ni InfoTech';

// Comprehensive Route-to-PageName Dictionary
const ROUTE_PAGE_NAMES = {
  // Public & Auth
  '/': `Home`,
  '/login': `Sign In`,
  '/login/admin': `Admin Sign In`,
  '/login/student': `Student Portal Sign In`,
  '/login/agent': `Partner Agent Sign In`,
  '/forgot-password/student': `Reset Password`,
  '/register/student': `Student Registration`,
  '/register/agent': `Partner Agent Registration`,
  '/apply': `Role Applications`,

  // Admin Portal Primary Workspace
  '/admin/dashboard': `Dashboard Overview`,
  '/admin/reception': `Reception Desk`,
  '/admin/reception/walk-ins': `Walk-in Registrations`,
  '/admin/enquiries': `Enquiry Workspace`,
  '/admin/enquiries/new': `New Student Enquiry`,
  '/admin/enquiries/unassigned': `Unassigned Leads Pool`,
  '/admin/assignment/course-counsellor-mapping': `Course-Counsellor Mapping`,
  '/admin/students': `Students Directory`,
  '/admin/applications': `University Applications`,
  '/admin/visas': `Visa Processing & Grants`,
  '/admin/fees': `Fee Invoicing & Payments`,
  '/admin/batches': `Batches & Attendance`,
  '/admin/calendar': `Calendar & Appointments`,
  '/admin/demo': `Demo Class Bookings`,
  '/admin/automation': `Automation Center & Workflows`,
  '/admin/sla': `SLA & Breach Tracking`,
  '/admin/reports': `Analytics & Reports`,
  '/admin/reports/leads': `Lead Performance Reports`,
  '/admin/reports/operations': `Operations Analytics`,
  '/admin/reports/academic': `Academic & Batch Analytics`,
  '/admin/reports/application-visa': `Admissions & Visa Analytics`,
  '/admin/reports/finance': `Revenue & Finance Analytics`,
  '/admin/reports/targets': `Counselor Target Analytics`,
  '/admin/reports/export': `Data Export Hub`,
  '/admin/users': `Team & User Directory`,
  '/admin/profile': `User Profile & Preferences`,
  '/admin/feature-toggle': `Feature Toggles`,
  '/admin/master-hub': `Master Configuration Hub`,
  '/admin/master/course-finder': `Global Course Finder`,
  '/admin/master/partners': `Partner Universities & Agents`,

  // Student Portal
  '/student/dashboard': `Student Dashboard`,
  '/student/courses': `My Enrolled Courses`,
  '/student/attendance': `My Attendance Records`,
  '/student/assignments': `Assignments & Homework`,
  '/student/tests': `Test Scores & Exams`,
  '/student/materials': `Digital Study Materials`,
  '/student/performance': `Academic Performance`,
  '/student/applications': `My University Applications`,
  '/student/fees': `Tuition Fees & Invoices`,
  '/student/fees/receipts': `Payment Receipts`,
  '/student/documents': `Document Vault`,
  '/student/visa': `Visa Milestone Tracker`,
  '/student/counseling': `Counseling Sessions`,
  '/student/reports': `My Progress Reports`,
  '/student/notifications': `Notifications`,
  '/student/calendar': `Academic Calendar`,
  '/student/help': `Student Support Desk`,
  '/student/profile': `Student Profile`,

  // Agent Portal
  '/agent/dashboard': `Partner Dashboard`,
  '/agent/enquiries': `Student Inquiries`,
  '/agent/students': `Referred Students`,
  '/agent/applications': `Track Applications`,
  '/agent/visas': `Visa Outcomes`,
  '/agent/commissions': `Partner Commissions`,
  '/agent/reports': `Partner Performance`,
  '/agent/calendar': `Counselor Calendar`,
  '/agent/profile': `Partner Profile`,
};

const SETTINGS_TAB_NAMES = {
  'email-templates': `Email & Lifecycle Hub`,
  'company': `Company Branding & Profile`,
  'team-access': `Team & Role Permissions`,
  'notifications': `Notification Preferences`,
  'branches': `Branch Management`,
  'features': `Feature Switches`,
  'security': `Security & Audit Controls`,
  'data-backup': `Backup & Data Export`,
};

/**
 * Resolves dynamic title based on location pathname, search parameters, and active brand name
 */
function resolveTitle(pathname, search, brand) {
  const params = new URLSearchParams(search);

  // Settings Tabs
  if (pathname === '/admin/settings') {
    const tab = params.get('tab') || 'email-templates';
    if (tab === 'email-templates') {
      if (params.get('compose') === 'true') {
        return `Compose & Send Email | ${brand}`;
      }
      return `Email & Lifecycle Hub | ${brand}`;
    }
    if (SETTINGS_TAB_NAMES[tab]) {
      return `${SETTINGS_TAB_NAMES[tab]} | ${brand}`;
    }
    return `Settings & Configuration | ${brand}`;
  }

  // Exact route match
  if (ROUTE_PAGE_NAMES[pathname]) {
    if (pathname === '/') return `${brand} — Overseas Education Advisory & Visa CRM`;
    return `${ROUTE_PAGE_NAMES[pathname]} | ${brand}`;
  }

  // Dynamic Pattern Matching
  if (pathname.startsWith('/admin/students/')) {
    return `Student Profile | ${brand}`;
  }
  if (pathname.startsWith('/admin/enquiries/')) {
    return `Enquiry Details | ${brand}`;
  }
  if (pathname.startsWith('/admin/batches/')) {
    return `Batch Management | ${brand}`;
  }
  if (pathname.startsWith('/admin/master/')) {
    const slug = pathname.replace('/admin/master/', '').replace(/-/g, ' ');
    const formatted = slug ? slug.charAt(0).toUpperCase() + slug.slice(1) : 'Data';
    return `Master Data: ${formatted} | ${brand}`;
  }
  if (pathname.startsWith('/apply/')) {
    return `Apply for Position | ${brand}`;
  }

  // Fallbacks
  if (pathname.startsWith('/admin')) {
    return `Admin Workspace | ${brand}`;
  }
  if (pathname.startsWith('/student')) {
    return `Student Portal | ${brand}`;
  }
  if (pathname.startsWith('/agent')) {
    return `Agent Portal | ${brand}`;
  }

  return brand;
}

export default function DocumentTitleManager() {
  const location = useLocation();
  const runtime = useCompanyRuntime();
  const brand = runtime?.settings?.portalTitle || runtime?.company?.name || DEFAULT_BRAND;

  useEffect(() => {
    const title = resolveTitle(location.pathname, location.search, brand);
    document.title = title;
  }, [location.pathname, location.search, brand]);

  return null;
}
