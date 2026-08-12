/** Google Calendar + .ics helpers for follow-up scheduling */

function toCalendarDate(date) {
  return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
}

export function buildGoogleCalendarUrl({ title, startAt, durationMinutes = 30, description = '', location = '' }) {
  const start = new Date(startAt);
  const end = new Date(start.getTime() + durationMinutes * 60 * 1000);
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: title,
    dates: `${toCalendarDate(start)}/${toCalendarDate(end)}`,
    details: description,
  });
  if (location) params.set('location', location);
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

export function downloadIcsFile({ title, startAt, durationMinutes = 30, description = '', uid }) {
  const start = new Date(startAt);
  const end = new Date(start.getTime() + durationMinutes * 60 * 1000);
  const stamp = toCalendarDate(new Date());
  const ics = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Lead Management CRM//EN',
    'BEGIN:VEVENT',
    `UID:${uid || `${Date.now()}@crm`}`,
    `DTSTAMP:${stamp}`,
    `DTSTART:${toCalendarDate(start)}`,
    `DTEND:${toCalendarDate(end)}`,
    `SUMMARY:${title.replace(/\n/g, ' ')}`,
    description ? `DESCRIPTION:${description.replace(/\n/g, '\\n')}` : '',
    'END:VEVENT',
    'END:VCALENDAR',
  ].filter(Boolean).join('\r\n');

  const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${title.replace(/\s+/g, '-').toLowerCase()}.ics`;
  link.click();
  URL.revokeObjectURL(url);
}

export function buildWhatsAppUrl(mobile, text = '') {
  const digits = String(mobile || '').replace(/\D/g, '');
  if (!digits) return null;
  return `https://wa.me/${digits}${text ? `?text=${encodeURIComponent(text)}` : ''}`;
}

export function buildTelUrl(mobile) {
  const digits = String(mobile || '').replace(/\s/g, '');
  return digits ? `tel:${digits}` : null;
}

export function buildSmsUrl(mobile, body = '') {
  const digits = String(mobile || '').replace(/\D/g, '');
  if (!digits) return null;
  const params = body ? `?body=${encodeURIComponent(body)}` : '';
  return `sms:${digits}${params}`;
}

export function buildMailtoUrl(email, subject = '', body = '') {
  if (!email) return null;
  const params = new URLSearchParams();
  if (subject) params.set('subject', subject);
  if (body) params.set('body', body);
  const q = params.toString();
  return `mailto:${email}${q ? `?${q}` : ''}`;
}
