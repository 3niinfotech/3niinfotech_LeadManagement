import {
  createCrmWorkbook,
  writeThemedSheet,
  workbookToBuffer,
} from '../../utils/excel.theme.js';

export const APPLICATION_EXPORT_COLUMNS = [
  { key: 'applicationNo', header: 'App No', minW: 14 },
  { key: 'studentCode', header: 'Student Code', minW: 16 },
  { key: 'studentName', header: 'Student Name', minW: 18 },
  { key: 'university', header: 'University', minW: 20 },
  { key: 'course', header: 'Course', minW: 16 },
  { key: 'country', header: 'Country', minW: 12 },
  { key: 'intake', header: 'Intake', minW: 12 },
  { key: 'status', header: 'Status', minW: 16 },
  { key: 'workflowStatus', header: 'Workflow Status', minW: 18 },
  { key: 'submittedAt', header: 'Submitted', minW: 12 },
  { key: 'offerDate', header: 'Offer Date', minW: 12 },
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
    university: row.university || '',
    course: row.course || '',
    country: row.country || row.metadata?.countryName || '',
    intake: row.intake || '',
    status: row.status || '',
    workflowStatus: row.metadata?.applicationStatusName || '',
    submittedAt: formatDate(row.submittedAt),
    offerDate: formatDate(row.offerDate),
    branch: s.branch?.name || '',
    createdAt: formatDate(row.createdAt),
  };
}

export async function buildApplicationExportWorkbook(rows = [], meta = {}) {
  const mapped = rows.map(mapExportRow);
  const exportedAt = new Date().toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });
  const scopeLabel = meta.scopeLabel || (meta.selected ? 'Selected applications' : 'All matching applications');

  const workbook = createCrmWorkbook();
  writeThemedSheet(workbook, {
    sheetName: 'Applications',
    title: 'Lead Management CRM — Applications Export',
    meta: `${scopeLabel}  ·  ${mapped.length} record${mapped.length === 1 ? '' : 's'}  ·  Exported ${exportedAt}`,
    columns: APPLICATION_EXPORT_COLUMNS,
    rows: mapped,
    totals: { label: 'TOTAL', value: mapped.length, note: 'Application records' },
  });
  return workbookToBuffer(workbook);
}

export function buildApplicationExportFilename(meta = {}) {
  const stamp = new Date().toISOString().slice(0, 10);
  return `CRM-Applications-Export-${meta.selected ? 'selected' : 'all'}-${stamp}.xlsx`;
}
