import {
  getEnquiryStatusLabel,
  getEnquiryPriorityLabel,
  getEnquiryTagLabel,
} from '../../../config/constants';
import { getFollowupActionLabel } from '../config/enquiryFollowup.config';
import { getCommunicationChannelLabel } from '../config/enquiryCommunication.config';
import { getDocumentCategoryLabel } from '../config/enquiryDocument.config';

const FIELD_LABELS = {
  status: 'Status',
  priority: 'Priority',
  tags: 'Tags',
  firstName: 'First name',
  lastName: 'Last name',
  email: 'Email',
  mobile: 'Mobile',
  interestedCourse: 'Course',
  interestedCountry: 'Country',
  assignedToId: 'Assignee',
};

const ACTION_META = {
  CREATE: { label: 'Enquiry created', tone: 'success' },
  UPDATE: { label: 'Record updated', tone: 'primary' },
  STATUS_CHANGE: { label: 'Status changed', tone: 'warning' },
  FOLLOWUP: { label: 'Follow-up logged', tone: 'info' },
  APPOINTMENT: { label: 'Appointment scheduled', tone: 'primary' },
  DEMO: { label: 'Demo recorded', tone: 'primary' },
  NOTE: { label: 'Note added', tone: 'secondary' },
  DOCUMENT: { label: 'Document uploaded', tone: 'info' },
  DOCUMENT_DELETE: { label: 'Document removed', tone: 'danger' },
  COMMUNICATION: { label: 'Communication sent', tone: 'info' },
  DROP: { label: 'Enquiry closed', tone: 'danger' },
  DELETE: { label: 'Enquiry deleted', tone: 'danger' },
};

function parseTagsValue(raw) {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return String(raw).split(',').map((t) => t.trim()).filter(Boolean);
  }
}

function formatFieldValue(field, raw) {
  if (raw == null || raw === '') return '—';
  if (field === 'status') return getEnquiryStatusLabel(raw);
  if (field === 'priority') return getEnquiryPriorityLabel(raw);
  if (field === 'tags') {
    const tags = parseTagsValue(raw);
    return tags.length ? tags.map(getEnquiryTagLabel).join(', ') : '—';
  }
  return String(raw);
}

export function getTimelineActionMeta(action) {
  return ACTION_META[action] || { label: action?.replace(/_/g, ' ') || 'Activity', tone: 'secondary' };
}

export function formatTimelineTitle(entry) {
  const meta = getTimelineActionMeta(entry.action);
  if (entry.action === 'FOLLOWUP' && entry.newValue) {
    return `${getFollowupActionLabel(entry.newValue)} logged`;
  }
  if (entry.action === 'COMMUNICATION' && entry.newValue) {
    return `${getCommunicationChannelLabel(entry.newValue)} logged`;
  }
  if (entry.action === 'DOCUMENT' && entry.newValue) {
    return `${getDocumentCategoryLabel(entry.newValue)} uploaded`;
  }
  if (entry.field && (entry.action === 'UPDATE' || entry.action === 'STATUS_CHANGE')) {
    const fieldLabel = FIELD_LABELS[entry.field] || entry.field;
    return `${fieldLabel} updated`;
  }
  return meta.label;
}

export function formatTimelineDetail(entry) {
  if (entry.description && !entry.field) return entry.description;
  if (entry.field && (entry.oldValue || entry.newValue)) {
    const from = formatFieldValue(entry.field, entry.oldValue);
    const to = formatFieldValue(entry.field, entry.newValue);
    if (from !== '—' || to !== '—') return `${from} → ${to}`;
  }
  return entry.description || null;
}

export function getActorName(user) {
  if (!user) return 'System';
  return `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email || 'Team member';
}

export function groupTimelineByDate(items = []) {
  const groups = new Map();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  items.forEach((item) => {
    const d = new Date(item.createdAt);
    const day = new Date(d);
    day.setHours(0, 0, 0, 0);

    let label;
    if (day.getTime() === today.getTime()) label = 'Today';
    else if (day.getTime() === yesterday.getTime()) label = 'Yesterday';
    else {
      label = d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
    }

    if (!groups.has(label)) groups.set(label, []);
    groups.get(label).push(item);
  });

  return Array.from(groups.entries());
}

export function mergeTimelineEvents(auditLogs = [], enquiry) {
  const byId = new Map();

  auditLogs.forEach((entry) => {
    byId.set(entry.id, entry);
  });

  if (enquiry?.createdAt && !auditLogs.some((e) => e.action === 'CREATE')) {
    byId.set(`created-${enquiry.id}`, {
      id: `created-${enquiry.id}`,
      action: 'CREATE',
      description: `Enquiry ${enquiry.enquiryCode} created`,
      createdAt: enquiry.createdAt,
      user: null,
    });
  }

  return Array.from(byId.values()).sort(
    (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
  );
}
