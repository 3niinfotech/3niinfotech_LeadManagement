/**
 * Idempotent relational master seed foundation (W0).
 * Stable codes — resolve parents by code, never by hardcoded UUIDs.
 */

export const RELATIONAL_COUNTRIES = [
  { code: 'IN', name: 'India', isoCode: 'IN', phoneCode: '+91', currencyCode: 'INR', nationality: 'Indian' },
  { code: 'GB', name: 'United Kingdom', isoCode: 'GB', phoneCode: '+44', currencyCode: 'GBP', nationality: 'British' },
  { code: 'US', name: 'United States', isoCode: 'US', phoneCode: '+1', currencyCode: 'USD', nationality: 'American' },
  { code: 'CA', name: 'Canada', isoCode: 'CA', phoneCode: '+1', currencyCode: 'CAD', nationality: 'Canadian' },
  { code: 'AU', name: 'Australia', isoCode: 'AU', phoneCode: '+61', currencyCode: 'AUD', nationality: 'Australian' },
  { code: 'NZ', name: 'New Zealand', isoCode: 'NZ', phoneCode: '+64', currencyCode: 'NZD', nationality: 'New Zealander' },
  { code: 'IE', name: 'Ireland', isoCode: 'IE', phoneCode: '+353', currencyCode: 'EUR', nationality: 'Irish' },
  { code: 'DE', name: 'Germany', isoCode: 'DE', phoneCode: '+49', currencyCode: 'EUR', nationality: 'German' },
  { code: 'FR', name: 'France', isoCode: 'FR', phoneCode: '+33', currencyCode: 'EUR', nationality: 'French' },
  { code: 'IT', name: 'Italy', isoCode: 'IT', phoneCode: '+39', currencyCode: 'EUR', nationality: 'Italian' },
  { code: 'ES', name: 'Spain', isoCode: 'ES', phoneCode: '+34', currencyCode: 'EUR', nationality: 'Spanish' },
  { code: 'NL', name: 'Netherlands', isoCode: 'NL', phoneCode: '+31', currencyCode: 'EUR', nationality: 'Dutch' },
  { code: 'SE', name: 'Sweden', isoCode: 'SE', phoneCode: '+46', currencyCode: 'SEK', nationality: 'Swedish' },
  { code: 'FI', name: 'Finland', isoCode: 'FI', phoneCode: '+358', currencyCode: 'EUR', nationality: 'Finnish' },
  { code: 'DK', name: 'Denmark', isoCode: 'DK', phoneCode: '+45', currencyCode: 'DKK', nationality: 'Danish' },
  { code: 'NO', name: 'Norway', isoCode: 'NO', phoneCode: '+47', currencyCode: 'NOK', nationality: 'Norwegian' },
  { code: 'CH', name: 'Switzerland', isoCode: 'CH', phoneCode: '+41', currencyCode: 'CHF', nationality: 'Swiss' },
  { code: 'AT', name: 'Austria', isoCode: 'AT', phoneCode: '+43', currencyCode: 'EUR', nationality: 'Austrian' },
  { code: 'BE', name: 'Belgium', isoCode: 'BE', phoneCode: '+32', currencyCode: 'EUR', nationality: 'Belgian' },
  { code: 'AE', name: 'UAE', isoCode: 'AE', phoneCode: '+971', currencyCode: 'AED', nationality: 'Emirati' },
  { code: 'SG', name: 'Singapore', isoCode: 'SG', phoneCode: '+65', currencyCode: 'SGD', nationality: 'Singaporean' },
  { code: 'MY', name: 'Malaysia', isoCode: 'MY', phoneCode: '+60', currencyCode: 'MYR', nationality: 'Malaysian' },
];

export const RELATIONAL_DEPARTMENTS = [
  { code: 'COUNSELLING', name: 'Counselling' },
  { code: 'ADMISSIONS', name: 'Admissions' },
  { code: 'VISA', name: 'Visa' },
  { code: 'ACCOUNTS', name: 'Accounts' },
  { code: 'RECEPTION', name: 'Reception' },
  { code: 'MARKETING', name: 'Marketing' },
  { code: 'OPERATIONS', name: 'Operations' },
  { code: 'STUDENT_SUPPORT', name: 'Student Support' },
];

export const RELATIONAL_QUALIFICATIONS = [
  { code: '10TH', name: '10th Standard', level: 'Secondary' },
  { code: '12TH', name: '12th Standard', level: 'Higher Secondary' },
  { code: 'DIPLOMA', name: 'Diploma', level: 'Diploma' },
  { code: 'BACHELOR', name: "Bachelor's Degree", level: 'Undergraduate' },
  { code: 'MASTER', name: "Master's Degree", level: 'Postgraduate' },
  { code: 'PHD', name: 'PhD / Doctorate', level: 'Doctoral' },
  { code: 'OTHER', name: 'Other', level: 'Other' },
];

