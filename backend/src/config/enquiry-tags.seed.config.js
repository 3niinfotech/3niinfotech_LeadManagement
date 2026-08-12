/**
 * Canonical enquiry tag labels (MasterItem category: tags).
 * Multiple tags per enquiry; distinct from Lead Source, Visit Purpose, etc.
 */
export const ENQUIRY_TAG_SEED_LABELS = [
  // Existing master tags (preserved — do not remove)
  'Hot Lead',
  'Warm Lead',
  'Cold Lead',
  'High Priority',
  'Budget Concern',
  'Visa Ready',
  'Needs IELTS',
  'Parent Involved',
  'Repeat Visit',
  'Scholarship Interest',

  // Language tests
  'IELTS',
  'PTE',
  'TOEFL',
  'Duolingo',

  // Destinations
  'Canada',
  'Australia',
  'UK',
  'USA',
  'New Zealand',
  'Germany',
  'Ireland',

  // Priority / profile
  'VIP',
  'Urgent',
  'Scholarship',
  'Parent Interested',
  'Returning Student',
  'Existing Client',

  // Funding
  'Education Loan',
  'Self Funded',

  // Services
  'Study Abroad',
  'University Admission',
  'Visa Assistance',
  'Counselling Required',
];

/** Legacy enquiry JSON tag codes → current master labels */
export const LEGACY_ENQUIRY_TAG_MAP = {
  IELTS: 'IELTS',
  PTE: 'PTE',
  TOEFL: 'TOEFL',
  DUOLINGO: 'Duolingo',
  CANADA: 'Canada',
  AUSTRALIA: 'Australia',
  UK: 'UK',
  USA: 'USA',
  NEW_ZEALAND: 'New Zealand',
  GERMANY: 'Germany',
  IRELAND: 'Ireland',
  VIP: 'VIP',
  URGENT: 'Urgent',
  HIGH_PRIORITY: 'High Priority',
  SCHOLARSHIP: 'Scholarship',
  PARENT_INTERESTED: 'Parent Interested',
  RETURNING: 'Returning Student',
  RETURNING_STUDENT: 'Returning Student',
  EXISTING_CLIENT: 'Existing Client',
  EDUCATION_LOAN: 'Education Loan',
  SELF_FUNDED: 'Self Funded',
  STUDY_ABROAD: 'Study Abroad',
  UNIVERSITY_ADMISSION: 'University Admission',
  VISA_ASSISTANCE: 'Visa Assistance',
  COUNSELLING_REQUIRED: 'Counselling Required',
};

export function mapLegacyEnquiryTag(value) {
  if (!value || typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  return LEGACY_ENQUIRY_TAG_MAP[trimmed] || trimmed;
}

export function buildEnquiryTagOptions(labels = ENQUIRY_TAG_SEED_LABELS) {
  return labels.map((label) => ({ value: label, label }));
}
