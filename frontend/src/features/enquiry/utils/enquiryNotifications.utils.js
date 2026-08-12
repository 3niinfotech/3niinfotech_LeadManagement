import { getDocumentCategoryLabel } from '../config/enquiryDocument.config';
import {
  ENQUIRY_NOTIFICATION_TYPES,
  REQUIRED_ENQUIRY_DOCUMENTS,
  JOURNEY_DOCUMENT_STATUSES,
  PAYMENT_WATCH_STATUSES,
} from '../config/enquiryNotification.config';

function startOfDay(value = new Date()) {
  const d = new Date(value);
  d.setHours(0, 0, 0, 0);
  return d;
}

function isSameCalendarDay(a, b = new Date()) {
  if (!a) return false;
  const d1 = new Date(a);
  const d2 = new Date(b);
  return (
    d1.getFullYear() === d2.getFullYear()
    && d1.getMonth() === d2.getMonth()
    && d1.getDate() === d2.getDate()
  );
}

function isWithinDays(date, days, from = new Date()) {
  if (!date) return false;
  const target = startOfDay(date);
  const start = startOfDay(from);
  const end = new Date(start);
  end.setDate(end.getDate() + days);
  return target >= start && target <= end;
}

function formatTime(value) {
  if (!value) return '';
  return new Date(value).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' });
}

