import {
  createCrmWorkbook,
  writeThemedSheet,
  workbookToBuffer,
} from '../../utils/excel.theme.js';

export const STUDENT_EXPORT_COLUMNS = [
  { key: 'studentCode', header: 'Student ID', minW: 16 },
  { key: 'firstName', header: 'First Name', minW: 14 },
  { key: 'lastName', header: 'Last Name', minW: 14 },
  { key: 'email', header: 'Email', minW: 24 },
  { key: 'phone', header: 'Phone', minW: 14 },
  { key: 'country', header: 'Target Country', minW: 14 },
  { key: 'course', header: 'Course', minW: 16 },
  { key: 'university', header: 'University', minW: 18 },
  { key: 'intake', header: 'Intake', minW: 12 },
  { key: 'status', header: 'Status', minW: 14 },
  { key: 'gender', header: 'Gender', minW: 10 },
  { key: 'passportNo', header: 'Passport No', minW: 14 },
  { key: 'nationality', header: 'Nationality', minW: 12 },
  { key: 'branch', header: 'Branch', minW: 14 },
  { key: 'assignedTo', header: 'Assigned To', minW: 16 },
  { key: 'partner', header: 'Partner/Agent', minW: 14 },
  { key: 'address', header: 'Address', minW: 22 },
  { key: 'createdAt', header: 'Created Date', minW: 14 },
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

function personName(user) {
  if (!user) return '';
  return `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.name || '';
}

function mapExportRow(row) {
  return {
    studentCode: row.studentCode || '',
    firstName: row.firstName || '',
    lastName: row.lastName || '',
    email: row.email || '',
    phone: row.phone || '',
    country: row.country || '',
    course: row.course || '',
    university: row.university || '',
    intake: row.intake || '',
    status: row.status || '',
    gender: row.gender || '',
    passportNo: row.passportNo || '',
    nationality: row.nationality || '',
    branch: row.branch?.name || '',
    assignedTo: personName(row.assignedTo),
    partner: row.partner?.name || '',
    address: row.address || '',
    createdAt: formatDate(row.createdAt),
  };
}

export async function buildStudentExportWorkbook(rows = [], meta = {}) {
  const mapped = rows.map(mapExportRow);
  const exportedAt = new Date().toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
  const scopeLabel = meta.scopeLabel || (meta.selected ? 'Selected students' : 'All matching students');

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
    sheetName: 'Students',
    title: 'Lead Management CRM — Students Export',
    meta: `${scopeLabel}  ·  ${mapped.length} student${mapped.length === 1 ? '' : 's'}  ·  Exported ${exportedAt}`,
    columns: STUDENT_EXPORT_COLUMNS,
    rows: mapped,
    totals: {
      label: 'TOTAL',
      value: mapped.length,
      note: statusSummary || 'Student records count',
    },
  });

  return workbookToBuffer(workbook);
}

export function buildStudentExportFilename(meta = {}) {
  const stamp = new Date().toISOString().slice(0, 10);
  const scope = meta.selected ? 'selected' : 'all';
  return `CRM-Students-Export-${scope}-${stamp}.xlsx`;
}

export default {
  STUDENT_EXPORT_COLUMNS,
  buildStudentExportWorkbook,
  buildStudentExportFilename,
};
