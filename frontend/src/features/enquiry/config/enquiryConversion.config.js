export const CONVERSION_FLOW_STEPS = [
  {
    id: 'lead',
    label: 'Enquiry',
    description: 'Lead captured — counsellor follow-up in progress',
  },
  {
    id: 'convert',
    label: 'Convert',
    description: 'Create a dedicated student record from this enquiry',
  },
  {
    id: 'student',
    label: 'Student',
    description: 'Full admission profile — applications, visa, finance',
  },
];

export const CONVERSION_BLOCKED_STATUSES = new Set([
  'LOST',
  'NOT_INTERESTED',
  'SPAM',
  'DUPLICATE',
]);
