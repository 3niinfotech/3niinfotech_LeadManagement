const HEATMAP_WEEKS = 12;
const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function toDateKey(value) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function startOfDay(value) {
  const d = new Date(value);
  d.setHours(0, 0, 0, 0);
  return d;
}

function mondayOfWeek(value) {
  const d = startOfDay(value);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return d;
}

function countToLevel(count) {
  if (count <= 0) return 0;
  if (count === 1) return 1;
  if (count <= 3) return 2;
  if (count <= 6) return 3;
  return 4;
}

function collectEvents(enquiry) {
  const events = [];

  for (const followup of enquiry?.followups || []) {
    const at = followup.followupAt || followup.createdAt;
    if (at) events.push({ at, kind: followup.stage });
  }

  for (const comm of enquiry?.communications || []) {
    const at = comm.sentAt || comm.createdAt;
    if (at) events.push({ at, kind: comm.channel });
  }

  for (const appointment of enquiry?.appointments || []) {
    if (appointment.startAt) events.push({ at: appointment.startAt, kind: 'MEETING' });
  }

  return events;
}

export function buildActivityCounts(enquiry) {
  const followups = enquiry?.followups || [];
  const communications = enquiry?.communications || [];
  const appointments = enquiry?.appointments || [];

  return {
    calls:
      followups.filter((f) => f.stage === 'CALL').length
      + communications.filter((c) => c.channel === 'CALL').length,
    whatsapp:
      followups.filter((f) => f.stage === 'WHATSAPP').length
      + communications.filter((c) => c.channel === 'WHATSAPP').length,
    emails:
      followups.filter((f) => f.stage === 'EMAIL').length
      + communications.filter((c) => c.channel === 'EMAIL').length,
    meetings:
      followups.filter((f) => f.stage === 'MEETING' || f.stage === 'VIDEO_CALL').length
      + appointments.length,
  };
}

export function buildActivityHeatmap(enquiry, weeks = HEATMAP_WEEKS) {
  const events = collectEvents(enquiry);
  const countByDay = {};

  for (const event of events) {
    const key = toDateKey(event.at);
    if (!key) continue;
    countByDay[key] = (countByDay[key] || 0) + 1;
  }

  const today = startOfDay(new Date());
  const rangeEnd = today;
  const rangeStart = new Date(today);
  rangeStart.setDate(rangeStart.getDate() - weeks * 7 + 1);
  const gridStart = mondayOfWeek(rangeStart);

  const columns = [];
  let cursor = new Date(gridStart);
  const endMonday = mondayOfWeek(today);
  endMonday.setDate(endMonday.getDate() + 7);

  while (cursor < endMonday && columns.length < weeks) {
    const week = [];
    for (let i = 0; i < 7; i += 1) {
      const cellDate = new Date(cursor);
      cellDate.setDate(cursor.getDate() + i);
      const key = toDateKey(cellDate);
      const count = key ? (countByDay[key] || 0) : 0;
      const inRange = cellDate >= rangeStart && cellDate <= rangeEnd;

      week.push({
        date: cellDate,
        dateKey: key,
        count: inRange ? count : 0,
        level: inRange ? countToLevel(count) : 0,
        inRange,
      });
    }
    columns.push(week);
    cursor.setDate(cursor.getDate() + 7);
  }

  const total = events.length;
  const maxDay = Math.max(0, ...Object.values(countByDay));

  return {
    counts: buildActivityCounts(enquiry),
    columns,
    dayLabels: DAY_LABELS,
    total,
    maxDay,
    rangeLabel: `${rangeStart.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} – ${rangeEnd.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}`,
  };
}
