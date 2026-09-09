import { calendarService } from '../calendar/calendar.service.js';

const OWN_ROLE_SLUGS = new Set([
  'counsellor',
  'senior_counsellor',
  'admission_counsellor',
  'tele_caller',
  'telecaller',
  'teacher',
  'faculty',
]);

const TYPE_LABEL = {
  FOLLOWUP: 'Enquiry',
  APPOINTMENT: 'Enquiry',
  DEMO: 'Demo',
  DUE_DATE: 'Fees',
  OFFER: 'Application',
  EXPIRY: 'Visa',
  CLASS: 'Class',
};

function startOfDay(d = new Date()) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function endOfDay(d = new Date()) {
  const x = new Date(d);
  x.setHours(23, 59, 59, 999);
  return x;
}

function formatDueAt(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  const today = startOfDay();
  const tomorrow = startOfDay();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const day = startOfDay(d);
  const time = d.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' });
  if (day.getTime() === today.getTime()) return `Today, ${time}`;
  if (day.getTime() === tomorrow.getTime()) return `Tomorrow, ${time}`;
  return d.toLocaleString('en-IN', {
    day: '2-digit', month: 'short', hour: 'numeric', minute: '2-digit',
  });
}

function buildLink(event) {
  const rel = event.relatedEntity || {};
  if (rel.type === 'enquiry' && rel.id) return `/admin/enquiries/${rel.id}`;
  if (rel.type === 'student' && rel.id) return `/admin/students/${rel.id}`;
  if (rel.type === 'lead' && rel.id) return `/admin/reception/walk-ins?open=${rel.id}`;
  if (event.eventType === 'DUE_DATE') return '/admin/fees';
  if (event.eventType === 'EXPIRY') return '/admin/visas';
  if (event.eventType === 'OFFER') return '/admin/applications';
  if (event.eventType === 'CLASS') return '/admin/batches';
  if (event.eventType === 'DEMO') return '/admin/demos';
  return '/admin/calendar';
}

function resolveAssignedFilter(user, queryAssignedTo) {
  if (queryAssignedTo) return queryAssignedTo;
  const scope = String(user?.role?.dataScope || user?.dataScope || '').toUpperCase();
  const slug = String(user?.role?.slug || '').toLowerCase();
  if (scope === 'OWN' || OWN_ROLE_SLUGS.has(slug)) return user.id;
  return undefined;
}

function mapItem(event) {
  const overdue = event.status === 'OVERDUE';
  const type = TYPE_LABEL[event.eventType]
    || (event.category === 'ENQUIRY' ? 'Enquiry' : event.category)
    || 'Reminder';
  return {
    id: event.id,
    title: event.title,
    description: event.description || null,
    type,
    eventType: event.eventType,
    sourceType: event.sourceType || null,
    status: event.status,
    priority: event.priority || 'MEDIUM',
    dueAt: formatDueAt(event.startAt),
    startAt: event.startAt,
    isToday: false,
    isOverdue: overdue,
    isUpcoming: false,
    assignedUserId: event.assignedUserId || null,
    assignedUserName: event.assignedUserName || null,
    branchName: event.branchName || null,
    link: buildLink(event),
    relatedEntity: event.relatedEntity || null,
    canComplete: Boolean(event.canComplete),
    canReschedule: Boolean(event.canReschedule),
  };
}

/**
 * Role-scoped reminders feed — reuses calendar tenant + permission walls.
 * OWN-scope / counsellor roles only see their assigned items.
 */
export const reminderService = {
  getFeed: async (query, user) => {
    const now = new Date();
    const sod = startOfDay(now);
    const eod = endOfDay(now);
    const upcomingEnd = new Date(sod);
    upcomingEnd.setDate(upcomingEnd.getDate() + 7);
    const rangeFrom = new Date(sod.getTime() - 14 * 86400000);

    const assignedTo = resolveAssignedFilter(user, query.assignedTo);
    const { events } = await calendarService.getEvents({
      from: rangeFrom.toISOString(),
      to: upcomingEnd.toISOString(),
      assignedTo,
      branchId: query.branchId,
    }, user);

    const open = events.filter((e) => e.status !== 'COMPLETED');
    const items = open.map(mapItem);

    const overdue = [];
    const dueToday = [];
    const upcoming = [];

    for (const item of items) {
      const t = new Date(item.startAt).getTime();
      if (item.isOverdue || t < sod.getTime()) {
        item.isOverdue = true;
        overdue.push(item);
      } else if (t >= sod.getTime() && t <= eod.getTime()) {
        item.isToday = true;
        dueToday.push(item);
      } else if (t > eod.getTime() && t <= upcomingEnd.getTime()) {
        item.isUpcoming = true;
        upcoming.push(item);
      }
    }

    const sortAsc = (a, b) => new Date(a.startAt) - new Date(b.startAt);
    overdue.sort(sortAsc);
    dueToday.sort(sortAsc);
    upcoming.sort(sortAsc);

    const roleSlug = user?.role?.slug || null;
    const scopeMode = assignedTo ? 'OWN' : (user?.role?.dataScope || 'COMPANY');

    return {
      roleSlug,
      scopeMode,
      counts: {
        overdue: overdue.length,
        dueToday: dueToday.length,
        upcoming: upcoming.length,
        badge: overdue.length + dueToday.length,
        total: overdue.length + dueToday.length + upcoming.length,
      },
      overdue: overdue.slice(0, 20),
      dueToday: dueToday.slice(0, 20),
      upcoming: upcoming.slice(0, 20),
    };
  },

  getSummary: async (query, user) => {
    const feed = await reminderService.getFeed(query, user);
    return {
      roleSlug: feed.roleSlug,
      scopeMode: feed.scopeMode,
      ...feed.counts,
    };
  },
};
