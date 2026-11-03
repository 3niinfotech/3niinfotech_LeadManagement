/** Company.settings JSON shape — stored on existing Company row, not a new table. */

export const ENQUIRY_MANDATORY_FIELDS = [
  { key: 'firstName', label: 'First Name' },
  { key: 'lastName', label: 'Last Name' },
  { key: 'email', label: 'Email' },
  { key: 'mobile', label: 'Mobile' },
  { key: 'alternateNo', label: 'Alternate No' },
  { key: 'dateOfBirth', label: 'Date of Birth' },
  { key: 'gender', label: 'Gender' },
  { key: 'nationality', label: 'Nationality' },
  { key: 'address', label: 'Address' },
  { key: 'maritalStatus', label: 'Marital Status' },
  { key: 'highestQual', label: 'Highest Qual.' },
  { key: 'interestedCourse', label: 'Interested Course' },
  { key: 'testsGiven', label: 'Test Given' },
  { key: 'interestedCountry', label: 'Int. Country' },
  { key: 'intake', label: 'Intake' },
  { key: 'applyLevel', label: 'Apply Level' },
  { key: 'source', label: 'Source' },
  { key: 'status', label: 'Status' },
  { key: 'remark', label: 'Remark' },
  { key: 'passportNo', label: 'Passport No' },
  { key: 'dateOfIssue', label: 'Date of Issue' },
  { key: 'dateOfExpiry', label: 'Date of Expiry' },
];

export const DEFAULT_MANDATORY = {
  firstName: true,
  email: true,
  mobile: true,
};

export const DEFAULT_FOLLOWUP_SLOTS = ['09:00', '10:00', '11:00', '12:00', '14:00', '15:00', '16:00', '17:00'];

export const FOLLOWUP_DURATION_OPTIONS = [
  { value: '10', label: '10 Minutes' },
  { value: '15', label: '15 Minutes' },
  { value: '20', label: '20 Minutes' },
  { value: '30', label: '30 Minutes' },
  { value: '45', label: '45 Minutes' },
  { value: '60', label: '60 Minutes' },
];

export const NAVBAR_TYPE_OPTIONS = [
  { value: 'vertical', label: 'Vertical Navbar' },
  { value: 'compact', label: 'Compact Navbar' },
];

export const DATE_FORMAT_OPTIONS = [
  { value: 'DD/MM/YYYY', label: 'DD/MM/YYYY' },
  { value: 'MM/DD/YYYY', label: 'MM/DD/YYYY' },
  { value: 'YYYY-MM-DD', label: 'YYYY-MM-DD' },
];

export const TIMEZONE_OPTIONS = [
  { value: 'Asia/Kolkata', label: 'Asia/Kolkata (IST)' },
  { value: 'Asia/Dubai', label: 'Asia/Dubai (GST)' },
  { value: 'Europe/London', label: 'Europe/London' },
  { value: 'America/New_York', label: 'America/New York' },
  { value: 'Australia/Sydney', label: 'Australia/Sydney' },
];

export const SOCIAL_FIELDS = [
  { key: 'socialLinkedin', label: 'LinkedIn', placeholder: 'https://linkedin.com/company/…' },
  { key: 'socialInstagram', label: 'Instagram', placeholder: 'https://instagram.com/…' },
  { key: 'socialTwitter', label: 'Twitter / X', placeholder: 'https://x.com/…' },
  { key: 'socialYoutube', label: 'YouTube', placeholder: 'https://youtube.com/…' },
  { key: 'socialPinterest', label: 'Pinterest', placeholder: 'https://pinterest.com/…' },
  { key: 'socialFacebook', label: 'Facebook', placeholder: 'https://facebook.com/…' },
];

function normalizeNavbarType(value) {
  if (value === 'compact') return 'compact';
  return 'vertical';
}

function asStringList(value) {
  if (Array.isArray(value)) return value.map((item) => String(item).trim()).filter(Boolean);
  return String(value || '')
    .split(/[\n,]+/)
    .map((item) => item.trim())
    .filter(Boolean);
}

export function emptyCompanySettings() {
  return {
    invoiceTerms: '',
    defaultCurrencyCode: '',
    defaultMobileCode: '+91',
    defaultNationality: '',
    whatsapp: '',
    favicon: '',
    navbarType: 'vertical',
    followupPopup: false,
    followupSlots: DEFAULT_FOLLOWUP_SLOTS.join(','),
    followupSlotDuration: '10',
    autoLogoutMinutes: 0,
    loginStartTime: '',
    loginEndTime: '',
    allowedIps: [],
    timezone: 'Asia/Kolkata',
    dateFormat: 'DD/MM/YYYY',
    primaryColour: '',
    secondaryColour: '',
    headerColour: '',
    fontColour: '',
    portalTitle: '',
    portalSubtitle: '',
    scrollingText: '',
    socialLinkedin: '',
    socialInstagram: '',
    socialTwitter: '',
    socialYoutube: '',
    socialPinterest: '',
    socialFacebook: '',
    mandatoryFields: { ...DEFAULT_MANDATORY },
    attendance: {
      openMinutesBefore: 15,
      closeMinutesAfter: 30,
      lateThresholdMinutes: 15,
      lowAttendancePercent: 75,
      consecutiveAbsenceAlert: 3,
    },
  };
}

