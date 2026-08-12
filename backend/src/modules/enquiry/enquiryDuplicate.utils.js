export function normalizeEmail(value) {
  const email = String(value || '').trim().toLowerCase();
  return email.includes('@') ? email : '';
}

export function normalizePhone(value) {
  const digits = String(value || '').replace(/\D/g, '');
  if (digits.length < 6) return '';
  return digits.length > 10 ? digits.slice(-10) : digits;
}

export function normalizePassport(value) {
  return String(value || '').trim().toUpperCase().replace(/\s+/g, '');
}

export function phoneMatches(recordValue, inputValue) {
  const a = normalizePhone(recordValue);
  const b = normalizePhone(inputValue);
  if (!a || !b) return false;
  return a === b || a.endsWith(b) || b.endsWith(a);
}

export function getMatchedFields(record, input) {
  const matchedOn = [];
  const email = normalizeEmail(input.email);
  if (email && normalizeEmail(record.email) === email) matchedOn.push('email');

  if (input.mobile && (phoneMatches(record.mobile, input.mobile) || phoneMatches(record.alternateNo, input.mobile))) {
    matchedOn.push('mobile');
  }
  if (input.alternateNo && (phoneMatches(record.mobile, input.alternateNo) || phoneMatches(record.alternateNo, input.alternateNo))) {
    matchedOn.push('alternateNo');
  }

  const passport = normalizePassport(input.passportNo);
  if (passport && normalizePassport(record.passportNo) === passport) matchedOn.push('passport');

  return matchedOn;
}

export const DUPLICATE_FIELD_LABELS = {
  email: 'Email',
  mobile: 'Mobile',
  alternateNo: 'Alternate Number',
  passport: 'Passport',
};
