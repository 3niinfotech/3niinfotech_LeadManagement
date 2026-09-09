import {
  createCrmWorkbook,
  writeThemedSheet,
  workbookToBuffer,
} from '../../utils/excel.theme.js';

export const INVOICE_EXPORT_COLUMNS = [
  { key: 'invoiceNo', header: 'Invoice No', minW: 18 },
  { key: 'studentCode', header: 'Student Code', minW: 14 },
  { key: 'studentName', header: 'Student Name', minW: 18 },
  { key: 'amount', header: 'Amount', minW: 12 },
  { key: 'tax', header: 'Tax', minW: 10 },
  { key: 'total', header: 'Total', minW: 12 },
  { key: 'currency', header: 'Currency', minW: 10 },
  { key: 'status', header: 'Status', minW: 12 },
  { key: 'dueDate', header: 'Due Date', minW: 12 },
  { key: 'paidAt', header: 'Paid At', minW: 12 },
  { key: 'branch', header: 'Branch', minW: 14 },
  { key: 'notes', header: 'Notes', minW: 20 },
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
    invoiceNo: row.invoiceNo || '',
    studentCode: s.studentCode || '',
    studentName: `${s.firstName || ''} ${s.lastName || ''}`.trim(),
    amount: row.amount != null ? Number(row.amount) : '',
    tax: row.tax != null ? Number(row.tax) : '',
    total: row.total != null ? Number(row.total) : '',
    currency: row.currency || '',
    status: row.status || '',
    dueDate: formatDate(row.dueDate),
    paidAt: formatDate(row.paidAt),
    branch: s.branch?.name || '',
    notes: row.notes || '',
    createdAt: formatDate(row.createdAt),
  };
}

export async function buildInvoiceExportWorkbook(rows = [], meta = {}) {
  const mapped = rows.map(mapExportRow);
  const exportedAt = new Date().toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });
  const scopeLabel = meta.scopeLabel || (meta.selected ? 'Selected invoices' : 'All matching invoices');

  const workbook = createCrmWorkbook();
  writeThemedSheet(workbook, {
    sheetName: 'Invoices',
    title: 'Lead Management CRM — Fees / Invoices Export',
    meta: `${scopeLabel}  ·  ${mapped.length} record${mapped.length === 1 ? '' : 's'}  ·  Exported ${exportedAt}`,
    columns: INVOICE_EXPORT_COLUMNS,
    rows: mapped,
    totals: { label: 'TOTAL', value: mapped.length, note: 'Invoice records' },
  });
  return workbookToBuffer(workbook);
}

export function buildInvoiceExportFilename(meta = {}) {
  const stamp = new Date().toISOString().slice(0, 10);
  return `CRM-Fees-Export-${meta.selected ? 'selected' : 'all'}-${stamp}.xlsx`;
}
