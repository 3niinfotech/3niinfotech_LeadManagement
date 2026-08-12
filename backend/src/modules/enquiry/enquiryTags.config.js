/** Predefined enquiry tags — multiple allowed per enquiry */
export const ENQUIRY_TAGS = [
  { value: 'IELTS', label: 'IELTS' },
  { value: 'PTE', label: 'PTE' },
  { value: 'CANADA', label: 'Canada' },
  { value: 'AUSTRALIA', label: 'Australia' },
  { value: 'VIP', label: 'VIP' },
  { value: 'SCHOLARSHIP', label: 'Scholarship' },
  { value: 'PARENT_INTERESTED', label: 'Parent Interested' },
  { value: 'WALK_IN', label: 'Walk-In' },
  { value: 'REFERRAL', label: 'Referral' },
  { value: 'URGENT', label: 'Urgent' },
  { value: 'RETURNING', label: 'Returning' },
];

export const ENQUIRY_TAG_VALUES = ENQUIRY_TAGS.map((t) => t.value);

export function normalizeEnquiryTags(tags) {
  if (!Array.isArray(tags)) return [];
  const allowed = new Set(ENQUIRY_TAG_VALUES);
  return [...new Set(tags.filter((t) => allowed.has(t)))];
}
