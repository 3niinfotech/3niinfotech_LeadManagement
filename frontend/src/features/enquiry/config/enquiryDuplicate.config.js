export const DUPLICATE_FIELD_LABELS = {
  email: 'Email',
  mobile: 'Mobile',
  alternateNo: 'Alternate Number',
  passport: 'Passport',
};

export function getDuplicateFieldLabel(field) {
  return DUPLICATE_FIELD_LABELS[field] || field;
}
