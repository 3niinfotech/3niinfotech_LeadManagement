import {
  createCrmWorkbook,
  writeThemedSheet,
  workbookToBuffer,
} from '../../utils/excel.theme.js';

/** Columns for share-ready enquiry Excel */
export const EXPORT_COLUMNS = [
  { key: 'enquiryCode', header: 'Enquiry Code', minW: 16 },
  { key: 'firstName', header: 'First Name', minW: 14 },
  { key: 'lastName', header: 'Last Name', minW: 14 },
  { key: 'email', header: 'Email', minW: 24 },
  { key: 'mobile', header: 'Mobile', minW: 14 },
  { key: 'mobileCountry', header: 'Code', minW: 10 },
  { key: 'alternateNo', header: 'Alt No', minW: 12 },
  { key: 'gender', header: 'Gender', minW: 10 },
  { key: 'nationality', header: 'Nationality', minW: 12 },
  { key: 'interestedCountry', header: 'Country', minW: 12 },
  { key: 'interestedCourse', header: 'Course', minW: 16 },
  { key: 'intake', header: 'Intake', minW: 12 },
  { key: 'applyLevel', header: 'Apply Level', minW: 12 },
  { key: 'highestQual', header: 'Qualification', minW: 14 },
  { key: 'source', header: 'Source', minW: 12 },
  { key: 'priority', header: 'Priority', minW: 10 },
  { key: 'status', header: 'Status', minW: 14 },
  { key: 'tags', header: 'Tags', minW: 16 },
  { key: 'branch', header: 'Branch', minW: 14 },
  { key: 'assignedTo', header: 'Assigned To', minW: 16 },
  { key: 'passportNo', header: 'Passport', minW: 12 },
  { key: 'dateOfBirth', header: 'DOB', minW: 12 },
  { key: 'address', header: 'Address', minW: 22 },
  { key: 'lastRemark', header: 'Remark', minW: 20 },
  { key: 'createdAt', header: 'Created', minW: 14 },
];

function formatDate(value) {
  if (!value) return '';
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

function formatTags(tags) {
  if (!tags) return '';
  if (Array.isArray(tags)) return tags.filter(Boolean).join(', ');
  if (typeof tags === 'string') {
    try {
      const parsed = JSON.parse(tags);
      if (Array.isArray(parsed)) return parsed.filter(Boolean).join(', ');
    } catch {
      return tags;
    }
  }
  return '';
}

function personName(user) {
  if (!user) return '';
  return `${user.firstName || ''} ${user.lastName || ''}`.trim();
}

function mapExportRow(row) {
  return {
    enquiryCode: row.enquiryCode || '',
    firstName: row.firstName || '',
    lastName: row.lastName || '',
    email: row.email || '',
    mobile: row.mobile || '',
    mobileCountry: row.mobileCountry || '',
    alternateNo: row.alternateNo || '',
    gender: row.gender || '',
    nationality: row.nationality || '',
    interestedCountry: row.interestedCountry || '',
    interestedCourse: row.interestedCourse || '',
    intake: row.intake || '',
    applyLevel: row.applyLevel || '',
    highestQual: row.highestQual || '',
    source: row.source || '',
    priority: row.priority || '',
    status: row.status || '',
    tags: formatTags(row.tags),
    branch: row.branch?.name || row.branch?.code || '',
    assignedTo: personName(row.assignedTo),
    passportNo: row.passportNo || '',
    dateOfBirth: formatDate(row.dateOfBirth),
    address: row.address || '',
    lastRemark: row.lastRemark || row.remark || '',
    createdAt: formatDate(row.createdAt),
  };
}

export async function buildEnquiryExportWorkbook(rows = [], meta = {}) {
  const mapped = rows.map(mapExportRow);
  const exportedAt = new Date().toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
  const scopeLabel = meta.scopeLabel || (meta.selected ? 'Selected rows' : 'All matching enquiries');

  const statusCounts = mapped.reduce((acc, r) => {
    const s = r.status || 'UNKNOWN';
    acc[s] = (acc[s] || 0) + 1;
    return acc;
  }, {});
  const statusSummary = Object.entries(statusCounts)
    .slice(0, 6)
    .map(([k, v]) => `${k}: ${v}`)
    .join(' · ');

  const workbook = createCrmWorkbook();
  writeThemedSheet(workbook, {
    sheetName: 'Enquiries',
    title: 'Lead Management CRM — Enquiry Export',
    meta: `${scopeLabel}  ·  ${mapped.length} record${mapped.length === 1 ? '' : 's'}  ·  Exported ${exportedAt}`,
    columns: EXPORT_COLUMNS,
    rows: mapped,
    totals: {
      label: 'TOTAL',
      value: mapped.length,
      note: statusSummary || 'Enquiry records in this file',
    },
  });

  return workbookToBuffer(workbook);
}

export function buildEnquiryExportFilename(meta = {}) {
  const stamp = new Date().toISOString().slice(0, 10);
  const scope = meta.selected ? 'selected' : 'all';
  return `CRM-Enquiry-Export-${scope}-${stamp}.xlsx`;
}

export default {
  EXPORT_COLUMNS,
  buildEnquiryExportWorkbook,
  buildEnquiryExportFilename,
};
