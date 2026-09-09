export function formatMoney(amount, currency = 'INR') {
  if (amount == null || Number.isNaN(Number(amount))) return '—';
  try {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
    }).format(Number(amount));
  } catch {
    return `${currency} ${Number(amount).toLocaleString('en-IN')}`;
  }
}

export function formatDate(value, withTime = false) {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString('en-IN', withTime
    ? { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }
    : { day: '2-digit', month: 'short', year: 'numeric' });
}

export function statusBadgeClass(status) {
  const s = String(status || '').toUpperCase();
  if (['PAID', 'SUCCESS', 'APPROVED', 'VERIFIED', 'UNCONDITIONAL_OFFER', 'COMPLETED'].includes(s)) {
    return 'bg-success-soft text-success';
  }
  if (['PENDING', 'SENT', 'UNDER_REVIEW', 'UPLOADED', 'REQUESTED', 'SCHEDULED', 'PARTIAL'].includes(s)) {
    return 'bg-brand-soft text-brand';
  }
  if (['OVERDUE', 'REJECTED', 'REQUIRED', 'FAILED'].includes(s)) {
    return 'bg-danger-soft text-danger';
  }
  return 'bg-row-hover text-text-secondary';
}