export function parseCompanySettings(raw) {
  const base = emptyCompanySettings();
  if (!raw || typeof raw !== 'object') return base;
  return {
    ...base,
    ...raw,
    navbarType: normalizeNavbarType(raw.navbarType),
    followupPopup: Boolean(raw.followupPopup),
    followupSlotDuration: String(raw.followupSlotDuration || base.followupSlotDuration),
    allowedIps: asStringList(raw.allowedIps),
    mandatoryFields: { ...DEFAULT_MANDATORY, ...(raw.mandatoryFields || {}) },
    attendance: {
      ...base.attendance,
      ...(raw.attendance && typeof raw.attendance === 'object' ? raw.attendance : {}),
    },
  };
}

export function followupSlotList(settings) {
  const raw = settings?.followupSlots || DEFAULT_FOLLOWUP_SLOTS.join(',');
  return asStringList(raw);
}

export function followupSlotOptions(settings) {
  return followupSlotList(settings).map((value) => ({ value, label: value }));
}

export function suggestedFollowupFromSettings(settings) {
  const minutes = Number(settings?.followupSlotDuration) || 10;
  const next = new Date(Date.now() + minutes * 60 * 1000);
  const pad = (n) => String(n).padStart(2, '0');
  return {
    followUpDate: `${next.getFullYear()}-${pad(next.getMonth() + 1)}-${pad(next.getDate())}`,
    followUpTime: `${pad(next.getHours())}:${pad(next.getMinutes())}`,
  };
}

import { getDocumentUrl } from '../features/enquiry/config/enquiryDocument.config';

export function resolvePublicAssetUrl(value) {
  if (!value) return '';
  if (/^https?:\/\//i.test(value) || value.startsWith('data:') || value.startsWith('blob:')) return value;
  const normalized = String(value).replace(/\\/g, '/');
  if (normalized.includes('uploads/') || normalized.startsWith('enquiries/') || normalized.startsWith('students/')) {
    const url = getDocumentUrl(normalized);
    if (url) return url;
  }
  const relative = normalized.startsWith('/') ? normalized : `/${normalized}`;
  const apiBase = import.meta.env.VITE_API_URL || '/api';
  const origin = apiBase.replace(/\/api\/?$/, '');
  if (!origin) return relative;
  return `${origin}${relative}`;
}

export function buildCompanySettingsPayload(form) {
  return {
    invoiceTerms: form.invoiceTerms || '',
    defaultCurrencyCode: form.defaultCurrencyCode || '',
    defaultMobileCode: form.defaultMobileCode || '+91',
    defaultNationality: form.defaultNationality || '',
    whatsapp: form.whatsapp || '',
    favicon: form.favicon || '',
    navbarType: normalizeNavbarType(form.navbarType),
    followupPopup: Boolean(form.followupPopup),
    followupSlots: Array.isArray(form.followupSlotList)
      ? form.followupSlotList.join(',')
      : (form.followupSlots || ''),
    followupSlotDuration: String(form.followupSlotDuration || '10'),
    autoLogoutMinutes: Number(form.autoLogoutMinutes) || 0,
    loginStartTime: form.loginStartTime || '',
    loginEndTime: form.loginEndTime || '',
    allowedIps: asStringList(form.allowedIps),
    timezone: form.timezone || 'Asia/Kolkata',
    dateFormat: form.dateFormat || 'DD/MM/YYYY',
    primaryColour: form.primaryColour || '',
    secondaryColour: form.secondaryColour || '',
    headerColour: form.headerColour || '',
    fontColour: form.fontColour || '',
    portalTitle: form.portalTitle || '',
    portalSubtitle: form.portalSubtitle || '',
    scrollingText: form.scrollingText || '',
    socialLinkedin: form.socialLinkedin || '',
    socialInstagram: form.socialInstagram || '',
    socialTwitter: form.socialTwitter || '',
    socialYoutube: form.socialYoutube || '',
    socialPinterest: form.socialPinterest || '',
    socialFacebook: form.socialFacebook || '',
    mandatoryFields: form.mandatoryFields || {},
    attendance: {
      openMinutesBefore: Number(form.attendance?.openMinutesBefore) || 15,
      closeMinutesAfter: Number(form.attendance?.closeMinutesAfter) || 30,
      lateThresholdMinutes: Number(form.attendance?.lateThresholdMinutes) || 15,
      lowAttendancePercent: Number(form.attendance?.lowAttendancePercent) || 75,
      consecutiveAbsenceAlert: Number(form.attendance?.consecutiveAbsenceAlert) || 3,
    },
  };
}
