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
    { value: '+91', label: '+91 India' },
    { value: '+1', label: '+1 USA / Canada' },
    { value: '+44', label: '+44 UK' },
    { value: '+61', label: '+61 Australia' },
    { value: '+64', label: '+64 New Zealand' },
    { value: '+971', label: '+971 UAE' },
    { value: '+49', label: '+49 Germany' },
    { value: '+353', label: '+353 Ireland' },
  ],
  highestQual: [
    { value: '10th', label: '10th Standard' },
    { value: '12th', label: '12th Standard' },
    { value: 'Diploma', label: 'Diploma' },
    { value: 'Bachelors', label: "Bachelor's Degree" },
    { value: 'Masters', label: "Master's Degree" },
    { value: 'PhD', label: 'PhD / Doctorate' },
  ],
  course: [
    { value: 'MBA', label: 'MBA' },
    { value: 'MSc Computer Science', label: 'MSc Computer Science' },
    { value: 'BBA', label: 'BBA' },
    { value: 'MS Data Science', label: 'MS Data Science' },
    { value: 'Mechanical Engineering', label: 'Mechanical Engineering' },
    { value: 'Hotel Management', label: 'Hotel Management' },
    { value: 'LLM', label: 'LLM' },
    { value: 'Nursing', label: 'Nursing' },
    { value: 'Business Analytics', label: 'Business Analytics' },
    { value: 'Graphic Design', label: 'Graphic Design' },
    { value: 'MBA Finance', label: 'MBA Finance' },
    { value: 'Architecture', label: 'Architecture' },
    { value: 'IT', label: 'Information Technology' },
    { value: 'Public Health', label: 'Public Health' },
    { value: 'Automobile Engineering', label: 'Automobile Engineering' },
  ],
  country: [
    { value: 'Canada', label: 'Canada' },
    { value: 'UK', label: 'United Kingdom' },
    { value: 'Australia', label: 'Australia' },
    { value: 'USA', label: 'United States' },
    { value: 'Germany', label: 'Germany' },
    { value: 'New Zealand', label: 'New Zealand' },
    { value: 'Ireland', label: 'Ireland' },
  ],
  intake: buildIntakeOptions(),
  applyLevel: [
    { value: 'Certificate', label: 'Certificate' },
    { value: 'Diploma', label: 'Diploma' },
    { value: 'Bachelors', label: 'Bachelors' },
    { value: 'Masters', label: 'Masters' },
    { value: 'PhD', label: 'PhD' },
  ],
  source: [
    { value: 'Website', label: 'Website' },
    { value: 'Walk-in', label: 'Walk-in' },
    { value: 'Referral', label: 'Referral' },
    { value: 'Facebook Ads', label: 'Facebook Ads' },
    { value: 'Google Ads', label: 'Google Ads' },
    { value: 'Instagram', label: 'Instagram' },
    { value: 'Education Fair', label: 'Education Fair' },
    { value: 'Partner', label: 'Partner / Agent' },
    { value: 'WhatsApp', label: 'WhatsApp' },
    { value: 'Phone Call', label: 'Phone Call' },
  ],
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
