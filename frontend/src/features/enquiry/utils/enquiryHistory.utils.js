import {
  getEnquiryStatusLabel,
  getEnquiryPriorityLabel,
  getEnquiryTagLabel,
} from '../../../config/constants';
import { HISTORY_ACTION_LABELS, HISTORY_FIELD_LABELS } from '../config/enquiryHistory.config';

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
      if (Array.isArray(parsed)) {
        return parsed.map(getEnquiryTagLabel).join(', ') || '—';
      }
    } catch {
      return raw;
    }
  }

  return raw;
}

function buildEntryFromAudit(log) {
  const fieldLabel = log.field ? (HISTORY_FIELD_LABELS[log.field] || log.field) : null;
  const title = fieldLabel
    ? `${HISTORY_ACTION_LABELS[log.action] || log.action} · ${fieldLabel}`
    : (HISTORY_ACTION_LABELS[log.action] || log.action);

  const oldValue = formatValue(log.field, log.oldValue);
  const newValue = formatValue(log.field, log.newValue)
    || (log.description ? log.description : '—');

  return {
    id: log.id,
    title,
    action: log.action,
    field: log.field,
    oldValue,
    newValue,
    who: formatActor(log.user),
    when: log.createdAt,
    whenLabel: formatWhen(log.createdAt),
    ip: log.ipAddress || '—',
    description: log.description || null,
  };
}

function buildSyntheticEvents(enquiry) {
  const items = [];
  const hasCreate = (enquiry.auditLogs || []).some((log) => log.action === 'CREATE');

  if (!hasCreate && enquiry.createdAt) {
    items.push({
      id: `created-${enquiry.id}`,
      title: 'Created',
      action: 'CREATE',
      field: null,
      oldValue: '—',
      newValue: enquiry.enquiryCode || 'Enquiry created',
      who: 'System',
      when: enquiry.createdAt,
      whenLabel: formatWhen(enquiry.createdAt),
      ip: '—',
      description: null,
    });
  }

  return items;
}

export function buildEnquiryHistory(enquiry) {
  if (!enquiry?.id) return [];

  const auditEntries = (enquiry.auditLogs || []).map(buildEntryFromAudit);
  const synthetic = buildSyntheticEvents(enquiry);

  return [...auditEntries, ...synthetic]
    .sort((a, b) => new Date(b.when).getTime() - new Date(a.when).getTime());
}
