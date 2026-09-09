/** Public staff apply — student prospect uses enquiry flow, not this module */

export const APPLY_FEATURED_ROLES = [
  { slug: 'counsellor', label: 'Counsellor', description: 'Guide students through visa & study abroad journey' },
  { slug: 'teacher', label: 'Teacher', description: 'Deliver classes, batches & academic sessions' },
  { slug: 'receptionist', label: 'Receptionist', description: 'Front desk, walk-ins & visitor management' },
];

export const APPLY_OTHER_ROLES = [
  { slug: 'telecaller', label: 'Telecaller' },
  { slug: 'application_officer', label: 'Application Officer' },
  { slug: 'visa_officer', label: 'Visa Officer' },
  { slug: 'document_executive', label: 'Document Executive' },
  { slug: 'team_leader', label: 'Team Leader' },
  { slug: 'marketing_executive', label: 'Marketing Executive' },
  { slug: 'finance_executive', label: 'Finance Executive' },
  { slug: 'compliance_officer', label: 'Compliance Officer' },
];

export const ROLE_APPLY_PATH = (slug) => `/apply/${slug}`;

export const APPLY_STATUS_LABELS = {
  PENDING: 'Pending',
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
};

export const APPLY_STATUS_TONES = {
  PENDING: 'warning',
  APPROVED: 'success',
  REJECTED: 'danger',
};
