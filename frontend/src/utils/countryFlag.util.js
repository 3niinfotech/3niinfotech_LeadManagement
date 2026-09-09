/**
 * Resolve country display → ISO 3166-1 alpha-2 for flags.
 * Accepts: "India", "IN", "AU", "United Kingdom", { name, isoCode, code }, etc.
 */

const NAME_TO_ISO = {
  afghanistan: 'AF', albania: 'AL', algeria: 'DZ', andorra: 'AD', angola: 'AO',
  argentina: 'AR', armenia: 'AM', australia: 'AU', austria: 'AT', azerbaijan: 'AZ',
  bahamas: 'BS', bahrain: 'BH', bangladesh: 'BD', barbados: 'BB', belarus: 'BY',
  belgium: 'BE', belize: 'BZ', benin: 'BJ', bhutan: 'BT', bolivia: 'BO',
  'bosnia and herzegovina': 'BA', botswana: 'BW', brazil: 'BR', brunei: 'BN',
  bulgaria: 'BG', 'burkina faso': 'BF', burundi: 'BI', cambodia: 'KH',
  cameroon: 'CM', canada: 'CA', 'cape verde': 'CV', chile: 'CL', china: 'CN',
  colombia: 'CO', congo: 'CG', 'costa rica': 'CR', croatia: 'HR', cuba: 'CU',
  cyprus: 'CY', 'czech republic': 'CZ', czechia: 'CZ', denmark: 'DK',
  'dominican republic': 'DO', ecuador: 'EC', egypt: 'EG', 'el salvador': 'SV',
  estonia: 'EE', ethiopia: 'ET', fiji: 'FJ', finland: 'FI', france: 'FR',
  georgia: 'GE', germany: 'DE', ghana: 'GH', greece: 'GR', guatemala: 'GT',
  guyana: 'GY', haiti: 'HT', honduras: 'HN', 'hong kong': 'HK', hungary: 'HU',
  iceland: 'IS', india: 'IN', indonesia: 'ID', iran: 'IR', iraq: 'IQ',
  ireland: 'IE', israel: 'IL', italy: 'IT', jamaica: 'JM', japan: 'JP',
  jordan: 'JO', kazakhstan: 'KZ', kenya: 'KE', kuwait: 'KW', kyrgyzstan: 'KG',
  laos: 'LA', latvia: 'LV', lebanon: 'LB', libya: 'LY', lithuania: 'LT',
  luxembourg: 'LU', macau: 'MO', madagascar: 'MG', malawi: 'MW', malaysia: 'MY',
  maldives: 'MV', mali: 'ML', malta: 'MT', mauritius: 'MU', mexico: 'MX',
  moldova: 'MD', mongolia: 'MN', montenegro: 'ME', morocco: 'MA', mozambique: 'MZ',
  myanmar: 'MM', namibia: 'NA', nepal: 'NP', netherlands: 'NL', 'new zealand': 'NZ',
  nicaragua: 'NI', nigeria: 'NG', 'north korea': 'KP', 'north macedonia': 'MK',
  norway: 'NO', oman: 'OM', pakistan: 'PK', palestine: 'PS', panama: 'PA',
  'papua new guinea': 'PG', paraguay: 'PY', peru: 'PE', philippines: 'PH',
  poland: 'PL', portugal: 'PT', qatar: 'QA', romania: 'RO', russia: 'RU',
  rwanda: 'RW', 'saudi arabia': 'SA', senegal: 'SN', serbia: 'RS',
  singapore: 'SG', slovakia: 'SK', slovenia: 'SI', 'south africa': 'ZA',
  'south korea': 'KR', korea: 'KR', spain: 'ES', 'sri lanka': 'LK', sudan: 'SD',
  sweden: 'SE', switzerland: 'CH', syria: 'SY', taiwan: 'TW', tajikistan: 'TJ',
  tanzania: 'TZ', thailand: 'TH', 'timor-leste': 'TL', togo: 'TG', 'trinidad and tobago': 'TT',
  tunisia: 'TN', turkey: 'TR', turkmenistan: 'TM', uganda: 'UG', ukraine: 'UA',
  'united arab emirates': 'AE', uae: 'AE', 'united kingdom': 'GB', uk: 'GB',
  britain: 'GB', 'great britain': 'GB', england: 'GB', scotland: 'GB', wales: 'GB',
  'united states': 'US', 'united states of america': 'US', usa: 'US', us: 'US',
  america: 'US', uruguay: 'UY', uzbekistan: 'UZ', venezuela: 'VE', vietnam: 'VN',
  yemen: 'YE', zambia: 'ZM', zimbabwe: 'ZW',
  // short codes sometimes stored as names
  au: 'AU', ca: 'CA', de: 'DE', in: 'IN', nz: 'NZ', gb: 'GB',
};

