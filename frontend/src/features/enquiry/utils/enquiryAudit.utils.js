import {
  AUDIT_ACTION_LABELS,
  getAuditFilterBucket,
  isAuditTabAction,
} from '../config/enquiryAudit.config';
import { HISTORY_FIELD_LABELS } from '../config/enquiryHistory.config';
import {
  getEnquiryStatusLabel,
  getEnquiryPriorityLabel,
  getEnquiryTagLabel,
} from '../../../config/constants';

function formatActor(user) {
  if (!user) return 'System';
  return `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email || 'User';
}

function formatWhen(value) {
  if (!value) return '—';
  return new Date(value).toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function formatValue(field, value) {
  if (value == null || value === '') return '—';
  const raw = String(value);

  if (field === 'status') return getEnquiryStatusLabel(raw) || raw;
  if (field === 'priority') return getEnquiryPriorityLabel(raw) || raw;

  if (field === 'tags') {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed.map(getEnquiryTagLabel).join(', ') || '—';
    } catch {
      return raw;
    }
  }

  return raw;
}

function buildAuditEntry(log) {
  const bucket = getAuditFilterBucket(log.action);
  const fieldLabel = log.field ? (HISTORY_FIELD_LABELS[log.field] || log.field) : null;

  return {
    id: log.id,
    action: log.action,
    bucket,
    actionLabel: AUDIT_ACTION_LABELS[log.action] || log.action,
    fieldLabel,
    oldValue: formatValue(log.field, log.oldValue),
    newValue: formatValue(log.field, log.newValue)
      || (log.description ? log.description : '—'),
    who: formatActor(log.user),
    when: log.createdAt,
    whenLabel: formatWhen(log.createdAt),
    ip: log.ipAddress || '—',
    description: log.description || null,
  };
}

export function buildEnquiryAuditLogs(enquiry) {
  if (!enquiry?.id) return [];

  return (enquiry.auditLogs || [])
    .filter((log) => isAuditTabAction(log.action))
    .map(buildAuditEntry)
    .sort((a, b) => new Date(b.when).getTime() - new Date(a.when).getTime());
}

export function filterAuditLogs(entries, filterId) {
  if (!filterId || filterId === 'all') return entries;
  return entries.filter((entry) => entry.bucket === filterId);
}

export function countAuditByFilter(entries) {
  const counts = { all: entries.length };
  entries.forEach((entry) => {
    counts[entry.bucket] = (counts[entry.bucket] || 0) + 1;
  });
  return counts;
}
