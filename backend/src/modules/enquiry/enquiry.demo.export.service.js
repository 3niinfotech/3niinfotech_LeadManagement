import {
  createCrmWorkbook,
  writeThemedSheet,
  workbookToBuffer,
} from '../../utils/excel.theme.js';

export const DEMO_EXPORT_COLUMNS = [
  { key: 'demoId', header: 'Demo ID', minW: 14 },
  { key: 'demoDate', header: 'Date & Time', minW: 20 },
  { key: 'studentName', header: 'Student Name', minW: 18 },
  { key: 'enquiryCode', header: 'Enquiry Code', minW: 16 },
  { key: 'mobile', header: 'Mobile', minW: 14 },
  { key: 'email', header: 'Email', minW: 24 },
  { key: 'course', header: 'Course', minW: 18 },
  { key: 'batch', header: 'Batch', minW: 14 },
  { key: 'faculty', header: 'Faculty / Trainer', minW: 18 },
  { key: 'branch', header: 'Branch', minW: 14 },
  { key: 'sessionStatus', header: 'Session Status', minW: 14 },
  { key: 'attendance', header: 'Attendance', minW: 14 },
  { key: 'result', header: 'Outcome', minW: 14 },
  { key: 'feedback', header: 'Feedback', minW: 24 },
  { key: 'remark', header: 'Remarks', minW: 20 },
  { key: 'markedBy', header: 'Marked By', minW: 16 },
  { key: 'markedAt', header: 'Marked At', minW: 18 },
];

function formatDateTime(value) {
  if (!value) return '';
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}

function personName(user) {
  if (!user) return '';
  return `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.name || '';
}

function mapExportRow(row) {
  const enquiry = row.enquiry || {};
  return {
    demoId: row.id?.slice(0, 8) || '',
    demoDate: formatDateTime(row.demoDate),
    studentName: `${enquiry.firstName || ''} ${enquiry.lastName || ''}`.trim(),
    enquiryCode: enquiry.enquiryCode || '',
    mobile: enquiry.mobile || '',
    email: enquiry.email || '',
    course: row.className || enquiry.interestedCourse || '',
    batch: row.batch || '',
    faculty: row.faculty?.name || personName(row.faculty) || '',
    branch: enquiry.branch?.name || enquiry.branch?.code || '',
    sessionStatus: row.sessionStatus || 'SCHEDULED',
    attendance: row.attendance || 'NOT_MARKED',
    result: row.result || 'PENDING',
    feedback: row.feedback || '',
    remark: row.remark || '',
    markedBy: personName(row.attendanceMarkedBy),
    markedAt: formatDateTime(row.attendanceMarkedAt),
  };
}

export async function buildDemoExportWorkbook(rows = [], meta = {}) {
  const mapped = rows.map(mapExportRow);
  const exportedAt = new Date().toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
  const scopeLabel = meta.scopeLabel || (meta.selected ? 'Selected demos' : 'All matching demo sessions');

  const attendanceCounts = mapped.reduce((acc, r) => {
    const s = r.attendance || 'NOT_MARKED';
    acc[s] = (acc[s] || 0) + 1;
    return acc;
  }, {});
  const summaryText = Object.entries(attendanceCounts)
    .slice(0, 5)
    .map(([k, v]) => `${k}: ${v}`)
    .join(' · ');

  const workbook = createCrmWorkbook();
  writeThemedSheet(workbook, {
    sheetName: 'Demo Sessions',
    title: 'Lead Management CRM — Demo Sessions Export',
    meta: `${scopeLabel}  ·  ${mapped.length} session${mapped.length === 1 ? '' : 's'}  ·  Exported ${exportedAt}`,
    columns: DEMO_EXPORT_COLUMNS,
    rows: mapped,
    totals: {
      label: 'TOTAL',
      value: mapped.length,
      note: summaryText || 'Demo sessions count',
    },
  });

  return workbookToBuffer(workbook);
}

export function buildDemoExportFilename(meta = {}) {
  const stamp = new Date().toISOString().slice(0, 10);
  const scope = meta.selected ? 'selected' : 'all';
  return `CRM-Demo-Sessions-Export-${scope}-${stamp}.xlsx`;
}

export default {
  DEMO_EXPORT_COLUMNS,
  buildDemoExportWorkbook,
  buildDemoExportFilename,
};
