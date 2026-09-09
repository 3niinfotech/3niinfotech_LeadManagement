import {
  createCrmWorkbook,
  writeThemedSheet,
  workbookToBuffer,
} from '../../utils/excel.theme.js';

export const VISA_EXPORT_COLUMNS = [
  { key: 'applicationNo', header: 'Visa No', minW: 14 },
  { key: 'studentCode', header: 'Student Code', minW: 16 },
  { key: 'studentName', header: 'Student Name', minW: 18 },
  { key: 'country', header: 'Country', minW: 12 },
  { key: 'visaType', header: 'Visa Type', minW: 14 },
  { key: 'status', header: 'Status', minW: 16 },
  { key: 'workflowStatus', header: 'Workflow Status', minW: 18 },
  { key: 'submittedAt', header: 'Submitted', minW: 12 },
  { key: 'decisionAt', header: 'Decision', minW: 12 },
  { key: 'expiryDate', header: 'Expiry', minW: 12 },
  { key: 'branch', header: 'Branch', minW: 14 },
  { key: 'createdAt', header: 'Created', minW: 12 },
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

function mapExportRow(row) {
  const s = row.student || {};
  return {
    applicationNo: row.applicationNo || '',
    studentCode: s.studentCode || '',
    studentName: `${s.firstName || ''} ${s.lastName || ''}`.trim(),
    country: row.country || row.metadata?.countryName || '',
    visaType: row.visaType || '',
    status: row.status || '',
    workflowStatus: row.metadata?.visaStatusName || '',
    submittedAt: formatDate(row.submittedAt),
    decisionAt: formatDate(row.decisionAt),
    expiryDate: formatDate(row.expiryDate),
    branch: s.branch?.name || '',
    createdAt: formatDate(row.createdAt),
  };
}

export async function buildVisaExportWorkbook(rows = [], meta = {}) {
  const mapped = rows.map(mapExportRow);
  const exportedAt = new Date().toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });
  const scopeLabel = meta.scopeLabel || (meta.selected ? 'Selected visa cases' : 'All matching visa cases');

  const workbook = createCrmWorkbook();
  writeThemedSheet(workbook, {
    sheetName: 'Visas',
    title: 'Lead Management CRM — Visa Cases Export',
    meta: `${scopeLabel}  ·  ${mapped.length} record${mapped.length === 1 ? '' : 's'}  ·  Exported ${exportedAt}`,
    columns: VISA_EXPORT_COLUMNS,
    rows: mapped,
    totals: { label: 'TOTAL', value: mapped.length, note: 'Visa case records' },
  });
  return workbookToBuffer(workbook);
}

export function buildVisaExportFilename(meta = {}) {
  const stamp = new Date().toISOString().slice(0, 10);
  return `CRM-Visas-Export-${meta.selected ? 'selected' : 'all'}-${stamp}.xlsx`;
}
