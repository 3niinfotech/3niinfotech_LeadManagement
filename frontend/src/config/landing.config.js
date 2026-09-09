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
  { id: 'students', label: 'For Students', href: '#for-students' },
  { id: 'institutes', label: 'For Institutes', href: '#for-admin' },
  { id: 'resources', label: 'Resources', href: '#security' },
  { id: 'about', label: 'About', href: '#cta' },
];

export const LANDING_HEADER_LOGINS = [
  { id: 'student', label: 'Student Login', href: LANDING_LOGIN.student },
  { id: 'register', label: 'Register', href: ROUTES.REGISTER_STUDENT, variant: 'register' },
  { id: 'staff', label: 'Staff Login', href: LANDING_LOGIN.crm },
  { id: 'agent', label: 'Agent', href: LANDING_LOGIN.agent },
];

export const LANDING_WORKSPACES = [
  {
    id: 'student',
    title: 'Student',
    description: 'Track applications, classes, documents, fees and your study-abroad journey.',
    cta: 'Student Login',
    href: LANDING_LOGIN.student,
    secondaryCta: 'Create Account',
    secondaryHref: ROUTES.REGISTER_STUDENT,
    accent: 'student',
  },
  {
    id: 'counsellor',
    title: 'Counsellor / Agent',
    description: 'Manage enquiries, follow-ups, applications and student journeys.',
    cta: 'Agent Login',
    href: LANDING_LOGIN.agent,
    accent: 'agent',
  },
  {
    id: 'faculty',
    title: 'Faculty',
    description: 'Manage classes, attendance, assignments and student performance.',
    cta: 'Faculty Login',
    href: LANDING_LOGIN.faculty,
    accent: 'faculty',
  },
  {
    id: 'institute',
    title: 'Institute',
    description: 'Manage your institution, students, programs and operations.',
    cta: 'Institute Login',
    href: LANDING_LOGIN.institute,
    accent: 'institute',
  },
  {
    id: 'crm',
    title: 'CRM / Admin',
    description: 'Manage the complete organization from one secure workspace.',
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
  'Student Registration',
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
      { label: 'About', href: '#cta' },
      { label: 'Contact', href: 'mailto:support@3niinfotech.com' },
      { label: 'Careers', href: '#cta' },
    ],
  },
  {
    title: 'Platform',
    links: [
      { label: 'CRM', href: LANDING_LOGIN.crm },
      { label: 'Student Portal', href: LANDING_LOGIN.student },
      { label: 'Faculty', href: LANDING_LOGIN.faculty },
      { label: 'Applications', href: '#platform' },
      { label: 'Visa', href: '#platform' },
    ],
  },
  {
    title: 'Solutions',
    links: [
      { label: 'Lead Management', href: '#solutions' },
      { label: 'Student Management', href: '#solutions' },
      { label: 'Academic Management', href: '#solutions' },
      { label: 'Finance', href: '#solutions' },
      { label: 'Analytics', href: '#analytics' },
    ],
  },
  {
    title: 'Resources',
    links: [
      { label: 'Student Register', href: ROUTES.REGISTER_STUDENT },
      { label: 'Help', href: `mailto:${LANDING_BRAND.supportEmail}` },
      { label: 'FAQs', href: '#cta' },
      { label: 'Contact', href: 'mailto:support@3niinfotech.com' },
    ],
  },
  {
    title: 'Login',
    links: [
      { label: 'Student Login', href: LANDING_LOGIN.student },
      { label: 'Student Register', href: ROUTES.REGISTER_STUDENT },
      { label: 'Agent Login', href: LANDING_LOGIN.agent },
      { label: 'Faculty Login', href: LANDING_LOGIN.faculty },
      { label: 'CRM Login', href: LANDING_LOGIN.crm },
    ],
  },
];