function formatDateTime(value) {
  if (!value) return '';
  return new Date(value).toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function buildFollowUpNotifications(enquiry) {
  const items = [];
  const today = new Date();
  const followups = enquiry?.followups || [];

  const dueToday = followups.filter((f) => isSameCalendarDay(f.nextDate, today));
  dueToday.forEach((f) => {
    items.push({
      id: `followup-${f.id}`,
      type: ENQUIRY_NOTIFICATION_TYPES.TODAY_FOLLOWUP,
      title: 'Follow-up due today',
      message: f.remark?.trim() || `Scheduled ${f.stage || 'follow-up'} for today`,
      at: f.nextDate,
      meta: formatTime(f.nextDate),
    });
  });

  if (dueToday.length === 0) {
    const overdue = followups
      .filter((f) => f.nextDate && new Date(f.nextDate) < startOfDay(today))
      .sort((a, b) => new Date(b.nextDate) - new Date(a.nextDate))[0];

    if (overdue) {
      items.push({
        id: `followup-overdue-${overdue.id}`,
        type: ENQUIRY_NOTIFICATION_TYPES.TODAY_FOLLOWUP,
        title: 'Overdue follow-up',
        message: overdue.remark?.trim() || 'A scheduled follow-up was missed',
        at: overdue.nextDate,
        meta: new Date(overdue.nextDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
      });
    }
  }

  return items;
}

function buildAppointmentNotifications(enquiry) {
  const items = [];
  const today = new Date();
  const appointments = (enquiry?.appointments || []).filter((a) => !a.isCompleted);

  appointments
    .filter((a) => isSameCalendarDay(a.startAt, today))
    .forEach((a) => {
      items.push({
        id: `appointment-today-${a.id}`,
        type: ENQUIRY_NOTIFICATION_TYPES.APPOINTMENT,
        title: 'Appointment today',
        message: a.title || (a.mode === 'ONLINE' ? 'Online counselling session' : 'In-person meeting'),
        at: a.startAt,
        meta: formatTime(a.startAt),
      });
    });

  appointments
    .filter((a) => !isSameCalendarDay(a.startAt, today) && isWithinDays(a.startAt, 3, today))
    .forEach((a) => {
      items.push({
        id: `appointment-upcoming-${a.id}`,
        type: ENQUIRY_NOTIFICATION_TYPES.APPOINTMENT,
        title: 'Upcoming appointment',
        message: a.title || 'Counselling appointment scheduled',
        at: a.startAt,
        meta: formatDateTime(a.startAt),
      });
    });

  return items;
}

function buildDemoNotifications(enquiry) {
  const items = [];
  const today = new Date();
  const demos = enquiry?.demos || [];

  demos
    .filter((d) => isSameCalendarDay(d.demoDate, today))
    .forEach((d) => {
      const needsAttendance = d.attendance === 'NOT_MARKED' || d.attendance === 'ABSENT';
      items.push({
        id: `demo-today-${d.id}`,
        type: ENQUIRY_NOTIFICATION_TYPES.DEMO,
        title: needsAttendance ? 'Demo today — mark attendance' : 'Demo scheduled today',
        message: [d.className, d.batch].filter(Boolean).join(' · ') || 'Demo session today',
        at: d.demoDate,
        meta: formatTime(d.demoDate),
      });
    });

  demos
    .filter((d) => !isSameCalendarDay(d.demoDate, today) && isWithinDays(d.demoDate, 7, today))
    .forEach((d) => {
      items.push({
        id: `demo-upcoming-${d.id}`,
        type: ENQUIRY_NOTIFICATION_TYPES.DEMO,
        title: 'Upcoming demo',
        message: [d.className, d.batch].filter(Boolean).join(' · ') || 'Demo session scheduled',
        at: d.demoDate,
        meta: formatDateTime(d.demoDate),
      });
    });

  return items;
}

function buildDocumentNotifications(enquiry) {
  const uploaded = new Set((enquiry?.documents || []).map((d) => d.category));
  const required = JOURNEY_DOCUMENT_STATUSES.has(enquiry?.status)
    ? REQUIRED_ENQUIRY_DOCUMENTS.journey
    : REQUIRED_ENQUIRY_DOCUMENTS.default;
  const missing = required.filter((cat) => !uploaded.has(cat));

  if (missing.length === 0) return [];

  const labels = missing.map(getDocumentCategoryLabel).join(', ');
  return [{
    id: `documents-missing-${missing.join('-')}`,
    type: ENQUIRY_NOTIFICATION_TYPES.DOCUMENT_MISSING,
    title: `${missing.length} document${missing.length > 1 ? 's' : ''} missing`,
    message: `Upload: ${labels}`,
    at: enquiry?.updatedAt || enquiry?.createdAt,
    meta: `${missing.length} pending`,
  }];
}

function buildPaymentNotifications(enquiry) {
  const meta = enquiry?.metadata || {};
  const feesPaid = meta.feesPaid === true || meta.paymentStatus === 'PAID';
  const explicitPending = meta.paymentPending === true || meta.feePending === true;
  const amountDue = meta.feeDue || meta.amountDue || meta.pendingAmount;
  const statusWatch = PAYMENT_WATCH_STATUSES.has(enquiry?.status);

  if (feesPaid && !explicitPending) return [];

  if (!explicitPending && !statusWatch && !amountDue) return [];

  const amountLabel = amountDue
    ? `₹${Number(amountDue).toLocaleString('en-IN')}`
    : 'Fee payment';

  return [{
    id: 'payment-pending',
    type: ENQUIRY_NOTIFICATION_TYPES.PAYMENT_PENDING,
    title: 'Payment pending',
    message: explicitPending
      ? (meta.paymentNote || `${amountLabel} awaiting collection`)
      : `${amountLabel} — collect before proceeding`,
    at: meta.feeDueDate || enquiry?.updatedAt,
    meta: amountDue ? amountLabel : 'Pending',
  }];
}

export function buildEnquiryNotifications(enquiry) {
  if (!enquiry?.id) return [];

  const items = [
    ...buildFollowUpNotifications(enquiry),
    ...buildAppointmentNotifications(enquiry),
    ...buildDemoNotifications(enquiry),
    ...buildDocumentNotifications(enquiry),
    ...buildPaymentNotifications(enquiry),
  ];

  return items.sort((a, b) => {
    const aTime = a.at ? new Date(a.at).getTime() : 0;
    const bTime = b.at ? new Date(b.at).getTime() : 0;
    return bTime - aTime;
  });
}

export function groupNotificationsByType(notifications) {
  const order = Object.values(ENQUIRY_NOTIFICATION_TYPES);
  const groups = new Map();

  order.forEach((type) => {
    groups.set(type.id, { type, items: [] });
  });

  notifications.forEach((item) => {
    const key = item.type.id;
    if (!groups.has(key)) groups.set(key, { type: item.type, items: [] });
    groups.get(key).items.push(item);
  });

  return [...groups.values()].filter((g) => g.items.length > 0);
}
