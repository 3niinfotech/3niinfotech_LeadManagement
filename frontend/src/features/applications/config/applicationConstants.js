export const APPLICATION_STATUS_OPTIONS = [
  { value: 'DRAFT', label: 'Draft', tone: 'warning' },
  { value: 'SUBMITTED', label: 'Submitted', tone: 'info' },
  { value: 'UNDER_REVIEW', label: 'Under Review', tone: 'primary' },
  { value: 'CONDITIONAL_OFFER', label: 'Conditional Offer', tone: 'success' },
  { value: 'UNCONDITIONAL_OFFER', label: 'Unconditional Offer', tone: 'success' },
  { value: 'REJECTED', label: 'Rejected', tone: 'danger' },
  { value: 'WITHDRAWN', label: 'Withdrawn', tone: 'secondary' },
];

export function getApplicationStatusLabel(status) {
  return APPLICATION_STATUS_OPTIONS.find((s) => s.value === status)?.label || status || '—';
}

export function getApplicationStatusTone(status, metadata = {}) {
  if (metadata?.setOfferLetter) return 'success';
  if (status === 'REJECTED' || status === 'WITHDRAWN') return 'danger';
  if (status === 'DRAFT') return 'warning';
  if (status === 'SUBMITTED' || status === 'UNDER_REVIEW') return 'info';
  if (status === 'CONDITIONAL_OFFER' || status === 'UNCONDITIONAL_OFFER') return 'success';
  return 'primary';
}

export function displayApplicationStatus(record) {
  return record?.metadata?.applicationStatusName || getApplicationStatusLabel(record?.status);
}
