export const VISA_STATUS_OPTIONS = [
  { value: 'NOT_STARTED', label: 'Not Started', tone: 'secondary' },
  { value: 'DOCUMENTS_COLLECTED', label: 'Documents Collected', tone: 'info' },
  { value: 'APPLICATION_SUBMITTED', label: 'Submitted', tone: 'primary' },
  { value: 'BIOMETRICS_DONE', label: 'Biometrics Done', tone: 'info' },
  { value: 'INTERVIEW_SCHEDULED', label: 'Interview', tone: 'warning' },
  { value: 'APPROVED', label: 'Approved', tone: 'success' },
  { value: 'REJECTED', label: 'Rejected', tone: 'danger' },
  { value: 'APPEAL', label: 'Appeal', tone: 'warning' },
];

export function getVisaStatusLabel(status) {
  return VISA_STATUS_OPTIONS.find((s) => s.value === status)?.label || status || '—';
}

export function getVisaStatusTone(status, metadata = {}) {
  if (metadata?.visaApproved || status === 'APPROVED') return 'success';
  if (metadata?.visaRejected || status === 'REJECTED') return 'danger';
  if (metadata?.visaWithdraw || status === 'APPEAL') return 'warning';
  if (status === 'NOT_STARTED') return 'secondary';
  if (status === 'INTERVIEW_SCHEDULED') return 'warning';
  if (status === 'APPLICATION_SUBMITTED' || status === 'DOCUMENTS_COLLECTED') return 'info';
  return 'primary';
}

export function displayVisaStatus(record) {
  return record?.metadata?.visaStatusName || getVisaStatusLabel(record?.status);
}