const ALIAS_ISO = {
  UK: 'GB',
  EN: 'GB',
  USA: 'US',
  UAE: 'AE',
};

/** Preferred full display name per ISO — used when DB/API still stores "US", "GB", etc. */
const ISO_TO_DISPLAY = {
  US: 'United States',
  GB: 'United Kingdom',
  AE: 'United Arab Emirates',
  NZ: 'New Zealand',
  KR: 'South Korea',
  ZA: 'South Africa',
  IN: 'India',
  CA: 'Canada',
  AU: 'Australia',
  DE: 'Germany',
  FR: 'France',
  IE: 'Ireland',
  SG: 'Singapore',
  MY: 'Malaysia',
  NL: 'Netherlands',
  CH: 'Switzerland',
  SE: 'Sweden',
  NO: 'Norway',
  ES: 'Spain',
  IT: 'Italy',
  BE: 'Belgium',
  AT: 'Austria',
  FI: 'Finland',
  JP: 'Japan',
  CN: 'China',
  HK: 'Hong Kong',
  TW: 'Taiwan',
  TH: 'Thailand',
  VN: 'Vietnam',
  PH: 'Philippines',
  ID: 'Indonesia',
  PK: 'Pakistan',
  BD: 'Bangladesh',
  LK: 'Sri Lanka',
  NP: 'Nepal',
  SA: 'Saudi Arabia',
  QA: 'Qatar',
  KW: 'Kuwait',
  OM: 'Oman',
  BH: 'Bahrain',
  EG: 'Egypt',
  TR: 'Turkey',
  PL: 'Poland',
  PT: 'Portugal',
  CZ: 'Czech Republic',
  HU: 'Hungary',
  RO: 'Romania',
  UA: 'Ukraine',
  RU: 'Russia',
  BR: 'Brazil',
  MX: 'Mexico',
  AR: 'Argentina',
  CL: 'Chile',
  CO: 'Colombia',
  PE: 'Peru',
  NG: 'Nigeria',
  KE: 'Kenya',
  GH: 'Ghana',
  MU: 'Mauritius',
};

for (const [name, iso] of Object.entries(NAME_TO_ISO)) {
  if (name.length <= 3) continue;
  if (['america', 'britain', 'england', 'korea', 'czechia', 'uae', 'usa'].includes(name)) continue;
  const title = name
    .split(' ')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
  if (!ISO_TO_DISPLAY[iso]) ISO_TO_DISPLAY[iso] = title;
}

function looksLikeCountryCode(value, iso) {
  if (!value || !iso) return false;
  const raw = String(value).trim();
  if (!raw) return false;
  const upper = raw.toUpperCase();
  return upper === iso || (upper === raw && /^[A-Z]{2,3}$/.test(upper)) || Boolean(ALIAS_ISO[upper]);
}

export function normalizeCountryIso(input) {
  if (input == null || input === '' || input === '—') return null;

  if (typeof input === 'object') {
    const fromObj = normalizeCountryIso(input.isoCode || input.code || input.countryCode || input.country || input.name || input.label);
    return fromObj;
  }

  const raw = String(input).trim();
  if (!raw) return null;

  const upper = raw.toUpperCase();
  if (ALIAS_ISO[upper]) return ALIAS_ISO[upper];
  if (/^[A-Z]{2}$/.test(upper)) return upper;
  if (/^[A-Z]{3}$/.test(upper)) {
    // common alpha-3 leftovers
    const a3 = {
      AUS: 'AU', CAN: 'CA', IND: 'IN', USA: 'US', GBR: 'GB', DEU: 'DE',
      NZL: 'NZ', ARE: 'AE', SGP: 'SG', NPL: 'NP', BGD: 'BD', PAK: 'PK',
      LKA: 'LK', FRA: 'FR', ITA: 'IT', ESP: 'ES', CHN: 'CN', JPN: 'JP',
    };
    if (a3[upper]) return a3[upper];
  }

  const key = raw.toLowerCase().replace(/\s+/g, ' ').trim();
  return NAME_TO_ISO[key] || null;
}

export function getCountryDisplayName(input) {
  if (input == null || input === '') return '';
  if (typeof input === 'object') {
    return String(input.name || input.label || input.country || input.countryName || '').trim();
  }
  return String(input).trim();
}

/** Human-readable country name — use for plain text (no flag). */
export function resolveCountryDisplayName(input) {
  return resolveCountryMeta(input).label;
}

export function resolveCountryMeta(input) {
  const rawName = getCountryDisplayName(input);
  const iso = normalizeCountryIso(input);
  let label = rawName;

  if (iso && ISO_TO_DISPLAY[iso] && looksLikeCountryCode(rawName, iso)) {
    label = ISO_TO_DISPLAY[iso];
  } else if (iso && !label) {
    label = ISO_TO_DISPLAY[iso] || iso;
  }

  return {
    name: label,
    iso,
    label: label || iso || '—',
  };
}