export const RELATIONAL_INTAKES = [
  { code: 'JAN', name: 'January' },
  { code: 'FEB', name: 'February' },
  { code: 'MAR', name: 'March' },
  { code: 'APR', name: 'April' },
  { code: 'MAY', name: 'May' },
  { code: 'JUN', name: 'June' },
  { code: 'JUL', name: 'July' },
  { code: 'AUG', name: 'August' },
  { code: 'SEP', name: 'September' },
  { code: 'OCT', name: 'October' },
  { code: 'NOV', name: 'November' },
  { code: 'DEC', name: 'December' },
];

export const RELATIONAL_CURRENCIES = [
  { code: 'INR', name: 'Indian Rupee', symbol: '₹' },
  { code: 'USD', name: 'US Dollar', symbol: '$' },
  { code: 'GBP', name: 'British Pound', symbol: '£' },
  { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$' },
  { code: 'AUD', name: 'Australian Dollar', symbol: 'A$' },
  { code: 'NZD', name: 'New Zealand Dollar', symbol: 'NZ$' },
  { code: 'EUR', name: 'Euro', symbol: '€' },
  { code: 'AED', name: 'UAE Dirham', symbol: 'د.إ' },
  { code: 'SGD', name: 'Singapore Dollar', symbol: 'S$' },
];

export const RELATIONAL_PAYMENT_MODES = [
  { code: 'CASH', name: 'Cash' },
  { code: 'BANK_TRANSFER', name: 'Bank Transfer' },
  { code: 'UPI', name: 'UPI' },
  { code: 'CREDIT_CARD', name: 'Credit Card' },
  { code: 'DEBIT_CARD', name: 'Debit Card' },
  { code: 'CHEQUE', name: 'Cheque' },
  { code: 'ONLINE', name: 'Online' },
  { code: 'OTHER', name: 'Other' },
];

/** Configurable tax labels already used in MasterItem — not legal tax advice. */
export const RELATIONAL_TAXES = [
  { code: 'GST_18', name: 'GST 18%', taxPercentage: 18 },
  { code: 'GST_12', name: 'GST 12%', taxPercentage: 12 },
  { code: 'GST_5', name: 'GST 5%', taxPercentage: 5 },
  { code: 'EXEMPT', name: 'Exempt', taxPercentage: 0 },
  { code: 'ZERO_RATED', name: 'Zero Rated', taxPercentage: 0 },
];

export const RELATIONAL_VISIT_PURPOSES = [
  { code: 'ENQUIRY', name: 'Enquiry' },
  { code: 'COUNSELLING', name: 'Counselling' },
  { code: 'ADMISSION', name: 'Admission' },
  { code: 'DOCUMENT_SUBMISSION', name: 'Document Submission' },
  { code: 'VISA_CONSULTATION', name: 'Visa Consultation' },
  { code: 'PAYMENT', name: 'Payment' },
  { code: 'FOLLOW_UP', name: 'Follow-up' },
  { code: 'GENERAL', name: 'General' },
];

export const RELATIONAL_COUNSELLOR_SKILLS = [
  { code: 'STUDENT_COUNSELLING', name: 'Student Counselling' },
  { code: 'UNIVERSITY_COUNSELLING', name: 'University Counselling' },
  { code: 'VISA_COUNSELLING', name: 'Visa Counselling' },
  { code: 'APPLICATION_PROCESSING', name: 'Application Processing' },
  { code: 'DOCUMENTATION', name: 'Documentation' },
  { code: 'INTERVIEW_PREPARATION', name: 'Interview Preparation' },
  { code: 'IELTS_GUIDANCE', name: 'IELTS Guidance' },
  { code: 'CAREER_GUIDANCE', name: 'Career Guidance' },
  { code: 'FOLLOW_UP', name: 'Follow-up' },
];

export const RELATIONAL_FACULTY = [
  { code: 'IELTS', name: 'IELTS Faculty', description: 'IELTS coaching demos' },
  { code: 'PTE', name: 'PTE Faculty', description: 'PTE coaching demos' },
  { code: 'SPOKEN_ENGLISH', name: 'Spoken English Faculty', description: 'Spoken English demos' },
  { code: 'GRE', name: 'GRE Faculty', description: 'GRE prep demos' },
  { code: 'SAT', name: 'SAT Faculty', description: 'SAT prep demos' },
];

export const RELATIONAL_LEAD_SOURCES = [
  { code: 'WEBSITE', name: 'Website' },
  { code: 'WALK_IN', name: 'Walk-in' },
  { code: 'REFERRAL', name: 'Referral' },
  { code: 'GOOGLE', name: 'Google' },
  { code: 'FACEBOOK', name: 'Facebook' },
  { code: 'INSTAGRAM', name: 'Instagram' },
  { code: 'WHATSAPP', name: 'WhatsApp' },
  { code: 'ADVERTISEMENT', name: 'Advertisement' },
  { code: 'PARTNER', name: 'Partner' },
  { code: 'AGENT', name: 'Agent' },
  { code: 'EXISTING_STUDENT', name: 'Existing Student' },
  { code: 'OTHER', name: 'Other' },
];

export const RELATIONAL_LEAD_STATUSES = [
  { code: 'NEW', name: 'New', defaultStatus: true },
  { code: 'CONTACTED', name: 'Contacted' },
  { code: 'INTERESTED', name: 'Interested' },
  { code: 'HIGHLY_INTERESTED', name: 'Highly Interested' },
  { code: 'FOLLOW_UP', name: 'Follow-up' },
  { code: 'APPOINTMENT', name: 'Appointment' },
  { code: 'DEMO_SCHEDULED', name: 'Demo Scheduled' },
  { code: 'DEMO_ATTENDED', name: 'Demo Attended' },
  { code: 'COUNSELLING', name: 'Counselling' },
  { code: 'DOCUMENTS_PENDING', name: 'Documents Pending' },
  { code: 'APPLICATION_STARTED', name: 'Application Started' },
  { code: 'CONVERTED', name: 'Converted' },
  { code: 'HOLD', name: 'On Hold' },
  { code: 'LOST', name: 'Lost' },
  { code: 'NOT_INTERESTED', name: 'Not Interested' },
];

export const RELATIONAL_LOST_REASONS = [
  { code: 'BUDGET', name: 'Budget' },
  { code: 'NOT_INTERESTED', name: 'Not Interested' },
  { code: 'CHANGED_COUNTRY', name: 'Changed Country' },
  { code: 'LOW_QUALIFICATION', name: 'Low Qualification' },
  { code: 'DOCUMENTATION', name: 'Documentation' },
  { code: 'VISA_REFUSED', name: 'Visa Refused' },
  { code: 'NO_RESPONSE', name: 'No Response' },
  { code: 'COMPETITOR', name: 'Competitor' },
  { code: 'OTHER', name: 'Other' },
];

export const RELATIONAL_FOLLOWUP_TYPES = [
  { code: 'CALL', name: 'Call' },
  { code: 'WHATSAPP', name: 'WhatsApp' },
  { code: 'EMAIL', name: 'Email' },
  { code: 'MEETING', name: 'Meeting' },
  { code: 'COUNSELLING', name: 'Counselling' },
  { code: 'DOCUMENT_FOLLOW_UP', name: 'Document Follow-up' },
  { code: 'PAYMENT_FOLLOW_UP', name: 'Payment Follow-up' },
  { code: 'OTHER', name: 'Other' },
];

export const RELATIONAL_DOCUMENT_TYPES = [
  { code: 'PASSPORT', name: 'Passport', category: 'Identity' },
  { code: 'PASSPORT_PHOTO', name: 'Passport Photograph', category: 'Identity' },
  { code: 'MARKSHEET_10', name: '10th Marksheet', category: 'Academic' },
  { code: 'MARKSHEET_12', name: '12th Marksheet', category: 'Academic' },
  { code: 'BACHELOR_DEGREE', name: 'Bachelor Degree', category: 'Academic' },
  { code: 'MASTER_DEGREE', name: 'Master Degree', category: 'Academic' },
  { code: 'TRANSCRIPT', name: 'Transcript', category: 'Academic' },
  { code: 'IELTS', name: 'IELTS', category: 'Language' },
  { code: 'PTE', name: 'PTE', category: 'Language' },
  { code: 'SOP', name: 'SOP', category: 'Application' },
  { code: 'LOR', name: 'LOR', category: 'Application' },
  { code: 'CV', name: 'CV / Resume', category: 'Application' },
  { code: 'BANK_STATEMENT', name: 'Bank Statement', category: 'Finance' },
  { code: 'BANK_CERTIFICATE', name: 'Bank Certificate', category: 'Finance' },
  { code: 'OFFER_LETTER', name: 'Offer Letter', category: 'Admission' },
  { code: 'CAS_I20', name: 'CAS / I-20', category: 'Admission' },
  { code: 'MEDICAL', name: 'Medical Certificate', category: 'Visa' },
  { code: 'PCC', name: 'PCC', category: 'Visa' },
  { code: 'AFFIDAVIT', name: 'Affidavit of Support', category: 'Finance' },
];

/** countryCode resolves Country.code; optional visaTypeCode resolves VisaType.code */
export const RELATIONAL_UNIVERSITIES = [
  { code: 'UNIV_TORONTO', name: 'University of Toronto', countryCode: 'CA', city: 'Toronto' },
  { code: 'UNIV_UBC', name: 'University of British Columbia', countryCode: 'CA', city: 'Vancouver' },
  { code: 'UNIV_MCGILL', name: 'McGill University', countryCode: 'CA', city: 'Montreal' },
  { code: 'UNIV_ALBERTA', name: 'University of Alberta', countryCode: 'CA', city: 'Edmonton' },
  { code: 'UNIV_YORK', name: 'York University', countryCode: 'CA', city: 'Toronto' },
  { code: 'UNIV_CONCORDIA', name: 'Concordia University', countryCode: 'CA', city: 'Montreal' },
  { code: 'UNIV_MANCHESTER', name: 'University of Manchester', countryCode: 'GB', city: 'Manchester' },
  { code: 'UNIV_BIRMINGHAM', name: 'University of Birmingham', countryCode: 'GB', city: 'Birmingham' },
  { code: 'UNIV_COVENTRY', name: 'Coventry University', countryCode: 'GB', city: 'Coventry' },
  { code: 'UNIV_LEEDS', name: 'University of Leeds', countryCode: 'GB', city: 'Leeds' },
  { code: 'UNIV_MELBOURNE', name: 'University of Melbourne', countryCode: 'AU', city: 'Melbourne' },
  { code: 'UNIV_MONASH', name: 'Monash University', countryCode: 'AU', city: 'Melbourne' },
  { code: 'UNIV_SYDNEY', name: 'University of Sydney', countryCode: 'AU', city: 'Sydney' },
  { code: 'UNIV_UNSW', name: 'UNSW Sydney', countryCode: 'AU', city: 'Sydney' },
  { code: 'UNIV_HARVARD', name: 'Harvard University', countryCode: 'US', city: 'Cambridge' },
  { code: 'UNIV_STANFORD', name: 'Stanford University', countryCode: 'US', city: 'Stanford' },
  { code: 'UNIV_NYU', name: 'New York University', countryCode: 'US', city: 'New York' },
  { code: 'UNIV_TUM', name: 'Technical University of Munich', countryCode: 'DE', city: 'Munich' },
  { code: 'UNIV_HEIDELBERG', name: 'Heidelberg University', countryCode: 'DE', city: 'Heidelberg' },
  { code: 'UNIV_UCD', name: 'University College Dublin', countryCode: 'IE', city: 'Dublin' },
  { code: 'UNIV_AUCKLAND', name: 'University of Auckland', countryCode: 'NZ', city: 'Auckland' },
  { code: 'UNIV_NUS', name: 'National University of Singapore', countryCode: 'SG', city: 'Singapore' },
  { code: 'UNIV_SORBONNE', name: 'Sorbonne University', countryCode: 'FR', city: 'Paris' },
  { code: 'UNIV_AMSTERDAM', name: 'University of Amsterdam', countryCode: 'NL', city: 'Amsterdam' },
  { code: 'UNIV_MALAYA', name: 'University of Malaya', countryCode: 'MY', city: 'Kuala Lumpur' },
];

export const RELATIONAL_COURSES = [
  { code: 'COURSE_MBA_TORONTO', name: 'MBA', universityCode: 'UNIV_TORONTO', level: 'Masters', discipline: 'Business' },
  { code: 'COURSE_MSC_CS_TORONTO', name: 'MSc Computer Science', universityCode: 'UNIV_TORONTO', level: 'Masters', discipline: 'Computer Science' },
  { code: 'COURSE_BSC_CS_CONCORDIA', name: 'BSc Computer Science', universityCode: 'UNIV_CONCORDIA', level: 'Bachelors', discipline: 'Computer Science' },
  { code: 'COURSE_MBA_CONCORDIA', name: 'MBA', universityCode: 'UNIV_CONCORDIA', level: 'Masters', discipline: 'Business' },
  { code: 'COURSE_MSC_DS_UBC', name: 'MS Data Science', universityCode: 'UNIV_UBC', level: 'Masters', discipline: 'Data Science' },
  { code: 'COURSE_BBA_YORK', name: 'BBA', universityCode: 'UNIV_YORK', level: 'Bachelors', discipline: 'Business' },
  { code: 'COURSE_ENG_ALBERTA', name: 'Mechanical Engineering', universityCode: 'UNIV_ALBERTA', level: 'Bachelors', discipline: 'Engineering' },
  { code: 'COURSE_MBA_MCGILL', name: 'MBA', universityCode: 'UNIV_MCGILL', level: 'Masters', discipline: 'Business' },
  { code: 'COURSE_MSC_CS_MANCHESTER', name: 'MSc Computer Science', universityCode: 'UNIV_MANCHESTER', level: 'Masters', discipline: 'Computer Science' },
  { code: 'COURSE_MBA_MANCHESTER', name: 'MBA', universityCode: 'UNIV_MANCHESTER', level: 'Masters', discipline: 'Business' },
  { code: 'COURSE_BA_BIRMINGHAM', name: 'Business Analytics', universityCode: 'UNIV_BIRMINGHAM', level: 'Masters', discipline: 'Analytics' },
  { code: 'COURSE_IT_COVENTRY', name: 'Information Technology', universityCode: 'UNIV_COVENTRY', level: 'Masters', discipline: 'IT' },
  { code: 'COURSE_LLM_LEEDS', name: 'LLM', universityCode: 'UNIV_LEEDS', level: 'Masters', discipline: 'Law' },
  { code: 'COURSE_MBA_MELBOURNE', name: 'MBA', universityCode: 'UNIV_MELBOURNE', level: 'Masters', discipline: 'Business' },
  { code: 'COURSE_NURSING_MONASH', name: 'Nursing', universityCode: 'UNIV_MONASH', level: 'Bachelors', discipline: 'Health' },
  { code: 'COURSE_ARCH_SYDNEY', name: 'Architecture', universityCode: 'UNIV_SYDNEY', level: 'Masters', discipline: 'Architecture' },
  { code: 'COURSE_DS_UNSW', name: 'MS Data Science', universityCode: 'UNIV_UNSW', level: 'Masters', discipline: 'Data Science' },
  { code: 'COURSE_MBA_HARVARD', name: 'MBA', universityCode: 'UNIV_HARVARD', level: 'Masters', discipline: 'Business' },
  { code: 'COURSE_CS_STANFORD', name: 'MSc Computer Science', universityCode: 'UNIV_STANFORD', level: 'Masters', discipline: 'Computer Science' },
  { code: 'COURSE_PUBLIC_HEALTH_NYU', name: 'Public Health', universityCode: 'UNIV_NYU', level: 'Masters', discipline: 'Health' },
  { code: 'COURSE_MECH_TUM', name: 'Mechanical Engineering', universityCode: 'UNIV_TUM', level: 'Masters', discipline: 'Engineering' },
  { code: 'COURSE_CS_TUM', name: 'MSc Computer Science', universityCode: 'UNIV_TUM', level: 'Masters', discipline: 'Computer Science' },
  { code: 'COURSE_MED_HEIDELBERG', name: 'Medicine Foundation', universityCode: 'UNIV_HEIDELBERG', level: 'Foundation', discipline: 'Health' },
  { code: 'COURSE_MBA_UCD', name: 'MBA', universityCode: 'UNIV_UCD', level: 'Masters', discipline: 'Business' },
  { code: 'COURSE_CS_UCD', name: 'MSc Computer Science', universityCode: 'UNIV_UCD', level: 'Masters', discipline: 'Computer Science' },
  { code: 'COURSE_MBA_AUCKLAND', name: 'MBA', universityCode: 'UNIV_AUCKLAND', level: 'Masters', discipline: 'Business' },
  { code: 'COURSE_IT_NUS', name: 'Information Technology', universityCode: 'UNIV_NUS', level: 'Masters', discipline: 'IT' },
  { code: 'COURSE_BA_NUS', name: 'Business Analytics', universityCode: 'UNIV_NUS', level: 'Masters', discipline: 'Analytics' },
  { code: 'COURSE_DIP_BUS_COVENTRY', name: 'Diploma in Business', universityCode: 'UNIV_COVENTRY', level: 'Diploma', discipline: 'Business' },
  { code: 'COURSE_FOUNDATION_COVENTRY', name: 'Foundation Program', universityCode: 'UNIV_COVENTRY', level: 'Foundation', discipline: 'General' },
  { code: 'COURSE_HOTEL_SYDNEY', name: 'Hotel Management', universityCode: 'UNIV_SYDNEY', level: 'Bachelors', discipline: 'Hospitality' },
  { code: 'COURSE_DESIGN_AMSTERDAM', name: 'Graphic Design', universityCode: 'UNIV_AMSTERDAM', level: 'Bachelors', discipline: 'Design' },
  { code: 'COURSE_CIVIL_MALAYA', name: 'Civil Engineering', universityCode: 'UNIV_MALAYA', level: 'Bachelors', discipline: 'Engineering' },
  { code: 'COURSE_MBA_SORBONNE', name: 'MBA', universityCode: 'UNIV_SORBONNE', level: 'Masters', discipline: 'Business' },
  { code: 'COURSE_AUTO_TUM', name: 'Automobile Engineering', universityCode: 'UNIV_TUM', level: 'Masters', discipline: 'Engineering' },
];

export const RELATIONAL_VISA_TYPES = [
  { code: 'STUDY_PERMIT_CA', name: 'Study Permit (Canada)', countryCode: 'CA', category: 'Student' },
  { code: 'STUDENT_VISA_UK', name: 'Student Visa (UK)', countryCode: 'GB', category: 'Student' },
  { code: 'STUDENT_VISA_AU', name: 'Student Visa (Australia)', countryCode: 'AU', category: 'Student' },
  { code: 'F1_US', name: 'F-1 Student Visa (USA)', countryCode: 'US', category: 'Student' },
  { code: 'NATIONAL_D_DE', name: 'National Visa D (Germany)', countryCode: 'DE', category: 'Student' },
  { code: 'STUDENT_VISA_NZ', name: 'Student Visa (New Zealand)', countryCode: 'NZ', category: 'Student' },
  { code: 'STAMP2_IE', name: 'Stamp 2 (Ireland)', countryCode: 'IE', category: 'Student' },
  { code: 'STUDENT_VISA_FR', name: 'Student Visa (France)', countryCode: 'FR', category: 'Student' },
  { code: 'STUDENT_VISA_NL', name: 'Student Visa (Netherlands)', countryCode: 'NL', category: 'Student' },
  { code: 'STUDENT_PASS_SG', name: 'Student Pass (Singapore)', countryCode: 'SG', category: 'Student' },
  { code: 'DEPENDENT', name: 'Dependent Visa', countryCode: null, category: 'Dependent' },
  { code: 'TOURIST', name: 'Tourist Visa', countryCode: null, category: 'Visit' },
  { code: 'WORK_PERMIT', name: 'Work Permit', countryCode: null, category: 'Work' },
];

/** Minimal embassy rows — no invented contact details */
export const RELATIONAL_EMBASSIES = [
  { code: 'EMB_CA_DELHI', name: 'Canadian High Commission – New Delhi', countryCode: 'CA', city: 'New Delhi' },
  { code: 'EMB_GB_DELHI', name: 'British High Commission – New Delhi', countryCode: 'GB', city: 'New Delhi' },
  { code: 'EMB_AU_DELHI', name: 'Australian High Commission – New Delhi', countryCode: 'AU', city: 'New Delhi' },
  { code: 'EMB_US_MUMBAI', name: 'US Consulate – Mumbai', countryCode: 'US', city: 'Mumbai' },
  { code: 'EMB_DE_MUMBAI', name: 'German Consulate – Mumbai', countryCode: 'DE', city: 'Mumbai' },
  { code: 'EMB_NZ_MUMBAI', name: 'New Zealand Consulate – Mumbai', countryCode: 'NZ', city: 'Mumbai' },
  { code: 'EMB_IE_DELHI', name: 'Irish Embassy – New Delhi', countryCode: 'IE', city: 'New Delhi' },
  { code: 'EMB_FR_DELHI', name: 'French Embassy – New Delhi', countryCode: 'FR', city: 'New Delhi' },
  { code: 'EMB_SG_DELHI', name: 'Singapore High Commission – New Delhi', countryCode: 'SG', city: 'New Delhi' },
];

/**
 * Sample requirements linking DocumentType ↔ Country / VisaType.
 * code is unique per company.
 */
export const RELATIONAL_DOCUMENT_REQUIREMENTS = [
  {
    code: 'REQ_PASSPORT_CA_STUDY',
    name: 'Passport for Canada Study Permit',
    documentTypeCode: 'PASSPORT',
    countryCode: 'CA',
    visaTypeCode: 'STUDY_PERMIT_CA',
    applicableFor: 'STUDENT',
    isMandatory: true,
  },
  {
    code: 'REQ_IELTS_CA_STUDY',
    name: 'IELTS for Canada Study Permit',
    documentTypeCode: 'IELTS',
    countryCode: 'CA',
    visaTypeCode: 'STUDY_PERMIT_CA',
    applicableFor: 'STUDENT',
    isMandatory: true,
  },
  {
    code: 'REQ_BANK_CA_STUDY',
    name: 'Bank Statement for Canada Study Permit',
    documentTypeCode: 'BANK_STATEMENT',
    countryCode: 'CA',
    visaTypeCode: 'STUDY_PERMIT_CA',
    applicableFor: 'STUDENT',
    isMandatory: true,
  },
  {
    code: 'REQ_PASSPORT_UK_STUDENT',
    name: 'Passport for UK Student Visa',
    documentTypeCode: 'PASSPORT',
    countryCode: 'GB',
    visaTypeCode: 'STUDENT_VISA_UK',
    applicableFor: 'STUDENT',
    isMandatory: true,
  },
  {
    code: 'REQ_CAS_UK_STUDENT',
    name: 'CAS for UK Student Visa',
    documentTypeCode: 'CAS_I20',
    countryCode: 'GB',
    visaTypeCode: 'STUDENT_VISA_UK',
    applicableFor: 'STUDENT',
    isMandatory: true,
  },
  {
    code: 'REQ_PASSPORT_US_F1',
    name: 'Passport for F-1 Visa',
    documentTypeCode: 'PASSPORT',
    countryCode: 'US',
    visaTypeCode: 'F1_US',
    applicableFor: 'STUDENT',
    isMandatory: true,
  },
  {
    code: 'REQ_I20_US_F1',
    name: 'I-20 for F-1 Visa',
    documentTypeCode: 'CAS_I20',
    countryCode: 'US',
    visaTypeCode: 'F1_US',
    applicableFor: 'STUDENT',
    isMandatory: true,
  },
  {
    code: 'REQ_SOP_GENERAL',
    name: 'SOP (general application)',
    documentTypeCode: 'SOP',
    countryCode: null,
    visaTypeCode: null,
    applicableFor: 'APPLICATION',
    isMandatory: true,
  },
  {
    code: 'REQ_LOR_GENERAL',
    name: 'LOR (general application)',
    documentTypeCode: 'LOR',
    countryCode: null,
    visaTypeCode: null,
    applicableFor: 'APPLICATION',
    isMandatory: false,
  },
  {
    code: 'REQ_PCC_AU',
    name: 'PCC for Australia Student Visa',
    documentTypeCode: 'PCC',
    countryCode: 'AU',
    visaTypeCode: 'STUDENT_VISA_AU',
    applicableFor: 'STUDENT',
    isMandatory: true,
  },
];

export const RELATIONAL_COMMUNICATION_TEMPLATES = [
  {
    code: 'TPL_WELCOME_SMS',
    name: 'Welcome SMS',
    channel: 'SMS',
    subject: null,
    body: 'Welcome {{firstName}}! Thank you for contacting us. Your counsellor will reach out shortly.',
    eventType: 'ENQUIRY_CREATED',
    variables: ['firstName'],
  },
  {
    code: 'TPL_FOLLOWUP_REMINDER',
    name: 'Follow-up Reminder',
    channel: 'EMAIL',
    subject: 'Follow-up reminder — {{enquiryCode}}',
    body: 'Hi {{firstName}}, this is a reminder about your scheduled follow-up on {{followUpDate}}.',
    eventType: 'FOLLOWUP_DUE',
    variables: ['firstName', 'enquiryCode', 'followUpDate'],
  },
  {
    code: 'TPL_DEMO_INVITE',
    name: 'Demo Invitation',
    channel: 'EMAIL',
    subject: 'Demo invitation',
    body: 'Hi {{firstName}}, you are invited to a demo session on {{demoDate}}.',
    eventType: 'DEMO_SCHEDULED',
    variables: ['firstName', 'demoDate'],
  },
  {
    code: 'TPL_DOC_PENDING',
    name: 'Document Pending Alert',
    channel: 'WHATSAPP',
    subject: null,
    body: 'Hi {{firstName}}, please submit pending documents: {{documentList}}.',
    eventType: 'DOCUMENT_PENDING',
    variables: ['firstName', 'documentList'],
  },
  {
    code: 'TPL_OFFER_RECEIVED',
    name: 'Offer Received',
    channel: 'EMAIL',
    subject: 'Offer received — {{universityName}}',
    body: 'Congratulations {{firstName}}! An offer has been received from {{universityName}}.',
    eventType: 'OFFER_RECEIVED',
    variables: ['firstName', 'universityName'],
  },
  {
    code: 'TPL_VISA_APPOINTMENT',
    name: 'Visa Appointment Reminder',
    channel: 'SMS',
    subject: null,
    body: 'Reminder: visa appointment on {{appointmentDate}} at {{location}}.',
    eventType: 'VISA_APPOINTMENT',
    variables: ['appointmentDate', 'location'],
  },
  {
    code: 'TPL_FEE_DUE',
    name: 'Fee Due Reminder',
    channel: 'EMAIL',
    subject: 'Fee due reminder',
    body: 'Hi {{firstName}}, a fee of {{amount}} is due on {{dueDate}}.',
    eventType: 'FEE_DUE',
    variables: ['firstName', 'amount', 'dueDate'],
  },
  {
    code: 'TPL_THANK_YOU_VISIT',
    name: 'Thank You After Visit',
    channel: 'WHATSAPP',
    subject: null,
    body: 'Thank you for visiting us, {{firstName}}. We look forward to supporting your journey.',
    eventType: 'VISIT_COMPLETED',
    variables: ['firstName'],
  },
];

export const RELATIONAL_APPLICATION_CHECKLISTS = [
  { name: '10th Mark Sheet', documentType: 'Academic', isMandatory: true, enquiryForm: false, sortOrder: 1 },
  { name: '12th Mark Sheet', documentType: 'Academic', isMandatory: true, enquiryForm: false, sortOrder: 2 },
  { name: 'Academic Transcripts', documentType: 'Academic', isMandatory: true, enquiryForm: false, sortOrder: 3 },
  { name: "Bachelor's Degree Certificate", documentType: 'Academic', isMandatory: false, enquiryForm: false, sortOrder: 4 },
  { name: 'Passport', documentType: 'Identity', isMandatory: true, enquiryForm: true, sortOrder: 5 },
  { name: 'Bank Statement', documentType: 'Financial', isMandatory: true, enquiryForm: false, sortOrder: 6 },
  { name: 'Curriculum Vitae (CV)', documentType: 'Professional', isMandatory: false, enquiryForm: false, sortOrder: 7 },
  { name: 'Recommendation Letter', documentType: 'Professional', isMandatory: false, enquiryForm: false, sortOrder: 8 },
  { name: 'Language Proficiency Certificate', documentType: 'Academic', isMandatory: false, enquiryForm: false, sortOrder: 9 },
  { name: 'Photograph', documentType: 'Identity', isMandatory: true, enquiryForm: true, sortOrder: 10 },
];

export const RELATIONAL_APPLICATION_STATUSES = [
  { name: 'Application Started', mailSend: false, defaultStatus: true, setOfferLetter: false, position: 1 },
  { name: 'Documents Pending', mailSend: true, defaultStatus: false, setOfferLetter: false, position: 2 },
  { name: 'Application Submitted', mailSend: true, defaultStatus: false, setOfferLetter: false, position: 3 },
  { name: 'Application Under Review', mailSend: false, defaultStatus: false, setOfferLetter: false, position: 4 },
  { name: 'Conditional Offer Received', mailSend: true, defaultStatus: false, setOfferLetter: true, position: 5 },
  { name: 'Unconditional Offer Received', mailSend: true, defaultStatus: false, setOfferLetter: true, position: 6 },
  { name: 'Fee Paid', mailSend: false, defaultStatus: false, setOfferLetter: false, position: 7 },
  { name: 'Visa Applied', mailSend: false, defaultStatus: false, setOfferLetter: false, position: 8 },
  { name: 'Approved', mailSend: true, defaultStatus: false, setOfferLetter: false, position: 9 },
  { name: 'Rejected', mailSend: true, defaultStatus: false, setOfferLetter: false, position: 10 },
];

export const RELATIONAL_VISA_CHECKLISTS = [
  { name: 'Passport', documentType: 'Identity', isMandatory: true, sortOrder: 1 },
  { name: 'Visa Application Form', documentType: 'Application', isMandatory: true, sortOrder: 2 },
  { name: 'COE / CAS Letter', documentType: 'Academic', isMandatory: true, sortOrder: 3 },
  { name: 'Financial Evidence', documentType: 'Financial', isMandatory: true, sortOrder: 4 },
  { name: 'Medical Certificate', documentType: 'Medical', isMandatory: false, sortOrder: 5 },
  { name: 'Police Clearance', documentType: 'Identity', isMandatory: false, sortOrder: 6 },
];

export const RELATIONAL_VISA_STATUSES = [
  { name: 'Not Started', visaApproved: false, visaWithdraw: false, visaRejected: false, mailSend: false, defaultStatus: true, position: 1 },
  { name: 'Documents Collected', visaApproved: false, visaWithdraw: false, visaRejected: false, mailSend: false, defaultStatus: false, position: 2 },
  { name: 'Application Submitted', visaApproved: false, visaWithdraw: false, visaRejected: false, mailSend: true, defaultStatus: false, position: 3 },
  { name: 'Biometrics Done', visaApproved: false, visaWithdraw: false, visaRejected: false, mailSend: false, defaultStatus: false, position: 4 },
  { name: 'Visa Approved', visaApproved: true, visaWithdraw: false, visaRejected: false, mailSend: true, defaultStatus: false, position: 5 },
  { name: 'Visa Rejected', visaApproved: false, visaWithdraw: false, visaRejected: true, mailSend: true, defaultStatus: false, position: 6 },
  { name: 'Visa Withdrawn', visaApproved: false, visaWithdraw: true, visaRejected: false, mailSend: false, defaultStatus: false, position: 7 },
];

export const RELATIONAL_STUDENT_STATUSES = [
  { code: 'ENQUIRY', name: 'Enquiry', defaultStatus: true, colorCode: 'info', sortOrder: 1 },
  { code: 'REGISTERED', name: 'Registered', defaultStatus: false, colorCode: 'primary', sortOrder: 2 },
  { code: 'DOCUMENT_PENDING', name: 'Document Pending', defaultStatus: false, colorCode: 'warning', sortOrder: 3 },
  { code: 'APPLICATION_SUBMITTED', name: 'Application Submitted', defaultStatus: false, colorCode: 'info', sortOrder: 4 },
  { code: 'OFFER_RECEIVED', name: 'Offer Received', defaultStatus: false, colorCode: 'success', sortOrder: 5 },
  { code: 'VISA_APPLIED', name: 'Visa Applied', defaultStatus: false, colorCode: 'warning', sortOrder: 6 },
  { code: 'VISA_GRANTED', name: 'Visa Granted', defaultStatus: false, colorCode: 'success', sortOrder: 7 },
  { code: 'ENROLLED', name: 'Enrolled', defaultStatus: false, colorCode: 'success', sortOrder: 8 },
  { code: 'DEFERRED', name: 'Deferred', defaultStatus: false, colorCode: 'secondary', sortOrder: 9 },
  { code: 'WITHDRAWN', name: 'Withdrawn', defaultStatus: false, colorCode: 'danger', sortOrder: 10 },
];
