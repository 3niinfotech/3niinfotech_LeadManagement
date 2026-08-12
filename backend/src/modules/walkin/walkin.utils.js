/** Split "Smit Patel" → { firstName, lastName } */
export function splitFullName(fullName = '') {
  const parts = String(fullName).trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return { firstName: '', lastName: null };
  if (parts.length === 1) return { firstName: parts[0], lastName: null };
  return {
    firstName: parts[0],
    lastName: parts.slice(1).join(' '),
  };
}

export function normalizePhone(phone = '') {
  return String(phone).replace(/\D/g, '');
}

export function buildQrPayload(lead) {
  return {
    type: 'LEAD',
    leadCode: lead.leadCode,
    tokenNumber: lead.tokenNumber,
    id: lead.id,
  };
}
