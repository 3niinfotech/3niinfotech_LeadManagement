import { ROUTES } from './routes';

/** Public landing — brand defaults (tenant logo/name can override via props/runtime later) */
export const LANDING_BRAND = {
  name: '3ni Infotech',
  productName: 'VisaERP',
  legalName: '3ni Infotech',
  supportEmail: 'support@3niinfotech.com',
};

export const LANDING_LOGIN = {
  student: ROUTES.LOGIN_STUDENT,
  agent: ROUTES.LOGIN_AGENT,
  faculty: ROUTES.LOGIN_ADMIN,
  institute: ROUTES.LOGIN_ADMIN,
  crm: ROUTES.LOGIN_ADMIN,
  partner: ROUTES.LOGIN_AGENT,
};

export const LANDING_NAV = [
  { id: 'platform', label: 'Platform', href: '#platform' },
  { id: 'solutions', label: 'Solutions', href: '#solutions' },
  { id: 'for-students', label: 'For Students', href: '#for-students' },
  { id: 'for-admin', label: 'For Institutes', href: '#for-admin' },
  { id: 'careers', label: 'Careers', href: '/apply' },
  { id: 'contact', label: 'Contact Us', href: '#contact' },
];

export const LANDING_HEADER_LOGINS = [
  { id: 'student', label: 'Student Login', href: LANDING_LOGIN.student },
  { id: 'staff', label: 'Staff Login', href: LANDING_LOGIN.crm },
  { id: 'agent', label: 'Agent', href: LANDING_LOGIN.agent },
  { id: 'contact', label: 'Enquire Now', href: '#contact', variant: 'contact' },
];

export const LANDING_WORKSPACES = [
  {
    id: 'student',
    title: 'Student Portal',
    description: 'Track applications, attend classes, access study documents, view fee receipts and monitor visa milestones.',
    cta: 'Student Login',
    href: LANDING_LOGIN.student,
    accent: 'student',
  },
  {
    id: 'counsellor',
    title: 'Counsellor / Agent',
    description: 'Manage incoming enquiries, follow-ups, applications, demo sessions and student conversions.',
    cta: 'Agent Login',
    href: LANDING_LOGIN.agent,
    accent: 'agent',
  },
  {
    id: 'faculty',
    title: 'Faculty & Trainers',
    description: 'Manage batches, mark attendance, assign tasks, review mock test scores and share learning materials.',
    cta: 'Faculty Login',
    href: LANDING_LOGIN.faculty,
    accent: 'faculty',
  },
  {
    id: 'institute',
    title: 'Institute Operations',
    description: 'Manage institution branches, admissions pipeline, fees collection, batch allocations and operations.',
    cta: 'Institute Login',
    href: LANDING_LOGIN.institute,
    accent: 'institute',
  },
  {
    id: 'crm',
    title: 'CRM / Executive Admin',
    description: 'Complete centralized governance, multi-branch control, compliance, and real-time business intelligence.',
    cta: 'CRM Login',
    href: LANDING_LOGIN.crm,
    accent: 'crm',
  },
];

export const LANDING_VALUE_ITEMS = [
  { id: 'leads', label: 'Lead Management', description: 'Capture, assign and track every enquiry from first contact.' },
  { id: 'counselling', label: 'Counselling', description: 'Structured follow-ups, notes and conversion workflows.' },
  { id: 'students', label: 'Student Management', description: 'One master profile across the entire lifecycle.' },
  { id: 'applications', label: 'Applications', description: 'University applications, documents and status tracking.' },
  { id: 'visa', label: 'Visa Processing', description: 'Case stages, checklists and officer workflows.' },
  { id: 'academic', label: 'Academic Management', description: 'Batches, courses, timetables and progress.' },
  { id: 'attendance', label: 'Attendance', description: 'Class sessions, marks and participation records.' },
  { id: 'fees', label: 'Fees & Payments', description: 'Plans, invoices, receipts and outstanding balances.' },
  { id: 'documents', label: 'Documents', description: 'Central document vault with role-based visibility.' },
  { id: 'followups', label: 'Follow-ups', description: 'Calendar-driven reminders for staff and counsellors.' },
  { id: 'reports', label: 'Reports & Analytics', description: 'Operational, academic and finance intelligence.' },
  { id: 'communication', label: 'Communication', description: 'Notifications and engagement across portals.' },
];

export const LANDING_JOURNEY_STEPS = [
  'Enquiry',
  'Counselling',
  'Demo / Assessment',
  'Student Profile',
  'Course / Batch',
  'Application',
  'Documents',
  'Visa',
  'Decision',
  'Student Success',
];

export const LANDING_CRM_WORKFLOW = [
  'New Enquiry',
  'Assign Counsellor',
  'Follow-up',
  'Demo',
  'Conversion',
  'Student',
  'Application',
  'Visa',
];

export const LANDING_DESTINATIONS = [
  { code: 'CA', name: 'Canada' },
  { code: 'AU', name: 'Australia' },
  { code: 'GB', name: 'United Kingdom' },
  { code: 'US', name: 'United States' },
  { code: 'NZ', name: 'New Zealand' },
  { code: 'DE', name: 'Germany' },
  { code: 'IE', name: 'Ireland' },
  { code: 'SG', name: 'Singapore' },
];

export const LANDING_ANALYTICS_METRICS = [
  { label: 'Enquiries', value: '—', hint: 'Pipeline volume' },
  { label: 'Conversion', value: '—', hint: 'Enquiry → student' },
  { label: 'Follow-ups', value: '—', hint: 'Due & completed' },
  { label: 'Demo attendance', value: '—', hint: 'Scheduled vs attended' },
  { label: 'Students', value: '—', hint: 'Active cohorts' },
  { label: 'Applications', value: '—', hint: 'In progress' },
  { label: 'Visa cases', value: '—', hint: 'Stage breakdown' },
  { label: 'Collections', value: '—', hint: 'Fees received' },
];

export const LANDING_SECURITY_ITEMS = [
  'Role-based access',
  'Permission management',
  'Branch-level access',
  'Tenant isolation',
  'Secure authentication',
  'Activity tracking',
  'Controlled data visibility',
];

export const LANDING_FOOTER_COLUMNS = [
  {
    title: 'Company',
    links: [
      { label: 'About Us', href: '#cta' },
      { label: 'Careers (Join Team)', href: '/apply' },
      { label: 'Contact Us', href: '#contact' },
    ],
  },
  {
    title: 'Portals',
    links: [
      { label: 'Student Login', href: LANDING_LOGIN.student },
      { label: 'Staff / CRM Login', href: LANDING_LOGIN.crm },
      { label: 'Agent Login', href: LANDING_LOGIN.agent },
      { label: 'Faculty Login', href: LANDING_LOGIN.faculty },
    ],
  },
  {
    title: 'Solutions',
    links: [
      { label: 'Lead Management', href: '#solutions' },
      { label: 'Student Management', href: '#solutions' },
      { label: 'Academic Management', href: '#solutions' },
      { label: 'Finance & Invoicing', href: '#solutions' },
      { label: 'Visa Processing', href: '#platform' },
    ],
  },
  {
    title: 'Enquiry & Support',
    links: [
      { label: 'Free Counselling Enquiry', href: '#contact' },
      { label: 'Careers & Hiring', href: '/apply' },
      { label: 'Help Desk', href: `mailto:${LANDING_BRAND.supportEmail}` },
    ],
  },
];
