/**
 * Enquiry tag labels — mirrors backend MasterItem category `tags`.
 * Dropdown options are loaded from /masters/tags/options when available.
 */
export const ENQUIRY_TAG_LABELS = [
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
  'IELTS',
  'PTE',
  'TOEFL',
  'Duolingo',
  'Canada',
  'Australia',
  'UK',
  'USA',
  'New Zealand',
  'Germany',
  'Ireland',
  'VIP',
  'Urgent',
  'Scholarship',
  'Parent Interested',
  'Returning Student',
  'Existing Client',
  'Education Loan',
  'Self Funded',
  'Study Abroad',
  'University Admission',
  'Visa Assistance',
  'Counselling Required',
];

const TAG_COLORS = {
  IELTS: 'info',
  PTE: 'info',
  TOEFL: 'info',
  Duolingo: 'info',
  Canada: 'primary',
  Australia: 'primary',
  UK: 'primary',
  USA: 'primary',
  'New Zealand': 'primary',
  Germany: 'primary',
  Ireland: 'primary',
  VIP: 'success',
  Urgent: 'danger',
  Scholarship: 'warning',
  'Scholarship Interest': 'warning',
  'Parent Interested': 'primary',
  'Parent Involved': 'primary',
  'Returning Student': 'secondary',
  'Repeat Visit': 'secondary',
  'Hot Lead': 'danger',
  'Warm Lead': 'warning',
  'Cold Lead': 'info',
  'High Priority': 'danger',
};

export const ENQUIRY_TAGS = ENQUIRY_TAG_LABELS.map((label) => ({
  value: label,
  label,
  color: TAG_COLORS[label] || 'secondary',
}));

export function getEnquiryTagLabel(value) {
  return ENQUIRY_TAGS.find((t) => t.value === value)?.label ?? value;
}

export function getEnquiryTagMeta(value) {
  const match = ENQUIRY_TAGS.find((t) => t.value === value);
  if (match) return match;
  return value ? { value, label: value, color: 'secondary' } : undefined;
}

export function mapEnquiryTagOptions(options = []) {
  return options.map(({ value, label }) => ({
    value: value || label,
    label: label || value,
    color: TAG_COLORS[label || value] || 'secondary',
  }));
}
