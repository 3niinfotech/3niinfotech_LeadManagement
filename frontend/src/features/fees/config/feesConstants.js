export const INVOICE_STATUS_OPTIONS = [
  { value: 'DRAFT', label: 'Draft', tone: 'secondary' },
  { value: 'SENT', label: 'Sent', tone: 'info' },
  { value: 'PARTIAL', label: 'Partial', tone: 'warning' },
  { value: 'OVERDUE', label: 'Overdue', tone: 'danger' },
  { value: 'PAID', label: 'Paid', tone: 'success' },
  { value: 'CANCELLED', label: 'Cancelled', tone: 'secondary' },
];

export function getInvoiceStatusTone(status) {
  return INVOICE_STATUS_OPTIONS.find((s) => s.value === status)?.tone || 'secondary';
}

export function displayInvoiceStatus(status) {
  return INVOICE_STATUS_OPTIONS.find((s) => s.value === status)?.label || status || '—';
}

export function formatMoney(value, currency) {
  const n = Number(value);
  if (Number.isNaN(n)) return '—';
  const formatted = n.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
  return currency ? `${currency} ${formatted}` : formatted;
}

/** Tax amount from master % — amount × (taxPercentage / 100) */
export function calcTaxAmount(amount, taxPercentage) {
  const base = Number(amount) || 0;
  const pct = Number(taxPercentage);
  if (!pct || Number.isNaN(pct)) return 0;
  return Math.round(base * (pct / 100) * 100) / 100;
}
