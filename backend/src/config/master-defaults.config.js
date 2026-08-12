import { ENQUIRY_TAG_SEED_LABELS } from './enquiry-tags.seed.config.js';

function buildIntakeLabels(monthsAhead = 24) {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const labels = [];
  const now = new Date();
  for (let i = 0; i < monthsAhead; i += 1) {
    const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
    labels.push(`${months[d.getMonth()]}-${d.getFullYear()}`);
  }
  return labels;
}

export const MASTER_DEFAULTS = {
  // ── Reception ────────────────────────────────────────────────────────────
  'visit-purpose': [
    'Study Abroad Enquiry',
    'Visa Consultation',
    'IELTS / Coaching Demo',
    'Documentation Support',
    'Follow-up Visit',
    'Fee / Payment Query',
    'Existing Student Support',
    'University Shortlisting',
    'SOP / LOR Guidance',
    'Other',
  ],
  'counsellor-skill': [
    'Canada Admissions',
    'UK Admissions',
    'Australia Admissions',
    'USA Admissions',
    'Germany Admissions',
    'Visa Filing',
    'IELTS Coaching',
    'Finance Counselling',
    'Student Care',
  ],

  // ── Organization (lookup lists) ──────────────────────────────────────────
  department: [
    'Counselling',
    'Admissions',
    'Visa',
    'Accounts',
    'Reception',
    'Marketing',
    'Operations',
    'Student Support',
  ],

  // ── Academic ─────────────────────────────────────────────────────────────
  country: [
    'Canada',
    'United Kingdom',
    'Australia',
    'United States',
    'Germany',
    'New Zealand',
    'Ireland',
    'France',
    'Dubai (UAE)',
    'Singapore',
  ],
  university: [
    'University of Toronto',
    'University of British Columbia',
    'McGill University',
    'University of Alberta',
    'York University',
    'University of Manchester',
    'University of Birmingham',
    'Coventry University',
    'University of Melbourne',
    'Monash University',
    'University of Sydney',
    'Harvard University',
    'Stanford University',
    'Technical University of Munich',
    'University College Dublin',
  ],
  course: [
    'MBA',
    'MBA Finance',
    'BBA',
    'MSc Computer Science',
    'MS Data Science',
    'Business Analytics',
    'Information Technology',
    'Mechanical Engineering',
    'Automobile Engineering',
    'Civil Engineering',
    'Hotel Management',
    'Nursing',
    'Public Health',
    'LLM',
    'Architecture',
    'Graphic Design',
    'Diploma in Business',
    'Foundation Program',
  ],
  intake: buildIntakeLabels(24),
  qualification: [
    '10th Standard',
    '12th Standard',
    'Diploma',
    "Bachelor's Degree",
    "Master's Degree",
    'PhD / Doctorate',
  ],
  // Form key aliases (enquiry forms)
  highestQual: [
    '10th',
    '12th',
    'Diploma',
    'Bachelors',
    'Masters',
    'PhD',
  ],
  applyLevel: [
    'Certificate',
    'Diploma',
    'Bachelors',
    'Masters',
    'PhD',
  ],

  // ── Visa ─────────────────────────────────────────────────────────────────
  'visa-type': [
    'Study Permit (Canada)',
    'Student Visa (UK)',
    'Student Visa (Australia)',
    'F-1 Student Visa (USA)',
    'National Visa D (Germany)',
    'Student Visa (New Zealand)',
    'Stamp 2 (Ireland)',
    'Dependent Visa',
    'Tourist Visa',
    'Work Permit',
  ],
  'document-checklist': [
    'Passport',
    'Academic Transcripts',
    'Degree Certificate',
    'IELTS / PTE Scorecard',
    'SOP (Statement of Purpose)',
    'LOR (Letter of Recommendation)',
    'CV / Resume',
    'Bank Statement',
    'Affidavit of Support',
    'Offer Letter',
    'CAS / I-20',
    'Medical Report',
    'Police Clearance',
    'Passport Photos',
  ],
  embassy: [
    'Canadian High Commission – New Delhi',
    'VFS Global – Mumbai (Canada)',
    'British High Commission – New Delhi',
    'VFS Global – Ahmedabad (UK)',
    'Australian High Commission – New Delhi',
    'US Consulate – Mumbai',
    'German Consulate – Mumbai',
    'New Zealand Consulate – Mumbai',
    'Irish Embassy – New Delhi',
  ],

  // ── Finance ──────────────────────────────────────────────────────────────
  'fee-type': [
    'Counselling Fee',
    'Application Fee',
    'Visa Filing Fee',
    'Documentation Fee',
    'IELTS Coaching Fee',
    'Service Charge',
    'University Deposit',
    'Tuition Fee Installment',
    'Late Fee',
    'Refund Adjustment',
  ],
  'payment-mode': [
    'Cash',
    'UPI',
    'NEFT / IMPS',
    'Cheque',
    'Credit Card',
    'Debit Card',
    'Bank Transfer',
    'Razorpay',
    'Paytm',
  ],
  currency: [
    'INR',
    'USD',
    'CAD',
    'GBP',
    'AUD',
    'EUR',
    'NZD',
    'AED',
  ],
  tax: [
    'GST 18%',
    'GST 12%',
    'GST 5%',
    'Exempt',
    'Zero Rated',
  ],

  // ── CRM ──────────────────────────────────────────────────────────────────
  'lead-source': [
    'Website',
    'Walk-in',
    'Referral',
    'Facebook Ads',
    'Google Ads',
    'Instagram',
    'Education Fair',
    'Partner / Agent',
    'WhatsApp',
    'Phone Call',
    'Justdial',
    'LinkedIn',
  ],
  source: [
    'Website',
    'Walk-in',
    'Referral',
    'Facebook Ads',
    'Google Ads',
    'Instagram',
    'Education Fair',
    'Partner',
    'WhatsApp',
    'Phone Call',
  ],
  'enquiry-status': [
    'NEW',
    'CONTACTED',
    'IN_PROGRESS',
    'QUALIFIED',
    'DEMO_SCHEDULED',
    'FOLLOW_UP',
    'CONVERTED',
    'DROPPED',
    'ON_HOLD',
  ],
  tags: ENQUIRY_TAG_SEED_LABELS,

  // ── Profile / form helpers ───────────────────────────────────────────────
  gender: [
    'Male',
    'Female',
    'Other',
    'Prefer not to say',
  ],
  nationality: [
    'India',
    'Nepal',
    'Bangladesh',
    'Sri Lanka',
    'UAE',
    'Other',
  ],
  maritalStatus: [
    'Single',
    'Married',
    'Divorced',
    'Widowed',
  ],
  countryCode: [
    '+91 India',
    '+1 USA / Canada',
    '+44 UK',
    '+61 Australia',
    '+64 New Zealand',
    '+971 UAE',
    '+49 Germany',
    '+353 Ireland',
  ],
  testName: [
    'IELTS',
    'TOEFL',
    'PTE Academic',
    'Duolingo English Test',
    'GRE',
    'GMAT',
    'SAT',
  ],

  // ── System templates ─────────────────────────────────────────────────────
  'communication-template': [
    'Welcome SMS',
    'Follow-up Reminder',
    'Demo Invitation',
    'Document Pending Alert',
    'Offer Received',
    'Visa Appointment Reminder',
    'Fee Due Reminder',
    'Thank You After Visit',
  ],
};

export const MASTER_CATEGORIES = Object.keys(MASTER_DEFAULTS);

export function isValidMasterCategory(category) {
  return MASTER_CATEGORIES.includes(category);
}
