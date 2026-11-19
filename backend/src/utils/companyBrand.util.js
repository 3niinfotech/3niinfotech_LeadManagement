import prisma from '../config/database.js';

let cachedBrand = null;
let lastFetchTime = 0;
const CACHE_TTL_MS = 60 * 1000; // 1 minute in-memory cache

export const DEFAULT_BRAND_INFO = {
  id: 'default',
  name: '3ni Infotech',
  legalName: '3ni Infotech Education & Visa Services Pvt. Ltd.',
  code: 'MAIN',
  divisionTag: 'Overseas Education Advisory & Visa Consultancy Division',
  email: 'info@3niinfotech.com',
  phone: '+91 79 1234 5678',
  website: 'https://www.3niinfotech.com',
  addressLine1: '101, Shivalik Plaza, SG Highway',
  addressLine2: 'Near Iscon Cross Road',
  city: 'Ahmedabad',
  state: 'Gujarat',
  postalCode: '380015',
  fullAddress: '101, Shivalik Plaza, SG Highway, Near Iscon Cross Road, Ahmedabad, Gujarat 380015',
  taxNumber: 'GSTIN24AABCU9603R1ZM',
  registrationNumber: 'U80900GJ2018PTC105432',
  stateCode: '24',
  logo: '/assets/images/brand/logo.jpg',
  favicon: '/favicon.ico',
  stampText: '[ 3NI E-VERIFIED ]',
  signatoryTitle: 'Authorized Signatory / Accounts Dept.',
  bankName: 'HDFC Bank Current A/C',
  bankBranch: 'Main Branch',
  bankAccountNo: '',
  bankIfsc: '',
  social: {
    linkedin: '',
    instagram: '',
    facebook: '',
    twitter: '',
    youtube: '',
  },
};

/**
 * Format raw Prisma company record into clean public/brand data
 */
export function formatCompanyBrand(company) {
  if (!company) return { ...DEFAULT_BRAND_INFO };

  const settings = company.settings && typeof company.settings === 'object' ? company.settings : {};
  const addressParts = [
    company.addressLine1,
    company.addressLine2,
    company.city,
    company.state,
    company.postalCode,
  ].filter(Boolean);

  const stateStr = company.state || '';
  const isGujarat = stateStr.toLowerCase().includes('gujarat');
  const stateCode = settings.stateCode || (isGujarat ? '24' : '');

  return {
    id: company.id,
    name: company.name || DEFAULT_BRAND_INFO.name,
    legalName: company.legalName || company.name || DEFAULT_BRAND_INFO.legalName,
    code: company.code || 'MAIN',
    divisionTag: settings.divisionTag || settings.portalSubtitle || DEFAULT_BRAND_INFO.divisionTag,
    email: company.email || DEFAULT_BRAND_INFO.email,
    phone: company.phone || DEFAULT_BRAND_INFO.phone,
    website: company.website || DEFAULT_BRAND_INFO.website,
    addressLine1: company.addressLine1 || '',
    addressLine2: company.addressLine2 || '',
    city: company.city || '',
    state: company.state || '',
    postalCode: company.postalCode || '',
    fullAddress: addressParts.join(', ') || DEFAULT_BRAND_INFO.fullAddress,
    taxNumber: company.taxNumber || DEFAULT_BRAND_INFO.taxNumber,
    registrationNumber: company.registrationNumber || DEFAULT_BRAND_INFO.registrationNumber,
    stateCode: stateCode || '24',
    logo: company.logo || DEFAULT_BRAND_INFO.logo,
    favicon: settings.favicon || DEFAULT_BRAND_INFO.favicon,
    stampText: settings.stampText || `[ ${(company.name || '3NI').toUpperCase()} E-VERIFIED ]`,
    signatoryTitle: settings.signatoryTitle || DEFAULT_BRAND_INFO.signatoryTitle,
    bankName: settings.bankName || DEFAULT_BRAND_INFO.bankName,
    bankBranch: settings.bankBranch || (company.city ? `${company.city} Branch` : DEFAULT_BRAND_INFO.bankBranch),
    bankAccountNo: settings.bankAccountNo || '',
    bankIfsc: settings.bankIfsc || '',
    invoiceTerms: settings.invoiceTerms || '',
    social: {
      linkedin: settings.socialLinkedin || '',
      instagram: settings.socialInstagram || '',
      facebook: settings.socialFacebook || '',
      twitter: settings.socialTwitter || '',
      youtube: settings.socialYoutube || '',
    },
    rawSettings: settings,
  };
}

/**
 * Fetch company brand from DB with caching
 */
export async function getCompanyBrandInfo(companyId = null) {
  const now = Date.now();
  if (cachedBrand && !companyId && now - lastFetchTime < CACHE_TTL_MS) {
    return cachedBrand;
  }

  try {
    let company = null;
    if (companyId) {
      company = await prisma.company.findFirst({
        where: { id: companyId, deletedAt: null },
      });
    }

    if (!company) {
      company = await prisma.company.findFirst({
        where: { deletedAt: null, isActive: true },
        orderBy: { createdAt: 'asc' },
      });
    }

    const brand = formatCompanyBrand(company);
    if (!companyId) {
      cachedBrand = brand;
      lastFetchTime = now;
    }
    return brand;
  } catch (err) {
    console.error('[companyBrand.util] failed to fetch brand:', err.message);
    return cachedBrand || { ...DEFAULT_BRAND_INFO };
  }
}

/**
 * Synchronous accessor for fast template rendering
 */
export function getCachedCompanyBrand() {
  return cachedBrand || { ...DEFAULT_BRAND_INFO };
}

/**
 * Invalidate cache on update
 */
export function invalidateCompanyBrandCache() {
  cachedBrand = null;
  lastFetchTime = 0;
}

// Pre-prime cache on process launch
getCompanyBrandInfo().catch(() => {});
