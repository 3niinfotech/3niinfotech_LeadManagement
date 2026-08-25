/**
 * Calendar event visual / semantic config — uses theme CSS variables.
 */

export const EVENT_TYPE_STYLE = {
  FOLLOWUP: {
    label: 'Follow-up',
    color: 'var(--info)',
    bg: 'var(--info-soft)',
    border: 'var(--info)',
  },
  APPOINTMENT: {
    label: 'Appointment',
    color: 'var(--brand)',
    bg: 'var(--brand-soft)',
    border: 'var(--brand)',
  },
  DUE_DATE: {
    label: 'Due Date',
    color: 'var(--warning)',
    bg: 'var(--warning-soft)',
    border: 'var(--warning)',
  },
  OFFER: {
    label: 'Offer',
    color: 'var(--success)',
    bg: 'var(--success-soft)',
    border: 'var(--success)',
  },
  EXPIRY: {
    label: 'Expiry',
    color: 'var(--danger)',
    bg: 'var(--danger-soft)',
    border: 'var(--danger)',
  },
  CLASS: {
    label: 'Class',
    color: 'var(--brand)',
    bg: 'var(--brand-soft)',
    border: 'var(--brand)',
  },
  DEMO: {
    label: 'Demo',
    color: 'var(--info)',
    bg: 'var(--info-soft)',
    border: 'var(--info)',
  },
};

export const STATUS_STYLE = {
  OVERDUE: { label: 'Overdue', tone: 'danger' },
  COMPLETED: { label: 'Completed', tone: 'success' },
  PENDING: { label: 'Pending', tone: 'warning' },
  SCHEDULED: { label: 'Scheduled', tone: 'primary' },
};

export function getEventStyle(event) {
  if (event?.status === 'OVERDUE') {
    return {
      color: 'var(--danger)',
      bg: 'var(--danger-soft)',
      border: 'var(--danger)',
    };
  }
  if (event?.status === 'COMPLETED') {
    return {
      color: 'var(--success)',
      bg: 'var(--success-soft)',
      border: 'var(--success)',
    };
  }
  return EVENT_TYPE_STYLE[event?.eventType] || EVENT_TYPE_STYLE.FOLLOWUP;
}

export function toFullCalendarEvent(event) {
  const style = getEventStyle(event);
  return {
    id: event.id,
    title: event.title,
    start: event.startAt,
    end: event.endAt || undefined,
    allDay: Boolean(event.allDay),
    backgroundColor: style.bg,
    borderColor: style.border,
    textColor: style.color,
    editable: Boolean(event.canReschedule),
    extendedProps: { ...event },
  };
}
