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

const ONES = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
const TENS = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

function convertChunk(num) {
  let str = '';
  if (num >= 100) {
    str += ONES[Math.floor(num / 100)] + ' Hundred ';
    num %= 100;
  }
  if (num >= 20) {
    str += TENS[Math.floor(num / 10)] + (num % 10 ? ' ' + ONES[num % 10] : '');
  } else if (num > 0) {
    str += ONES[num];
  }
  return str.trim();
}

export function numberToWords(amount, currency = 'INR') {
  const num = Math.round(Number(amount || 0));
  if (num === 0) return `Rupees Zero Only`;

  if (currency === 'INR' || currency === '₹') {
    const crore = Math.floor(num / 10000000);
    const lakh = Math.floor((num % 10000000) / 100000);
    const thousand = Math.floor((num % 100000) / 1000);
    const remainder = num % 1000;
    const parts = [];
    if (crore) parts.push(convertChunk(crore) + ' Crore');
    if (lakh) parts.push(convertChunk(lakh) + ' Lakh');
    if (thousand) parts.push(convertChunk(thousand) + ' Thousand');
    if (remainder) parts.push(convertChunk(remainder));
    return `Rupees ${parts.join(' ')} Only`.replace(/\s+/g, ' ').trim();
  }

  const millions = Math.floor(num / 1000000);
  const thousands = Math.floor((num % 1000000) / 1000);
  const remainder = num % 1000;
  const parts = [];
  if (millions) parts.push(convertChunk(millions) + ' Million');
  if (thousands) parts.push(convertChunk(thousands) + ' Thousand');
  if (remainder) parts.push(convertChunk(remainder));
  return `${currency} ${parts.join(' ')} Only`.replace(/\s+/g, ' ').trim();
}
