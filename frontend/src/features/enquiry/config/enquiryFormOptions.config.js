/** Master categories — swap values via masters API without changing form UI */
export const ENQUIRY_FORM_CATEGORIES = {
  GENDER: 'gender',
  NATIONALITY: 'nationality',
  MARITAL_STATUS: 'maritalStatus',
  COUNTRY_CODE: 'countryCode',
  HIGHEST_QUAL: 'highestQual',
  COURSE: 'course',
  COUNTRY: 'country',
  INTAKE: 'intake',
  APPLY_LEVEL: 'applyLevel',
  SOURCE: 'source',
  TEST_NAME: 'testName',
};

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function buildIntakeOptions(monthsAhead = 24) {
  const options = [];
  const now = new Date();
  for (let i = 0; i < monthsAhead; i += 1) {
    const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
    const label = `${MONTHS[d.getMonth()]}-${d.getFullYear()}`;
    options.push({ value: label, label });
  }
  return options;
}

/** Dial codes from Country master — label/value are code only (+91), deduped */
export function mapCountryPhoneCodeOptions(countryOptions = []) {
  const seen = new Set();
  const out = [];
  for (const row of countryOptions) {
    let code = String(row?.phoneCode || '').trim();
    if (!code) continue;
    if (!code.startsWith('+')) code = `+${code.replace(/^\+/, '')}`;
    if (seen.has(code)) continue;
    seen.add(code);
    out.push({ value: code, label: code });
  }
  return out;
}

export const ENQUIRY_FORM_OPTIONS = {
  gender: [
    { value: 'Male', label: 'Male' },
    { value: 'Female', label: 'Female' },
    { value: 'Other', label: 'Other' },
    { value: 'Prefer not to say', label: 'Prefer not to say' },
  ],
  nationality: [
    { value: 'India', label: 'India' },
    { value: 'Nepal', label: 'Nepal' },
    { value: 'Bangladesh', label: 'Bangladesh' },
    { value: 'Sri Lanka', label: 'Sri Lanka' },
    { value: 'UAE', label: 'UAE' },
    { value: 'Other', label: 'Other' },
  ],
  maritalStatus: [
    { value: 'Single', label: 'Single' },
    { value: 'Married', label: 'Married' },
    { value: 'Divorced', label: 'Divorced' },
    { value: 'Widowed', label: 'Widowed' },
  ],
  countryCode: [
    { value: '+91', label: '+91' },
    { value: '+1', label: '+1' },
    { value: '+44', label: '+44' },
    { value: '+61', label: '+61' },
    { value: '+64', label: '+64' },
    { value: '+971', label: '+971' },
    { value: '+49', label: '+49' },
    { value: '+353', label: '+353' },
  ],
  highestQual: [],
  course: [],
  country: [],
  intake: [],
  applyLevel: [],
  source: [],
  testName: [
    { value: 'IELTS', label: 'IELTS' },
    { value: 'TOEFL', label: 'TOEFL' },
    { value: 'PTE', label: 'PTE Academic' },
    { value: 'DUOLINGO', label: 'Duolingo English Test' },
    { value: 'GRE', label: 'GRE' },
    { value: 'GMAT', label: 'GMAT' },
    { value: 'SAT', label: 'SAT' },
  ],
};
