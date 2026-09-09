import { ROUTES } from '../../../config/routes';

const STUDENT_LINK_PREFIXES = ['/student'];

export function studentSafeLink(link) {
  if (!link || typeof link !== 'string') return null;
  const path = link.split('?')[0];
  if (STUDENT_LINK_PREFIXES.some((p) => path === p || path.startsWith(`${p}/`))) {
    return path;
  }
  return null;
}

export function notificationCategory(item) {
  const event = item?.metadata?.event || item?.type || '';
  const text = `${event} ${item?.title || ''} ${item?.message || ''}`.toUpperCase();
  if (text.includes('DOCUMENT') || text.includes('DOC')) return 'documents';
  if (text.includes('APPOINTMENT') || text.includes('COUNSEL')) return 'appointments';
  if (text.includes('ASSIGNMENT') || text.includes('TEST') || text.includes('MATERIAL') || text.includes('CLASS')) {
    return 'academic';
  }
  if (text.includes('FEE') || text.includes('PAYMENT') || text.includes('INVOICE')) return 'fees';
  if (text.includes('APPLICATION') || text.includes('VISA')) return 'journey';
  return 'general';
}

export function notificationCategoryLabel(cat) {
  const map = {
    all: 'All',
    appointments: 'Appointments',
    documents: 'Documents',
    academic: 'Academic',
    fees: 'Fees',
    journey: 'Application & Visa',
    general: 'Updates',
  };
  return map[cat] || 'Updates';
}

export function docStatusTone(status) {
  const s = String(status || '').toUpperCase();
  if (['VERIFIED', 'APPROVED'].includes(s)) return 'success';
  if (['REJECTED', 'REQUIRED'].includes(s)) return 'danger';
  if (['UNDER_REVIEW', 'UPLOADED', 'PENDING'].includes(s)) return 'info';
  return 'neutral';
}

export function appointmentStatusLabel(status) {
  const map = {
    REQUESTED: 'Pending approval',
    APPROVED: 'Confirmed',
    SCHEDULED: 'Scheduled',
    COMPLETED: 'Completed',
    PAST: 'Past',
    CANCELLED: 'Cancelled',
  };
  return map[String(status || '').toUpperCase()] || status || 'Scheduled';
}

export function defaultNotificationLink(category) {
  const map = {
    documents: ROUTES.STUDENT_DOCUMENTS,
    appointments: ROUTES.STUDENT_COUNSELING,
    academic: ROUTES.STUDENT_ASSIGNMENTS,
    fees: ROUTES.STUDENT_FEES,
    journey: ROUTES.STUDENT_APPLICATIONS,
  };
  return map[category] || ROUTES.STUDENT_NOTIFICATIONS;
}
